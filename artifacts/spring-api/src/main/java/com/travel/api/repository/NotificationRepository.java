package com.travel.api.repository;

import com.travel.api.entity.Notification;
import com.travel.api.entity.Trip;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface NotificationRepository extends JpaRepository<Notification, Long> {
    List<Notification> findByTripOrderByNotificationDatetimeAsc(Trip trip);
    Optional<Notification> findByNotificationIdAndTrip(Long id, Trip trip);
}
