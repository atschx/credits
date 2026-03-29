package com.credits.model.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.time.LocalDateTime;
import java.util.List;

@Schema(description = "Create a rate card with items")
public class RateCardCreateRequest {

    @NotBlank
    private String name;

    @Schema(defaultValue = "USD")
    private String currency = "USD";

    @NotNull
    private LocalDateTime effectiveFrom;

    private LocalDateTime effectiveTo;

    @Valid
    private List<Item> items;

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getCurrency() { return currency; }
    public void setCurrency(String currency) { this.currency = currency; }
    public LocalDateTime getEffectiveFrom() { return effectiveFrom; }
    public void setEffectiveFrom(LocalDateTime effectiveFrom) { this.effectiveFrom = effectiveFrom; }
    public LocalDateTime getEffectiveTo() { return effectiveTo; }
    public void setEffectiveTo(LocalDateTime effectiveTo) { this.effectiveTo = effectiveTo; }
    public List<Item> getItems() { return items; }
    public void setItems(List<Item> items) { this.items = items; }

    public static class Item {
        @NotBlank
        private String actionCode;
        @NotBlank
        private String actionName;
        private String unitOfMeasure = "request";
        @NotNull
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
}
