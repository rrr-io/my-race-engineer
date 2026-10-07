package org.mre.e1.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import java.time.LocalTime;

@Entity
@Table(name = "reminder_settings")
public class ReminderSettings {

    @Id
    private Integer id;

    @Column(nullable = false)
    private boolean enabled;

    @Column(name = "interval_hours", nullable = false)
    private int intervalHours;

    @Column(name = "window_start", nullable = false)
    private LocalTime windowStart;

    @Column(name = "window_end", nullable = false)
    private LocalTime windowEnd;

    protected ReminderSettings() {
    }

    public void update(boolean newEnabled, int newIntervalHours, LocalTime newStart, LocalTime newEnd) {
        this.enabled = newEnabled;
        this.intervalHours = newIntervalHours;
        this.windowStart = newStart;
        this.windowEnd = newEnd;
    }

    public boolean isEnabled() { return enabled; }
    public int getIntervalHours() { return intervalHours; }
    public LocalTime getWindowStart() { return windowStart; }
    public LocalTime getWindowEnd() { return windowEnd; }
}
