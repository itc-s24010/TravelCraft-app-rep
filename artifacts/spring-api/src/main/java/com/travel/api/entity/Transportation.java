package com.travel.api.entity;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.OffsetDateTime;

@Entity
@Table(name = "transportation")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Transportation {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "transportation_id")
    private Long transportationId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "trip_id", nullable = false)
    private Trip trip;

    @Column(name = "transportation_type")
    private String transportationType;

    @Column(name = "departure_place")
    private String departurePlace;

    @Column(name = "arrival_place")
    private String arrivalPlace;

    @Column(name = "departure_time")
    private OffsetDateTime departureTime;

    @Column(name = "arrival_time")
    private OffsetDateTime arrivalTime;

    @Column(name = "fare", precision = 12, scale = 2)
    private BigDecimal fare;
}
