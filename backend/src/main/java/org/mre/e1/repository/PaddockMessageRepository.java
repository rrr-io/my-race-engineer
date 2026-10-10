package org.mre.e1.repository;

import org.mre.e1.model.PaddockMessage;
import org.mre.e1.model.Team;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.Instant;
import java.util.List;

public interface PaddockMessageRepository extends JpaRepository<PaddockMessage, Long> {

    List<PaddockMessage> findTop30ByOrderByCreatedAtDesc();

    List<PaddockMessage> findTop5ByTeamAndCreatedAtAfterOrderByCreatedAtDesc(Team team, Instant after);
}
