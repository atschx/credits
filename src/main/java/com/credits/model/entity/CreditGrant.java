package com.credits.model.entity;

import com.baomidou.mybatisplus.annotation.TableName;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@TableName("credit_grants")
public class CreditGrant {

    private String id;
    private String accountId;
    private String grantTypeId;
    private String sourceReference;
    private Long originalAmount;
    private Long remainingAmount;
    private BigDecimal costBasisPerUnit;
    private String currency;
    private LocalDateTime expiresAt;
    private LocalDateTime createdAt;
    private Integer consumptionPriority;
    private String grantStatus;
    private LocalDateTime sortExpiresAt;
    private String metadata;

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public String getAccountId() { return accountId; }
    public void setAccountId(String accountId) { this.accountId = accountId; }
    public String getGrantTypeId() { return grantTypeId; }
    public void setGrantTypeId(String grantTypeId) { this.grantTypeId = grantTypeId; }
    public String getSourceReference() { return sourceReference; }
    public void setSourceReference(String sourceReference) { this.sourceReference = sourceReference; }
    public Long getOriginalAmount() { return originalAmount; }
    public void setOriginalAmount(Long originalAmount) { this.originalAmount = originalAmount; }
    public Long getRemainingAmount() { return remainingAmount; }
    public void setRemainingAmount(Long remainingAmount) { this.remainingAmount = remainingAmount; }
    public BigDecimal getCostBasisPerUnit() { return costBasisPerUnit; }
    public void setCostBasisPerUnit(BigDecimal costBasisPerUnit) { this.costBasisPerUnit = costBasisPerUnit; }
    public String getCurrency() { return currency; }
    public void setCurrency(String currency) { this.currency = currency; }
    public LocalDateTime getExpiresAt() { return expiresAt; }
    public void setExpiresAt(LocalDateTime expiresAt) { this.expiresAt = expiresAt; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
    public Integer getConsumptionPriority() { return consumptionPriority; }
    public void setConsumptionPriority(Integer consumptionPriority) { this.consumptionPriority = consumptionPriority; }
    public String getGrantStatus() { return grantStatus; }
    public void setGrantStatus(String grantStatus) { this.grantStatus = grantStatus; }
    public LocalDateTime getSortExpiresAt() { return sortExpiresAt; }
    public void setSortExpiresAt(LocalDateTime sortExpiresAt) { this.sortExpiresAt = sortExpiresAt; }
    public String getMetadata() { return metadata; }
    public void setMetadata(String metadata) { this.metadata = metadata; }
}
