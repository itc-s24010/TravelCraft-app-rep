package com.travel.api.dto.request;

import lombok.*;
import java.math.BigDecimal;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor
public class BudgetRequest {
    private Long categoryId;
    private BigDecimal budgetAmount;
}
