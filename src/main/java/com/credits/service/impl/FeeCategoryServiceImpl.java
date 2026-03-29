package com.credits.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.credits.mapper.FeeCategoryMapper;
import com.credits.model.dto.FeeCategoryRequest;
import com.credits.model.entity.FeeCategory;
import com.credits.service.FeeCategoryService;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.UUID;

@Service
public class FeeCategoryServiceImpl implements FeeCategoryService {

    private final FeeCategoryMapper feeCategoryMapper;

    public FeeCategoryServiceImpl(FeeCategoryMapper feeCategoryMapper) {
        this.feeCategoryMapper = feeCategoryMapper;
    }

    @Override
    public List<FeeCategory> list() {
        return feeCategoryMapper.selectList(new LambdaQueryWrapper<>());
    }

    @Override
    public FeeCategory getById(String id) {
        FeeCategory fc = feeCategoryMapper.selectById(id);
        if (fc == null) {
            throw new IllegalArgumentException("Fee category not found: " + id);
        }
        return fc;
    }

    @Override
    public FeeCategory create(FeeCategoryRequest request) {
        FeeCategory fc = new FeeCategory();
        fc.setId(UUID.randomUUID().toString());
        fc.setCode(request.getCode());
        fc.setName(request.getName());
        fc.setIsRevenue(request.getIsRevenue());
        fc.setIsRefundable(request.getIsRefundable());
        fc.setGlAccountCode(request.getGlAccountCode());
        feeCategoryMapper.insert(fc);
        return fc;
    }

    @Override
    public FeeCategory update(String id, FeeCategoryRequest request) {
        FeeCategory fc = getById(id);
        fc.setName(request.getName());
        fc.setIsRevenue(request.getIsRevenue());
        fc.setIsRefundable(request.getIsRefundable());
        fc.setGlAccountCode(request.getGlAccountCode());
        feeCategoryMapper.updateById(fc);
        return fc;
    }

    @Override
    public void delete(String id) {
        getById(id);
        feeCategoryMapper.deleteById(id);
    }
}
