package org.mre.e1.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "crew_member")
public class CrewMember {

    @Id
    private UUID id;

    @Column(nullable = false, length = 16)
    private Team team;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    protected CrewMember() {
    }

    public CrewMember(Team team) {
        this.id = UUID.randomUUID();
        this.team = team;
        this.createdAt = Instant.now();
    }

    public UUID getId() { return id; }
    public Team getTeam() { return team; }
    public Instant getCreatedAt() { return createdAt; }
}
