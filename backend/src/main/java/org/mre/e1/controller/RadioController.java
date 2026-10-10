package org.mre.e1.controller;

import org.mre.e1.model.CrewMember;
import org.mre.e1.repository.CrewMemberRepository;
import org.mre.e1.service.PaddockService;
import org.mre.e1.service.ProofService;
import org.mre.e1.service.RaceService;
import org.mre.e1.service.RadioService;
import org.mre.e1.service.VoteService;
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
    private final ProofService proofs;
    private final VoteService vote;
    private final PaddockService paddock;

    public RadioController(CrewMemberRepository crew, RaceService race, RadioService radio, ProofService proofs,
                           VoteService vote, PaddockService paddock) {
        this.crew = crew;
        this.race = race;
        this.radio = radio;
        this.proofs = proofs;
        this.vote = vote;
        this.paddock = paddock;
    }

    @GetMapping("/{id}/radio")
    public RadioService.Radio get(@PathVariable UUID id) {
        CrewMember member = crew.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
        return radio.forTeam(member.getTeam(), race.get(), proofs.today(id), vote.url(),
                paddock.forTeam(member.getTeam()));
    }
}
