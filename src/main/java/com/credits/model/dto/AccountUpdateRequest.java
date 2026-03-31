package com.credits.model.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Pattern;

public class AccountUpdateRequest {

    private String name;

    @Email(message = "Billing email must be a valid email address")
    private String billingEmail;

    private String rateCardId;

    @Pattern(
            regexp = "active|suspended|closed",
            message = "Status must be one of: active, suspended, closed")
    private String status;

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getBillingEmail() { return billingEmail; }
    public void setBillingEmail(String billingEmail) { this.billingEmail = billingEmail; }
    public String getRateCardId() { return rateCardId; }
    public void setRateCardId(String rateCardId) { this.rateCardId = rateCardId; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
}
