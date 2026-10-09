package org.mre.e1.service;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mre.e1.dto.ProofState;
import org.mre.e1.model.*;
import org.mre.e1.repository.*;
import org.springframework.test.util.ReflectionTestUtils;
import java.time.*;
import java.util.*;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class ProofServiceTest {
    final ProofRepository repository = mock(ProofRepository.class);
    final ProofStorage storage = mock(ProofStorage.class);
    final RaceService race = mock(RaceService.class);
    final CrewMemberRepository crew = mock(CrewMemberRepository.class);
    final CategoryService categories = mock(CategoryService.class);
    final RaceState state = mock(RaceState.class);
    final UUID crewId = UUID.randomUUID();
    final Instant now = Instant.parse("2026-10-09T15:01:00Z");
    final LocalDate day = LocalDate.of(2026, 10, 10); // after midnight KST
    final List<Proof> rows = new ArrayList<>();
    ProofService service;

    @BeforeEach void setup() {
        Category category = new Category("Demo category", 0, now);
        ReflectionTestUtils.setField(category, "id", 1L);
        when(categories.active()).thenReturn(List.of(category));
        when(categories.find(1L)).thenReturn(Optional.of(category));
        when(race.get()).thenReturn(state);
        when(state.getPhase()).thenReturn(Phase.SPRINT_RACE);
        when(repository.findByCrewIdAndDay(crewId, day)).thenAnswer(i -> rows);
        service = new ProofService(repository, storage, race, crew, categories,
                Clock.fixed(now, ZoneOffset.UTC), 10, 5, 8388608);
    }

    Proof proof(boolean practice, ProofStatus status) {
        Proof p = new Proof(crewId, 1L, day, Phase.SPRINT_RACE, practice,
                "proof-" + rows.size(), "image/png", 8, now);
        ReflectionTestUtils.setField(p, "id", (long) rows.size() + 1);
        if (status == ProofStatus.APPROVED) p.approve(now);
        if (status == ProofStatus.REJECTED) p.reject("Wrong day", now);
        rows.add(p);
        when(repository.findById(p.getId())).thenReturn(Optional.of(p));
        return p;
    }

    @Test void practiceDoesNotCompleteOrConsumeLiveAllowance() {
        proof(true, ProofStatus.APPROVED);
        var live = service.today(crewId);
        assertFalse(live.done());
        assertEquals(ProofState.MISSING, live.categories().get(0).state());
        assertEquals(0, live.categories().get(0).count());
        assertNull(live.latestProofId());
        assertEquals(day, live.day());
        when(state.isPractice()).thenReturn(true);
        assertTrue(service.today(crewId).done());
    }

    @Test void practiceDecisionDoesNotNotifyLiveCrew() {
        Proof p = proof(true, ProofStatus.PENDING);
        var result = service.approve(p.getId());
        assertFalse(result.current());
        assertTrue(result.done());
        assertFalse(service.today(crewId).done());
    }
}
