package com.travel.api.controller;

import com.travel.api.dto.request.AccommodationRequest;
import com.travel.api.entity.Accommodation;
import com.travel.api.entity.Trip;
import com.travel.api.repository.AccommodationRepository;
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
@RequestMapping("/api/trips/{tripId}/accommodation")
@RequiredArgsConstructor
public class AccommodationController {

    private final TripRepository tripRepository;
    private final AccommodationRepository accommodationRepository;
    private final UserService userService;
    private final TripAccessService tripAccessService;

    private Trip resolveTrip(UserPrincipal principal, Long tripId) {
        return tripAccessService.accessible(principal, tripId);
    }

    @GetMapping
    public List<Accommodation> getAll(@AuthenticationPrincipal UserPrincipal principal,
                                       @PathVariable Long tripId) {
        return accommodationRepository.findByTripOrderByCheckInAsc(resolveTrip(principal, tripId));
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public Accommodation create(@AuthenticationPrincipal UserPrincipal principal,
                                 @PathVariable Long tripId,
                                 @RequestBody AccommodationRequest req) {
        return accommodationRepository.save(Accommodation.builder()
                .trip(resolveTrip(principal, tripId))
                .createdBy(tripAccessService.currentUser(principal))
                .accommodationName(req.getAccommodationName())
                .address(req.getAddress())
                .checkIn(req.getCheckIn())
                .checkOut(req.getCheckOut())
                .reservationNumber(req.getReservationNumber())
                .build());
    }

    @PatchMapping("/{id}")
    public Accommodation update(@AuthenticationPrincipal UserPrincipal principal,
                                 @PathVariable Long tripId,
                                 @PathVariable Long id,
                                 @RequestBody AccommodationRequest req) {
        Accommodation a = accommodationRepository.findByAccommodationIdAndTripAndCreatedBy(id, resolveTrip(principal, tripId), tripAccessService.currentUser(principal))
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
        if (req.getAccommodationName() != null) a.setAccommodationName(req.getAccommodationName());
        if (req.getAddress() != null) a.setAddress(req.getAddress());
        if (req.getCheckIn() != null) a.setCheckIn(req.getCheckIn());
        if (req.getCheckOut() != null) a.setCheckOut(req.getCheckOut());
        if (req.getReservationNumber() != null) a.setReservationNumber(req.getReservationNumber());
        return accommodationRepository.save(a);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@AuthenticationPrincipal UserPrincipal principal,
                       @PathVariable Long tripId,
                       @PathVariable Long id) {
        Accommodation a = accommodationRepository.findByAccommodationIdAndTripAndCreatedBy(id, resolveTrip(principal, tripId), tripAccessService.currentUser(principal))
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
        accommodationRepository.delete(a);
    }
}
