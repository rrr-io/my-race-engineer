package org.mre.e1.service;

import org.mre.e1.model.Phase;
import org.mre.e1.model.RaceState;
import org.mre.e1.repository.RaceStateRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
public class RaceService {

    private static final int ROW_ID = 1;

    private final RaceStateRepository repository;

    public RaceService(RaceStateRepository repository) {
        this.repository = repository;
    }

    @Transactional(readOnly = true)
    public RaceState get() {
        return repository.findById(ROW_ID).orElseThrow();
    }

    /**
     * While a pit stop is on the stage is frozen: neither a new phase nor switching free practice (which resets the
     * phase) is accepted, unless the same request ends the pit stop.
     * Free practice is a session on the Grid, for trying uploads and reviews that don't count: it starts only from
     * the Grid, no race phase or pit stop happens while it's on, and ending it can move straight to a phase.
     */
    @Transactional
    public RaceState update(Phase phase, Boolean pitStop, Boolean practice) {
        RaceState state = repository.findById(ROW_ID).orElseThrow();
        boolean endsPitStop = Boolean.FALSE.equals(pitStop);
        boolean changesStage = (phase != null && phase != state.getPhase())
                || (practice != null && practice != state.isPractice());
        if (state.isPitStop() && changesStage && !endsPitStop) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "End the pit stop before changing stage");
        }
        boolean startsPractice = Boolean.TRUE.equals(practice) && !state.isPractice();
        boolean inPractice = state.isPractice() && !Boolean.FALSE.equals(practice);
        if (startsPractice && (phase != null ? phase != Phase.GRID : state.getPhase() != Phase.GRID)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Free practice starts from the Grid");
        }
        if ((startsPractice || inPractice) && phase != null && phase != Phase.GRID) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "End free practice before changing phase");
        }
        if ((startsPractice || inPractice) && Boolean.TRUE.equals(pitStop)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "No pit stop during free practice");
        }
        state.update(phase, pitStop, practice);
        return state;
    }
}
