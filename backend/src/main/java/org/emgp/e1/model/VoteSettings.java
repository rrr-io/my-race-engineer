package org.emgp.e1.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "vote_settings")
public class VoteSettings {

    @Id
    private Integer id;

    @Column(nullable = false, length = 300)
    private String url;

    protected VoteSettings() {
    }

    public void setUrl(String newUrl) {
        this.url = newUrl;
    }

    public String getUrl() { return url; }
}
