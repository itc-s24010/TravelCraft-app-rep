package com.travel.api.controller;

import com.travel.api.dto.request.ChecklistItemRequest;
import com.travel.api.entity.ChecklistItem;
import com.travel.api.entity.Trip;
import com.travel.api.repository.ChecklistItemRepository;
import com.travel.api.security.UserPrincipal;
import com.travel.api.service.TripAccessService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@RestController
@RequestMapping("/api/trips/{tripId}/checklist")
@RequiredArgsConstructor
public class ChecklistItemController {

    private final ChecklistItemRepository checklistItemRepository;
    private final TripAccessService tripAccessService;

    @GetMapping
    public List<ChecklistItem> getAll(@AuthenticationPrincipal UserPrincipal principal,
                                       @PathVariable Long tripId) {
        Trip trip = tripAccessService.accessible(principal, tripId);
        return checklistItemRepository.findByTripOrderByCreatedAtAsc(trip);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public ChecklistItem create(@AuthenticationPrincipal UserPrincipal principal,
                                @PathVariable Long tripId,
                                @RequestBody ChecklistItemRequest req) {
        Trip trip = tripAccessService.accessible(principal, tripId);
        if (req.getLabel() == null || req.getLabel().isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "label is required");
        }
        return checklistItemRepository.save(ChecklistItem.builder()
                .trip(trip)
                .label(req.getLabel().trim())
                .isDone(false)
                .build());
    }

    @PatchMapping("/{id}")
    public ChecklistItem update(@AuthenticationPrincipal UserPrincipal principal,
                                @PathVariable Long tripId,
                                @PathVariable Long id,
                                @RequestBody ChecklistItemRequest req) {
        Trip trip = tripAccessService.accessible(principal, tripId);
        ChecklistItem item = checklistItemRepository.findByItemIdAndTrip(id, trip)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
        if (req.getLabel() != null && !req.getLabel().isBlank()) {
            item.setLabel(req.getLabel().trim());
        }
        if (req.getIsDone() != null) {
            item.setIsDone(req.getIsDone());
        }
        return checklistItemRepository.save(item);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@AuthenticationPrincipal UserPrincipal principal,
                       @PathVariable Long tripId,
                       @PathVariable Long id) {
        Trip trip = tripAccessService.accessible(principal, tripId);
        ChecklistItem item = checklistItemRepository.findByItemIdAndTrip(id, trip)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
        checklistItemRepository.delete(item);
    }
}
