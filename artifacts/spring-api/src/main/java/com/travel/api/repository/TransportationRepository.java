package com.travel.api.repository;

import com.travel.api.entity.Transportation;
import com.travel.api.entity.Trip;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface TransportationRepository extends JpaRepository<Transportation, Long> {
    List<Transportation> findByTripOrderByDepartureTimeAsc(Trip trip);
    Optional<Transportation> findByTransportationIdAndTrip(Long id, Trip trip);
}
