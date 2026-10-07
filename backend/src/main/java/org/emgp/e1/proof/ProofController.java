package org.emgp.e1.proof;

import org.emgp.e1.crew.CrewMemberRepository;
import org.emgp.e1.push.PushNotifier;
import org.springframework.http.CacheControl;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import java.io.IOException;
import java.time.Duration;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
public class ProofController {

    public record RejectRequest(String reason) {}

    public record PendingResponse(long pendingCount, List<ProofService.PendingProof> pending) {}

    private final ProofService proofs;
    private final CrewMemberRepository crew;
    private final PushNotifier notifier;

    public ProofController(ProofService proofs, CrewMemberRepository crew, PushNotifier notifier) {
        this.proofs = proofs;
        this.crew = crew;
        this.notifier = notifier;
    }

    @PostMapping("/api/crew/{id}/proofs")
    @ResponseStatus(HttpStatus.CREATED)
    public ProofView submit(@PathVariable UUID id, @RequestParam("files") List<MultipartFile> files,
                            @RequestParam("categoryIds") List<Long> categoryIds) {
        requireCrew(id);
        List<byte[]> data = new ArrayList<>();
        for (MultipartFile file : files) {
            try {
                data.add(file.getBytes());
            } catch (IOException e) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Could not read the upload");
            }
        }
        return proofs.submit(id, data, categoryIds);
    }

    @GetMapping("/api/crew/{id}/proofs/today")
    public ProofView today(@PathVariable UUID id) {
        requireCrew(id);
        return proofs.today(id);
    }

    @GetMapping("/api/admin/proofs")
    public PendingResponse pending() {
        return new PendingResponse(proofs.pendingCount(), proofs.pending());
    }

    @GetMapping("/api/admin/proofs/{id}/image")
    public ResponseEntity<byte[]> image(@PathVariable long id) {
        ProofService.ImageData image = proofs.image(id);
        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(image.contentType()))
                .cacheControl(CacheControl.maxAge(Duration.ofHours(1)).cachePrivate())
                .body(image.bytes());
    }

    @PostMapping("/api/admin/proofs/{id}/approve")
    public Map<String, String> approve(@PathVariable long id) {
        ProofService.Decision decision = proofs.approve(id);
        if (decision.current() && decision.done()) {
            notifier.proofDecided(decision.crewId(), ProofStatus.APPROVED, null, decision.proofId());
        }
        return Map.of("status", ProofStatus.APPROVED.name());
    }

    @PostMapping("/api/admin/proofs/{id}/reject")
    public Map<String, String> reject(@PathVariable long id, @RequestBody RejectRequest request) {
        ProofService.Decision decision = proofs.reject(id, request.reason());
        if (decision.current()) {
            notifier.proofDecided(decision.crewId(), ProofStatus.REJECTED,
                    decision.reason() + " (" + decision.category() + ")", decision.proofId());
        }
        return Map.of("status", ProofStatus.REJECTED.name());
    }

    private void requireCrew(UUID id) {
        if (!crew.existsById(id)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND);
        }
    }
}
