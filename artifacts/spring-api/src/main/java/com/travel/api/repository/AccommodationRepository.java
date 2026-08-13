package com.travel.api.repository;

import com.travel.api.entity.Accommodation;
import com.travel.api.entity.Trip;
import com.travel.api.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface AccommodationRepository extends JpaRepository<Accommodation, Long> {
    List<Accommodation> findByTripAndCreatedByOrderByCheckInAsc(Trip trip, User user);
    Optional<Accommodation> findByAccommodationIdAndTripAndCreatedBy(Long id, Trip trip, User user);
}
