package org.emgp.e1.service;

import org.emgp.e1.model.VoteSettings;
import org.emgp.e1.repository.VoteSettingsRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.net.URI;
import java.net.URISyntaxException;

/** The link behind the "Open MNET+" button. Only https links are accepted. */
@Service
public class VoteService {

    private static final int ROW_ID = 1;
    private static final int MAX_LENGTH = 300;

    private final VoteSettingsRepository repository;

    public VoteService(VoteSettingsRepository repository) {
        this.repository = repository;
    }

    @Transactional(readOnly = true)
    public String url() {
        return repository.findById(ROW_ID).orElseThrow().getUrl();
    }

    @Transactional
    public String update(String url) {
        String clean = url == null ? "" : url.trim();
        if (!valid(clean)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Use a full https:// link");
        }
        VoteSettings settings = repository.findById(ROW_ID).orElseThrow();
        settings.setUrl(clean);
        return clean;
    }

    private static boolean valid(String url) {
        if (url.isEmpty() || url.length() > MAX_LENGTH || !url.startsWith("https://")
                || url.chars().anyMatch(Character::isWhitespace)) {
            return false;
        }
        try {
            return new URI(url).getHost() != null;
        } catch (URISyntaxException e) {
            return false;
        }
    }
}
