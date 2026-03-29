package com.credits.model.entity;

import com.baomidou.mybatisplus.annotation.TableName;

import java.time.LocalDateTime;

@TableName("credit_balances")
public class CreditBalance {

    private String id;
    private String accountId;
    private Long totalBalance;
    private Long purchasedBalance;
    private Long promotionalBalance;
    private Long bonusBalance;
    private LocalDateTime updatedAt;

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public String getAccountId() { return accountId; }
    public void setAccountId(String accountId) { this.accountId = accountId; }
    public Long getTotalBalance() { return totalBalance; }
    public void setTotalBalance(Long totalBalance) { this.totalBalance = totalBalance; }
    public Long getPurchasedBalance() { return purchasedBalance; }
    public void setPurchasedBalance(Long purchasedBalance) { this.purchasedBalance = purchasedBalance; }
    public Long getPromotionalBalance() { return promotionalBalance; }
    public void setPromotionalBalance(Long promotionalBalance) { this.promotionalBalance = promotionalBalance; }
    public Long getBonusBalance() { return bonusBalance; }
    public void setBonusBalance(Long bonusBalance) { this.bonusBalance = bonusBalance; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
}
