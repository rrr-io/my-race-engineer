package org.emgp.e1.crew;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.UUID;

public interface CrewMemberRepository extends JpaRepository<CrewMember, UUID> {
}
