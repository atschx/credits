package com.credits.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.core.metadata.IPage;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.credits.mapper.AccountMapper;
import com.credits.mapper.CreditBalanceMapper;
import com.credits.model.dto.AccountCreateRequest;
import com.credits.model.dto.AccountSearchRequest;
import com.credits.model.dto.AccountUpdateRequest;
import com.credits.model.dto.PageResponse;
import com.credits.model.entity.Account;
import com.credits.model.entity.CreditBalance;
import com.credits.service.AccountService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
public class AccountServiceImpl implements AccountService {

    private final AccountMapper accountMapper;
    private final CreditBalanceMapper creditBalanceMapper;

    public AccountServiceImpl(AccountMapper accountMapper, CreditBalanceMapper creditBalanceMapper) {
        this.accountMapper = accountMapper;
        this.creditBalanceMapper = creditBalanceMapper;
    }

    @Override
    @Transactional
    public Account createAccount(AccountCreateRequest request) {
        Account account = new Account();
        account.setId(UUID.randomUUID().toString());
        account.setName(request.getName());
        account.setBillingEmail(request.getBillingEmail());
        account.setRateCardId(request.getRateCardId());
        account.setStatus("active");
        accountMapper.insert(account);

        CreditBalance balance = new CreditBalance();
        balance.setId(UUID.randomUUID().toString());
        balance.setAccountId(account.getId());
        balance.setTotalBalance(0L);
        balance.setPurchasedBalance(0L);
        balance.setPromotionalBalance(0L);
        balance.setBonusBalance(0L);
        creditBalanceMapper.insert(balance);

        return account;
    }

    @Override
    public Account getAccount(String id) {
        Account account = accountMapper.selectById(id);
        if (account == null) {
            throw new IllegalArgumentException("Account not found: " + id);
        }
        return account;
    }

    @Override
    public CreditBalance getBalance(String accountId) {
        CreditBalance balance = creditBalanceMapper.selectOne(
                new LambdaQueryWrapper<CreditBalance>().eq(CreditBalance::getAccountId, accountId));
        if (balance == null) {
            throw new IllegalArgumentException("Balance not found for account: " + accountId);
        }
        return balance;
    }

    @Override
    public PageResponse<Account> listAccounts(int page, int size, String status) {
        AccountSearchRequest search = new AccountSearchRequest();
        search.setStatus(status);
        return searchAccounts(page, size, search);
    }

    @Override
    public PageResponse<Account> searchAccounts(int page, int size, AccountSearchRequest search) {
        Page<Account> p = new Page<>(page, size);
        IPage<Account> result = accountMapper.searchAccounts(p, search);
        return PageResponse.of(result.getRecords(), result.getTotal(), page, size);
    }

    @Override
    public Account updateAccount(String id, AccountUpdateRequest request) {
        Account account = getAccount(id);
        if (request.getName() != null) account.setName(request.getName());
        if (request.getBillingEmail() != null) account.setBillingEmail(request.getBillingEmail());
        if (request.getRateCardId() != null) account.setRateCardId(request.getRateCardId());
        if (request.getStatus() != null) account.setStatus(request.getStatus());
        accountMapper.updateById(account);
        return account;
    }
}
