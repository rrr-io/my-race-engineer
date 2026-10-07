package org.emgp.e1.repository;

import org.emgp.e1.model.Proof;
import org.emgp.e1.model.ProofStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

public interface ProofRepository extends JpaRepository<Proof, Long> {

    List<Proof> findByCrewIdAndDay(UUID crewId, LocalDate day);

    List<Proof> findTop100ByStatusOrderByIdAsc(ProofStatus status);

    long countByStatus(ProofStatus status);
}
