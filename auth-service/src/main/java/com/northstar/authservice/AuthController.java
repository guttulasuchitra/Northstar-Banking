package com.northstar.authservice;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/auth")
public class AuthController {
    private final UserRepository repo;
    private final PasswordEncoder encoder;
    private final JwtUtil jwt;

    public AuthController(UserRepository repo, PasswordEncoder encoder, JwtUtil jwt) {
        this.repo = repo; this.encoder = encoder; this.jwt = jwt;
    }

    public record Credentials(String username, String password) {}

    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody Credentials c) {
        if (c.username() == null || c.username().isBlank() || c.password() == null || c.password().isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Username and password required"));
        }
        if (repo.findByUsername(c.username()).isPresent()) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body(Map.of("error", "Username already exists"));
        }
        repo.save(new User(null, c.username(), encoder.encode(c.password()), "USER"));
        return ResponseEntity.status(HttpStatus.CREATED).body(Map.of("message", "Registered"));
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody Credentials c) {
        return repo.findByUsername(c.username())
                .filter(u -> encoder.matches(c.password(), u.getPassword()))
                .<ResponseEntity<?>>map(u -> ResponseEntity.ok(Map.of(
                        "token", jwt.generate(u.getUsername(), u.getRole()),
                        "username", u.getUsername(),
                        "role", u.getRole())))
                .orElseGet(() -> ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body(Map.of("error", "Invalid username or password")));
    }
}
