package com.travel.api.dto.request;

import lombok.*;
import java.time.OffsetDateTime;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor
public class NotificationRequest {
    private String reminder;
    private OffsetDateTime notificationDatetime;
    private String notificationType;
}
