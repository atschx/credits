package com.credits.controller;

import com.credits.model.dto.*;
import com.credits.model.entity.CreditGrant;
import com.credits.model.entity.CreditTransaction;
import com.credits.model.entity.TransactionLineItem;
import com.credits.service.CreditService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/credits")
@Tag(name = "Credits", description = "Credit grant, consumption, and refund operations")
public class CreditController {

    private final CreditService creditService;

    public CreditController(CreditService creditService) {
        this.creditService = creditService;
    }

    @PostMapping("/grant")
    @Operation(summary = "Grant credits to an account")
    public ApiResponse<CreditGrant> grantCredits(@Valid @RequestBody CreditGrantRequest request) {
        return ApiResponse.ok(creditService.grantCredits(request));
    }

    @PostMapping("/consume")
    @Operation(summary = "Consume credits for an action (idempotent)")
    public ApiResponse<CreditTransaction> consumeCredits(@Valid @RequestBody ConsumeCreditsRequest request) {
        return ApiResponse.ok(creditService.consumeCredits(request));
    }

    @PostMapping("/refund")
    @Operation(summary = "Refund a previous consumption transaction")
    public ApiResponse<CreditTransaction> refund(@Valid @RequestBody RefundRequest request) {
        return ApiResponse.ok(creditService.refund(request));
    }

    @GetMapping("/grants")
    @Operation(summary = "List credit grants for an account")
    public ApiResponse<List<CreditGrant>> listGrants(
            @Parameter(description = "Account ID") @RequestParam String accountId) {
        return ApiResponse.ok(creditService.getGrantsByAccount(accountId));
    }

    @GetMapping("/transactions")
    @Operation(summary = "List transactions for an account (paginated)")
    public ApiResponse<PageResponse<CreditTransaction>> listTransactions(
            @Parameter(description = "Account ID") @RequestParam String accountId,
            @Parameter(description = "Page number (1-based)") @RequestParam(defaultValue = "1") int page,
            @Parameter(description = "Page size") @RequestParam(defaultValue = "20") int size) {

        List<CreditTransaction> records = creditService.getTransactions(accountId, page, size);
        long total = creditService.getTransactionCount(accountId);
        return ApiResponse.ok(PageResponse.of(records, total, page, size));
    }

    @GetMapping("/transactions/{transactionId}/line-items")
    @Operation(summary = "List line items for a transaction")
    public ApiResponse<List<TransactionLineItem>> listLineItems(
            @Parameter(description = "Transaction ID") @PathVariable String transactionId) {
        return ApiResponse.ok(creditService.getLineItems(transactionId));
    }
}
