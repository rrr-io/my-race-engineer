package org.mre.e1.repository;

import org.mre.e1.model.MessageTemplate;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface MessageTemplateRepository extends JpaRepository<MessageTemplate, Long> {

    List<MessageTemplate> findByEventTypeAndTeamOrderByVariant(String eventType, String team);
}
