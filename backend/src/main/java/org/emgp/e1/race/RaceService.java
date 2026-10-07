package org.emgp.e1.race;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

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

    @Transactional
    public RaceState update(Phase phase, Boolean pitStop, Boolean practice) {
        RaceState state = repository.findById(ROW_ID).orElseThrow();
        state.update(phase, pitStop, practice);
        return state;
    }
}
