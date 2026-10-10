package org.mre.e1.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.annotation.PreDestroy;
import org.mre.e1.client.WebPushSender;
import org.mre.e1.model.CrewMember;
import org.mre.e1.model.Phase;
import org.mre.e1.model.ProofStatus;
import org.mre.e1.model.PushSubscription;
import org.mre.e1.model.RaceState;
import org.mre.e1.model.Team;
import org.mre.e1.repository.CrewMemberRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.util.EnumMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.stream.Collectors;

@Service
public class PushNotifier {

    private static final Logger log = LoggerFactory.getLogger(PushNotifier.class);
    private static final int TTL_SECONDS = 3600;

    public record Action(String action, String title) {}

    /** voteUrl and actions are optional: they only go out with reminders and rejections. */
    public record Payload(String title, String body, String tag, String url, String voteUrl, List<Action> actions) {
        public Payload(String title, String body, String tag, String url) {
            this(title, body, tag, url, null, List.of());
        }
    }

    private final PushSubscriptionService subscriptions;
    private final CrewMemberRepository crew;
    private final RadioService radio;
    private final ObjectMapper mapper;
    private final String publicKey;
    private final WebPushSender sender;
    private final ExecutorService dispatcher = daemonPool(1);
    private final ExecutorService workers = daemonPool(4);

    public PushNotifier(PushSubscriptionService subscriptions, CrewMemberRepository crew, RadioService radio,
                        ObjectMapper mapper,
                        @Value("${push.vapid.public-key:}") String publicKey,
                        @Value("${push.vapid.private-key:}") String privateKey,
                        @Value("${push.vapid.subject}") String subject) {
        this.subscriptions = subscriptions;
        this.crew = crew;
        this.radio = radio;
        this.mapper = mapper;
        this.publicKey = publicKey.trim();
        this.sender = createSender(this.publicKey, privateKey.trim(), subject);
    }

    private static WebPushSender createSender(String publicKey, String privateKey, String subject) {
        if (publicKey.isEmpty() || privateKey.isEmpty()) {
            log.info("VAPID keys not set: push notifications are disabled");
            return null;
        }
        try {
            return new WebPushSender(publicKey, privateKey, subject);
        } catch (IllegalArgumentException e) {
            log.error("Invalid VAPID keys: push notifications are disabled", e);
            return null;
        }
    }

    public boolean enabled() {
        return sender != null;
    }

    public String publicKey() {
        return publicKey;
    }

    public long subscriberCount() {
        return subscriptions.count();
    }

    /** The recurring call, with "Open MNET+" and "Upload proof" buttons where the device shows them. */
    public void sendReminder(PushSubscription subscription, String title, String body, String voteUrl) {
        if (sender == null) {
            return;
        }
        Payload payload = new Payload(title, body, "reminder", "/?proof=1", voteUrl,
                List.of(new Action("mnet", "Open MNET+"), new Action("proof", "Upload proof")));
        workers.execute(() -> deliver(subscription, payload));
    }

    /** One notification to one device, in the background. */
    public void send(PushSubscription subscription, String title, String body, String tag) {
        if (sender == null) {
            return;
        }
        workers.execute(() -> deliver(subscription, new Payload(title, body, tag, "/")));
    }

    /** Lights Out when the phase changes, Pit Stop when it starts. Runs in the background, after the admin request is done. */
    public void raceChanged(Phase oldPhase, boolean oldPitStop, RaceState state) {
        if (sender == null) {
            return;
        }
        Phase phase = state.getPhase();
        boolean practice = state.isPractice();
        if (phase != oldPhase) {
            dispatcher.execute(() -> notifyLightsOut(phase, practice));
        }
        if (state.isPitStop() && !oldPitStop) {
            dispatcher.execute(() -> notifyPitStop(phase));
        }
        if (phase == Phase.FINISH_LINE && oldPhase != Phase.FINISH_LINE) {
            dispatcher.execute(this::notifyPodium);
        }
    }

    /** A Paddock announcement: only the devices of that team's crew get it. */
    public void paddock(Team team, String title, String body) {
        if (sender == null) {
            return;
        }
        dispatcher.execute(() -> {
            try {
                List<PushSubscription> all = subscriptions.all();
                Map<UUID, Team> teamByCrew = crew
                        .findAllById(all.stream().map(PushSubscription::getCrewId).distinct().toList())
                        .stream()
                        .collect(Collectors.toMap(CrewMember::getId, CrewMember::getTeam));
                Payload payload = new Payload(title, body, "paddock", "/");
                all.stream().filter(s -> teamByCrew.get(s.getCrewId()) == team)
                        .forEach(s -> workers.execute(() -> deliver(s, payload)));
            } catch (RuntimeException e) {
                log.error("Paddock push failed", e);
            }
        });
    }

