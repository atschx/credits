package com.credits.model.entity;

import com.baomidou.mybatisplus.annotation.TableName;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@TableName("refund_records")
public class RefundRecord {

    private String id;
    private String originalTxnId;
    private String refundTxnId;
    private String reason;
    private BigDecimal refundPct;
    private Boolean includeFees;
    private LocalDateTime createdAt;

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public String getOriginalTxnId() { return originalTxnId; }
    public void setOriginalTxnId(String originalTxnId) { this.originalTxnId = originalTxnId; }
    public String getRefundTxnId() { return refundTxnId; }
    public void setRefundTxnId(String refundTxnId) { this.refundTxnId = refundTxnId; }
    public String getReason() { return reason; }
    public void setReason(String reason) { this.reason = reason; }
    public BigDecimal getRefundPct() { return refundPct; }
    public void setRefundPct(BigDecimal refundPct) { this.refundPct = refundPct; }
    public Boolean getIncludeFees() { return includeFees; }
    public void setIncludeFees(Boolean includeFees) { this.includeFees = includeFees; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}
