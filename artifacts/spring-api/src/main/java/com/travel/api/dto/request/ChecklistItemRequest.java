package com.travel.api.dto.request;

import lombok.Getter;
import lombok.Setter;

@Getter @Setter
public class ChecklistItemRequest {
    private String label;
    private Boolean isDone;
}
