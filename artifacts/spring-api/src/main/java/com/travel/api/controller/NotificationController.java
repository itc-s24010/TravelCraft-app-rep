package com.travel.api.controller;

import com.travel.api.dto.request.NotificationRequest;
import com.travel.api.entity.Notification;
import com.travel.api.entity.Trip;
import com.travel.api.repository.NotificationRepository;
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
@RequestMapping("/api/trips/{tripId}/notifications")
@RequiredArgsConstructor
public class NotificationController {

    private final TripRepository tripRepository;
    private final NotificationRepository notificationRepository;
    private final UserService userService;

    private Trip resolveTrip(UserPrincipal principal, Long tripId) {
        var user = userService.ensureUser(principal.getSupabaseUserId());
        return tripRepository.findByTripIdAndUserAndDeletedAtIsNull(tripId, user)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
    }

    @GetMapping
    public List<Notification> getAll(@AuthenticationPrincipal UserPrincipal principal,
                                      @PathVariable Long tripId) {
        return notificationRepository.findByTripOrderByNotificationDatetimeAsc(resolveTrip(principal, tripId));
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public Notification create(@AuthenticationPrincipal UserPrincipal principal,
                                @PathVariable Long tripId,
                                @RequestBody NotificationRequest req) {
        return notificationRepository.save(Notification.builder()
                .trip(resolveTrip(principal, tripId))
                .reminder(req.getReminder())
                .notificationDatetime(req.getNotificationDatetime())
                .notificationType(req.getNotificationType())
                .build());
    }

    @PatchMapping("/{id}")
    public Notification update(@AuthenticationPrincipal UserPrincipal principal,
                                @PathVariable Long tripId,
                                @PathVariable Long id,
                                @RequestBody NotificationRequest req) {
        Notification n = notificationRepository.findByNotificationIdAndTrip(id, resolveTrip(principal, tripId))
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
        if (req.getReminder() != null) n.setReminder(req.getReminder());
        if (req.getNotificationDatetime() != null) n.setNotificationDatetime(req.getNotificationDatetime());
        if (req.getNotificationType() != null) n.setNotificationType(req.getNotificationType());
        return notificationRepository.save(n);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@AuthenticationPrincipal UserPrincipal principal,
                       @PathVariable Long tripId,
                       @PathVariable Long id) {
        Notification n = notificationRepository.findByNotificationIdAndTrip(id, resolveTrip(principal, tripId))
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
        notificationRepository.delete(n);
    }
}
