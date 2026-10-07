package org.emgp.e1.push;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import org.emgp.e1.crew.CrewMemberRepository;
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

import java.util.UUID;

@RestController
public class PushController {

    public record KeyResponse(boolean enabled, String publicKey) {}

    public record Keys(@NotBlank String p256dh, @NotBlank String auth) {}

    public record SubscribeRequest(@NotBlank String endpoint, @NotNull @Valid Keys keys) {}

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
        subscriptions.save(id, request.endpoint(), request.keys().p256dh(), request.keys().auth());
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
