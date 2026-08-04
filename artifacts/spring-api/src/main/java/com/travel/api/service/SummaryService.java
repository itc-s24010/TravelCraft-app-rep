package com.travel.api.service;

import com.travel.api.dto.response.SummaryResponse;
import com.travel.api.entity.Budget;
import com.travel.api.entity.Expense;
import com.travel.api.entity.Trip;
import com.travel.api.repository.BudgetRepository;
import com.travel.api.repository.ExpenseRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class SummaryService {

    private final BudgetRepository budgetRepository;
    private final ExpenseRepository expenseRepository;

    public SummaryResponse getSummary(Trip trip) {
        List<Budget> budgets = budgetRepository.findByTrip(trip);
        List<Expense> expenses = expenseRepository.findByTripOrderByExpenseDateDesc(trip);

        BigDecimal totalBudget = budgets.stream()
                .map(Budget::getBudgetAmount)
                .filter(Objects::nonNull)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal totalExpense = expenses.stream()
                .map(Expense::getExpenseAmount)
                .filter(Objects::nonNull)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal remaining = totalBudget.subtract(totalExpense);

        // Category breakdown
        Map<Long, BigDecimal> budgetByCategory = budgets.stream()
                .collect(Collectors.groupingBy(
                        b -> b.getCategory().getCategoryId(),
                        Collectors.reducing(BigDecimal.ZERO, Budget::getBudgetAmount, BigDecimal::add)
                ));

        Map<Long, BigDecimal> expenseByCategory = expenses.stream()
                .collect(Collectors.groupingBy(
                        e -> e.getCategory().getCategoryId(),
                        Collectors.reducing(BigDecimal.ZERO, Expense::getExpenseAmount, BigDecimal::add)
                ));

        Set<Long> allCategoryIds = new HashSet<>();
        allCategoryIds.addAll(budgetByCategory.keySet());
        allCategoryIds.addAll(expenseByCategory.keySet());

        Map<Long, String> categoryNames = new HashMap<>();
        budgets.forEach(b -> categoryNames.put(b.getCategory().getCategoryId(), b.getCategory().getCategoryName()));
        expenses.forEach(e -> categoryNames.put(e.getCategory().getCategoryId(), e.getCategory().getCategoryName()));

        List<SummaryResponse.CategoryBreakdown> breakdown = allCategoryIds.stream()
                .map(catId -> SummaryResponse.CategoryBreakdown.builder()
                        .categoryId(catId)
                        .categoryName(categoryNames.getOrDefault(catId, ""))
                        .budget(budgetByCategory.getOrDefault(catId, BigDecimal.ZERO).doubleValue())
                        .expense(expenseByCategory.getOrDefault(catId, BigDecimal.ZERO).doubleValue())
                        .build())
                .sorted(Comparator.comparing(SummaryResponse.CategoryBreakdown::getCategoryId))
                .collect(Collectors.toList());

        return SummaryResponse.builder()
                .totalBudget(totalBudget.doubleValue())
                .totalExpense(totalExpense.doubleValue())
                .remaining(remaining.doubleValue())
                .categoryBreakdown(breakdown)
                .build();
    }
}
