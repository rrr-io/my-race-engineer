package org.mre.e1.service;

import org.mre.e1.dto.ProofState;
import org.mre.e1.dto.ProofView;
import org.mre.e1.model.MessageTemplate;
import org.mre.e1.model.Phase;
import org.mre.e1.model.ProofStatus;
import org.mre.e1.model.RaceState;
import org.mre.e1.model.Team;
import org.mre.e1.repository.MessageTemplateRepository;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.time.ZoneId;
import java.util.ArrayList;
import java.util.EnumSet;
import java.util.List;
import java.util.Optional;
import java.util.Set;

@Service
public class RadioService {

    public enum Sender { ENGINEER, RACE_CONTROL, PADDOCK }

    /**
     * kind: LIGHTS_OUT, BRIEFING, PROOF or PIT_STOP, so the app can attach the right buttons; at: when it was "sent"
     * (the phase or pit stop start, the start of the Korean day, the last upload or review), for "JUST NOW".
     * id is set only for messages stored one by one (Paddock), so two equal texts stay two messages.
     */
    public record RadioMessage(Sender from, String kind, String text, Instant at, Long id) {
        public RadioMessage(Sender from, String kind, String text, Instant at) {
            this(from, kind, text, at, null);
        }
    }

    /** podium is filled at the Finish Line only: the top three teams by approved proofs. */
    public record Radio(Phase phase, boolean pitStop, boolean practice, ProofView proof, String voteUrl,
                        List<RadioMessage> messages, List<PodiumService.Standing> podium) {}

    private static final String DEFAULT_TEAM = "default";
    private static final ZoneId KST = ZoneId.of("Asia/Seoul");
    private static final Set<Phase> LIGHTS_OUT_PHASES =
            EnumSet.of(Phase.SPRINT_RACE, Phase.GRAND_PRIX, Phase.FINAL_LAP);

    private final MessageTemplateRepository templates;
    private final PodiumService podium;

    public RadioService(MessageTemplateRepository templates, PodiumService podium) {
        this.templates = templates;
        this.podium = podium;
    }

    public Radio forTeam(Team team, RaceState state, ProofView proof, String voteUrl) {
        return forTeam(team, state, proof, voteUrl, List.of());
    }

    /** paddock: the announcements for this team, already in order; they close the feed. */
    public Radio forTeam(Team team, RaceState state, ProofView proof, String voteUrl, List<RadioMessage> paddock) {
        Phase phase = state.getPhase();
        List<RadioMessage> messages = new ArrayList<>();

        Instant phaseStart = state.getPhaseStartedAt();
        Instant dayStart = proof.day().atStartOfDay(KST).toInstant();
        Instant briefingAt = phaseStart == null || dayStart.isAfter(phaseStart) ? dayStart : phaseStart;
        Instant proofAt = proof.lastActivityAt() != null ? proof.lastActivityAt() : briefingAt;

        lightsOut(team, phase).ifPresent(text ->
                messages.add(new RadioMessage(Sender.ENGINEER, "LIGHTS_OUT", text, phaseStart)));
        (state.isPractice() ? practiceBriefing(proof) : briefing(team, proof)).ifPresent(text ->
                messages.add(new RadioMessage(Sender.ENGINEER, "BRIEFING", text, briefingAt)));
        proofLine(team, proof).ifPresent(text ->
                messages.add(new RadioMessage(Sender.ENGINEER, "PROOF", text, proofAt)));
        if (state.isPitStop()) {
            pitStop(phase).ifPresent(text ->
                    messages.add(new RadioMessage(Sender.RACE_CONTROL, "PIT_STOP", text, state.getPitStopStartedAt())));
        }
        List<PodiumService.Standing> top = List.of();
        if (phase == Phase.FINISH_LINE) {
            top = podium.podium();
            messages.add(new RadioMessage(Sender.RACE_CONTROL, "PODIUM", podiumLine(top), phaseStart));
        }
        messages.addAll(paddock);
        return new Radio(phase, state.isPitStop(), state.isPractice(), proof, voteUrl, messages, top);
    }

    /** Race Control's Finish Line call, same for everyone. */
    public String podiumLine() {
        return podiumLine(podium.podium());
    }

    static String podiumLine(List<PodiumService.Standing> top) {
        if (top.isEmpty()) {
            return "Chequered flag! The race is over. Thank you, crew!";
        }
        List<String> places = new ArrayList<>();
        for (PodiumService.Standing s : top) {
            String name = "Team " + CalendarService.NAMES.get(Team.fromSlug(s.team()));
            places.add(places.isEmpty()
                    ? "P1 " + name + " with " + s.proofs() + (s.proofs() == 1 ? " proof" : " proofs")
                    : "P" + s.position() + " " + name + " with " + s.proofs());
        }
        return "Chequered flag! " + String.join(", ", places) + ". Thank you, crew!";
    }

