package org.emgp.e1.message;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface MessageTemplateRepository extends JpaRepository<MessageTemplate, Long> {

    List<MessageTemplate> findByEventTypeAndTeamOrderByVariant(String eventType, String team);
}
