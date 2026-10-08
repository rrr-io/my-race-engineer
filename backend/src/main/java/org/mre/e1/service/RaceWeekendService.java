package org.mre.e1.service;

import org.mre.e1.model.RaceEvent;
import org.mre.e1.repository.RaceEventRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.time.OffsetDateTime;
import java.time.format.DateTimeParseException;
import java.util.List;

/** The Race Weekend calendar: dates set by Race Control, shown in the app and in the ICS feed. */
@Service
public class RaceWeekendService {

    public static final int MAX_EVENTS = 100;
    private static final int MAX_TITLE = 120;
    private static final int MAX_NOTE = 500;
    private static final Duration MAX_LENGTH = Duration.ofDays(31);

    public record Draft(String title, String note, String start, String end) {}

    private final RaceEventRepository repository;
    private final Clock clock;

    public RaceWeekendService(RaceEventRepository repository, Clock clock) {
        this.repository = repository;
        this.clock = clock;
    }

    @Transactional(readOnly = true)
    public List<RaceEvent> all() {
        return repository.findAllByOrderByStartsAtAsc();
    }

    /** Events not over yet, soonest first. */
    @Transactional(readOnly = true)
    public List<RaceEvent> upcoming() {
        return repository.findByEndsAtAfterOrderByStartsAtAsc(clock.instant());
    }

    @Transactional
    public RaceEvent create(Draft draft) {
        if (repository.count() >= MAX_EVENTS) {
            throw bad("Up to " + MAX_EVENTS + " dates");
        }
        Checked c = check(draft);
        return repository.save(new RaceEvent(c.title, c.note, c.start, c.end, clock.instant()));
    }

    @Transactional
    public RaceEvent update(long id, Draft draft) {
        RaceEvent event = repository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
        Checked c = check(draft);
        event.change(c.title, c.note, c.start, c.end, clock.instant());
        return event;
    }

    @Transactional
    public void delete(long id) {
        if (!repository.existsById(id)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND);
        }
        repository.deleteById(id);
    }

    private record Checked(String title, String note, Instant start, Instant end) {}

    private static Checked check(Draft draft) {
        if (draft == null) {
            throw bad("Missing date");
        }
        String title = draft.title() == null ? "" : draft.title().strip();
        String note = draft.note() == null ? "" : draft.note().strip();
        if (title.isEmpty() || title.length() > MAX_TITLE) {
            throw bad("Title: 1 to " + MAX_TITLE + " characters");
        }
        if (note.length() > MAX_NOTE) {
            throw bad("Note: up to " + MAX_NOTE + " characters");
        }
        Instant start = parse(draft.start());
        Instant end = parse(draft.end());
        if (!end.isAfter(start)) {
            throw bad("The end must come after the start");
        }
        if (Duration.between(start, end).compareTo(MAX_LENGTH) > 0) {
            throw bad("A date can last up to 31 days");
        }
        return new Checked(title, note, start, end);
    }

    /** Times come with their offset (the admin panel sends KST, +09:00). */
    private static Instant parse(String value) {
        if (value == null) {
            throw bad("Missing time");
        }
        try {
            return OffsetDateTime.parse(value.strip()).toInstant();
        } catch (DateTimeParseException e) {
            throw bad("Use a time like 2026-11-28T18:00+09:00");
        }
    }

    private static ResponseStatusException bad(String reason) {
        return new ResponseStatusException(HttpStatus.BAD_REQUEST, reason);
    }
}
