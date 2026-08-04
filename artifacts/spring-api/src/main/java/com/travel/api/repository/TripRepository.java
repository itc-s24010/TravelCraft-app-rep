package com.travel.api.repository;

import com.travel.api.entity.Trip;
import com.travel.api.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface TripRepository extends JpaRepository<Trip, Long> {
    List<Trip> findByUserAndDeletedAtIsNullOrderByCreatedAtDesc(User user);
    Optional<Trip> findByTripIdAndUserAndDeletedAtIsNull(Long tripId, User user);
}
