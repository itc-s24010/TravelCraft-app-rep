package com.travel.api.repository;

import com.travel.api.entity.Trip;
import com.travel.api.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.data.jpa.repository.EntityGraph;

public interface TripRepository extends JpaRepository<Trip, Long> {
    @Query("select distinct t from Trip t left join t.members m " +
           "where t.deletedAt is null and (t.user = :user or m = :user) order by t.createdAt desc")
    @EntityGraph(attributePaths = {"user", "members"})
    List<Trip> findAccessibleByUser(@Param("user") User user);

    Optional<Trip> findByTripIdAndUserAndDeletedAtIsNull(Long tripId, User user);

    @Query("select distinct t from Trip t left join t.members m " +
           "where t.tripId = :tripId and t.deletedAt is null and (t.user = :user or m = :user)")
    @EntityGraph(attributePaths = {"user", "members"})
    Optional<Trip> findAccessibleByTripIdAndUser(@Param("tripId") Long tripId, @Param("user") User user);

    /** Load trip with all members (no user filter) – used to check access after full member list is loaded. */
    @EntityGraph(attributePaths = {"user", "members"})
    Optional<Trip> findByTripIdAndDeletedAtIsNull(Long tripId);

    Optional<Trip> findByShareTokenAndDeletedAtIsNull(String shareToken);
}
