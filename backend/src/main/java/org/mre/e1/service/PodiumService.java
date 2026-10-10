package org.mre.e1.service;

import org.mre.e1.model.Team;
import org.mre.e1.repository.ProofRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.Comparator;
import java.util.EnumMap;
import java.util.List;
import java.util.Map;

/**
 * The Podium: teams ranked by approved proofs over the whole race (every phase, every day). Practice proofs and
 * rejected ones don't count. Ties keep the team order, so the ranking is stable.
 */
@Service
public class PodiumService {

    public record Standing(int position, String team, long proofs) {}

    private final ProofRepository proofs;

    public PodiumService(ProofRepository proofs) {
        this.proofs = proofs;
    }

    /** All six teams, best first, teams with no proof included. */
    @Transactional(readOnly = true)
    public List<Standing> standings() {
        Map<Team, Long> counts = new EnumMap<>(Team.class);
        Arrays.stream(Team.values()).forEach(t -> counts.put(t, 0L));
        for (Object[] row : proofs.countApprovedByTeam()) {
            counts.put(Team.fromSlug((String) row[0]), ((Number) row[1]).longValue());
        }
        List<Map.Entry<Team, Long>> sorted = new ArrayList<>(counts.entrySet());
        sorted.sort(Comparator.<Map.Entry<Team, Long>>comparingLong(Map.Entry::getValue).reversed()
                .thenComparing(e -> e.getKey().ordinal()));
        List<Standing> result = new ArrayList<>();
        for (int i = 0; i < sorted.size(); i++) {
            result.add(new Standing(i + 1, sorted.get(i).getKey().slug(), sorted.get(i).getValue()));
        }
        return result;
    }

    /** The top three that sent at least one proof. */
    @Transactional(readOnly = true)
    public List<Standing> podium() {
        return standings().stream().filter(s -> s.proofs() > 0).limit(3).toList();
    }
}
