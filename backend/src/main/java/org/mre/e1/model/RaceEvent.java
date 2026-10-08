package org.mre.e1.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import java.time.Instant;

/** One date of the Race Weekend calendar. */
@Entity
@Table(name = "race_event")
public class RaceEvent {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 120)
    private String title;

    @Column(nullable = false, length = 500)
    private String note;

    @Column(name = "starts_at", nullable = false)
    private Instant startsAt;

    @Column(name = "ends_at", nullable = false)
    private Instant endsAt;

    /** Bumped on every change, so calendar apps replace the old copy (ICS SEQUENCE). */
    @Column(nullable = false)
    private int sequence;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    protected RaceEvent() {
    }

    public RaceEvent(String title, String note, Instant startsAt, Instant endsAt, Instant now) {
        this.title = title;
        this.note = note;
        this.startsAt = startsAt;
        this.endsAt = endsAt;
        this.sequence = 0;
        this.updatedAt = now;
    }

    public void change(String newTitle, String newNote, Instant newStart, Instant newEnd, Instant now) {
        this.title = newTitle;
        this.note = newNote;
        this.startsAt = newStart;
        this.endsAt = newEnd;
        this.sequence++;
        this.updatedAt = now;
    }

    public Long getId() { return id; }
    public String getTitle() { return title; }
    public String getNote() { return note; }
    public Instant getStartsAt() { return startsAt; }
    public Instant getEndsAt() { return endsAt; }
    public int getSequence() { return sequence; }
    public Instant getUpdatedAt() { return updatedAt; }
}
