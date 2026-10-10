package org.mre.e1.service;

import org.junit.jupiter.api.Test;
import org.mre.e1.TestData;
import org.mre.e1.repository.ProofRepository;

import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

class PodiumServiceTest {

    /** The repository already counts approved, non-practice proofs per team (that's its query). */
    private static PodiumService podium(Object[]... counts) {
        ProofRepository proofs = TestData.fake(ProofRepository.class,
                Map.of("countApprovedByTeam", args -> List.of(counts)));
        return new PodiumService(proofs);
    }

    private static Object[] team(String slug, long proofs) {
        return new Object[]{slug, proofs};
    }

    @Test
    void theTopThreeTeamsByApprovedProofs() {
        List<PodiumService.Standing> top = podium(team("niki", 28), team("sunoo", 42), team("jay", 12),
                team("sunghoon", 35), team("jake", 9)).podium();
        assertEquals(List.of("sunoo", "sunghoon", "niki"), top.stream().map(PodiumService.Standing::team).toList());
        assertEquals(List.of(1, 2, 3), top.stream().map(PodiumService.Standing::position).toList());
        assertEquals(42, top.get(0).proofs());
    }

    @Test
    void everyTeamIsInTheStandingsEvenWithoutProofs() {
        List<PodiumService.Standing> all = podium(team("jake", 3)).standings();
        assertEquals(6, all.size());
        assertEquals("jake", all.get(0).team());
        assertEquals(0, all.get(5).proofs());
    }

    @Test
    void onlyTeamsWithProofsMakeThePodium() {
        assertEquals(1, podium(team("jay", 1)).podium().size());
        assertTrue(podium().podium().isEmpty());
    }

    @Test
    void tiesKeepTheTeamOrder() {
        List<PodiumService.Standing> all = podium(team("niki", 5), team("jay", 5)).standings();
        PodiumService.Standing first = all.get(0);
        PodiumService.Standing second = all.get(1);
        assertEquals(5, first.proofs());
        assertEquals(5, second.proofs());
        assertTrue(org.mre.e1.model.Team.fromSlug(first.team()).ordinal()
                < org.mre.e1.model.Team.fromSlug(second.team()).ordinal());
    }
}
