package org.mre.e1.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import java.time.Instant;

/** A team's fanchant, sent by Race Control from the Paddock. Keyed by team slug (converters don't apply to ids). */
@Entity
@Table(name = "team_chant")
public class TeamChant {

    @Id
    private String team;

    @Column(nullable = false, length = 300)
    private String body;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    protected TeamChant() {
    }

    public void change(String newBody, Instant now) {
        this.body = newBody;
        this.updatedAt = now;
    }

    public String getTeam() { return team; }
    public String getBody() { return body; }
}
