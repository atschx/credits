package com.credits.service;

import com.credits.model.dto.AccountCreateRequest;
import com.credits.model.dto.AccountSearchRequest;
import com.credits.model.dto.AccountUpdateRequest;
import com.credits.model.dto.PageResponse;
import com.credits.model.entity.Account;
import com.credits.model.entity.CreditBalance;

public interface AccountService {

    Account createAccount(AccountCreateRequest request);

    Account getAccount(String id);

    CreditBalance getBalance(String accountId);

    PageResponse<Account> listAccounts(int page, int size, String status);

    PageResponse<Account> searchAccounts(int page, int size, AccountSearchRequest search);

    Account updateAccount(String id, AccountUpdateRequest request);
}
