package org.mre.e1.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

/** One screenshot, for one category, on one Korean day, with its own review. */
@Entity
@Table(name = "proof")
public class Proof {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "crew_id", nullable = false)
    private UUID crewId;

    @Column(name = "category_id", nullable = false)
    private Long categoryId;

    @Column(nullable = false)
    private LocalDate day;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 16)
    private ProofStatus status;

    @Column
    private String reason;

    @Column(nullable = false)
    private boolean practice;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 16)
    private Phase phase;

    @Column(name = "file_name", nullable = false, length = 64, unique = true)
    private String fileName;

    @Column(name = "content_type", nullable = false, length = 32)
    private String contentType;

    @Column(name = "size_bytes", nullable = false)
    private int sizeBytes;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @Column(name = "reviewed_at")
    private Instant reviewedAt;

    protected Proof() {
    }

    public Proof(UUID crewId, Long categoryId, LocalDate day, Phase phase, boolean practice,
                 String fileName, String contentType, int sizeBytes, Instant now) {
        this.crewId = crewId;
        this.categoryId = categoryId;
        this.day = day;
        this.phase = phase;
        this.practice = practice;
        this.fileName = fileName;
        this.contentType = contentType;
        this.sizeBytes = sizeBytes;
        this.status = ProofStatus.PENDING;
        this.createdAt = now;
    }

    public void approve(Instant now) {
        this.status = ProofStatus.APPROVED;
        this.reason = null;
        this.reviewedAt = now;
    }

    public void reject(String why, Instant now) {
        this.status = ProofStatus.REJECTED;
        this.reason = why;
        this.reviewedAt = now;
    }

    public Long getId() { return id; }
    public UUID getCrewId() { return crewId; }
    public Long getCategoryId() { return categoryId; }
    public LocalDate getDay() { return day; }
    public ProofStatus getStatus() { return status; }
    public String getReason() { return reason; }
    public boolean isPractice() { return practice; }
    public Phase getPhase() { return phase; }
    public String getFileName() { return fileName; }
    public String getContentType() { return contentType; }
    public Instant getCreatedAt() { return createdAt; }
    public Instant getReviewedAt() { return reviewedAt; }

    /** The last thing that happened to this proof: its review, or else its upload. */
    public Instant getLastActivityAt() { return reviewedAt != null ? reviewedAt : createdAt; }
}
