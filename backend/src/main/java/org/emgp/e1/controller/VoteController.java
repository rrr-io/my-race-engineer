package org.emgp.e1.controller;

import org.emgp.e1.service.VoteService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class VoteController {

    public record VoteLink(String url) {}

    private final VoteService service;

    public VoteController(VoteService service) {
        this.service = service;
    }

    @GetMapping("/api/admin/vote-link")
    public VoteLink get() {
        return new VoteLink(service.url());
    }

    @PutMapping("/api/admin/vote-link")
    public VoteLink update(@RequestBody VoteLink request) {
        return new VoteLink(service.update(request.url()));
    }
}
