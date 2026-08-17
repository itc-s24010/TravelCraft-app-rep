package com.travel.api.controller;

import com.travel.api.dto.request.ScheduleItemRequest;
import com.travel.api.entity.ScheduleItem;
import com.travel.api.entity.Trip;
import com.travel.api.repository.ScheduleItemRepository;
import com.travel.api.repository.TripRepository;
import com.travel.api.security.UserPrincipal;
import com.travel.api.service.UserService;
import com.travel.api.service.TripAccessService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@RestController
@RequestMapping("/api/trips/{tripId}/schedule")
@RequiredArgsConstructor
public class ScheduleItemController {

    private final TripRepository tripRepository;
    private final ScheduleItemRepository scheduleItemRepository;
    private final UserService userService;
    private final TripAccessService tripAccessService;

    private Trip resolveTrip(UserPrincipal principal, Long tripId) {
        return tripAccessService.accessible(principal, tripId);
    }

    @GetMapping
    public List<ScheduleItem> getAll(@AuthenticationPrincipal UserPrincipal principal,
                                      @PathVariable Long tripId) {
        return scheduleItemRepository.findByTripOrderByStartTimeAscCreatedAtAsc(resolveTrip(principal, tripId));
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public ScheduleItem create(@AuthenticationPrincipal UserPrincipal principal,
                                @PathVariable Long tripId,
                                @RequestBody ScheduleItemRequest req) {
        Trip trip = resolveTrip(principal, tripId);
        return scheduleItemRepository.save(ScheduleItem.builder()
                .trip(trip)
                .title(req.getTitle())
                .description(req.getDescription())
                .location(req.getLocation())
                .startTime(req.getStartTime())
                .endTime(req.getEndTime())
                .cost(req.getCost())
                .build());
    }

    @PatchMapping("/{id}")
    public ScheduleItem update(@AuthenticationPrincipal UserPrincipal principal,
                                @PathVariable Long tripId,
                                @PathVariable Long id,
                                @RequestBody ScheduleItemRequest req) {
        ScheduleItem item = scheduleItemRepository
                .findByScheduleIdAndTrip(id, resolveTrip(principal, tripId))
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
        if (req.getTitle() != null) item.setTitle(req.getTitle());
        if (req.getDescription() != null) item.setDescription(req.getDescription());
        if (req.getLocation() != null) item.setLocation(req.getLocation());
        if (req.getStartTime() != null) item.setStartTime(req.getStartTime());
        if (req.getEndTime() != null) item.setEndTime(req.getEndTime());
        if (req.getCost() != null) item.setCost(req.getCost());
        return scheduleItemRepository.save(item);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@AuthenticationPrincipal UserPrincipal principal,
                       @PathVariable Long tripId,
                       @PathVariable Long id) {
        ScheduleItem item = scheduleItemRepository
                .findByScheduleIdAndTrip(id, resolveTrip(principal, tripId))
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
        scheduleItemRepository.delete(item);
    }
}
