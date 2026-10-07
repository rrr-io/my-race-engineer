package org.emgp.e1.reminder;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.annotation.Configuration;
import org.springframework.scheduling.annotation.EnableScheduling;
import org.springframework.scheduling.annotation.Scheduled;

@Configuration
@EnableScheduling
public class ReminderScheduler {

    private static final Logger log = LoggerFactory.getLogger(ReminderScheduler.class);

    private final ReminderService service;

    public ReminderScheduler(ReminderService service) {
        this.service = service;
    }

    @Scheduled(fixedDelayString = "${reminders.tick-ms}", initialDelayString = "${reminders.tick-ms}")
    public void tick() {
        try {
            service.run(false);
        } catch (RuntimeException e) {
            log.error("Reminder pass failed", e);
        }
    }
}
