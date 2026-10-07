package org.emgp.e1.radio;

import org.emgp.e1.crew.Team;
import org.emgp.e1.message.MessageTemplate;
import org.emgp.e1.message.MessageTemplateRepository;
import org.emgp.e1.race.Phase;
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

    public record RadioMessage(Sender from, String text) {}

    public record Radio(Phase phase, boolean pitStop, boolean practice, List<RadioMessage> messages) {}

    private static final String DEFAULT_TEAM = "default";
    private static final Set<Phase> LIGHTS_OUT_PHASES =
            EnumSet.of(Phase.SPRINT_RACE, Phase.GRAND_PRIX, Phase.FINAL_LAP);

    private final MessageTemplateRepository templates;

    public RadioService(MessageTemplateRepository templates) {
        this.templates = templates;
    }

    public Radio forTeam(Team team, RaceState state) {
        Phase phase = state.getPhase();
        List<RadioMessage> messages = new ArrayList<>();

        if (LIGHTS_OUT_PHASES.contains(phase)) {
            pick("LIGHTS_OUT", team.slug(), phase).ifPresent(body ->
                    messages.add(new RadioMessage(Sender.ENGINEER, body.replace("{phase}", phase.label()))));
        }
        if (state.isPitStop()) {
            pick("PIT_STOP", DEFAULT_TEAM, phase).ifPresent(body ->
                    messages.add(new RadioMessage(Sender.RACE_CONTROL, body)));
        }
        return new Radio(phase, state.isPitStop(), state.isPractice(), messages);
    }

    /** Variants rotate with the phase, so a given phase always reads the same. */
    private Optional<String> pick(String event, String team, Phase phase) {
        List<MessageTemplate> found = templates.findByEventTypeAndTeamOrderByVariant(event, team);
        if (found.isEmpty() && !DEFAULT_TEAM.equals(team)) {
            found = templates.findByEventTypeAndTeamOrderByVariant(event, DEFAULT_TEAM);
        }
        if (found.isEmpty()) {
            return Optional.empty();
        }
        return Optional.of(found.get(phase.ordinal() % found.size()).getBody());
    }
}
