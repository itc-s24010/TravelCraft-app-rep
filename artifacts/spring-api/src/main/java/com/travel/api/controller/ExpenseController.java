package com.travel.api.controller;

import com.travel.api.dto.request.ExpenseRequest;
import com.travel.api.entity.Category;
import com.travel.api.entity.Expense;
import com.travel.api.entity.Trip;
import com.travel.api.repository.ExpenseRepository;
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
@RequestMapping("/api/trips/{tripId}/expenses")
@RequiredArgsConstructor
public class ExpenseController {

    private final TripRepository tripRepository;
    private final ExpenseRepository expenseRepository;
    private final CategoryService categoryService;
    private final TripAccessService tripAccessService;

    private Trip resolveTrip(UserPrincipal principal, Long tripId) {
        return tripAccessService.accessible(principal, tripId);
    }

    @GetMapping
    public ResponseEntity<List<Expense>> getAll(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable Long tripId) {

        resolveTrip(principal, tripId);

        return ResponseEntity.ok()
                .cacheControl(CacheControl.noStore())
                .body(expenseRepository.findPersonal(
                        tripId,
                        tripAccessService.currentUser(principal).getUserId()
                ));
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public Expense create(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable Long tripId,
            @RequestBody ExpenseRequest req) {

        Category cat = categoryService.requireOwned(
                req.getCategoryId(),
                tripAccessService.currentUser(principal)
        );

        return expenseRepository.save(
                Expense.builder()
                        .trip(resolveTrip(principal, tripId))
                        .user(tripAccessService.currentUser(principal))
                        .category(cat)
                        .expenseAmount(req.getExpenseAmount())
                        .expenseDate(req.getExpenseDate())
                        .paymentMethod(req.getPaymentMethod())
                        .build()
        );
    }

    @PatchMapping("/{id}")
    public Expense update(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable Long tripId,
            @PathVariable Long id,
            @RequestBody ExpenseRequest req) {

        Expense e = expenseRepository
                .findByExpenseIdAndTripAndUser(
                        id,
                        resolveTrip(principal, tripId),
                        tripAccessService.currentUser(principal)
                )
                .orElseThrow(() ->
                        new ResponseStatusException(HttpStatus.NOT_FOUND));

        if (req.getExpenseAmount() != null) {
            e.setExpenseAmount(req.getExpenseAmount());
        }

        if (req.getExpenseDate() != null) {
            e.setExpenseDate(req.getExpenseDate());
        }

        if (req.getPaymentMethod() != null) {
            e.setPaymentMethod(req.getPaymentMethod());
        }

        if (req.getCategoryId() != null) {
            Category cat = categoryService.requireOwned(
                    req.getCategoryId(),
                    tripAccessService.currentUser(principal)
            );

            e.setCategory(cat);
        }

        return expenseRepository.save(e);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable Long tripId,
            @PathVariable Long id) {

        Expense e = expenseRepository
                .findByExpenseIdAndTripAndUser(
                        id,
                        resolveTrip(principal, tripId),
                        tripAccessService.currentUser(principal)
                )
                .orElseThrow(() ->
                        new ResponseStatusException(HttpStatus.NOT_FOUND));

        expenseRepository.delete(e);
    }
}
