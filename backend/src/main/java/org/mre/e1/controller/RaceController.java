package org.mre.e1.controller;

import org.mre.e1.model.Phase;
import org.mre.e1.model.RaceState;
import org.mre.e1.model.Team;
import org.mre.e1.service.PushNotifier;
import org.mre.e1.service.RaceService;
import org.mre.e1.service.RadioService;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

@RestController
public class RaceController {

    public record RaceResponse(Phase phase, boolean pitStop, boolean practice, Instant updatedAt) {
        static RaceResponse of(RaceState state) {
            return new RaceResponse(state.getPhase(), state.isPitStop(), state.isPractice(), state.getUpdatedAt());
        }
    }

    public record UpdateRaceRequest(Phase phase, Boolean pitStop, Boolean practice) {}

    /** One radio call as fans will get it; team is null for Race Control lines, which are the same for everyone. */
    public record PreviewLine(String team, String text) {}

    /** What a change would send, so Race Control can check it before confirming. */
    public record Preview(boolean pushEnabled, long devices, String from, List<PreviewLine> lines) {}

    private final RaceService service;
    private final PushNotifier notifier;
    private final RadioService radio;

    public RaceController(RaceService service, PushNotifier notifier, RadioService radio) {
        this.service = service;
        this.notifier = notifier;
        this.radio = radio;
    }

    @GetMapping("/api/race")
    public RaceResponse get() {
        return RaceResponse.of(service.get());
    }

    /**
     * The radio calls a change would send: the Lights Out line of each team for a new phase, or the Race Control
     * line when a pit stop starts, the engineer's call when free practice opens. Same texts the notifier sends;
     * nothing is changed or sent here.
     */
    @GetMapping("/api/admin/race/preview")
    public Preview preview(@RequestParam(required = false) Phase phase,
                           @RequestParam(required = false) Boolean pitStop,
                           @RequestParam(required = false) Boolean practice) {
        RaceState state = service.get();
        List<PreviewLine> lines = new ArrayList<>();
        String from = "ENGINEER";
        if (Boolean.TRUE.equals(practice) && !state.isPractice()) {
            lines.add(new PreviewLine(null, RadioService.PRACTICE_OPEN));
        } else if (phase == Phase.FINISH_LINE && state.getPhase() != Phase.FINISH_LINE) {
            from = "RACE_CONTROL";
            lines.add(new PreviewLine(null, radio.podiumLine()));
        } else if (Boolean.TRUE.equals(pitStop) && !state.isPitStop()) {
            from = "RACE_CONTROL";
            radio.pitStop(state.getPhase()).ifPresent(text -> lines.add(new PreviewLine(null, text)));
        } else if (phase != null && phase != state.getPhase()) {
            for (Team team : Team.values()) {
                radio.lightsOut(team, phase).ifPresent(text -> lines.add(new PreviewLine(team.slug(), text)));
            }
        }
        return new Preview(notifier.enabled(), notifier.enabled() ? notifier.subscriberCount() : 0, from, lines);
    }

    @PutMapping("/api/admin/race")
    public RaceResponse update(@RequestBody UpdateRaceRequest request) {
        if (request.phase() == null && request.pitStop() == null && request.practice() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "phase, pitStop or practice is required");
        }
        RaceState before = service.get();
        RaceState after = service.update(request.phase(), request.pitStop(), request.practice());
        notifier.raceChanged(before.getPhase(), before.isPitStop(), before.isPractice(), after);
        return RaceResponse.of(after);
    }
}
