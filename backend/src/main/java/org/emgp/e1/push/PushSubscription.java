package org.emgp.e1.push;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "push_subscription")
public class PushSubscription {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "crew_id", nullable = false)
    private UUID crewId;

    @Column(nullable = false, unique = true)
    private String endpoint;

    @Column(nullable = false)
    private String p256dh;

    @Column(nullable = false)
    private String auth;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    protected PushSubscription() {
    }

    public PushSubscription(UUID crewId, String endpoint, String p256dh, String auth) {
        this.crewId = crewId;
        this.endpoint = endpoint;
        this.p256dh = p256dh;
        this.auth = auth;
        this.createdAt = Instant.now();
    }

    public void update(UUID newCrewId, String newP256dh, String newAuth) {
        this.crewId = newCrewId;
        this.p256dh = newP256dh;
        this.auth = newAuth;
    }

    public Long getId() { return id; }
    public UUID getCrewId() { return crewId; }
    public String getEndpoint() { return endpoint; }
    public String getP256dh() { return p256dh; }
    public String getAuth() { return auth; }
}
