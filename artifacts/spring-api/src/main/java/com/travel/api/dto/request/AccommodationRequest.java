package com.travel.api.dto.request;

import lombok.*;
import java.time.LocalDate;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor
public class AccommodationRequest {
    private String accommodationName;
    private String address;
    private LocalDate checkIn;
    private LocalDate checkOut;
    private String reservationNumber;
}
