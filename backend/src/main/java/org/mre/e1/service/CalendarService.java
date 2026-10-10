package org.mre.e1.service;

import org.mre.e1.model.RaceEvent;
import org.mre.e1.model.Team;
import org.mre.e1.util.Ics;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.net.URI;
import java.time.Clock;
import java.util.List;
import java.util.Map;

/** Writes the Race Weekend as an ICS feed, one per team, with a reminder in the engineer's voice. */
@Service
public class CalendarService {

    static final Map<Team, String> NAMES = Map.of(
            Team.JAY, "Jay", Team.JAKE, "Jake", Team.SUNGHOON, "Sunghoon",
            Team.SUNOO, "Sunoo", Team.JUNGWON, "Jungwon", Team.NIKI, "Ni-ki");

    /** What the engineer says 30 minutes before each date. */
    static final Map<Team, String> ALARMS = Map.of(
            Team.JAY, "Box, box: 30 minutes to the start. Battery up, MNET+ logged in, stay on the racing line.",
            Team.SUNOO, "30 minutes to go!! I'm so excited. Get comfy, open MNET+ and let's do this together!",
            Team.JUNGWON, "30 minutes. Phone charged, app open, no excuses. I trust you. Don't make me repeat it.",
            Team.JAKE, "Hey, 30 minutes to go. No stress, just grab a snack and be there.",
            Team.SUNGHOON, "30 minutes to the start. Get ready. You'll do great.",
            Team.NIKI, "30 minutes. Be there.");

    private final RaceWeekendService raceWeekend;
    private final Clock clock;
    private final String appUrl;
    private final String uidDomain;

    public CalendarService(RaceWeekendService raceWeekend, Clock clock,
                           @Value("${app.url}") String appUrl) {
        this.raceWeekend = raceWeekend;
        this.clock = clock;
        this.appUrl = appUrl.endsWith("/") ? appUrl.substring(0, appUrl.length() - 1) : appUrl;
        String host = URI.create(this.appUrl).getHost();
        this.uidDomain = host == null ? "race-engineer" : host;
    }

    public String feed(Team team) {
        List<RaceEvent> events = raceWeekend.all();
        String name = "Race Weekend · Team " + NAMES.get(team);
        String stamp = Ics.time(clock.instant());

        StringBuilder out = new StringBuilder(512 + events.size() * 600);
        Ics.line(out, "BEGIN:VCALENDAR");
        Ics.line(out, "VERSION:2.0");
        Ics.line(out, "PRODID:-//RACE ENGENEer//Race Weekend//EN");
        Ics.line(out, "CALSCALE:GREGORIAN");
        Ics.line(out, "METHOD:PUBLISH");
        Ics.line(out, "X-WR-CALNAME:" + Ics.text(name));
        Ics.line(out, "X-WR-CALDESC:" + Ics.text("Voting dates for ENHYPEN at MAMA, from your race ENGENEer."));
        Ics.line(out, "REFRESH-INTERVAL;VALUE=DURATION:PT1H");
        Ics.line(out, "X-PUBLISHED-TTL:PT1H");

        for (RaceEvent e : events) {
            String description = e.getNote().isEmpty()
                    ? "Open your race ENGENEer: " + appUrl
                    : e.getNote() + "\n\nOpen your race ENGENEer: " + appUrl;
            Ics.line(out, "BEGIN:VEVENT");
            Ics.line(out, "UID:race-event-" + e.getId() + "@" + uidDomain);
            Ics.line(out, "DTSTAMP:" + stamp);
            Ics.line(out, "LAST-MODIFIED:" + Ics.time(e.getUpdatedAt()));
            Ics.line(out, "SEQUENCE:" + e.getSequence());
            Ics.line(out, "DTSTART:" + Ics.time(e.getStartsAt()));
            Ics.line(out, "DTEND:" + Ics.time(e.getEndsAt()));
            Ics.line(out, "SUMMARY:" + Ics.text(e.getTitle()));
            Ics.line(out, "DESCRIPTION:" + Ics.text(description));
            Ics.line(out, "URL:" + appUrl + "/");
            Ics.line(out, "BEGIN:VALARM");
            Ics.line(out, "ACTION:DISPLAY");
            Ics.line(out, "TRIGGER:-PT30M");
            Ics.line(out, "DESCRIPTION:" + Ics.text(ALARMS.get(team)));
            Ics.line(out, "END:VALARM");
            Ics.line(out, "END:VEVENT");
        }
        Ics.line(out, "END:VCALENDAR");
        return out.toString();
    }
}
