package com.travel.api.dto.request;

import lombok.*;
import java.math.BigDecimal;
import java.time.OffsetDateTime;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor
public class TransportationRequest {
    private String transportationType;
    private String departurePlace;
    private String arrivalPlace;
    private OffsetDateTime departureTime;
    private OffsetDateTime arrivalTime;
    private BigDecimal fare;
}
