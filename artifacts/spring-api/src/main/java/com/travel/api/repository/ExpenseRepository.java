package com.travel.api.repository;

import com.travel.api.entity.Expense;
import com.travel.api.entity.Trip;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

public interface ExpenseRepository extends JpaRepository<Expense, Long> {
    List<Expense> findByTripOrderByExpenseDateDesc(Trip trip);
    Optional<Expense> findByExpenseIdAndTrip(Long id, Trip trip);

    @Query("SELECT COALESCE(SUM(e.expenseAmount), 0) FROM Expense e WHERE e.trip = :trip")
    BigDecimal sumExpenseAmountByTrip(Trip trip);
}
