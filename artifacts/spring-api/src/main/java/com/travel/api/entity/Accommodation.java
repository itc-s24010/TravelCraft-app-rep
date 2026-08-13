package com.travel.api.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;

@Entity
@Table(name = "accommodation", indexes = {
        @Index(name = "idx_accommodation_trip_owner", columnList = "trip_id,created_by_user_id")
})
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Accommodation {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "accommodation_id")
    private Long accommodationId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "trip_id", nullable = false)
    private Trip trip;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "created_by_user_id")
    private User createdBy;

    @Column(name = "accommodation_name")
    private String accommodationName;

    @Column(name = "address")
    private String address;

    @Column(name = "check_in")
    private LocalDate checkIn;

    @Column(name = "check_out")
    private LocalDate checkOut;

    @Column(name = "reservation_number")
    private String reservationNumber;
}
