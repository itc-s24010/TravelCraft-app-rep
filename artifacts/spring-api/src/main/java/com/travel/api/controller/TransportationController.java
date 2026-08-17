package com.travel.api.controller;

import com.travel.api.dto.request.TransportationRequest;
import com.travel.api.entity.Transportation;
import com.travel.api.entity.Trip;
import com.travel.api.repository.TransportationRepository;
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
@RequestMapping("/api/trips/{tripId}/transportation")
@RequiredArgsConstructor
public class TransportationController {

    private final TripRepository tripRepository;
    private final TransportationRepository transportationRepository;
    private final UserService userService;
    private final TripAccessService tripAccessService;

    private Trip resolveTrip(UserPrincipal principal, Long tripId) {
        return tripAccessService.accessible(principal, tripId);
    }

    @GetMapping
    public List<Transportation> getAll(@AuthenticationPrincipal UserPrincipal principal,
                                        @PathVariable Long tripId) {
        return transportationRepository.findByTripAndCreatedByOrderByDepartureTimeAsc(resolveTrip(principal, tripId), tripAccessService.currentUser(principal));
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public Transportation create(@AuthenticationPrincipal UserPrincipal principal,
                                  @PathVariable Long tripId,
                                  @RequestBody TransportationRequest req) {
        Trip trip = resolveTrip(principal, tripId);
        return transportationRepository.save(Transportation.builder()
                .trip(trip)
                .createdBy(tripAccessService.currentUser(principal))
                .transportationType(req.getTransportationType())
                .departurePlace(req.getDeparturePlace())
                .arrivalPlace(req.getArrivalPlace())
                .departureTime(req.getDepartureTime())
                .arrivalTime(req.getArrivalTime())
                .fare(req.getFare())
                .build());
    }

    @GetMapping("/{id}")
    public Transportation getOne(@AuthenticationPrincipal UserPrincipal principal,
                                  @PathVariable Long tripId,
                                  @PathVariable Long id) {
        return transportationRepository.findByTransportationIdAndTripAndCreatedBy(id, resolveTrip(principal, tripId), tripAccessService.currentUser(principal))
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
    }

    @PatchMapping("/{id}")
    public Transportation update(@AuthenticationPrincipal UserPrincipal principal,
                                  @PathVariable Long tripId,
                                  @PathVariable Long id,
                                  @RequestBody TransportationRequest req) {
        Transportation t = transportationRepository.findByTransportationIdAndTripAndCreatedBy(id, resolveTrip(principal, tripId), tripAccessService.currentUser(principal))
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
        if (req.getTransportationType() != null) t.setTransportationType(req.getTransportationType());
        if (req.getDeparturePlace() != null) t.setDeparturePlace(req.getDeparturePlace());
        if (req.getArrivalPlace() != null) t.setArrivalPlace(req.getArrivalPlace());
        if (req.getDepartureTime() != null) t.setDepartureTime(req.getDepartureTime());
        if (req.getArrivalTime() != null) t.setArrivalTime(req.getArrivalTime());
        if (req.getFare() != null) t.setFare(req.getFare());
        return transportationRepository.save(t);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@AuthenticationPrincipal UserPrincipal principal,
                       @PathVariable Long tripId,
                       @PathVariable Long id) {
        Transportation t = transportationRepository.findByTransportationIdAndTripAndCreatedBy(id, resolveTrip(principal, tripId), tripAccessService.currentUser(principal))
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
        transportationRepository.delete(t);
    }
}
