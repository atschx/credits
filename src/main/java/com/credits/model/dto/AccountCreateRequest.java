package com.credits.model.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

@Schema(description = "Create account request")
public class AccountCreateRequest {

    @NotBlank
    @Schema(description = "Account name", example = "Acme Corp")
    private String name;

    @Email
    @Schema(description = "Billing email", example = "billing@acme.com")
    private String billingEmail;

    @Schema(description = "Rate card ID to associate", example = "uuid")
    private String rateCardId;

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getBillingEmail() { return billingEmail; }
    public void setBillingEmail(String billingEmail) { this.billingEmail = billingEmail; }
    public String getRateCardId() { return rateCardId; }
    public void setRateCardId(String rateCardId) { this.rateCardId = rateCardId; }
}
