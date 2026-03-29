package com.credits.controller;

import com.credits.model.dto.*;
import com.credits.model.entity.RateCard;
import com.credits.model.entity.RateCardItem;
import com.credits.service.RateCardService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/rate-cards")
@Tag(name = "Rate Cards", description = "Rate card management")
public class RateCardController {

    private final RateCardService rateCardService;

    public RateCardController(RateCardService rateCardService) {
        this.rateCardService = rateCardService;
    }

    @GetMapping
    @Operation(summary = "List rate cards with optional status filter")
    public ApiResponse<List<RateCard>> listRateCards(@RequestParam(required = false) String status) {
        return ApiResponse.ok(rateCardService.listRateCards(status));
    }

    @PostMapping
    @Operation(summary = "Create a rate card with items")
    public ApiResponse<RateCard> createRateCard(@Valid @RequestBody RateCardCreateRequest request) {
        return ApiResponse.ok(rateCardService.createRateCard(request));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get rate card by ID")
    public ApiResponse<RateCard> getRateCard(@PathVariable String id) {
        return ApiResponse.ok(rateCardService.getRateCard(id));
    }

    @PutMapping("/{id}")
    @Operation(summary = "Update rate card")
    public ApiResponse<RateCard> updateRateCard(@PathVariable String id, @RequestBody RateCardUpdateRequest request) {
        return ApiResponse.ok(rateCardService.updateRateCard(id, request));
    }

    @PutMapping("/{id}/status")
    @Operation(summary = "Change rate card status")
    public ApiResponse<RateCard> changeStatus(@PathVariable String id, @Valid @RequestBody StatusChangeRequest request) {
        return ApiResponse.ok(rateCardService.changeStatus(id, request.getStatus()));
    }

    @GetMapping("/{id}/items")
    @Operation(summary = "Get rate card items")
    public ApiResponse<List<RateCardItem>> getRateCardItems(@PathVariable String id) {
        return ApiResponse.ok(rateCardService.getRateCardItems(id));
    }

    @PostMapping("/{id}/items")
    @Operation(summary = "Add item to rate card")
    public ApiResponse<RateCardItem> addItem(@PathVariable String id, @Valid @RequestBody RateCardItemRequest request) {
        return ApiResponse.ok(rateCardService.addItem(id, request));
    }

    @PutMapping("/{id}/items/{itemId}")
    @Operation(summary = "Update rate card item")
    public ApiResponse<RateCardItem> updateItem(@PathVariable String id, @PathVariable String itemId,
                                                 @Valid @RequestBody RateCardItemRequest request) {
        return ApiResponse.ok(rateCardService.updateItem(id, itemId, request));
    }

    @DeleteMapping("/{id}/items/{itemId}")
    @Operation(summary = "Delete rate card item")
    public ApiResponse<Void> deleteItem(@PathVariable String id, @PathVariable String itemId) {
        rateCardService.deleteItem(id, itemId);
        return ApiResponse.ok(null);
    }
}
