package com.credits.model.entity;

import com.baomidou.mybatisplus.annotation.TableName;

@TableName("fee_categories")
public class FeeCategory {

    private String id;
    private String code;
    private String name;
    private Boolean isRevenue;
    private Boolean isRefundable;
    private String glAccountCode;

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
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
