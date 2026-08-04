package com.travel.api.repository;

import com.travel.api.entity.Budget;
import com.travel.api.entity.Trip;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

public interface BudgetRepository extends JpaRepository<Budget, Long> {
    List<Budget> findByTrip(Trip trip);
    Optional<Budget> findByBudgetIdAndTrip(Long id, Trip trip);

    @Query("SELECT COALESCE(SUM(b.budgetAmount), 0) FROM Budget b WHERE b.trip = :trip")
    BigDecimal sumBudgetAmountByTrip(Trip trip);
}
