package org.mre.e1.service;

import org.junit.jupiter.api.Test;
import org.mre.e1.TestData;
import org.mre.e1.dto.ProofState;
import org.mre.e1.dto.ProofView;
import org.mre.e1.model.Phase;
import org.mre.e1.model.RaceState;
import org.mre.e1.model.Team;
import org.mre.e1.repository.MessageTemplateRepository;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

class RadioServiceTest {

    private static final LocalDate DAY = LocalDate.of(2026, 10, 10);

    private static ProofView day(ProofView.CategoryProgress... rows) {
        boolean done = rows.length > 0 && List.of(rows).stream().allMatch(r -> r.state() == ProofState.APPROVED);
        return new ProofView(DAY, done, !done, List.of(rows), 10, null, null);
    }

    private static ProofView.CategoryProgress row(long id, String name, ProofState state) {
        return new ProofView.CategoryProgress(id, name, state, null, state == ProofState.MISSING ? 0 : 1);
    }

    /** No templates stored: only the lines written in code are sent. */
    private static RadioService radio() {
        MessageTemplateRepository templates = TestData.fake(MessageTemplateRepository.class,
                Map.of("findByEventTypeAndTeamOrderByVariant", args -> List.of()));
        return new RadioService(templates, new PodiumService(new TestData.Proofs().repository));
    }

    @Test
    void namesAreJoinedLikeASentence() {
        assertEquals("Fans' Choice", RadioService.joinNames(List.of("Fans' Choice")));
        assertEquals("A and B", RadioService.joinNames(List.of("A", "B")));
        assertEquals("A, B and C", RadioService.joinNames(List.of("A", "B", "C")));
    }

    @Test
    void thePracticeCallListsOnlyWhatIsStillToDo() {
        Optional<String> text = RadioService.practiceBriefing(day(
                row(1, "Fans' Choice", ProofState.MISSING),
                row(2, "Song of the Year", ProofState.APPROVED),
                row(3, "Best Male Group", ProofState.REJECTED)));
        assertTrue(text.orElseThrow().contains("Fans' Choice and Best Male Group"));
        assertFalse(text.get().contains("Song of the Year"));
        assertTrue(text.get().contains("doesn't count for the race"));
    }

    @Test
    void thePracticeCallWaitsForTheCategories() {
        assertTrue(RadioService.practiceBriefing(day()).orElseThrow().contains("still setting the categories"));
    }

    @Test
    void thePracticeCallStopsWhenEverythingWasSent() {
        assertTrue(RadioService.practiceBriefing(day(row(1, "Fans' Choice", ProofState.PENDING))).isEmpty());
    }

    @Test
    void duringFreePracticeTheBriefingIsThePracticeCall() {
        RaceState state = TestData.race(Phase.GRID, false, true);
        RadioService.Radio radio = radio().forTeam(Team.SUNOO, state, day(row(1, "Fans' Choice", ProofState.MISSING)), null);
        assertTrue(radio.practice());
        RadioService.RadioMessage briefing = radio.messages().stream()
                .filter(m -> m.kind().equals("BRIEFING")).findFirst().orElseThrow();
        assertEquals(RadioService.Sender.ENGINEER, briefing.from());
        assertTrue(briefing.text().startsWith("Free practice is open!"));
    }

    @Test
    void theChequeredFlagCallNamesThePodium() {
        assertEquals("Chequered flag! The race is over. Thank you, crew!", RadioService.podiumLine(List.of()));
        String line = RadioService.podiumLine(List.of(
                new PodiumService.Standing(1, "sunoo", 42),
                new PodiumService.Standing(2, "sunghoon", 35),
                new PodiumService.Standing(3, "niki", 1)));
        assertTrue(line.startsWith("Chequered flag! P1 Team Sunoo with 42 proofs, P2 Team Sunghoon with 35"));
        assertTrue(line.endsWith("Thank you, crew!"));
    }

    @Test
    void theFinishLineCarriesThePodium() {
        RaceState state = TestData.race(Phase.FINISH_LINE, false, false);
        RadioService.Radio radio = radio().forTeam(Team.JAY, state, day(), null);
        assertTrue(radio.messages().stream().anyMatch(m -> m.kind().equals("PODIUM")));
        assertTrue(radio.podium().isEmpty());
    }
}
