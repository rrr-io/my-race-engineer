package org.mre.e1.service;

import org.mre.e1.model.PaddockMessage;
import org.mre.e1.model.PaddockMessage.Kind;
import org.mre.e1.model.Team;
import org.mre.e1.model.TeamChant;
import org.mre.e1.repository.PaddockMessageRepository;
import org.mre.e1.repository.TeamChantRepository;
import org.mre.e1.service.RadioService.RadioMessage;
import org.mre.e1.service.RadioService.Sender;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.Clock;
import java.time.Duration;
import java.util.ArrayList;
import java.util.Collections;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * Paddock Announcers: Race Control sends a team its fanchant or a message; only that team's crew gets it, through
 * their race engineer.
 */
@Service
public class PaddockService {

    static final int MAX_CHANT = 300;
    static final int MAX_MESSAGE = 500;
    /** How long an announcement stays in the team's feed. */
    static final Duration IN_FEED = Duration.ofHours(48);

    private final TeamChantRepository chants;
    private final PaddockMessageRepository messages;
    private final PushNotifier notifier;
    private final Clock clock;

    public PaddockService(TeamChantRepository chants, PaddockMessageRepository messages, PushNotifier notifier,
                          Clock clock) {
        this.chants = chants;
        this.messages = messages;
        this.notifier = notifier;
        this.clock = clock;
    }

    /** slug -> chant, in team order. */
    @Transactional(readOnly = true)
    public Map<String, String> chants() {
        Map<String, String> result = new LinkedHashMap<>();
        for (Team team : Team.values()) {
            result.put(team.slug(), chants.findById(team.slug()).map(TeamChant::getBody).orElse(""));
        }
        return result;
    }

    @Transactional
    public Map<String, String> setChant(Team team, String text) {
        String clean = text == null ? "" : text.strip();
        if (clean.length() > MAX_CHANT) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "A chant can be up to " + MAX_CHANT + " characters");
        }
        chants.findById(team.slug()).orElseThrow().change(clean, clock.instant());
        return chants();
    }

    /** CHANT sends the team's saved chant (text is ignored); MESSAGE sends text. */
    @Transactional
    public PaddockMessage send(Team team, Kind kind, String text) {
        String body;
        if (kind == Kind.CHANT) {
            body = chants.findById(team.slug()).map(TeamChant::getBody).orElse("");
            if (body.isBlank()) {
                throw new ResponseStatusException(HttpStatus.CONFLICT, "Save the team's chant first");
            }
        } else {
            body = text == null ? "" : text.strip();
            if (body.isEmpty() || body.length() > MAX_MESSAGE) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "A message is 1 to " + MAX_MESSAGE + " characters");
            }
        }
        PaddockMessage saved = messages.save(new PaddockMessage(team, kind, body, clock.instant()));
        // it reaches the fan through their engineer, like every other radio call
        String name = "Team " + CalendarService.NAMES.get(team);
        notifier.paddock(team, kind == Kind.CHANT ? "Race Engineer · " + name + " fanchant" : "Race Engineer", body);
        return saved;
    }

    @Transactional(readOnly = true)
    public List<PaddockMessage> recent() {
        return messages.findTop30ByOrderByCreatedAtDesc();
    }

    @Transactional
    public void delete(long id) {
        if (!messages.existsById(id)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND);
        }
        messages.deleteById(id);
    }

    /** The team's announcements of the last 48 hours, oldest first, as radio messages. */
    @Transactional(readOnly = true)
    public List<RadioMessage> forTeam(Team team) {
        List<PaddockMessage> found = new ArrayList<>(
                messages.findTop5ByTeamAndCreatedAtAfterOrderByCreatedAtDesc(team, clock.instant().minus(IN_FEED)));
        Collections.reverse(found);
        return found.stream()
                .map(m -> new RadioMessage(Sender.PADDOCK, m.getKind().name(), m.getBody(), m.getCreatedAt(), m.getId()))
                .toList();
    }
}
