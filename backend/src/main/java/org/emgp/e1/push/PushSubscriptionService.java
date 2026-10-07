package org.emgp.e1.push;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
public class PushSubscriptionService {

    private final PushSubscriptionRepository repository;

    public PushSubscriptionService(PushSubscriptionRepository repository) {
        this.repository = repository;
    }

    /** One row per device: subscribing again from the same endpoint just refreshes the keys and the crew. */
    @Transactional
    public void save(UUID crewId, String endpoint, String p256dh, String auth) {
        repository.findByEndpoint(endpoint).ifPresentOrElse(
                existing -> existing.update(crewId, p256dh, auth),
                () -> repository.save(new PushSubscription(crewId, endpoint, p256dh, auth)));
    }

    @Transactional
    public void remove(UUID crewId, String endpoint) {
        repository.deleteByEndpointAndCrewId(endpoint, crewId);
    }

    @Transactional
    public void removeExpired(String endpoint) {
        repository.deleteByEndpoint(endpoint);
    }

    @Transactional(readOnly = true)
    public List<PushSubscription> all() {
        return repository.findAll();
    }

    @Transactional(readOnly = true)
    public List<PushSubscription> forCrew(UUID crewId) {
        return repository.findByCrewId(crewId);
    }

    @Transactional(readOnly = true)
    public long count() {
        return repository.count();
    }
}
