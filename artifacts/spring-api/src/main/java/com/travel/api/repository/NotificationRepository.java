package com.travel.api.repository;

import com.travel.api.entity.Notification;
import com.travel.api.entity.Trip;
import com.travel.api.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface NotificationRepository extends JpaRepository<Notification, Long> {
    List<Notification> findByTripAndCreatedByOrderByNotificationDatetimeAsc(Trip trip, User user);
    Optional<Notification> findByNotificationIdAndTripAndCreatedBy(Long id, Trip trip, User user);
}
