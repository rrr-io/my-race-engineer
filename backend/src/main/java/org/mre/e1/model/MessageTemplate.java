package org.mre.e1.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "message_template")
public class MessageTemplate {

    @Id
    private Long id;

    @Column(name = "event_type", nullable = false, length = 32)
    private String eventType;

    @Column(nullable = false, length = 16)
    private String team;

    @Column(nullable = false)
    private short variant;

    @Column(nullable = false)
    private String body;

    protected MessageTemplate() {
    }

    public String getBody() { return body; }
}
