package com.travel.api.dto.response;

import lombok.*;
import java.util.List;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class SummaryResponse {
    private double totalBudget;
    private double totalExpense;
    private double remaining;
    private List<CategoryBreakdown> categoryBreakdown;

    @Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
    public static class CategoryBreakdown {
        private Long categoryId;
        private String categoryName;
        private double budget;
        private double expense;
    }
}
