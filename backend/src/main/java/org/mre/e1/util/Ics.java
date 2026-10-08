package org.mre.e1.util;

import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.time.ZoneOffset;
import java.time.format.DateTimeFormatter;

/** Small helpers for writing iCalendar (RFC 5545) text by hand. */
public final class Ics {

    private static final DateTimeFormatter UTC =
            DateTimeFormatter.ofPattern("yyyyMMdd'T'HHmmss'Z'").withZone(ZoneOffset.UTC);
    private static final int MAX_OCTETS = 75;

    private Ics() {
    }

    public static String time(Instant instant) {
        return UTC.format(instant);
    }

    /** Escapes a TEXT value: backslash, semicolon, comma and newlines. */
    public static String text(String value) {
        StringBuilder out = new StringBuilder(value.length() + 8);
        for (int i = 0; i < value.length(); i++) {
            char c = value.charAt(i);
            switch (c) {
                case '\\' -> out.append("\\\\");
                case ';' -> out.append("\\;");
                case ',' -> out.append("\\,");
                case '\n' -> out.append("\\n");
                case '\r' -> { }
                default -> out.append(c);
            }
        }
        return out.toString();
    }

    /** Appends one content line, folded at 75 octets without splitting a UTF-8 character, ending in CRLF. */
    public static void line(StringBuilder out, String line) {
        int octets = 0;
        int limit = MAX_OCTETS;
        for (int i = 0; i < line.length(); ) {
            int cp = line.codePointAt(i);
            int size = new String(Character.toChars(cp)).getBytes(StandardCharsets.UTF_8).length;
            if (octets + size > limit) {
                out.append("\r\n ");
                octets = 0;
                limit = MAX_OCTETS - 1; // the leading space counts
            }
            out.appendCodePoint(cp);
            octets += size;
            i += Character.charCount(cp);
        }
        out.append("\r\n");
    }
}
