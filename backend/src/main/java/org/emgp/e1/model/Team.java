package org.emgp.e1.model;

import java.util.Arrays;

public enum Team {
    JAY("jay"),
    JAKE("jake"),
    SUNGHOON("sunghoon"),
    SUNOO("sunoo"),
    JUNGWON("jungwon"),
    NIKI("niki");

    private final String slug;

    Team(String slug) {
        this.slug = slug;
    }

    public String slug() {
        return slug;
    }

    public static Team fromSlug(String slug) {
        return Arrays.stream(values())
                .filter(t -> t.slug.equals(slug))
                .findFirst()
                .orElseThrow(() -> new IllegalArgumentException("Unknown team: " + slug));
    }
}
