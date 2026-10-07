package org.mre.e1.controller;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import org.mre.e1.repository.CrewMemberRepository;
import org.mre.e1.service.PushNotifier;
import org.mre.e1.service.PushSubscriptionService;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import java.time.DateTimeException;
import java.time.ZoneId;
import java.util.UUID;

@RestController
public class PushController {

    public record KeyResponse(boolean enabled, String publicKey) {}

    public record Keys(@NotBlank String p256dh, @NotBlank String auth) {}

    public record SubscribeRequest(@NotBlank String endpoint, @NotNull @Valid Keys keys, String timezone) {}

    public record AdminPushResponse(boolean enabled, long subscriptions) {}

    public record TestResponse(boolean enabled, int sent) {}

    private final PushNotifier notifier;
    private final PushSubscriptionService subscriptions;
    private final CrewMemberRepository crew;

    public PushController(PushNotifier notifier, PushSubscriptionService subscriptions, CrewMemberRepository crew) {
        this.notifier = notifier;
        this.subscriptions = subscriptions;
        this.crew = crew;
    }

    @GetMapping("/api/push/key")
    public KeyResponse key() {
        return new KeyResponse(notifier.enabled(), notifier.enabled() ? notifier.publicKey() : null);
    }

    @PostMapping("/api/crew/{id}/push")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void subscribe(@PathVariable UUID id, @Valid @RequestBody SubscribeRequest request) {
        if (!crew.existsById(id)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND);
        }
        subscriptions.save(id, request.endpoint(), request.keys().p256dh(), request.keys().auth(),
                validTimezone(request.timezone()));
    }

    /** The device's IANA time zone, used to remind it at sensible local hours; anything unusable is ignored. */
    private static String validTimezone(String timezone) {
        if (timezone == null || timezone.isBlank() || timezone.length() > 64) {
            return null;
        }
        try {
            ZoneId.of(timezone.trim());
            return timezone.trim();
        } catch (DateTimeException e) {
            return null;
        }
    }

    @DeleteMapping("/api/crew/{id}/push")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void unsubscribe(@PathVariable UUID id, @RequestParam String endpoint) {
        subscriptions.remove(id, endpoint);
    }

    @GetMapping("/api/admin/push")
    public AdminPushResponse adminPush() {
        return new AdminPushResponse(notifier.enabled(), notifier.subscriberCount());
    }

    @PostMapping("/api/admin/push/test")
    public TestResponse sendTest() {
        return new TestResponse(notifier.enabled(), notifier.sendTest());
    }
}
