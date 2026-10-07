package org.emgp.e1.proof;

import org.emgp.e1.category.Category;
import org.emgp.e1.category.CategoryService;
import org.emgp.e1.crew.CrewMember;
import org.emgp.e1.crew.CrewMemberRepository;
import org.emgp.e1.crew.Team;
import org.emgp.e1.race.Phase;
import org.emgp.e1.race.RaceService;
import org.emgp.e1.race.RaceState;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.io.IOException;
import java.time.Clock;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
public class ProofService {

    /** MAMA voting resets on the Korean day, so "today" is always the KST date. */
    private static final ZoneId KST = ZoneId.of("Asia/Seoul");

    public record PendingProof(long id, UUID crewId, String team, long categoryId, String category, LocalDate day,
                               Instant createdAt, boolean practice, Phase phase) {}

    public record ImageData(byte[] bytes, String contentType) {}

    /** The outcome of a review. {@code current} = it concerns today; {@code done} = the fan's day is now complete. */
    public record Decision(UUID crewId, ProofStatus status, String category, String reason, long proofId,
                           boolean current, boolean done) {}

    private final ProofRepository proofs;
    private final ProofStorage storage;
    private final RaceService race;
    private final CrewMemberRepository crew;
    private final CategoryService categories;
    private final Clock clock;
    private final int maxPerSubmission;
    private final int maxPerCategory;
    private final int maxImageBytes;

    public ProofService(ProofRepository proofs, ProofStorage storage, RaceService race, CrewMemberRepository crew,
                        CategoryService categories, Clock clock,
                        @Value("${proofs.max-per-submission}") int maxPerSubmission,
                        @Value("${proofs.max-per-category}") int maxPerCategory,
                        @Value("${proofs.max-image-bytes}") int maxImageBytes) {
        this.proofs = proofs;
        this.storage = storage;
        this.race = race;
        this.crew = crew;
        this.categories = categories;
        this.clock = clock;
        this.maxPerSubmission = maxPerSubmission;
        this.maxPerCategory = maxPerCategory;
        this.maxImageBytes = maxImageBytes;
    }

    @Transactional(readOnly = true)
    public ProofView today(UUID crewId) {
        return progress(crewId, today());
    }

