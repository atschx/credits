package com.credits.model.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public class GrantTypeRequest {

    @NotBlank(message = "Name is required")
    private String name;

    @NotBlank(message = "Code is required")
    private String code;

    @NotNull(message = "isRevenueBearing is required")
    private Boolean isRevenueBearing;

    private String accountingTreatment;

    private Integer defaultExpiryDays = 365;

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getCode() { return code; }
    public void setCode(String code) { this.code = code; }
    public Boolean getIsRevenueBearing() { return isRevenueBearing; }
    public void setIsRevenueBearing(Boolean isRevenueBearing) { this.isRevenueBearing = isRevenueBearing; }
    public String getAccountingTreatment() { return accountingTreatment; }
    public void setAccountingTreatment(String accountingTreatment) { this.accountingTreatment = accountingTreatment; }
    public Integer getDefaultExpiryDays() { return defaultExpiryDays; }
    public void setDefaultExpiryDays(Integer defaultExpiryDays) { this.defaultExpiryDays = defaultExpiryDays; }
}
