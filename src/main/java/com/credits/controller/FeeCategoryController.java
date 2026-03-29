package com.credits.controller;

import com.credits.model.dto.ApiResponse;
import com.credits.model.dto.FeeCategoryRequest;
import com.credits.model.entity.FeeCategory;
import com.credits.service.FeeCategoryService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/fee-categories")
@Tag(name = "Fee Categories", description = "Fee category management")
public class FeeCategoryController {

    private final FeeCategoryService feeCategoryService;

    public FeeCategoryController(FeeCategoryService feeCategoryService) {
        this.feeCategoryService = feeCategoryService;
    }

    @GetMapping
    @Operation(summary = "List all fee categories")
    public ApiResponse<List<FeeCategory>> list() {
        return ApiResponse.ok(feeCategoryService.list());
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get fee category by ID")
    public ApiResponse<FeeCategory> getById(@PathVariable String id) {
        return ApiResponse.ok(feeCategoryService.getById(id));
    }

    @PostMapping
    @Operation(summary = "Create a fee category")
    public ApiResponse<FeeCategory> create(@Valid @RequestBody FeeCategoryRequest request) {
        return ApiResponse.ok(feeCategoryService.create(request));
    }

    @PutMapping("/{id}")
    @Operation(summary = "Update a fee category")
    public ApiResponse<FeeCategory> update(@PathVariable String id, @Valid @RequestBody FeeCategoryRequest request) {
        return ApiResponse.ok(feeCategoryService.update(id, request));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Delete a fee category")
    public ApiResponse<Void> delete(@PathVariable String id) {
        feeCategoryService.delete(id);
        return ApiResponse.ok(null);
    }
}
