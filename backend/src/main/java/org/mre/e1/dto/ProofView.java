package org.mre.e1.dto;

import java.time.Instant;
import java.time.LocalDate;
import java.util.List;

/**
 * A fan's day: one row per active category. {@code done} means every category has an approved proof;
 * {@code needsAction} means at least one category is missing or was rejected. {@code lastActivityAt} is the latest
 * upload or review of the day (null when nothing was sent).
 */
public record ProofView(LocalDate day, boolean done, boolean needsAction, List<CategoryProgress> categories,
                        int maxPerSubmission, Long latestProofId,
                        Instant lastActivityAt) {

    public record CategoryProgress(long id, String name, ProofState state, String reason, int count) {}
}