    /** The team's Lights Out line, empty for phases that don't have one. */
    public Optional<String> lightsOut(Team team, Phase phase) {
        if (!LIGHTS_OUT_PHASES.contains(phase)) {
            return Optional.empty();
        }
        return pick("LIGHTS_OUT", team.slug(), phase.ordinal()).map(body -> body.replace("{phase}", phase.label()));
    }

    /** What the engineer says when free practice opens: sent as a notification and shown in the admin preview. */
    public static final String PRACTICE_OPEN = "Free practice is open! Send a certificate from an old vote: "
            + "Race Control checks it for real, but it doesn't count for the race.";

    /**
     * The free practice call: like the briefing, only what is still to do, but with a certificate from an old vote.
     * Before Race Control sets the categories it says so.
     */
    static Optional<String> practiceBriefing(ProofView proof) {
        if (proof.categories().isEmpty()) {
            return Optional.of("Free practice is open! Race Control is still setting the categories, hold on.");
        }
        List<String> todo = proof.categories().stream()
                .filter(c -> c.state() == ProofState.MISSING || c.state() == ProofState.REJECTED)
                .map(ProofView.CategoryProgress::name)
                .toList();
        if (todo.isEmpty()) {
            return Optional.empty();
        }
        return Optional.of("Free practice is open! Send a certificate from an old vote for " + joinNames(todo)
                + ". Race Control checks it for real, but it doesn't count for the race.");
    }

    public Optional<String> pitStop(Phase phase) {
        return pick("PIT_STOP", DEFAULT_TEAM, phase.ordinal());
    }

    /** Where to vote and in which categories: only what is still to do (missing or rejected), new variant each day. */
    private Optional<String> briefing(Team team, ProofView proof) {
        List<String> todo = proof.categories().stream()
                .filter(c -> c.state() == ProofState.MISSING || c.state() == ProofState.REJECTED)
                .map(ProofView.CategoryProgress::name)
                .toList();
        if (todo.isEmpty()) {
            return Optional.empty();
        }
        return pick("VOTE_BRIEFING", team.slug(), (int) (proof.day().toEpochDay() % 1000))
                .map(body -> body.replace("{categories}", joinNames(todo)));
    }

    /** One line for the whole day: all approved, else the first rejection, else "received" while proofs wait. */
    private Optional<String> proofLine(Team team, ProofView proof) {
        int seed = proof.latestProofId() == null ? 0 : (int) (proof.latestProofId() % 1000);
        if (proof.done()) {
            return proof(team, ProofStatus.APPROVED, null, seed);
        }
        Optional<ProofView.CategoryProgress> rejected = proof.categories().stream()
                .filter(c -> c.state() == ProofState.REJECTED).findFirst();
        if (rejected.isPresent()) {
            return proof(team, ProofStatus.REJECTED, rejected.get().reason() + " (" + rejected.get().name() + ")", seed);
        }
        if (proof.categories().stream().anyMatch(c -> c.state() == ProofState.PENDING)) {
            return proof(team, ProofStatus.PENDING, null, seed);
        }
        return Optional.empty();
    }

    static String joinNames(List<String> names) {
        if (names.size() == 1) {
            return names.get(0);
        }
        return String.join(", ", names.subList(0, names.size() - 1)) + " and " + names.get(names.size() - 1);
    }

    /** The recurring call: {lap} is the reminder number of the Korean day, {categories} what is still to do. */
    public Optional<String> reminder(Team team, List<String> categories, int lap) {
        return pick("DAILY_REMINDER", team.slug(), lap - 1)
                .map(body -> body.replace("{lap}", Integer.toString(lap)).replace("{categories}", joinNames(categories)));
    }

    /** The team's line for a proof received, approved or rejected; {reason} is filled in for rejections. */
    public Optional<String> proof(Team team, ProofStatus status, String reason, long proofId) {
        String event = switch (status) {
            case PENDING -> "PROOF_RECEIVED";
            case APPROVED -> "PROOF_APPROVED";
            case REJECTED -> "PROOF_REJECTED";
        };
        return pick(event, team.slug(), (int) (proofId % 1000))
                .map(body -> body.replace("{reason}", reason == null ? "" : reason));
    }

    /** Variants rotate with the seed (phase or proof id), so the same moment always reads the same. */
    private Optional<String> pick(String event, String team, int seed) {
        List<MessageTemplate> found = templates.findByEventTypeAndTeamOrderByVariant(event, team);
        if (found.isEmpty() && !DEFAULT_TEAM.equals(team)) {
            found = templates.findByEventTypeAndTeamOrderByVariant(event, DEFAULT_TEAM);
        }
        if (found.isEmpty()) {
            return Optional.empty();
        }
        return Optional.of(found.get(seed % found.size()).getBody());
    }
}
