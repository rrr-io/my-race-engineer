package org.emgp.e1.reminder;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import java.time.DateTimeException;
import java.time.LocalTime;

@RestController
public class ReminderController {

    public record SettingsBody(boolean enabled, int intervalHours, String windowStart, String windowEnd) {}

    public record RunResponse(int reminded) {}

    private final ReminderService service;

    public ReminderController(ReminderService service) {
        this.service = service;
    }

    @GetMapping("/api/admin/reminders")
    public SettingsBody get() {
        return body(service.settings());
    }

    @PutMapping("/api/admin/reminders")
    public SettingsBody update(@RequestBody SettingsBody request) {
        return body(service.update(request.enabled(), request.intervalHours(),
                time(request.windowStart()), time(request.windowEnd())));
    }

    @PostMapping("/api/admin/reminders/run")
    public RunResponse run() {
        return new RunResponse(service.run(true));
    }

    private static LocalTime time(String value) {
        try {
            return LocalTime.parse(value);
        } catch (DateTimeException | NullPointerException e) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Times look like 10:00");
        }
    }

    private static SettingsBody body(ReminderService.Settings settings) {
        return new SettingsBody(settings.enabled(), settings.intervalHours(),
                settings.windowStart().toString(), settings.windowEnd().toString());
    }
}
