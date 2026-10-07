package org.emgp.e1.repository;

import org.emgp.e1.model.CrewMember;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.UUID;

public interface CrewMemberRepository extends JpaRepository<CrewMember, UUID> {
}
