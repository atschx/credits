package com.credits.model.dto;

import io.swagger.v3.oas.annotations.media.Schema;

import java.math.BigDecimal;
import java.util.List;

@Schema(description = "Dashboard statistics overview")
public class DashboardStats {

    @Schema(description = "Total number of accounts")
    private long totalAccounts;

    @Schema(description = "Number of accounts with a positive credit balance")
    private long activeAccounts;

    @Schema(description = "Sum of all positive transaction amounts (credits granted)")
    private BigDecimal totalGranted;

    @Schema(description = "Sum of all negative transaction amounts as a positive value (credits consumed)")
    private BigDecimal totalConsumed;

    @Schema(description = "Sum of revenue_impact from consumption transactions")
    private BigDecimal recognizedRevenue;

    @Schema(description = "Sum of remaining_amount * cost_basis_per_unit from non-expired grants")
    private BigDecimal deferredRevenue;

    @Schema(description = "Monthly recognized revenue breakdown")
    private List<MonthlyRevenue> monthlyRevenue;

    @Schema(description = "Per-account revenue breakdown")
    private List<AccountRevenue> accountRevenue;

    public long getTotalAccounts() { return totalAccounts; }
    public void setTotalAccounts(long totalAccounts) { this.totalAccounts = totalAccounts; }
    public long getActiveAccounts() { return activeAccounts; }
    public void setActiveAccounts(long activeAccounts) { this.activeAccounts = activeAccounts; }
    public BigDecimal getTotalGranted() { return totalGranted; }
    public void setTotalGranted(BigDecimal totalGranted) { this.totalGranted = totalGranted; }
    public BigDecimal getTotalConsumed() { return totalConsumed; }
    public void setTotalConsumed(BigDecimal totalConsumed) { this.totalConsumed = totalConsumed; }
    public BigDecimal getRecognizedRevenue() { return recognizedRevenue; }
    public void setRecognizedRevenue(BigDecimal recognizedRevenue) { this.recognizedRevenue = recognizedRevenue; }
    public BigDecimal getDeferredRevenue() { return deferredRevenue; }
    public void setDeferredRevenue(BigDecimal deferredRevenue) { this.deferredRevenue = deferredRevenue; }
    public List<MonthlyRevenue> getMonthlyRevenue() { return monthlyRevenue; }
    public void setMonthlyRevenue(List<MonthlyRevenue> monthlyRevenue) { this.monthlyRevenue = monthlyRevenue; }
    public List<AccountRevenue> getAccountRevenue() { return accountRevenue; }
    public void setAccountRevenue(List<AccountRevenue> accountRevenue) { this.accountRevenue = accountRevenue; }

    @Schema(description = "Monthly recognized revenue entry")
    public static class MonthlyRevenue {
        @Schema(description = "Month in yyyy-MM format", example = "2025-01")
        private String month;
        @Schema(description = "Recognized revenue for the month")
        private BigDecimal recognizedRevenue;

        public String getMonth() { return month; }
        public void setMonth(String month) { this.month = month; }
        public BigDecimal getRecognizedRevenue() { return recognizedRevenue; }
        public void setRecognizedRevenue(BigDecimal recognizedRevenue) { this.recognizedRevenue = recognizedRevenue; }
    }

    @Schema(description = "Per-account revenue entry")
    public static class AccountRevenue {
        @Schema(description = "Account ID")
        private String accountId;
        @Schema(description = "Account name")
        private String accountName;
        @Schema(description = "Recognized revenue for the account")
        private BigDecimal recognizedRevenue;
        @Schema(description = "Total credits consumed by the account")
        private long totalConsumed;

        public String getAccountId() { return accountId; }
        public void setAccountId(String accountId) { this.accountId = accountId; }
        public String getAccountName() { return accountName; }
        public void setAccountName(String accountName) { this.accountName = accountName; }
        public BigDecimal getRecognizedRevenue() { return recognizedRevenue; }
        public void setRecognizedRevenue(BigDecimal recognizedRevenue) { this.recognizedRevenue = recognizedRevenue; }
        public long getTotalConsumed() { return totalConsumed; }
        public void setTotalConsumed(long totalConsumed) { this.totalConsumed = totalConsumed; }
    }
}
