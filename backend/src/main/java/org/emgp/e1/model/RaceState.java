package org.emgp.e1.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import java.time.Instant;

@Entity
@Table(name = "race_state")
public class RaceState {

    @Id
    private Integer id;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 16)
    private Phase phase;

    @Column(name = "pit_stop", nullable = false)
    private boolean pitStop;

    @Column(nullable = false)
    private boolean practice;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    protected RaceState() {
    }

    /** Switching practice on or off always sends the race back to the grid; an explicit phase in the same request wins. */
    public void update(Phase newPhase, Boolean newPitStop, Boolean newPractice) {
        if (newPractice != null && newPractice != this.practice) {
            this.practice = newPractice;
            this.phase = Phase.GRID;
        }
        if (newPhase != null) {
            this.phase = newPhase;
        }
        if (newPitStop != null) {
            this.pitStop = newPitStop;
        }
        this.updatedAt = Instant.now();
    }

    public Phase getPhase() { return phase; }
    public boolean isPitStop() { return pitStop; }
    public boolean isPractice() { return practice; }
    public Instant getUpdatedAt() { return updatedAt; }
}
