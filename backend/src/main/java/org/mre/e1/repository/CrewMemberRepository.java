package org.mre.e1.repository;

import org.mre.e1.model.CrewMember;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.UUID;

public interface CrewMemberRepository extends JpaRepository<CrewMember, UUID> {
    @org.springframework.data.jpa.repository.Lock(jakarta.persistence.LockModeType.PESSIMISTIC_WRITE)
    @org.springframework.data.jpa.repository.Query("select c from CrewMember c where c.id = :id")
    java.util.Optional<CrewMember> lockForProof(@org.springframework.data.repository.query.Param("id") UUID id);
}
