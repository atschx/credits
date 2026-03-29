package com.credits.model.entity;

import com.baomidou.mybatisplus.annotation.TableName;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@TableName("credit_transactions")
public class CreditTransaction {

    private String id;
    private String accountId;
    private String grantId;
    private String type;
    private Long amount;
    private BigDecimal revenueImpact;
    private String idempotencyKey;
    private String description;
    private LocalDateTime createdAt;

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public String getAccountId() { return accountId; }
    public void setAccountId(String accountId) { this.accountId = accountId; }
    public String getGrantId() { return grantId; }
    public void setGrantId(String grantId) { this.grantId = grantId; }
    public String getType() { return type; }
    public void setType(String type) { this.type = type; }
    public Long getAmount() { return amount; }
    public void setAmount(Long amount) { this.amount = amount; }
    public BigDecimal getRevenueImpact() { return revenueImpact; }
    public void setRevenueImpact(BigDecimal revenueImpact) { this.revenueImpact = revenueImpact; }
    public String getIdempotencyKey() { return idempotencyKey; }
    public void setIdempotencyKey(String idempotencyKey) { this.idempotencyKey = idempotencyKey; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}
