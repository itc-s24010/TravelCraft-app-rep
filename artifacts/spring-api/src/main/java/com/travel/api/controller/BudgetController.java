package com.travel.api.controller;

import com.travel.api.dto.request.BudgetRequest;
import com.travel.api.entity.Budget;
import com.travel.api.entity.Category;
import com.travel.api.entity.Trip;
import com.travel.api.repository.BudgetRepository;
import com.travel.api.repository.CategoryRepository;
import com.travel.api.repository.TripRepository;
import com.travel.api.security.UserPrincipal;
import com.travel.api.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@RestController
@RequestMapping("/api/trips/{tripId}/budget")
@RequiredArgsConstructor
public class BudgetController {

    private final TripRepository tripRepository;
    private final BudgetRepository budgetRepository;
    private final CategoryRepository categoryRepository;
    private final UserService userService;

    private Trip resolveTrip(UserPrincipal principal, Long tripId) {
        var user = userService.ensureUser(principal.getSupabaseUserId());
        return tripRepository.findByTripIdAndUserAndDeletedAtIsNull(tripId, user)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
    }

    @GetMapping
    public List<Budget> getAll(@AuthenticationPrincipal UserPrincipal principal,
                                @PathVariable Long tripId) {
        return budgetRepository.findByTrip(resolveTrip(principal, tripId));
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public Budget create(@AuthenticationPrincipal UserPrincipal principal,
                          @PathVariable Long tripId,
                          @RequestBody BudgetRequest req) {
        Trip trip = resolveTrip(principal, tripId);
        if (budgetRepository.existsByTripAndCategory_CategoryId(trip, req.getCategoryId())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "このカテゴリの予算は既に設定されています。削除してから再設定してください。");
        }
        Category cat = categoryRepository.findById(req.getCategoryId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Category not found"));
        return budgetRepository.save(Budget.builder()
                .trip(trip)
                .category(cat)
                .budgetAmount(req.getBudgetAmount())
                .build());
    }

    @PatchMapping("/{id}")
    public Budget update(@AuthenticationPrincipal UserPrincipal principal,
                          @PathVariable Long tripId,
                          @PathVariable Long id,
                          @RequestBody BudgetRequest req) {
        Budget b = budgetRepository.findByBudgetIdAndTrip(id, resolveTrip(principal, tripId))
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
        if (req.getBudgetAmount() != null) b.setBudgetAmount(req.getBudgetAmount());
        if (req.getCategoryId() != null) {
            Category cat = categoryRepository.findById(req.getCategoryId())
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST));
            b.setCategory(cat);
        }
        return budgetRepository.save(b);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@AuthenticationPrincipal UserPrincipal principal,
                       @PathVariable Long tripId,
                       @PathVariable Long id) {
        Budget b = budgetRepository.findByBudgetIdAndTrip(id, resolveTrip(principal, tripId))
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
        budgetRepository.delete(b);
    }
}
