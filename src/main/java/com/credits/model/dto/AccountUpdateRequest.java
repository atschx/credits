package com.credits.model.dto;

public class AccountUpdateRequest {

    private String name;
    private String billingEmail;
    private String rateCardId;
    private String status;

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getBillingEmail() { return billingEmail; }
    public void setBillingEmail(String billingEmail) { this.billingEmail = billingEmail; }
    public String getRateCardId() { return rateCardId; }
    public void setRateCardId(String rateCardId) { this.rateCardId = rateCardId; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
}
