package org.mre.e1.repository;

import org.mre.e1.model.RaceEvent;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.Instant;
import java.util.List;

public interface RaceEventRepository extends JpaRepository<RaceEvent, Long> {

    List<RaceEvent> findAllByOrderByStartsAtAsc();

    List<RaceEvent> findByEndsAtAfterOrderByStartsAtAsc(Instant now);
}
