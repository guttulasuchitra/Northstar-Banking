package com.northstar.accountservice;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ThreadLocalRandom;

@RestController
@RequestMapping("/api/accounts")
public class AccountController {
    private final AccountRepository repo;
    public AccountController(AccountRepository repo) { this.repo = repo; }

    @GetMapping
    public List<Account> all(@RequestParam(required = false) Long customerId) {
        return customerId == null ? repo.findAll() : repo.findByCustomerId(customerId);
    }

    @GetMapping("/{id}")
    public ResponseEntity<Account> one(@PathVariable Long id) {
        return repo.findById(id).map(ResponseEntity::ok).orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public Account create(@RequestBody Account a) {
        a.setId(null);
        if (a.getAccountNumber() == null || a.getAccountNumber().isBlank()) {
            a.setAccountNumber("NS" + String.format("%010d", ThreadLocalRandom.current().nextLong(10_000_000_000L)));
        }
        if (a.getBalance() == null) a.setBalance(BigDecimal.ZERO);
        return repo.save(a);
    }

    @PutMapping("/{id}")
    public ResponseEntity<Account> update(@PathVariable Long id, @RequestBody Account a) {
        if (!repo.existsById(id)) return ResponseEntity.notFound().build();
        a.setId(id);
        return ResponseEntity.ok(repo.save(a));
    }

    @PostMapping("/{id}/deposit")
    public ResponseEntity<?> deposit(@PathVariable Long id, @RequestBody Map<String, BigDecimal> body) {
        return repo.findById(id).<ResponseEntity<?>>map(a -> {
            a.setBalance(a.getBalance().add(body.get("amount")));
            return ResponseEntity.ok(repo.save(a));
        }).orElse(ResponseEntity.notFound().build());
    }

    @PostMapping("/{id}/withdraw")
    public ResponseEntity<?> withdraw(@PathVariable Long id, @RequestBody Map<String, BigDecimal> body) {
        return repo.findById(id).<ResponseEntity<?>>map(a -> {
            BigDecimal amt = body.get("amount");
            if (a.getBalance().compareTo(amt) < 0) {
                return ResponseEntity.badRequest().body(Map.of("error", "Insufficient funds"));
            }
            a.setBalance(a.getBalance().subtract(amt));
            return ResponseEntity.ok(repo.save(a));
        }).orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        if (!repo.existsById(id)) return ResponseEntity.notFound().build();
        repo.deleteById(id);
        return ResponseEntity.noContent().build();
    }
}
