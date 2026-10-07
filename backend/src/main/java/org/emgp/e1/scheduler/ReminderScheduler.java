package org.emgp.e1.scheduler;

import org.emgp.e1.service.ReminderService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Component
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
