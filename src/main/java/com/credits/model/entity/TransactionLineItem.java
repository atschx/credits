package com.credits.model.entity;

import com.baomidou.mybatisplus.annotation.TableName;

import java.math.BigDecimal;

@TableName("transaction_line_items")
public class TransactionLineItem {

    private String id;
    private String transactionId;
    private String feeCategoryId;
    private Long amount;
    private BigDecimal revenueImpact;
    private String label;

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public String getTransactionId() { return transactionId; }
    public void setTransactionId(String transactionId) { this.transactionId = transactionId; }
    public String getFeeCategoryId() { return feeCategoryId; }
    public void setFeeCategoryId(String feeCategoryId) { this.feeCategoryId = feeCategoryId; }
    public Long getAmount() { return amount; }
    public void setAmount(Long amount) { this.amount = amount; }
    public BigDecimal getRevenueImpact() { return revenueImpact; }
    public void setRevenueImpact(BigDecimal revenueImpact) { this.revenueImpact = revenueImpact; }
    public String getLabel() { return label; }
    public void setLabel(String label) { this.label = label; }
}
