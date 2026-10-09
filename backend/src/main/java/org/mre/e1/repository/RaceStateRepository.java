package org.mre.e1.repository;

import org.mre.e1.model.RaceState;
import org.springframework.data.jpa.repository.JpaRepository;

public interface RaceStateRepository extends JpaRepository<RaceState, Integer> {
    @org.springframework.data.jpa.repository.Lock(jakarta.persistence.LockModeType.PESSIMISTIC_READ)
    @org.springframework.data.jpa.repository.Query("select r from RaceState r where r.id = 1")
    RaceState lockForProof();

    @org.springframework.data.jpa.repository.Lock(jakarta.persistence.LockModeType.PESSIMISTIC_WRITE)
    @org.springframework.data.jpa.repository.Query("select r from RaceState r where r.id = 1")
    RaceState lockForUpdate();
}
