package com.travel.api.repository;

import com.travel.api.entity.ChecklistItem;
import com.travel.api.entity.Trip;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface ChecklistItemRepository extends JpaRepository<ChecklistItem, Long> {
    List<ChecklistItem> findByTripOrderByCreatedAtAsc(Trip trip);
    Optional<ChecklistItem> findByItemIdAndTrip(Long itemId, Trip trip);
}
