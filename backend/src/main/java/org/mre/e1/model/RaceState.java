package org.mre.e1.model;

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

    /** When the current phase began (Lights Out time). */
    @Column(name = "phase_started_at")
    private Instant phaseStartedAt;

    /** When the current pit stop began; null when there is none. */
    @Column(name = "pit_stop_started_at")
    private Instant pitStopStartedAt;

    protected RaceState() {
    }

    /**
     * Switching free practice on or off always sends the race back to the grid; an explicit phase in the same request
     * wins. Free practice is a session of its own, so it restarts the clock like a new phase.
     */
    public void update(Phase newPhase, Boolean newPitStop, Boolean newPractice) {
        Instant now = Instant.now();
        Phase oldPhase = this.phase;
        boolean oldPitStop = this.pitStop;
        boolean practiceChanged = newPractice != null && newPractice != this.practice;
        if (practiceChanged) {
            this.practice = newPractice;
            this.phase = Phase.GRID;
        }
        if (newPhase != null) {
            this.phase = newPhase;
        }
        if (newPitStop != null) {
            this.pitStop = newPitStop;
        }
        if (this.phase != oldPhase || practiceChanged) {
            this.phaseStartedAt = now;
        }
        if (this.pitStop && !oldPitStop) {
            this.pitStopStartedAt = now;
        } else if (!this.pitStop) {
            this.pitStopStartedAt = null;
        }
        this.updatedAt = now;
    }

    public Phase getPhase() { return phase; }
    public boolean isPitStop() { return pitStop; }
    public boolean isPractice() { return practice; }
    public Instant getUpdatedAt() { return updatedAt; }
    public Instant getPhaseStartedAt() { return phaseStartedAt != null ? phaseStartedAt : updatedAt; }
    public Instant getPitStopStartedAt() { return pitStopStartedAt != null ? pitStopStartedAt : updatedAt; }
}
