package com.travel.api.controller;

import com.travel.api.dto.request.BudgetRequest;
import com.travel.api.entity.Budget;
import com.travel.api.entity.Category;
import com.travel.api.entity.User;
import com.travel.api.entity.Trip;
import com.travel.api.repository.BudgetRepository;
import com.travel.api.repository.TripRepository;
import com.travel.api.security.UserPrincipal;
import com.travel.api.service.CategoryService;
import com.travel.api.service.TripAccessService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.http.CacheControl;
import org.springframework.http.ResponseEntity;

import java.util.List;

@RestController
@RequestMapping("/api/trips/{tripId}/budget")
@RequiredArgsConstructor
public class BudgetController {

    private final TripRepository tripRepository;
    private final BudgetRepository budgetRepository;
    private final CategoryService categoryService;
    private final TripAccessService tripAccessService;

    private Trip resolveTrip(UserPrincipal principal, Long tripId) {
        return tripAccessService.accessible(principal, tripId);
    }

    @GetMapping
    public ResponseEntity<List<Budget>> getAll(@AuthenticationPrincipal UserPrincipal principal,
                                               @PathVariable Long tripId) {
        resolveTrip(principal, tripId);
        Long userId = tripAccessService.currentUser(principal).getUserId();
        List<Budget> personalBudgets = budgetRepository.findPersonal(tripId, userId)
                .stream()
                .filter(b -> b.getUser() != null && userId.equals(b.getUser().getUserId()))
                .toList();
        return ResponseEntity.ok().cacheControl(CacheControl.noStore()).body(personalBudgets);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public Budget create(@AuthenticationPrincipal UserPrincipal principal,
                          @PathVariable Long tripId,
                          @RequestBody BudgetRequest req) {
        User currentUser = tripAccessService.currentUser(principal);
        Category cat = categoryService.requireOwned(req.getCategoryId(), currentUser);
        return budgetRepository.save(Budget.builder()
                .trip(resolveTrip(principal, tripId))
                .user(currentUser)
                .category(cat)
                .budgetAmount(req.getBudgetAmount())
                .build());
    }

    @PatchMapping("/{id}")
    public Budget update(@AuthenticationPrincipal UserPrincipal principal,
                          @PathVariable Long tripId,
                          @PathVariable Long id,
                          @RequestBody BudgetRequest req) {
        Budget b = budgetRepository.findByBudgetIdAndTripAndUser(id, resolveTrip(principal, tripId), tripAccessService.currentUser(principal))
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
        if (req.getBudgetAmount() != null) b.setBudgetAmount(req.getBudgetAmount());
        if (req.getCategoryId() != null) {
            Category cat = categoryService.requireOwned(req.getCategoryId(), tripAccessService.currentUser(principal));
            b.setCategory(cat);
        }
        return budgetRepository.save(b);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@AuthenticationPrincipal UserPrincipal principal,
                       @PathVariable Long tripId,
                       @PathVariable Long id) {
        Budget b = budgetRepository.findByBudgetIdAndTripAndUser(id, resolveTrip(principal, tripId), tripAccessService.currentUser(principal))
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
        budgetRepository.delete(b);
    }
}