    private void notifyPodium() {
        try {
            Payload payload = new Payload("Race Control · Finish Line", radio.podiumLine(), "podium", "/");
            subscriptions.all().forEach(s -> workers.execute(() -> deliver(s, payload)));
        } catch (RuntimeException e) {
            log.error("Podium broadcast failed", e);
        }
    }

    /** Tells one fan how Race Control judged their proof, in their engineer's voice. */
    public void proofDecided(UUID crewId, ProofStatus status, String reason, long proofId) {
        if (sender == null) {
            return;
        }
        dispatcher.execute(() -> {
            try {
                crew.findById(crewId).flatMap(member -> radio.proof(member.getTeam(), status, reason, proofId))
                        .ifPresent(text -> {
                            Payload payload = status == ProofStatus.REJECTED
                                    ? new Payload("Race Engineer", text, "proof", "/?proof=1", null,
                                            List.of(new Action("proof", "Upload proof")))
                                    : new Payload("Race Engineer", text, "proof", "/");
                            subscriptions.forCrew(crewId).forEach(s -> workers.execute(() -> deliver(s, payload)));
                        });
            } catch (RuntimeException e) {
                log.error("Proof notification failed", e);
            }
        });
    }

    /** @return how many devices the test was sent to */
    public int sendTest() {
        if (sender == null) {
            return 0;
        }
        List<PushSubscription> all = subscriptions.all();
        Payload test = new Payload("Race Control", "Radio check. This is a test notification.", "radio-check", "/");
        all.forEach(s -> workers.execute(() -> deliver(s, test)));
        return all.size();
    }

    private void notifyLightsOut(Phase phase, boolean practice) {
        try {
            List<PushSubscription> all = subscriptions.all();
            Map<UUID, Team> teamByCrew = crew
                    .findAllById(all.stream().map(PushSubscription::getCrewId).distinct().toList())
                    .stream()
                    .collect(Collectors.toMap(CrewMember::getId, CrewMember::getTeam));
            Map<Team, Optional<String>> texts = new EnumMap<>(Team.class);
            String title = practice ? "Race Engineer · Free Practice" : "Race Engineer";

            for (PushSubscription subscription : all) {
                Team team = teamByCrew.get(subscription.getCrewId());
                if (team == null) {
                    continue;
                }
                texts.computeIfAbsent(team, t -> radio.lightsOut(t, phase)).ifPresent(text ->
                        workers.execute(() -> deliver(subscription, new Payload(title, text, "race-phase", "/"))));
            }
        } catch (RuntimeException e) {
            log.error("Lights out broadcast failed", e);
        }
    }

    private void notifyPitStop(Phase phase) {
        try {
            radio.pitStop(phase).ifPresent(text -> {
                Payload payload = new Payload("Race Control", text, "pit-stop", "/");
                subscriptions.all().forEach(s -> workers.execute(() -> deliver(s, payload)));
            });
        } catch (RuntimeException e) {
            log.error("Pit stop broadcast failed", e);
        }
    }

    private void deliver(PushSubscription subscription, Payload payload) {
        try {
            byte[] body = mapper.writeValueAsBytes(payload);
            int status = sender.send(new WebPushSender.Subscription(
                    subscription.getEndpoint(), subscription.getP256dh(), subscription.getAuth()), body, TTL_SECONDS);
            if (status == 404 || status == 410) {
                subscriptions.removeExpired(subscription.getEndpoint());
            } else if (status >= 400) {
                log.warn("Push rejected with HTTP {} for subscription {}", status, subscription.getId());
            }
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
        } catch (Exception e) {
            log.warn("Push delivery failed for subscription {}: {}", subscription.getId(), e.toString());
        }
    }

    private static ExecutorService daemonPool(int threads) {
        return Executors.newFixedThreadPool(threads, runnable -> {
            Thread thread = new Thread(runnable, "push-sender");
            thread.setDaemon(true);
            return thread;
        });
    }

    @PreDestroy
    void shutdown() {
        dispatcher.shutdown();
        workers.shutdown();
    }
}
