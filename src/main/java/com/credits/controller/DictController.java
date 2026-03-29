package com.credits.controller;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.credits.mapper.FeeCategoryMapper;
import com.credits.mapper.GrantTypeMapper;
import com.credits.model.dto.ApiResponse;
import com.credits.model.entity.FeeCategory;
import com.credits.model.entity.GrantType;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/dict")
@Tag(name = "Dictionaries", description = "Grant types and fee categories")
public class DictController {

    private final GrantTypeMapper grantTypeMapper;
    private final FeeCategoryMapper feeCategoryMapper;

    public DictController(GrantTypeMapper grantTypeMapper, FeeCategoryMapper feeCategoryMapper) {
        this.grantTypeMapper = grantTypeMapper;
        this.feeCategoryMapper = feeCategoryMapper;
    }

    @GetMapping("/grant-types")
    @Operation(summary = "List all grant types")
    public ApiResponse<List<GrantType>> listGrantTypes() {
        return ApiResponse.ok(grantTypeMapper.selectList(new LambdaQueryWrapper<>()));
    }

    @GetMapping("/fee-categories")
    @Operation(summary = "List all fee categories")
    public ApiResponse<List<FeeCategory>> listFeeCategories() {
        return ApiResponse.ok(feeCategoryMapper.selectList(new LambdaQueryWrapper<>()));
    }
}
