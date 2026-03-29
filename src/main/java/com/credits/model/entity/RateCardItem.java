package com.credits.model.entity;

import com.baomidou.mybatisplus.annotation.TableName;

@TableName("rate_card_items")
public class RateCardItem {

    private String id;
    private String rateCardId;
    private String actionCode;
    private String actionName;
    private String unitOfMeasure;
    private Integer baseCreditCost;
    private Integer feeCreditCost;
    private String feeCategoryId;

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public String getRateCardId() { return rateCardId; }
    public void setRateCardId(String rateCardId) { this.rateCardId = rateCardId; }
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
