package org.mre.e1.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import java.time.Instant;

/** One Paddock announcement to one team: its fanchant (CHANT) or a written message (MESSAGE). */
@Entity
@Table(name = "paddock_message")
public class PaddockMessage {

    public enum Kind { CHANT, MESSAGE }

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 16)
    private Team team;

    @jakarta.persistence.Enumerated(jakarta.persistence.EnumType.STRING)
    @Column(nullable = false, length = 8)
    private Kind kind;

    @Column(nullable = false, length = 500)
    private String body;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    protected PaddockMessage() {
    }

    public PaddockMessage(Team team, Kind kind, String body, Instant now) {
        this.team = team;
        this.kind = kind;
        this.body = body;
        this.createdAt = now;
    }

    public Long getId() { return id; }
    public Team getTeam() { return team; }
    public Kind getKind() { return kind; }
    public String getBody() { return body; }
    public Instant getCreatedAt() { return createdAt; }
}
