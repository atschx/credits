package com.credits.controller;

import com.credits.model.dto.*;
import com.credits.model.entity.Account;
import com.credits.model.entity.CreditBalance;
import com.credits.service.AccountService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;

@RestController
@RequestMapping("/api/v1/accounts")
@Tag(name = "Accounts", description = "Account management")
public class AccountController {

    private final AccountService accountService;

    public AccountController(AccountService accountService) {
        this.accountService = accountService;
    }

    @GetMapping
    @Operation(summary = "Search accounts with filters")
    public ApiResponse<PageResponse<Account>> listAccounts(
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String email,
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) String sortBy,
            @RequestParam(required = false) String sortDir,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate createdFrom,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate createdTo,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate lastConsumptionFrom,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate lastConsumptionTo,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate lastRechargeFrom,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate lastRechargeTo) {

        AccountSearchRequest search = new AccountSearchRequest();
        search.setStatus(status);
        search.setEmail(email);
        search.setKeyword(keyword);
        search.setSortBy(sortBy);
        search.setSortDir(sortDir);
        search.setCreatedFrom(createdFrom);
        search.setCreatedTo(createdTo);
        search.setLastConsumptionFrom(lastConsumptionFrom);
        search.setLastConsumptionTo(lastConsumptionTo);
        search.setLastRechargeFrom(lastRechargeFrom);
        search.setLastRechargeTo(lastRechargeTo);

        return ApiResponse.ok(accountService.searchAccounts(page, size, search));
    }

    @PostMapping
    @Operation(summary = "Create a new account")
    public ApiResponse<Account> createAccount(@Valid @RequestBody AccountCreateRequest request) {
        return ApiResponse.ok(accountService.createAccount(request));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get account by ID")
    public ApiResponse<Account> getAccount(@PathVariable String id) {
        return ApiResponse.ok(accountService.getAccount(id));
    }

    @PutMapping("/{id}")
    @Operation(summary = "Update an account")
    public ApiResponse<Account> updateAccount(@PathVariable String id, @RequestBody AccountUpdateRequest request) {
        return ApiResponse.ok(accountService.updateAccount(id, request));
    }

    @GetMapping("/{id}/balance")
    @Operation(summary = "Get account credit balance")
    public ApiResponse<CreditBalance> getBalance(@PathVariable String id) {
        return ApiResponse.ok(accountService.getBalance(id));
    }
}
