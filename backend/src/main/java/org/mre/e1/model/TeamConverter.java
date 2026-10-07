package org.mre.e1.model;

import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;

/** Stores teams as lowercase slugs. */
@Converter(autoApply = true)
public class TeamConverter implements AttributeConverter<Team, String> {

    @Override
    public String convertToDatabaseColumn(Team team) {
        return team == null ? null : team.slug();
    }

    @Override
    public Team convertToEntityAttribute(String slug) {
        return slug == null ? null : Team.fromSlug(slug);
    }
}
