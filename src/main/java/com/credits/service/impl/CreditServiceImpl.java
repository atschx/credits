package com.credits.service.impl;

import com.credits.model.dto.ConsumeCreditsRequest;
import com.credits.model.dto.CreditGrantRequest;
import com.credits.model.dto.RefundRequest;
import com.credits.model.entity.CreditGrant;
import com.credits.model.entity.CreditTransaction;
import com.credits.model.entity.TransactionLineItem;
import com.credits.service.ConsumptionService;
import com.credits.service.CreditService;
import com.credits.service.GrantService;
import com.credits.service.LedgerService;
import com.credits.service.RefundService;
import org.springframework.stereotype.Service;

import java.util.List;

/**
 * Thin facade that composes the split domain services so existing callers
 * (controllers, tests) continue to work against a single entry point.
 */
@Service
public class CreditServiceImpl implements CreditService {

    private final GrantService grantService;
    private final ConsumptionService consumptionService;
    private final RefundService refundService;
    private final LedgerService ledgerService;

    public CreditServiceImpl(GrantService grantService,
                             ConsumptionService consumptionService,
                             RefundService refundService,
                             LedgerService ledgerService) {
        this.grantService = grantService;
        this.consumptionService = consumptionService;
        this.refundService = refundService;
        this.ledgerService = ledgerService;
    }

    @Override
    public CreditGrant grantCredits(CreditGrantRequest request) {
        return grantService.grantCredits(request);
    }

    @Override
    public CreditTransaction consumeCredits(ConsumeCreditsRequest request) {
        return consumptionService.consumeCredits(request);
    }

    @Override
    public CreditTransaction refund(RefundRequest request) {
        return refundService.refund(request);
    }

    @Override
    public List<CreditTransaction> getTransactions(String accountId, int page, int size) {
        return ledgerService.getTransactions(accountId, page, size);
    }

    @Override
    public long getTransactionCount(String accountId) {
        return ledgerService.getTransactionCount(accountId);
    }

    @Override
    public List<CreditGrant> getGrantsByAccount(String accountId) {
        return ledgerService.getGrantsByAccount(accountId);
    }

    @Override
    public List<TransactionLineItem> getLineItems(String transactionId) {
        return ledgerService.getLineItems(transactionId);
    }
}
