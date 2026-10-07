package org.emgp.e1.service;

import org.emgp.e1.dto.ProofState;
import org.emgp.e1.dto.ProofView;
import org.emgp.e1.model.CrewMember;
import org.emgp.e1.model.Phase;
import org.emgp.e1.model.PushSubscription;
import org.emgp.e1.model.RaceState;
import org.emgp.e1.model.ReminderSettings;
import org.emgp.e1.model.Team;
import org.emgp.e1.repository.CrewMemberRepository;
import org.emgp.e1.repository.ReminderSettingsRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.Clock;
import java.time.DateTimeException;
import java.time.Duration;
import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalTime;
import java.time.ZoneId;
import java.util.ArrayList;
import java.util.EnumSet;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * The recurring radio call. A device is reminded when its fan still has categories to do (missing or rejected),
 * a race phase is on and no pit stop is running, it is inside the allowed local hours, and the interval since its
 * last reminder has passed. Nothing is sent once every category has a proof in review or approved.
 */
@Service
public class ReminderService {

    private static final ZoneId KST = ZoneId.of("Asia/Seoul");
    private static final Set<Phase> RUNNING = EnumSet.of(Phase.SPRINT_RACE, Phase.GRAND_PRIX, Phase.FINAL_LAP);

    public record Settings(boolean enabled, int intervalHours, LocalTime windowStart, LocalTime windowEnd) {}

    private final ReminderSettingsRepository settingsRepository;
    private final RaceService race;
    private final ProofService proofs;
    private final PushSubscriptionService subscriptions;
    private final CrewMemberRepository crew;
    private final RadioService radio;
    private final PushNotifier notifier;
    private final VoteService vote;
    private final Clock clock;

    public ReminderService(ReminderSettingsRepository settingsRepository, RaceService race, ProofService proofs,
                           PushSubscriptionService subscriptions, CrewMemberRepository crew, RadioService radio,
                           PushNotifier notifier, VoteService vote, Clock clock) {
        this.settingsRepository = settingsRepository;
        this.race = race;
        this.proofs = proofs;
        this.subscriptions = subscriptions;
        this.crew = crew;
        this.radio = radio;
        this.notifier = notifier;
        this.vote = vote;
        this.clock = clock;
    }

    @Transactional(readOnly = true)
    public Settings settings() {
        return toSettings(settingsRepository.findById(1).orElseThrow());
    }

    @Transactional
    public Settings update(boolean enabled, int intervalHours, LocalTime start, LocalTime end) {
        if (intervalHours < 1 || intervalHours > 24) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "The interval must be between 1 and 24 hours");
        }
        if (start.equals(end)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "The window must start and end at different times");
        }
        ReminderSettings stored = settingsRepository.findById(1).orElseThrow();
        stored.update(enabled, intervalHours, start, end);
        return toSettings(stored);
    }

    /**
     * One pass over every device. {@code force} (the admin's "send now") ignores the on/off switch, the local hours
     * and the interval, but never reminds someone who has nothing left to do, nor during a pit stop or outside a race.
     *
     * @return how many devices were reminded
     */
    public int run(boolean force) {
        if (!notifier.enabled()) {
            return 0;
        }
        Settings settings = settings();
        if (!settings.enabled() && !force) {
            return 0;
        }
        RaceState state = race.get();
        if (!RUNNING.contains(state.getPhase()) || state.isPitStop()) {
            return 0;
        }
        List<PushSubscription> all = subscriptions.all();
        if (all.isEmpty()) {
            return 0;
        }

        Instant now = clock.instant();
        LocalDate day = LocalDate.now(clock.withZone(KST));
        Map<UUID, Team> teams = crew.findAllById(all.stream().map(PushSubscription::getCrewId).distinct().toList())
                .stream()
                .collect(Collectors.toMap(CrewMember::getId, CrewMember::getTeam));
        Map<UUID, ProofView> progress = new HashMap<>();
        String title = state.isPractice() ? "Race Engineer · Free Practice" : "Race Engineer";
        String voteUrl = vote.url();

        List<Long> reminded = new ArrayList<>();
        for (PushSubscription subscription : all) {
            Team team = teams.get(subscription.getCrewId());
            if (team == null) {
                continue;
            }
            ProofView view = progress.computeIfAbsent(subscription.getCrewId(), proofs::today);
            if (!view.needsAction() || (!force && !due(subscription, settings, now))) {
                continue;
            }
            List<String> todo = view.categories().stream()
                    .filter(c -> c.state() == ProofState.MISSING || c.state() == ProofState.REJECTED)
                    .map(ProofView.CategoryProgress::name)
                    .toList();
            int lap = subscription.remindersOn(day) + 1;
            radio.reminder(team, todo, lap).ifPresent(text -> {
                notifier.sendReminder(subscription, title, text, voteUrl);
                reminded.add(subscription.getId());
            });
        }
        subscriptions.markReminded(reminded, now, day);
        return reminded.size();
    }

    private static boolean due(PushSubscription subscription, Settings settings, Instant now) {
        LocalTime local = now.atZone(zoneOf(subscription.getTimezone())).toLocalTime();
        if (!inWindow(local, settings.windowStart(), settings.windowEnd())) {
            return false;
        }
        Instant last = subscription.getLastReminderAt();
        return last == null || !now.isBefore(last.plus(Duration.ofHours(settings.intervalHours())));
    }

    /** start inclusive, end exclusive; a window like 20:00-02:00 runs through midnight. */
    static boolean inWindow(LocalTime time, LocalTime start, LocalTime end) {
        if (start.isBefore(end)) {
            return !time.isBefore(start) && time.isBefore(end);
        }
        return !time.isBefore(start) || time.isBefore(end);
    }

    private static ZoneId zoneOf(String timezone) {
        try {
            return timezone == null ? KST : ZoneId.of(timezone);
        } catch (DateTimeException e) {
            return KST;
        }
    }

    private static Settings toSettings(ReminderSettings stored) {
        return new Settings(stored.isEnabled(), stored.getIntervalHours(), stored.getWindowStart(), stored.getWindowEnd());
    }
}
