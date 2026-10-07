package org.emgp.e1.controller;

import org.emgp.e1.model.Phase;
import org.emgp.e1.model.RaceState;
import org.emgp.e1.service.PushNotifier;
import org.emgp.e1.service.RaceService;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import java.time.Instant;

@RestController
public class RaceController {

    public record RaceResponse(Phase phase, boolean pitStop, boolean practice, Instant updatedAt) {
        static RaceResponse of(RaceState state) {
            return new RaceResponse(state.getPhase(), state.isPitStop(), state.isPractice(), state.getUpdatedAt());
        }
    }

    public record UpdateRaceRequest(Phase phase, Boolean pitStop, Boolean practice) {}

    private final RaceService service;
    private final PushNotifier notifier;

    public RaceController(RaceService service, PushNotifier notifier) {
        this.service = service;
        this.notifier = notifier;
    }

    @GetMapping("/api/race")
    public RaceResponse get() {
        return RaceResponse.of(service.get());
    }

    @PutMapping("/api/admin/race")
    public RaceResponse update(@RequestBody UpdateRaceRequest request) {
        if (request.phase() == null && request.pitStop() == null && request.practice() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "phase, pitStop or practice is required");
        }
        RaceState before = service.get();
        RaceState after = service.update(request.phase(), request.pitStop(), request.practice());
        notifier.raceChanged(before.getPhase(), before.isPitStop(), after);
        return RaceResponse.of(after);
    }
}
