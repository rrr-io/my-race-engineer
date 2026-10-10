package org.mre.e1.service;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mre.e1.TestData;
import org.mre.e1.dto.ProofState;
import org.mre.e1.dto.ProofView;
import org.mre.e1.model.Phase;
import org.mre.e1.model.Proof;
import org.mre.e1.model.RaceState;
import org.springframework.web.server.ResponseStatusException;

import java.io.IOException;
import java.nio.file.Files;
import java.time.Clock;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneOffset;
import java.util.List;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

class ProofServiceTest {

    private static final long FANS_CHOICE = 1;
    private static final long SONG_OF_THE_YEAR = 2;
    private static final int PER_REQUEST = 3;
    // 21:00 in Korea: still 10 October there
    private static final Clock CLOCK = Clock.fixed(Instant.parse("2026-10-10T12:00:00Z"), ZoneOffset.UTC);
    private static final LocalDate TODAY_KST = LocalDate.of(2026, 10, 10);

    private final UUID fan = UUID.randomUUID();
    private RaceState state;
    private RaceService race;
    private TestData.Proofs proofs;
    private ProofService service;

    @BeforeEach
    void setUp() throws IOException {
        state = TestData.race(Phase.SPRINT_RACE, false, false);
        race = new RaceService(TestData.raceRepository(state));
        proofs = new TestData.Proofs();
        CategoryService categories = new CategoryService(TestData.categoryRepository(List.of(
                TestData.category(FANS_CHOICE, "Fans' Choice"),
                TestData.category(SONG_OF_THE_YEAR, "Song of the Year"))), CLOCK);
        ProofStorage storage = new ProofStorage(Files.createTempDirectory("proofs").toString());
        service = new ProofService(proofs.repository, storage, race, null, categories, CLOCK, PER_REQUEST, 1_000_000);
    }

    private ProofView send(long... categoryIds) {
        List<Long> ids = java.util.Arrays.stream(categoryIds).boxed().toList();
        return service.submit(fan, ids.stream().map(id -> TestData.PNG).toList(), ids);
    }

    private ProofState stateOf(ProofView view, long categoryId) {
        return view.categories().stream().filter(c -> c.id() == categoryId).findFirst().orElseThrow().state();
    }

    private static int status(Runnable action) {
        return assertThrows(ResponseStatusException.class, action::run).getStatusCode().value();
    }

    @Test
    void aProofIsUnderReviewUntilRaceControlDecides() {
        ProofView view = send(FANS_CHOICE);
        assertEquals(ProofState.PENDING, stateOf(view, FANS_CHOICE));
        assertEquals(ProofState.MISSING, stateOf(view, SONG_OF_THE_YEAR));
        assertEquals(TODAY_KST, proofs.last().getDay());
        assertEquals(Phase.SPRINT_RACE, proofs.last().getPhase());
    }

    @Test
    void theDayIsDoneWhenEveryCategoryIsApproved() {
        send(FANS_CHOICE, SONG_OF_THE_YEAR);
        service.approve(1);
        ProofService.Decision last = service.approve(2);
        assertTrue(last.done());
        assertTrue(last.current());
        assertTrue(service.today(fan).done());
    }

    @Test
    void aRejectionNeedsAReasonAndAsksForANewProof() {
        send(FANS_CHOICE);
        assertEquals(400, status(() -> service.reject(1, "  ")));
        service.reject(1, "Not readable");
        ProofView view = service.today(fan);
        assertEquals(ProofState.REJECTED, stateOf(view, FANS_CHOICE));
        assertEquals("Not readable", view.categories().get(0).reason());
        assertTrue(view.needsAction());
    }

    @Test
    void aProofIsReviewedOnlyOnce() {
        send(FANS_CHOICE);
        service.approve(1);
        assertEquals(409, status(() -> service.reject(1, "Wrong app")));
    }

    @Test
    void anApprovedCategoryStillTakesMoreCertificates() {
        send(FANS_CHOICE);
        service.approve(1);
        send(FANS_CHOICE);
        assertEquals(ProofState.APPROVED, stateOf(service.today(fan), FANS_CHOICE));
        assertEquals(2, service.today(fan).categories().get(0).count());
    }

    @Test
    void thereIsNoDailyLimit() {
        for (int i = 0; i < 10; i++) {
            send(FANS_CHOICE, FANS_CHOICE, SONG_OF_THE_YEAR);
        }
        assertEquals(30, proofs.count(fan, TODAY_KST));
    }

    @Test
    void oneRequestCarriesAFewCertificatesAtATime() {
        assertEquals(400, status(() -> send(FANS_CHOICE, FANS_CHOICE, FANS_CHOICE, FANS_CHOICE)));
    }

    @Test
    void theDayIsAnnouncedAsDoneOnlyOnce() {
        send(FANS_CHOICE, SONG_OF_THE_YEAR);
        service.approve(1);
        assertTrue(service.approve(2).done());
        send(FANS_CHOICE);
        assertFalse(service.approve(3).done());
    }

    @Test
    void onlyKnownCategoriesAndRealImagesAreAccepted() {
        assertEquals(400, status(() -> service.submit(fan, List.of(TestData.PNG), List.of(99L))));
        assertEquals(400, status(() -> service.submit(fan, List.of("hello".getBytes()), List.of(FANS_CHOICE))));
        assertTrue(proofs.all.isEmpty());
    }

    @Test
    void uploadsAreClosedOnTheGridAndDuringAPitStop() {
        TestData.set(state, "phase", Phase.GRID);
        assertEquals(409, status(() -> send(FANS_CHOICE)));
        TestData.set(state, "phase", Phase.FINISH_LINE);
        assertEquals(409, status(() -> send(FANS_CHOICE)));
        TestData.set(state, "phase", Phase.GRAND_PRIX);
        TestData.set(state, "pitStop", true);
        assertEquals(409, status(() -> send(FANS_CHOICE)));
        assertTrue(proofs.all.isEmpty());
    }

    @Test
    void freePracticeOpensUploadsOnTheGrid() {
        TestData.set(state, "phase", Phase.GRID);
        TestData.set(state, "practice", true);
        send(FANS_CHOICE);
        Proof proof = proofs.last();
        assertTrue(proof.isPractice());
        assertEquals(ProofState.PENDING, stateOf(service.today(fan), FANS_CHOICE));
    }

    @Test
    void practiceProofsNeverCountForTheRace() {
        TestData.set(state, "phase", Phase.GRID);
        TestData.set(state, "practice", true);
        send(FANS_CHOICE, FANS_CHOICE);
        service.approve(1);
        assertEquals(ProofState.APPROVED, stateOf(service.today(fan), FANS_CHOICE));

        race.update(Phase.SPRINT_RACE, null, false);
        ProofView raceDay = service.today(fan);
        assertEquals(ProofState.MISSING, stateOf(raceDay, FANS_CHOICE));
        assertEquals(0, raceDay.categories().get(0).count());
        send(FANS_CHOICE, FANS_CHOICE);
        assertFalse(proofs.last().isPractice());
    }

    @Test
    void aPracticeProofReviewedAfterPracticeEndedIsNotCurrent() {
        TestData.set(state, "phase", Phase.GRID);
        TestData.set(state, "practice", true);
        send(FANS_CHOICE);
        race.update(Phase.SPRINT_RACE, null, false);

        ProofService.Decision decision = service.approve(1);
        assertTrue(decision.practice());
        assertFalse(decision.current());
    }
}
