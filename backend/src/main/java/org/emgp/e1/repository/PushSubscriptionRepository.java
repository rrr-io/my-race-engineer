package org.emgp.e1.repository;

import org.emgp.e1.model.PushSubscription;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface PushSubscriptionRepository extends JpaRepository<PushSubscription, Long> {

    Optional<PushSubscription> findByEndpoint(String endpoint);

    List<PushSubscription> findByCrewId(UUID crewId);

    void deleteByEndpoint(String endpoint);

    void deleteByEndpointAndCrewId(String endpoint, UUID crewId);
}
