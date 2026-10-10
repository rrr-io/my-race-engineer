package org.mre.e1.service;

import org.junit.jupiter.api.Test;
import org.mre.e1.TestData;
import org.mre.e1.model.Phase;
import org.mre.e1.model.RaceState;
import org.springframework.web.server.ResponseStatusException;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

class RaceServiceTest {

    private static RaceService serviceFor(RaceState state) {
        return new RaceService(TestData.raceRepository(state));
    }

    private static void assertConflict(Runnable change) {
        ResponseStatusException e = assertThrows(ResponseStatusException.class, change::run);
        assertEquals(409, e.getStatusCode().value());
    }

    @Test
    void aPitStopFreezesTheStage() {
        RaceState state = TestData.race(Phase.SPRINT_RACE, true, false);
        RaceService race = serviceFor(state);
        assertConflict(() -> race.update(Phase.GRAND_PRIX, null, null));
        assertEquals(Phase.SPRINT_RACE, state.getPhase());
    }

    @Test
    void endingThePitStopInTheSameRequestUnfreezesIt() {
        RaceState state = TestData.race(Phase.SPRINT_RACE, true, false);
        serviceFor(state).update(Phase.GRAND_PRIX, false, null);
        assertEquals(Phase.GRAND_PRIX, state.getPhase());
        assertFalse(state.isPitStop());
    }

    @Test
    void freePracticeStartsOnlyFromTheGrid() {
        RaceState state = TestData.race(Phase.SPRINT_RACE, false, false);
        assertConflict(() -> serviceFor(state).update(null, null, true));
        assertFalse(state.isPractice());
    }

    @Test
    void freePracticeStartsFromTheGrid() {
        RaceState state = TestData.race(Phase.GRID, false, false);
        serviceFor(state).update(null, null, true);
        assertTrue(state.isPractice());
        assertEquals(Phase.GRID, state.getPhase());
    }

    @Test
    void freePracticeLocksPhasesAndPitStops() {
        RaceState state = TestData.race(Phase.GRID, false, true);
        RaceService race = serviceFor(state);
        assertConflict(() -> race.update(Phase.SPRINT_RACE, null, null));
        assertConflict(() -> race.update(null, true, null));
        assertEquals(Phase.GRID, state.getPhase());
        assertFalse(state.isPitStop());
    }

    @Test
    void endingFreePracticeCanGoStraightToARacePhase() {
        RaceState state = TestData.race(Phase.GRID, false, true);
        serviceFor(state).update(Phase.SPRINT_RACE, null, false);
        assertFalse(state.isPractice());
        assertEquals(Phase.SPRINT_RACE, state.getPhase());
    }

    @Test
    void racePhasesMoveFreelyOutsidePracticeAndPitStops() {
        RaceState state = TestData.race(Phase.GRID, false, false);
        RaceService race = serviceFor(state);
        race.update(Phase.SPRINT_RACE, null, null);
        race.update(Phase.FINISH_LINE, null, null);
        assertEquals(Phase.FINISH_LINE, state.getPhase());
    }
}
