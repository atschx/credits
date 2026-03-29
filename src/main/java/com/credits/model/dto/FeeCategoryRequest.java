package com.credits.model.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public class FeeCategoryRequest {

    @NotBlank(message = "Code is required")
    private String code;

    @NotBlank(message = "Name is required")
    private String name;

    @NotNull(message = "isRevenue is required")
    private Boolean isRevenue;

    private Boolean isRefundable = false;

    private String glAccountCode;

    public String getCode() { return code; }
    public void setCode(String code) { this.code = code; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public Boolean getIsRevenue() { return isRevenue; }
    public void setIsRevenue(Boolean isRevenue) { this.isRevenue = isRevenue; }
    public Boolean getIsRefundable() { return isRefundable; }
    public void setIsRefundable(Boolean isRefundable) { this.isRefundable = isRefundable; }
    public String getGlAccountCode() { return glAccountCode; }
    public void setGlAccountCode(String glAccountCode) { this.glAccountCode = glAccountCode; }
}
