package com.travel.api.dto.request;

import com.fasterxml.jackson.annotation.JsonSetter;
import lombok.*;
import java.math.BigDecimal;
import java.time.OffsetDateTime;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor
public class ScheduleItemRequest {
    private String title;
    private String description;
    private String scheduleType;
    private boolean scheduleTypeProvided;
    private String location;
    private OffsetDateTime startTime;
    private OffsetDateTime endTime;
    private BigDecimal cost;

    @JsonSetter("scheduleType")
    public void setScheduleType(String scheduleType) {
        this.scheduleType = scheduleType;
        this.scheduleTypeProvided = true;
    }
}
