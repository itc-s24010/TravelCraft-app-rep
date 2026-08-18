package com.travel.api.service;

import com.travel.api.entity.Trip;
import com.travel.api.entity.User;
import com.travel.api.repository.TripRepository;
import com.travel.api.security.UserPrincipal;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

/** Centralizes ownership and shared-trip authorization. */
@Service
@RequiredArgsConstructor
public class TripAccessService {
    private final TripRepository tripRepository;
    private final UserService userService;

    public User currentUser(UserPrincipal principal) {
        return userService.ensureUser(principal);
    }

    public Trip accessible(UserPrincipal principal, Long tripId) {
        User current = currentUser(principal);
        // Load the trip with ALL members (not filtered), then verify access.
        // Using the filtered query causes JPA to reuse the WHERE-filtered join for
        // the EntityGraph, resulting in members set containing only the current user.
        Trip trip = tripRepository.findByTripIdAndDeletedAtIsNull(tripId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
        boolean isOwner = trip.getUser().getUserId().equals(current.getUserId());
        boolean isMember = trip.getMembers() != null && trip.getMembers().stream()
                .anyMatch(m -> m.getUserId().equals(current.getUserId()));
        if (!isOwner && !isMember) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND);
        }
        return trip;
    }

    public Trip owned(UserPrincipal principal, Long tripId) {
        return tripRepository.findByTripIdAndUserAndDeletedAtIsNull(tripId, currentUser(principal))
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
    }
}
