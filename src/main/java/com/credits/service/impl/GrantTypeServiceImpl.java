package com.credits.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.credits.mapper.GrantTypeMapper;
import com.credits.model.dto.GrantTypeRequest;
import com.credits.model.entity.GrantType;
import com.credits.service.GrantTypeService;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.UUID;

@Service
public class GrantTypeServiceImpl implements GrantTypeService {

    private final GrantTypeMapper grantTypeMapper;

    public GrantTypeServiceImpl(GrantTypeMapper grantTypeMapper) {
        this.grantTypeMapper = grantTypeMapper;
    }

    @Override
    public List<GrantType> list() {
        return grantTypeMapper.selectList(new LambdaQueryWrapper<>());
    }

    @Override
    public GrantType getById(String id) {
        GrantType gt = grantTypeMapper.selectById(id);
        if (gt == null) {
            throw new IllegalArgumentException("Grant type not found: " + id);
        }
        return gt;
    }

    @Override
    public GrantType create(GrantTypeRequest request) {
        GrantType gt = new GrantType();
        gt.setId(UUID.randomUUID().toString());
        gt.setName(request.getName());
        gt.setCode(request.getCode());
        gt.setIsRevenueBearing(request.getIsRevenueBearing());
        gt.setAccountingTreatment(request.getAccountingTreatment());
        gt.setDefaultExpiryDays(request.getDefaultExpiryDays());
        grantTypeMapper.insert(gt);
        return gt;
    }

    @Override
    public GrantType update(String id, GrantTypeRequest request) {
        GrantType gt = getById(id);
        gt.setName(request.getName());
        gt.setIsRevenueBearing(request.getIsRevenueBearing());
        gt.setAccountingTreatment(request.getAccountingTreatment());
        gt.setDefaultExpiryDays(request.getDefaultExpiryDays());
        grantTypeMapper.updateById(gt);
        return gt;
    }

    @Override
    public void delete(String id) {
        getById(id);
        grantTypeMapper.deleteById(id);
    }
}
