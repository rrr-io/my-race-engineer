package org.mre.e1.controller;

import org.mre.e1.model.PaddockMessage;
import org.mre.e1.model.Team;
import org.mre.e1.service.PaddockService;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import java.time.Instant;
import java.util.List;
import java.util.Map;

@RestController
public class PaddockController {

    public record ChantRequest(String text) {}
    public record SendRequest(String kind, String text) {}
    public record MessageView(long id, String team, String kind, String text, Instant at) {
        static MessageView of(PaddockMessage m) {
            return new MessageView(m.getId(), m.getTeam().slug(), m.getKind().name(), m.getBody(), m.getCreatedAt());
        }
    }
    public record PaddockView(Map<String, String> chants, List<MessageView> recent) {}

    private final PaddockService service;

    public PaddockController(PaddockService service) {
        this.service = service;
    }

    @GetMapping("/api/admin/paddock")
    public PaddockView get() {
        return new PaddockView(service.chants(), service.recent().stream().map(MessageView::of).toList());
    }

    @PutMapping("/api/admin/paddock/chants/{team}")
    public Map<String, String> setChant(@PathVariable String team, @RequestBody ChantRequest request) {
        return service.setChant(team(team), request.text());
    }

    @PostMapping("/api/admin/paddock/{team}/send")
    @ResponseStatus(HttpStatus.CREATED)
    public MessageView send(@PathVariable String team, @RequestBody SendRequest request) {
        PaddockMessage.Kind kind;
        try {
            kind = PaddockMessage.Kind.valueOf(request.kind() == null ? "" : request.kind());
        } catch (IllegalArgumentException e) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "kind is CHANT or MESSAGE");
        }
        return MessageView.of(service.send(team(team), kind, request.text()));
    }

    @DeleteMapping("/api/admin/paddock/messages/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable long id) {
        service.delete(id);
    }

    private static Team team(String slug) {
        try {
            return Team.fromSlug(slug);
        } catch (IllegalArgumentException e) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND);
        }
    }
}
