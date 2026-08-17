package com.travel.api.dto.request;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.*;
import java.time.LocalDate;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor
public class TripRequest {
    private String title;
    private LocalDate tripDate;
    private LocalDate startDate;
    private LocalDate endDate;
    private String memo;
    private Integer companions;
    @JsonProperty("isCompleted")
    private Boolean isCompleted;
}
