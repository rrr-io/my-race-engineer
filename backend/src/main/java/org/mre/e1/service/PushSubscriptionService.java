package org.mre.e1.service;

import org.mre.e1.model.PushSubscription;
import org.mre.e1.repository.PushSubscriptionRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.LocalDate;
import java.util.Collection;
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
    public void save(UUID crewId, String endpoint, String p256dh, String auth, String timezone) {
        repository.findByEndpoint(endpoint).ifPresentOrElse(
                existing -> existing.update(crewId, p256dh, auth, timezone),
                () -> repository.save(new PushSubscription(crewId, endpoint, p256dh, auth, timezone)));
    }

    @Transactional
    public void markReminded(Collection<Long> ids, Instant now, LocalDate day) {
        if (!ids.isEmpty()) {
            repository.findAllById(ids).forEach(s -> s.markReminded(now, day));
        }
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
