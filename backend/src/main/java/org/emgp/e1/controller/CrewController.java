package org.emgp.e1.controller;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import org.emgp.e1.model.CrewMember;
import org.emgp.e1.model.Team;
import org.emgp.e1.repository.CrewMemberRepository;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/crew")
public class CrewController {

    public record CreateCrewRequest(@NotBlank String team) {}
    public record CrewResponse(UUID id, String team) {
        static CrewResponse of(CrewMember m) {
            return new CrewResponse(m.getId(), m.getTeam().slug());
        }
    }

    private final CrewMemberRepository repository;

    public CrewController(CrewMemberRepository repository) {
        this.repository = repository;
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public CrewResponse join(@Valid @RequestBody CreateCrewRequest request) {
        Team team = Team.fromSlug(request.team());
        return CrewResponse.of(repository.save(new CrewMember(team)));
    }

    @GetMapping("/{id}")
    public CrewResponse get(@PathVariable UUID id) {
        return repository.findById(id)
                .map(CrewResponse::of)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
    }

    @ExceptionHandler(IllegalArgumentException.class)
    @ResponseStatus(HttpStatus.BAD_REQUEST)
    public Map<String, String> badTeam(IllegalArgumentException e) {
        return Map.of("error", e.getMessage());
    }
}
