package com.credits.model.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

@Schema(description = "Consume credits for an action")
public class ConsumeCreditsRequest {

    @NotBlank
    @Schema(description = "Account ID")
    private String accountId;

    @NotBlank
    @Schema(description = "Action code (e.g. api_call, embedding)")
    private String actionCode;

    @NotNull @Positive
    @Schema(description = "Number of units consumed", example = "1")
    private Integer units;

    @NotBlank
    @Schema(description = "Idempotency key to prevent duplicate charges")
    private String idempotencyKey;

    @Schema(description = "Description of the consumption")
    private String description;

    public String getAccountId() { return accountId; }
    public void setAccountId(String accountId) { this.accountId = accountId; }
    public String getActionCode() { return actionCode; }
    public void setActionCode(String actionCode) { this.actionCode = actionCode; }
    public Integer getUnits() { return units; }
    public void setUnits(Integer units) { this.units = units; }
    public String getIdempotencyKey() { return idempotencyKey; }
    public void setIdempotencyKey(String idempotencyKey) { this.idempotencyKey = idempotencyKey; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
}
