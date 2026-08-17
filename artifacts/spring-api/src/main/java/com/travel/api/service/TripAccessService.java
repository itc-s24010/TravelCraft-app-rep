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
        return tripRepository.findAccessibleByTripIdAndUser(tripId, currentUser(principal))
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
    }

    public Trip owned(UserPrincipal principal, Long tripId) {
        return tripRepository.findByTripIdAndUserAndDeletedAtIsNull(tripId, currentUser(principal))
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
    }
}
