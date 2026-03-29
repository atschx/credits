package com.credits.model.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;

@Schema(description = "Refund a previous transaction")
public class RefundRequest {

    @NotBlank
    @Schema(description = "Original transaction ID to refund")
    private String originalTransactionId;

    @NotNull
    @Schema(description = "Reason for refund")
    private String reason;

    @NotNull
    @DecimalMin("0.01") @DecimalMax("100.00")
    @Schema(description = "Refund percentage (0.01 - 100.00)", example = "100.00")
    private BigDecimal refundPct;

    @Schema(description = "Whether to refund associated fees", defaultValue = "false")
    private boolean includeFees;

    @NotBlank
    @Schema(description = "Idempotency key")
    private String idempotencyKey;

    public String getOriginalTransactionId() { return originalTransactionId; }
    public void setOriginalTransactionId(String originalTransactionId) { this.originalTransactionId = originalTransactionId; }
    public String getReason() { return reason; }
    public void setReason(String reason) { this.reason = reason; }
    public BigDecimal getRefundPct() { return refundPct; }
    public void setRefundPct(BigDecimal refundPct) { this.refundPct = refundPct; }
    public boolean isIncludeFees() { return includeFees; }
    public void setIncludeFees(boolean includeFees) { this.includeFees = includeFees; }
    public String getIdempotencyKey() { return idempotencyKey; }
    public void setIdempotencyKey(String idempotencyKey) { this.idempotencyKey = idempotencyKey; }
}
