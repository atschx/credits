package com.credits.model.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

import java.math.BigDecimal;

@Schema(description = "Grant credits to an account")
public class CreditGrantRequest {

    @NotBlank
    @Schema(description = "Account ID")
    private String accountId;

    @NotBlank
    @Schema(description = "Grant type code (e.g. purchased, promotional, bonus)")
    private String grantTypeCode;

    @NotNull @Positive
    @Schema(description = "Amount of credits to grant")
    private Long amount;

    @Schema(description = "Cost basis per credit unit for revenue recognition", example = "0.01")
    private BigDecimal costBasisPerUnit;

    @Schema(description = "Currency code", example = "USD", defaultValue = "USD")
    private String currency = "USD";

    @Schema(description = "Source reference (e.g. payment order ID)")
    private String sourceReference;

    @Schema(description = "Expiry days override (null = use grant type default)")
    private Integer expiryDays;

    public String getAccountId() { return accountId; }
    public void setAccountId(String accountId) { this.accountId = accountId; }
    public String getGrantTypeCode() { return grantTypeCode; }
    public void setGrantTypeCode(String grantTypeCode) { this.grantTypeCode = grantTypeCode; }
    public Long getAmount() { return amount; }
    public void setAmount(Long amount) { this.amount = amount; }
    public BigDecimal getCostBasisPerUnit() { return costBasisPerUnit; }
    public void setCostBasisPerUnit(BigDecimal costBasisPerUnit) { this.costBasisPerUnit = costBasisPerUnit; }
    public String getCurrency() { return currency; }
    public void setCurrency(String currency) { this.currency = currency; }
    public String getSourceReference() { return sourceReference; }
    public void setSourceReference(String sourceReference) { this.sourceReference = sourceReference; }
    public Integer getExpiryDays() { return expiryDays; }
    public void setExpiryDays(Integer expiryDays) { this.expiryDays = expiryDays; }
}
