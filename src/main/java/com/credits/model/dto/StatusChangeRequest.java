package com.credits.model.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

public class StatusChangeRequest {

    @NotBlank(message = "Status is required")
    @Pattern(
            regexp = "draft|active|archived",
            message = "Status must be one of: draft, active, archived")
    private String status;

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
}
