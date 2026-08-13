package com.travel.api.controller;

import com.travel.api.dto.request.TripRequest;
import com.travel.api.dto.response.SummaryResponse;
import com.travel.api.entity.Trip;
import com.travel.api.entity.User;
import com.travel.api.repository.TripRepository;
import com.travel.api.security.UserPrincipal;
import com.travel.api.service.SummaryService;
import com.travel.api.service.UserService;
import com.travel.api.service.TripAccessService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.http.CacheControl;

import java.time.OffsetDateTime;
import java.util.List;

@RestController
@RequestMapping("/api/trips")
@RequiredArgsConstructor
public class TripController {

    private final TripRepository tripRepository;
    private final UserService userService;
    private final SummaryService summaryService;
    private final TripAccessService tripAccessService;

    private User resolveUser(UserPrincipal principal) {
        return userService.ensureUser(principal);
    }

    @GetMapping
    public List<Trip> getAll(@AuthenticationPrincipal UserPrincipal principal) {
        return tripRepository.findAccessibleByUser(resolveUser(principal));
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public Trip create(@AuthenticationPrincipal UserPrincipal principal,
                       @RequestBody TripRequest req) {
        User user = resolveUser(principal);
        Trip trip = Trip.builder()
                .user(user)
                .title(req.getTitle())
                .tripDate(req.getTripDate())
                .memo(req.getMemo())
                .companions(req.getCompanions())
                .build();
        return tripRepository.save(trip);
    }

    @GetMapping("/{tripId}")
    public Trip getOne(@AuthenticationPrincipal UserPrincipal principal,
                       @PathVariable Long tripId) {
        return tripAccessService.accessible(principal, tripId);
    }

    @PatchMapping("/{tripId}")
    public Trip update(@AuthenticationPrincipal UserPrincipal principal,
                       @PathVariable Long tripId,
                       @RequestBody TripRequest req) {
        Trip trip = tripAccessService.accessible(principal, tripId);
        if (req.getTitle() != null) trip.setTitle(req.getTitle());
        if (req.getTripDate() != null) trip.setTripDate(req.getTripDate());
        if (req.getMemo() != null) trip.setMemo(req.getMemo());
        if (req.getCompanions() != null) trip.setCompanions(req.getCompanions());
        return tripRepository.save(trip);
    }

    @DeleteMapping("/{tripId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@AuthenticationPrincipal UserPrincipal principal,
                       @PathVariable Long tripId) {
        Trip trip = tripAccessService.owned(principal, tripId);
        trip.setDeletedAt(OffsetDateTime.now());
        tripRepository.save(trip);
    }

    @GetMapping("/{tripId}/summary")
    public ResponseEntity<SummaryResponse> getSummary(@AuthenticationPrincipal UserPrincipal principal,
                                                       @PathVariable Long tripId) {
        Trip trip = tripAccessService.accessible(principal, tripId);
        return ResponseEntity.ok()
                .cacheControl(CacheControl.noStore())
                .body(summaryService.getSummary(trip, tripAccessService.currentUser(principal)));
    }
}
