package com.travel.api.dto.request;

import lombok.*;
import java.time.LocalDate;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor
public class TripRequest {
    private String title;
    private LocalDate tripDate;
    private String memo;
    private Integer companions;
}
