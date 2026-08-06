package com.travel.api.dto.request;

import lombok.*;
import java.math.BigDecimal;
import java.time.OffsetDateTime;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor
public class ScheduleItemRequest {
    private String title;
    private String description;
    private String location;
    private OffsetDateTime startTime;
    private OffsetDateTime endTime;
    private BigDecimal cost;
}
