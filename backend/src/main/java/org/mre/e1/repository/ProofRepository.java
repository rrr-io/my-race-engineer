package org.mre.e1.repository;

import org.mre.e1.model.Proof;
import org.mre.e1.model.ProofStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

public interface ProofRepository extends JpaRepository<Proof, Long> {

    List<Proof> findByCrewIdAndDay(UUID crewId, LocalDate day);

    List<Proof> findTop100ByStatusOrderByIdAsc(ProofStatus status);

    long countByStatus(ProofStatus status);

    /** [team slug, approved proofs] for every team with at least one approved, non-practice proof. */
    @Query(value = "SELECT c.team, COUNT(*) FROM proof p JOIN crew_member c ON c.id = p.crew_id "
            + "WHERE p.status = 'APPROVED' AND p.practice = FALSE GROUP BY c.team", nativeQuery = true)
    List<Object[]> countApprovedByTeam();
}
