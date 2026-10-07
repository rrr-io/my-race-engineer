package org.emgp.e1.push;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import java.time.Instant;
import java.time.LocalDate;
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

    @Column(length = 64)
    private String timezone;

    @Column(name = "last_reminder_at")
    private Instant lastReminderAt;

    @Column(name = "reminder_day")
    private LocalDate reminderDay;

    @Column(name = "reminder_count", nullable = false)
    private int reminderCount;

    protected PushSubscription() {
    }

    public PushSubscription(UUID crewId, String endpoint, String p256dh, String auth, String timezone) {
        this.crewId = crewId;
        this.endpoint = endpoint;
        this.p256dh = p256dh;
        this.auth = auth;
        this.timezone = timezone;
        this.createdAt = Instant.now();
    }

    public void update(UUID newCrewId, String newP256dh, String newAuth, String newTimezone) {
        this.crewId = newCrewId;
        this.p256dh = newP256dh;
        this.auth = newAuth;
        if (newTimezone != null) {
            this.timezone = newTimezone;
        }
    }

    /** reminder_count counts the reminders of one Korean day; it starts again when the day changes. */
    public void markReminded(Instant now, LocalDate day) {
        this.reminderCount = day.equals(this.reminderDay) ? this.reminderCount + 1 : 1;
        this.reminderDay = day;
        this.lastReminderAt = now;
    }

    public int remindersOn(LocalDate day) {
        return day.equals(reminderDay) ? reminderCount : 0;
    }

    public Long getId() { return id; }
    public UUID getCrewId() { return crewId; }
    public String getEndpoint() { return endpoint; }
    public String getP256dh() { return p256dh; }
    public String getAuth() { return auth; }
    public String getTimezone() { return timezone; }
    public Instant getLastReminderAt() { return lastReminderAt; }
}
