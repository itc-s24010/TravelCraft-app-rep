package com.travel.api.dto.request;

import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDate;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor
public class ExpenseRequest {
    private Long categoryId;
    private BigDecimal expenseAmount;
    private LocalDate expenseDate;
    private String paymentMethod;
    private String description;
}
