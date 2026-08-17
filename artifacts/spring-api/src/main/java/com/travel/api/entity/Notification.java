package com.travel.api.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.OffsetDateTime;

@Entity
@Table(name = "notification", indexes = {
        @Index(name = "idx_notification_trip_owner", columnList = "trip_id,created_by_user_id")
})
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Notification {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "notification_id")
    private Long notificationId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "trip_id", nullable = false)
    private Trip trip;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "created_by_user_id")
    private User createdBy;

    @Column(name = "reminder", columnDefinition = "TEXT")
    private String reminder;

    @Column(name = "notification_datetime")
    private OffsetDateTime notificationDatetime;

    @Column(name = "notification_type")
    private String notificationType;
}
