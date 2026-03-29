package com.credits.model.entity;

import com.baomidou.mybatisplus.annotation.TableName;

@TableName("grant_types")
public class GrantType {

    private String id;
    private String name;
    private String code;
    private Boolean isRevenueBearing;
    private String accountingTreatment;
    private Integer defaultExpiryDays;

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
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
