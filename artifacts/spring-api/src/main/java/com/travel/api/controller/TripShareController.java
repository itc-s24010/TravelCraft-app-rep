package com.travel.api.controller;

import com.travel.api.entity.Trip;
import com.travel.api.repository.TripRepository;
import com.travel.api.security.UserPrincipal;
import com.travel.api.service.TripAccessService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@RestController
@RequiredArgsConstructor
public class TripShareController {
    private final TripRepository tripRepository;
    private final TripAccessService tripAccessService;

    @PostMapping("/api/trips/{tripId}/share-link")
    public ShareLink shareLink(@AuthenticationPrincipal UserPrincipal principal, @PathVariable Long tripId) {
        Trip trip = tripAccessService.owned(principal, tripId);
        if (trip.getShareToken() == null) {
            trip.setShareToken(UUID.randomUUID().toString());
            tripRepository.save(trip);
        }
        return new ShareLink(trip.getShareToken());
    }

    @DeleteMapping("/api/trips/{tripId}/share-link")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void revoke(@AuthenticationPrincipal UserPrincipal principal, @PathVariable Long tripId) {
        Trip trip = tripAccessService.owned(principal, tripId);
        trip.setShareToken(null);
        tripRepository.save(trip);
    }

    @PostMapping("/api/shared-trips/{token}/join")
    @Transactional
    public Trip join(@AuthenticationPrincipal UserPrincipal principal, @PathVariable String token) {
        Trip trip = tripRepository.findByShareTokenAndDeletedAtIsNull(token)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "共有リンクが無効です"));
        var user = tripAccessService.currentUser(principal);
        if (!trip.getUser().getUserId().equals(user.getUserId())) {
            trip.getMembers().add(user);
            tripRepository.save(trip);
        }
        return trip;
    }

    public record ShareLink(String token) {}
}
