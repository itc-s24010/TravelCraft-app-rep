package com.travel.api.repository;

import com.travel.api.entity.Expense;
import com.travel.api.entity.Trip;
import com.travel.api.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

public interface ExpenseRepository extends JpaRepository<Expense, Long> {

    List<Expense> findByTripAndUserOrderByExpenseDateDesc(
            Trip trip,
            User user
    );

    @Query(value = "select * from expense where trip_id = :tripId and user_id = :userId order by expense_date desc", nativeQuery = true)
    List<Expense> findPersonal(
            @Param("tripId") Long tripId,
            @Param("userId") Long userId
    );

    Optional<Expense> findByExpenseIdAndTripAndUser(
            Long id,
            Trip trip,
            User user
    );

    @Query("""
        SELECT COALESCE(SUM(e.expenseAmount), 0)
        FROM Expense e
        WHERE e.trip = :trip
          AND e.user = :user
        """)
    BigDecimal sumExpenseAmountByTripAndUser(
            @Param("trip") Trip trip,
            @Param("user") User user
    );
}