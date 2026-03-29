package com.credits.controller;

import com.credits.model.dto.ApiResponse;
import com.credits.model.dto.GrantTypeRequest;
import com.credits.model.entity.GrantType;
import com.credits.service.GrantTypeService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/grant-types")
@Tag(name = "Grant Types", description = "Grant type management")
public class GrantTypeController {

    private final GrantTypeService grantTypeService;

    public GrantTypeController(GrantTypeService grantTypeService) {
        this.grantTypeService = grantTypeService;
    }

    @GetMapping
    @Operation(summary = "List all grant types")
    public ApiResponse<List<GrantType>> list() {
        return ApiResponse.ok(grantTypeService.list());
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get grant type by ID")
    public ApiResponse<GrantType> getById(@PathVariable String id) {
        return ApiResponse.ok(grantTypeService.getById(id));
    }

    @PostMapping
    @Operation(summary = "Create a grant type")
    public ApiResponse<GrantType> create(@Valid @RequestBody GrantTypeRequest request) {
        return ApiResponse.ok(grantTypeService.create(request));
    }

    @PutMapping("/{id}")
    @Operation(summary = "Update a grant type")
    public ApiResponse<GrantType> update(@PathVariable String id, @Valid @RequestBody GrantTypeRequest request) {
        return ApiResponse.ok(grantTypeService.update(id, request));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Delete a grant type")
    public ApiResponse<Void> delete(@PathVariable String id) {
        grantTypeService.delete(id);
        return ApiResponse.ok(null);
    }
}