    /**
     * Any number of screenshots, each tagged with its category. A category that is already approved is closed;
     * the others accept more until the daily cap per category.
     */
    @Transactional
    public ProofView submit(UUID crewId, List<byte[]> files, List<Long> categoryIds) {
        if (files.isEmpty() || files.size() != categoryIds.size() || files.size() > maxPerSubmission) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Send between 1 and " + maxPerSubmission + " screenshots, each with its category");
        }
        Map<Long, Category> active = categories.active().stream()
                .collect(Collectors.toMap(Category::getId, Function.identity()));
        List<ImageType> types = new ArrayList<>();
        for (int i = 0; i < files.size(); i++) {
            if (!active.containsKey(categoryIds.get(i))) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Unknown category");
            }
            if (files.get(i).length > maxImageBytes) {
                throw new ResponseStatusException(HttpStatus.PAYLOAD_TOO_LARGE, "Screenshot too large");
            }
            types.add(ImageType.detect(files.get(i)).orElseThrow(() ->
                    new ResponseStatusException(HttpStatus.BAD_REQUEST, "Only JPEG, PNG and WebP images are accepted")));
        }

        LocalDate day = today();
        Map<Long, ProofView.CategoryProgress> state = progress(crewId, day).categories().stream()
                .collect(Collectors.toMap(ProofView.CategoryProgress::id, Function.identity()));
        Map<Long, Integer> adding = new HashMap<>();
        categoryIds.forEach(id -> adding.merge(id, 1, Integer::sum));
        for (Map.Entry<Long, Integer> entry : adding.entrySet()) {
            ProofView.CategoryProgress category = state.get(entry.getKey());
            if (category.state() == ProofState.APPROVED) {
                throw new ResponseStatusException(HttpStatus.CONFLICT, category.name() + " is already approved");
            }
            if (category.count() + entry.getValue() > maxPerCategory) {
                throw new ResponseStatusException(HttpStatus.CONFLICT, "Too many screenshots for " + category.name() + " today");
            }
        }

        RaceState raceState = race.get();
        List<String> stored = new ArrayList<>();
        try {
            for (int i = 0; i < files.size(); i++) {
                stored.add(storage.store(files.get(i), types.get(i)));
            }
            Instant now = clock.instant();
            for (int i = 0; i < files.size(); i++) {
                proofs.save(new Proof(crewId, categoryIds.get(i), day, raceState.getPhase(), raceState.isPractice(),
                        stored.get(i), types.get(i).contentType(), files.get(i).length, now));
            }
            return progress(crewId, day);
        } catch (IOException e) {
            stored.forEach(storage::deleteQuietly);
            throw new IllegalStateException("Could not store the screenshots", e);
        } catch (RuntimeException e) {
            stored.forEach(storage::deleteQuietly);
            throw e;
        }
    }

    @Transactional(readOnly = true)
    public List<PendingProof> pending() {
        List<Proof> pending = proofs.findTop100ByStatusOrderByIdAsc(ProofStatus.PENDING);
        if (pending.isEmpty()) {
            return List.of();
        }
        Map<UUID, Team> teams = crew.findAllById(pending.stream().map(Proof::getCrewId).distinct().toList())
                .stream()
                .collect(Collectors.toMap(CrewMember::getId, CrewMember::getTeam));
        Map<Long, String> names = categories.namesById(pending.stream().map(Proof::getCategoryId).distinct().toList());
        return pending.stream()
                .map(p -> new PendingProof(p.getId(), p.getCrewId(),
                        teams.containsKey(p.getCrewId()) ? teams.get(p.getCrewId()).slug() : "unknown",
                        p.getCategoryId(), names.getOrDefault(p.getCategoryId(), "Category"),
                        p.getDay(), p.getCreatedAt(), p.isPractice(), p.getPhase()))
                .toList();
    }

    @Transactional(readOnly = true)
    public long pendingCount() {
        return proofs.countByStatus(ProofStatus.PENDING);
    }

    @Transactional(readOnly = true)
    public ImageData image(long proofId) {
        Proof proof = proofs.findById(proofId).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
        try {
            return new ImageData(storage.read(proof.getFileName()), proof.getContentType());
        } catch (IOException | RuntimeException e) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND);
        }
    }

    @Transactional
    public Decision approve(long proofId) {
        Proof proof = pendingOrThrow(proofId);
        proof.approve(clock.instant());
        return decision(proof);
    }

    @Transactional
    public Decision reject(long proofId, String reason) {
        String clean = reason == null ? "" : reason.trim();
        if (clean.isEmpty() || clean.length() > 200) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "A reason of up to 200 characters is required");
        }
        Proof proof = pendingOrThrow(proofId);
        proof.reject(clean, clock.instant());
        return decision(proof);
    }

    private Decision decision(Proof proof) {
        String category = categories.find(proof.getCategoryId()).map(Category::getName).orElse("category");
        boolean current = proof.getDay().equals(today());
        boolean done = progress(proof.getCrewId(), proof.getDay()).done();
        return new Decision(proof.getCrewId(), proof.getStatus(), category, proof.getReason(), proof.getId(), current, done);
    }

    private Proof pendingOrThrow(long proofId) {
        Proof proof = proofs.findById(proofId).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
        if (proof.getStatus() != ProofStatus.PENDING) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "This proof has already been reviewed");
        }
        return proof;
    }

    private ProofView progress(UUID crewId, LocalDate day) {
        List<Proof> ofTheDay = proofs.findByCrewIdAndDay(crewId, day);
        List<ProofView.CategoryProgress> rows = new ArrayList<>();
        for (Category category : categories.active()) {
            List<Proof> mine = ofTheDay.stream().filter(p -> p.getCategoryId().equals(category.getId())).toList();
            ProofState state = stateOf(mine);
            rows.add(new ProofView.CategoryProgress(category.getId(), category.getName(), state,
                    state == ProofState.REJECTED ? lastReason(mine) : null, mine.size()));
        }
        boolean done = !rows.isEmpty() && rows.stream().allMatch(r -> r.state() == ProofState.APPROVED);
        boolean needsAction = rows.stream().anyMatch(r -> r.state() == ProofState.MISSING || r.state() == ProofState.REJECTED);
        Long latest = ofTheDay.stream().map(Proof::getId).max(Long::compare).orElse(null);
        return new ProofView(day, done, needsAction, rows, maxPerSubmission, maxPerCategory, latest);
    }

    private static ProofState stateOf(List<Proof> mine) {
        if (mine.stream().anyMatch(p -> p.getStatus() == ProofStatus.APPROVED)) {
            return ProofState.APPROVED;
        }
        if (mine.stream().anyMatch(p -> p.getStatus() == ProofStatus.PENDING)) {
            return ProofState.PENDING;
        }
        if (mine.stream().anyMatch(p -> p.getStatus() == ProofStatus.REJECTED)) {
            return ProofState.REJECTED;
        }
        return ProofState.MISSING;
    }

    private static String lastReason(List<Proof> mine) {
        return mine.stream().filter(p -> p.getStatus() == ProofStatus.REJECTED)
                .max(Comparator.comparingLong(Proof::getId)).map(Proof::getReason).orElse(null);
    }

    private LocalDate today() {
        return LocalDate.now(clock.withZone(KST));
    }
}
