package org.mre.e1.dto;

import java.time.LocalDate;
import java.util.List;

/**
 * A fan's day: one row per active category. {@code done} means every category has an approved proof;
 * {@code needsAction} means at least one category is missing or was rejected.
 */
public record ProofView(LocalDate day, boolean done, boolean needsAction, List<CategoryProgress> categories,
                        int maxPerSubmission, int maxPerCategory, Long latestProofId) {

    public record CategoryProgress(long id, String name, ProofState state, String reason, int count, int remaining) {}
}
