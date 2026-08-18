package com.travel.api.repository;

import com.travel.api.entity.Transportation;
import com.travel.api.entity.Trip;
import com.travel.api.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface TransportationRepository extends JpaRepository<Transportation, Long> {
    /** 共有メンバーを含むトリップ全体の交通情報を返す（GETリスト用） */
    List<Transportation> findByTripOrderByDepartureTimeAsc(Trip trip);
    List<Transportation> findByTripAndCreatedByOrderByDepartureTimeAsc(Trip trip, User user);
    Optional<Transportation> findByTransportationIdAndTripAndCreatedBy(Long id, Trip trip, User user);
}
