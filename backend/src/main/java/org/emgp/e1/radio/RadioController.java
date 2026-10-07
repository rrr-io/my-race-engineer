package org.emgp.e1.radio;

import org.emgp.e1.crew.CrewMember;
import org.emgp.e1.crew.CrewMemberRepository;
import org.emgp.e1.race.RaceService;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import java.util.UUID;

@RestController
@RequestMapping("/api/crew")
public class RadioController {

    private final CrewMemberRepository crew;
    private final RaceService race;
    private final RadioService radio;

    public RadioController(CrewMemberRepository crew, RaceService race, RadioService radio) {
        this.crew = crew;
        this.race = race;
        this.radio = radio;
    }

    @GetMapping("/{id}/radio")
    public RadioService.Radio get(@PathVariable UUID id) {
        CrewMember member = crew.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
        return radio.forTeam(member.getTeam(), race.get());
    }
}
