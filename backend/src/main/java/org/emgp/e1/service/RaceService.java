package org.emgp.e1.service;

import org.emgp.e1.model.Phase;
import org.emgp.e1.model.RaceState;
import org.emgp.e1.repository.RaceStateRepository;
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
        state.update(phase, pitStop, practice);
        return state;
    }
}
