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
        List<GrantType> types = grantTypeMapper.selectList(new LambdaQueryWrapper<>());
        List<java.util.Map<String, Object>> counts = grantTypeMapper.selectGrantCountsByType();
        java.util.Map<String, long[]> countMap = new java.util.HashMap<>();
        for (java.util.Map<String, Object> row : counts) {
            String gtId = (String) row.get("GRANTTYPEID");
            long total = ((Number) row.get("TOTAL")).longValue();
            long active = ((Number) row.get("ACTIVE")).longValue();
            countMap.put(gtId, new long[]{total, active});
        }
        for (GrantType gt : types) {
            long[] c = countMap.getOrDefault(gt.getId(), new long[]{0, 0});
            gt.setGrantCount(c[0]);
            gt.setActiveGrantCount(c[1]);
        }
        return types;
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
