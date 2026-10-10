package org.mre.e1.model;

import org.junit.jupiter.api.Test;
import org.mre.e1.TestData;

import java.time.Instant;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

class RaceStateTest {

    @Test
    void switchingFreePracticeSendsTheRaceBackToTheGrid() {
        RaceState state = TestData.race(Phase.GRAND_PRIX, false, false);
        state.update(null, null, true);
        assertTrue(state.isPractice());
        assertEquals(Phase.GRID, state.getPhase());
    }

    @Test
    void anExplicitPhaseWinsOverTheResetToGrid() {
        RaceState state = TestData.race(Phase.GRID, false, true);
        state.update(Phase.SPRINT_RACE, null, false);
        assertFalse(state.isPractice());
        assertEquals(Phase.SPRINT_RACE, state.getPhase());
    }

    @Test
    void freePracticeRestartsTheClockEvenWhenThePhaseStaysGrid() {
        RaceState state = TestData.race(Phase.GRID, false, false);
        TestData.set(state, "phaseStartedAt", Instant.EPOCH);
        state.update(null, null, true);
        assertTrue(state.getPhaseStartedAt().isAfter(Instant.EPOCH));
    }

    @Test
    void aPitStopRemembersWhenItStartedAndForgetsWhenItEnds() {
        RaceState state = TestData.race(Phase.SPRINT_RACE, false, false);
        state.update(null, true, null);
        assertNotNull(TestData.get(state, "pitStopStartedAt"));
        state.update(null, false, null);
        assertNull(TestData.get(state, "pitStopStartedAt"));
    }

    @Test
    void theSamePhaseAgainKeepsItsStartTime() {
        RaceState state = TestData.race(Phase.SPRINT_RACE, false, false);
        TestData.set(state, "phaseStartedAt", Instant.EPOCH);
        state.update(Phase.SPRINT_RACE, null, null);
        assertEquals(Instant.EPOCH, state.getPhaseStartedAt());
    }
}
