package com.credits.model.dto;

import java.time.LocalDate;

public class AccountSearchRequest {
    private String status;
    private String email;
    private String keyword;
    private String sortBy;
    private String sortDir;
    private LocalDate createdFrom;
    private LocalDate createdTo;
    private LocalDate lastConsumptionFrom;
    private LocalDate lastConsumptionTo;
    private LocalDate lastRechargeFrom;
    private LocalDate lastRechargeTo;

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }
    public String getKeyword() { return keyword; }
    public void setKeyword(String keyword) { this.keyword = keyword; }
    public String getSortBy() { return sortBy; }
    public void setSortBy(String sortBy) { this.sortBy = sortBy; }
    public String getSortDir() { return sortDir; }
    public void setSortDir(String sortDir) { this.sortDir = sortDir; }
    public LocalDate getCreatedFrom() { return createdFrom; }
    public void setCreatedFrom(LocalDate createdFrom) { this.createdFrom = createdFrom; }
    public LocalDate getCreatedTo() { return createdTo; }
    public void setCreatedTo(LocalDate createdTo) { this.createdTo = createdTo; }
    public LocalDate getLastConsumptionFrom() { return lastConsumptionFrom; }
    public void setLastConsumptionFrom(LocalDate lastConsumptionFrom) { this.lastConsumptionFrom = lastConsumptionFrom; }
    public LocalDate getLastConsumptionTo() { return lastConsumptionTo; }
    public void setLastConsumptionTo(LocalDate lastConsumptionTo) { this.lastConsumptionTo = lastConsumptionTo; }
    public LocalDate getLastRechargeFrom() { return lastRechargeFrom; }
    public void setLastRechargeFrom(LocalDate lastRechargeFrom) { this.lastRechargeFrom = lastRechargeFrom; }
    public LocalDate getLastRechargeTo() { return lastRechargeTo; }
    public void setLastRechargeTo(LocalDate lastRechargeTo) { this.lastRechargeTo = lastRechargeTo; }

    public boolean hasTransactionFilters() {
        return lastConsumptionFrom != null || lastConsumptionTo != null
                || lastRechargeFrom != null || lastRechargeTo != null;
    }
}
