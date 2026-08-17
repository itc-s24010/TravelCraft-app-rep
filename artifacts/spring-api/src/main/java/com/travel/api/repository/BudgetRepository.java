package com.travel.api.repository;

import com.travel.api.entity.Budget;
import com.travel.api.entity.Trip;
import com.travel.api.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

public interface BudgetRepository extends JpaRepository<Budget, Long> {
    List<Budget> findByTripAndUser(Trip trip, User user);
    @Query(value = "select * from budget where trip_id = :tripId and user_id = :userId", nativeQuery = true)
    List<Budget> findPersonal(@Param("tripId") Long tripId, @Param("userId") Long userId);
    Optional<Budget> findByBudgetIdAndTripAndUser(Long id, Trip trip, User user);

    @Query("""
        SELECT COALESCE(SUM(b.budgetAmount), 0)
        FROM Budget b
        WHERE b.trip = :trip
        AND b.user = :user
        """)
    BigDecimal sumBudgetAmountByTripAndUser(
            @Param("trip") Trip trip,
            @Param("user") User user
    );
}
