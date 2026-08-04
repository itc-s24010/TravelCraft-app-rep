package com.travel.api.repository;

import com.travel.api.entity.Accommodation;
import com.travel.api.entity.Trip;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface AccommodationRepository extends JpaRepository<Accommodation, Long> {
    List<Accommodation> findByTripOrderByCheckInAsc(Trip trip);
    Optional<Accommodation> findByAccommodationIdAndTrip(Long id, Trip trip);
}
