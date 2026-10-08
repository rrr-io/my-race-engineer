package org.mre.e1.controller;

import org.mre.e1.model.RaceEvent;
import org.mre.e1.model.Team;
import org.mre.e1.service.CalendarService;
import org.mre.e1.service.RaceWeekendService;
import org.mre.e1.service.RaceWeekendService.Draft;
import org.springframework.http.CacheControl;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.time.Instant;
import java.util.List;

@RestController
public class RaceWeekendController {

    public record EventView(long id, String title, String note, Instant start, Instant end) {
        static EventView of(RaceEvent e) {
            return new EventView(e.getId(), e.getTitle(), e.getNote(), e.getStartsAt(), e.getEndsAt());
        }
    }

    public record EventList(List<EventView> events) {
        static EventList of(List<RaceEvent> events) {
            return new EventList(events.stream().map(EventView::of).toList());
        }
    }

    private static final MediaType TEXT_CALENDAR = new MediaType("text", "calendar", StandardCharsets.UTF_8);

    private final RaceWeekendService service;
    private final CalendarService calendar;

    public RaceWeekendController(RaceWeekendService service, CalendarService calendar) {
        this.service = service;
        this.calendar = calendar;
    }

    /** Dates not over yet, for the card in the app. */
    @GetMapping("/api/race-weekend")
    public EventList upcoming() {
        return EventList.of(service.upcoming());
    }

    /** The feed fans subscribe to. Per team, so no crew id ever ends up in a calendar app. */
    @GetMapping("/api/calendar/{team}.ics")
    public ResponseEntity<String> feed(@PathVariable String team) {
        Team t;
        try {
            t = Team.fromSlug(team);
        } catch (IllegalArgumentException e) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND);
        }
        return ResponseEntity.ok()
                .contentType(TEXT_CALENDAR)
                .cacheControl(CacheControl.maxAge(Duration.ofMinutes(5)).cachePublic())
                .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"race-weekend-" + t.slug() + ".ics\"")
                .body(calendar.feed(t));
    }

    @GetMapping("/api/admin/race-weekend")
    public EventList all() {
        return EventList.of(service.all());
    }

    @PostMapping("/api/admin/race-weekend")
    @ResponseStatus(HttpStatus.CREATED)
    public EventView create(@RequestBody Draft draft) {
        return EventView.of(service.create(draft));
    }

    @PutMapping("/api/admin/race-weekend/{id}")
    public EventView update(@PathVariable long id, @RequestBody Draft draft) {
        return EventView.of(service.update(id, draft));
    }

    @DeleteMapping("/api/admin/race-weekend/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable long id) {
        service.delete(id);
    }
}
