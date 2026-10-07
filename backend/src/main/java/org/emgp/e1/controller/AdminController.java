package org.emgp.e1.controller;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
public class AdminController {

    @GetMapping("/api/admin/session")
    public Map<String, Boolean> session() {
        return Map.of("ok", true);
    }
}
