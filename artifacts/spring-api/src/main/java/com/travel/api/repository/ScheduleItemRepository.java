package com.travel.api.repository;

import com.travel.api.entity.ScheduleItem;
import com.travel.api.entity.Trip;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface ScheduleItemRepository extends JpaRepository<ScheduleItem, Long> {
    List<ScheduleItem> findByTripOrderByStartTimeAscCreatedAtAsc(Trip trip);
    Optional<ScheduleItem> findByScheduleIdAndTrip(Long scheduleId, Trip trip);
}
