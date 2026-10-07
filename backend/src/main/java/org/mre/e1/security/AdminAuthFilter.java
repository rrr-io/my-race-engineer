package org.mre.e1.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.util.Base64;

/** HTTP Basic check for /api/admin/**. No WWW-Authenticate header, so browsers don't open their own prompt. */
@Component
public class AdminAuthFilter extends OncePerRequestFilter {

    private final byte[] expected;

    public AdminAuthFilter(@Value("${admin.username}") String username,
                           @Value("${admin.password}") String password) {
        this.expected = (username + ":" + password).getBytes(StandardCharsets.UTF_8);
    }

    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        return !request.getRequestURI().startsWith("/api/admin/");
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain chain)
            throws ServletException, IOException {
        String header = request.getHeader(HttpHeaders.AUTHORIZATION);
        if (header != null && header.startsWith("Basic ")) {
            try {
                byte[] given = Base64.getDecoder().decode(header.substring(6).trim());
                if (MessageDigest.isEqual(given, expected)) {
                    chain.doFilter(request, response);
                    return;
                }
            } catch (IllegalArgumentException ignored) {
                // malformed base64: fall through to 401
            }
        }
        response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
        response.setContentType(MediaType.APPLICATION_JSON_VALUE);
        response.getWriter().write("{\"error\":\"unauthorized\"}");
    }
}
