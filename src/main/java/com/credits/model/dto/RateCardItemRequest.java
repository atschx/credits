package com.credits.model.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public class RateCardItemRequest {

    @NotBlank(message = "Action code is required")
    private String actionCode;

    @NotBlank(message = "Action name is required")
    private String actionName;

    private String unitOfMeasure = "request";

    @NotNull(message = "Base credit cost is required")
    private Integer baseCreditCost;

    private Integer feeCreditCost = 0;

    private String feeCategoryId;

    public String getActionCode() { return actionCode; }
    public void setActionCode(String actionCode) { this.actionCode = actionCode; }
    public String getActionName() { return actionName; }
    public void setActionName(String actionName) { this.actionName = actionName; }
    public String getUnitOfMeasure() { return unitOfMeasure; }
    public void setUnitOfMeasure(String unitOfMeasure) { this.unitOfMeasure = unitOfMeasure; }
    public Integer getBaseCreditCost() { return baseCreditCost; }
    public void setBaseCreditCost(Integer baseCreditCost) { this.baseCreditCost = baseCreditCost; }
    public Integer getFeeCreditCost() { return feeCreditCost; }
    public void setFeeCreditCost(Integer feeCreditCost) { this.feeCreditCost = feeCreditCost; }
    public String getFeeCategoryId() { return feeCategoryId; }
    public void setFeeCategoryId(String feeCategoryId) { this.feeCategoryId = feeCategoryId; }
}
