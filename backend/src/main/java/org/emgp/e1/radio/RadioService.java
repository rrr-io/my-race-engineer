package org.emgp.e1.radio;

import org.emgp.e1.crew.Team;
import org.emgp.e1.message.MessageTemplate;
import org.emgp.e1.message.MessageTemplateRepository;
import org.emgp.e1.race.Phase;
import org.emgp.e1.proof.ProofState;
import org.emgp.e1.proof.ProofStatus;
import org.emgp.e1.proof.ProofView;
import org.emgp.e1.race.RaceState;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.EnumSet;
import java.util.List;
import java.util.Optional;
import java.util.Set;

@Service
public class RadioService {

    public enum Sender { ENGINEER, RACE_CONTROL }

    /** kind: LIGHTS_OUT, BRIEFING, PROOF or PIT_STOP, so the app can attach the right buttons. */
    public record RadioMessage(Sender from, String kind, String text) {}

    public record Radio(Phase phase, boolean pitStop, boolean practice, ProofView proof, String voteUrl,
                        List<RadioMessage> messages) {}

    private static final String DEFAULT_TEAM = "default";
    private static final Set<Phase> LIGHTS_OUT_PHASES =
            EnumSet.of(Phase.SPRINT_RACE, Phase.GRAND_PRIX, Phase.FINAL_LAP);

    private final MessageTemplateRepository templates;

    public RadioService(MessageTemplateRepository templates) {
        this.templates = templates;
    }

    public Radio forTeam(Team team, RaceState state, ProofView proof, String voteUrl) {
        Phase phase = state.getPhase();
        List<RadioMessage> messages = new ArrayList<>();

        lightsOut(team, phase).ifPresent(text -> messages.add(new RadioMessage(Sender.ENGINEER, "LIGHTS_OUT", text)));
        briefing(team, proof).ifPresent(text -> messages.add(new RadioMessage(Sender.ENGINEER, "BRIEFING", text)));
        proofLine(team, proof).ifPresent(text -> messages.add(new RadioMessage(Sender.ENGINEER, "PROOF", text)));
        if (state.isPitStop()) {
            pitStop(phase).ifPresent(text -> messages.add(new RadioMessage(Sender.RACE_CONTROL, "PIT_STOP", text)));
        }
        return new Radio(phase, state.isPitStop(), state.isPractice(), proof, voteUrl, messages);
    }

    /** The team's Lights Out line, empty for phases that don't have one. */
    public Optional<String> lightsOut(Team team, Phase phase) {
        if (!LIGHTS_OUT_PHASES.contains(phase)) {
            return Optional.empty();
        }
        return pick("LIGHTS_OUT", team.slug(), phase.ordinal()).map(body -> body.replace("{phase}", phase.label()));
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
