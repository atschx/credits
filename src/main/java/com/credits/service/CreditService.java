package com.credits.service;

import com.credits.model.dto.ConsumeCreditsRequest;
import com.credits.model.dto.CreditGrantRequest;
import com.credits.model.dto.RefundRequest;
import com.credits.model.entity.CreditGrant;
import com.credits.model.entity.CreditTransaction;
import com.credits.model.entity.TransactionLineItem;

import java.util.List;

public interface CreditService {

    CreditGrant grantCredits(CreditGrantRequest request);

    CreditTransaction consumeCredits(ConsumeCreditsRequest request);

    CreditTransaction refund(RefundRequest request);

    List<CreditTransaction> getTransactions(String accountId, int page, int size);

    long getTransactionCount(String accountId);

    List<CreditGrant> getGrantsByAccount(String accountId);

    List<TransactionLineItem> getLineItems(String transactionId);
}
