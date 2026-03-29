package com.credits.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.credits.mapper.*;
import com.credits.model.dto.ConsumeCreditsRequest;
import com.credits.model.dto.CreditGrantRequest;
import com.credits.model.dto.RefundRequest;
import com.credits.model.entity.*;
import com.credits.service.CreditService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Service
public class CreditServiceImpl implements CreditService {

    private final CreditGrantMapper creditGrantMapper;
    private final CreditTransactionMapper creditTransactionMapper;
    private final CreditBalanceMapper creditBalanceMapper;
    private final TransactionLineItemMapper lineItemMapper;
    private final RefundRecordMapper refundRecordMapper;
    private final AccountMapper accountMapper;
    private final RateCardItemMapper rateCardItemMapper;
    private final GrantTypeMapper grantTypeMapper;

    public CreditServiceImpl(CreditGrantMapper creditGrantMapper,
                             CreditTransactionMapper creditTransactionMapper,
                             CreditBalanceMapper creditBalanceMapper,
                             TransactionLineItemMapper lineItemMapper,
                             RefundRecordMapper refundRecordMapper,
                             AccountMapper accountMapper,
                             RateCardItemMapper rateCardItemMapper,
                             GrantTypeMapper grantTypeMapper) {
        this.creditGrantMapper = creditGrantMapper;
        this.creditTransactionMapper = creditTransactionMapper;
        this.creditBalanceMapper = creditBalanceMapper;
        this.lineItemMapper = lineItemMapper;
        this.refundRecordMapper = refundRecordMapper;
        this.accountMapper = accountMapper;
        this.rateCardItemMapper = rateCardItemMapper;
        this.grantTypeMapper = grantTypeMapper;
    }

    @Override
    @Transactional
    public CreditGrant grantCredits(CreditGrantRequest request) {
        GrantType grantType = grantTypeMapper.selectOne(
                new LambdaQueryWrapper<GrantType>().eq(GrantType::getCode, request.getGrantTypeCode()));
        if (grantType == null) {
            throw new IllegalArgumentException("Unknown grant type code: " + request.getGrantTypeCode());
        }

        int expiryDays = request.getExpiryDays() != null ? request.getExpiryDays() : grantType.getDefaultExpiryDays();
        BigDecimal costBasis = request.getCostBasisPerUnit() != null ? request.getCostBasisPerUnit() : BigDecimal.ZERO;

        CreditGrant grant = new CreditGrant();
        grant.setId(UUID.randomUUID().toString());
        grant.setAccountId(request.getAccountId());
        grant.setGrantTypeId(grantType.getId());
        grant.setSourceReference(request.getSourceReference());
        grant.setOriginalAmount(request.getAmount());
        grant.setRemainingAmount(request.getAmount());
        grant.setCostBasisPerUnit(costBasis);
        grant.setCurrency(request.getCurrency());
        grant.setExpiresAt(LocalDateTime.now().plusDays(expiryDays));
        creditGrantMapper.insert(grant);

        CreditTransaction txn = new CreditTransaction();
        txn.setId(UUID.randomUUID().toString());
        txn.setAccountId(request.getAccountId());
        txn.setGrantId(grant.getId());
        txn.setType(Boolean.TRUE.equals(grantType.getIsRevenueBearing()) ? "purchase" : grantType.getCode());
        txn.setAmount(request.getAmount());
        txn.setRevenueImpact(costBasis.multiply(BigDecimal.valueOf(request.getAmount())));
        txn.setIdempotencyKey("grant-" + grant.getId());
        txn.setDescription("Credit grant: " + grantType.getCode());
        creditTransactionMapper.insert(txn);

        long purchasedDelta = Boolean.TRUE.equals(grantType.getIsRevenueBearing()) ? request.getAmount() : 0;
        long promotionalDelta = "promotional".equals(grantType.getCode()) ? request.getAmount() : 0;
        long bonusDelta = "bonus".equals(grantType.getCode()) ? request.getAmount() : 0;
        if (purchasedDelta > 0) {
            promotionalDelta = 0;
            bonusDelta = 0;
        }

        int updated = creditBalanceMapper.adjustBalance(
                request.getAccountId(), request.getAmount(), purchasedDelta, promotionalDelta, bonusDelta);
        if (updated == 0) {
            throw new IllegalStateException("Balance record not found for account: " + request.getAccountId());
        }

        return grant;
    }

    @Override
    @Transactional
    public CreditTransaction consumeCredits(ConsumeCreditsRequest request) {
        CreditTransaction existing = creditTransactionMapper.selectOne(
                new LambdaQueryWrapper<CreditTransaction>()
                        .eq(CreditTransaction::getIdempotencyKey, request.getIdempotencyKey()));
        if (existing != null) {
            return existing;
        }

        Account account = accountMapper.selectById(request.getAccountId());
        if (account == null) {
            throw new IllegalArgumentException("Account not found: " + request.getAccountId());
        }
        if (account.getRateCardId() == null) {
            throw new IllegalStateException("Account has no rate card assigned");
        }

        RateCardItem rateCardItem = rateCardItemMapper.selectOne(
                new LambdaQueryWrapper<RateCardItem>()
                        .eq(RateCardItem::getRateCardId, account.getRateCardId())
                        .eq(RateCardItem::getActionCode, request.getActionCode()));
        if (rateCardItem == null) {
            throw new IllegalArgumentException("Action not found in rate card: " + request.getActionCode());
        }

        long totalCost = (long) rateCardItem.getBaseCreditCost() * request.getUnits()
                + (long) rateCardItem.getFeeCreditCost() * request.getUnits();

        List<CreditGrant> grants = creditGrantMapper.selectAvailableGrantsForUpdate(request.getAccountId());

        long remaining = totalCost;
        CreditTransaction firstTxn = null;
        int seq = 0;
        long purchasedDelta = 0, promotionalDelta = 0, bonusDelta = 0;

        for (CreditGrant grant : grants) {
            if (remaining <= 0) break;

            long deduct = Math.min(remaining, grant.getRemainingAmount());
            grant.setRemainingAmount(grant.getRemainingAmount() - deduct);
            creditGrantMapper.updateById(grant);

            BigDecimal revenueImpact = grant.getCostBasisPerUnit().multiply(BigDecimal.valueOf(deduct));

            // Create one transaction per grant deduction for full audit trail
            CreditTransaction txn = new CreditTransaction();
            txn.setId(UUID.randomUUID().toString());
            txn.setAccountId(request.getAccountId());
            txn.setGrantId(grant.getId());
            txn.setType("consumption");
            txn.setAmount(-deduct);
            txn.setRevenueImpact(revenueImpact);
            txn.setIdempotencyKey(seq == 0 ? request.getIdempotencyKey()
                    : request.getIdempotencyKey() + ":" + seq);
            txn.setDescription(request.getDescription());
            creditTransactionMapper.insert(txn);

            if (firstTxn == null) firstTxn = txn;
            seq++;

            // Track balance category based on grant type
            GrantType grantType = grantTypeMapper.selectById(grant.getGrantTypeId());
            String gtCode = grantType != null ? grantType.getCode() : "purchased";
            if (Boolean.TRUE.equals(grantType != null ? grantType.getIsRevenueBearing() : true)) {
                purchasedDelta -= deduct;
            } else if ("promotional".equals(gtCode)) {
                promotionalDelta -= deduct;
            } else if ("bonus".equals(gtCode)) {
                bonusDelta -= deduct;
            }

            remaining -= deduct;
        }

        if (remaining > 0) {
            throw new IllegalStateException("Insufficient credits. Need " + totalCost + " but short by " + remaining);
        }

        creditBalanceMapper.adjustBalance(request.getAccountId(), -totalCost,
                purchasedDelta, promotionalDelta, bonusDelta);

        return firstTxn;
    }

    @Override
    @Transactional
    public CreditTransaction refund(RefundRequest request) {
        CreditTransaction existingRefund = creditTransactionMapper.selectOne(
                new LambdaQueryWrapper<CreditTransaction>()
                        .eq(CreditTransaction::getIdempotencyKey, request.getIdempotencyKey()));
        if (existingRefund != null) {
            return existingRefund;
        }

        CreditTransaction originalTxn = creditTransactionMapper.selectById(request.getOriginalTransactionId());
        if (originalTxn == null) {
            throw new IllegalArgumentException("Original transaction not found");
        }
        if (!"consumption".equals(originalTxn.getType())) {
            throw new IllegalArgumentException("Can only refund consumption transactions");
        }

        BigDecimal pct = request.getRefundPct().divide(BigDecimal.valueOf(100));
        long refundAmount = pct.multiply(BigDecimal.valueOf(Math.abs(originalTxn.getAmount()))).longValue();
        BigDecimal revenueImpact = pct.multiply(originalTxn.getRevenueImpact()).negate();

        CreditTransaction refundTxn = new CreditTransaction();
        refundTxn.setId(UUID.randomUUID().toString());
        refundTxn.setAccountId(originalTxn.getAccountId());
        refundTxn.setGrantId(originalTxn.getGrantId());
        refundTxn.setType("refund");
        refundTxn.setAmount(refundAmount);
        refundTxn.setRevenueImpact(revenueImpact);
        refundTxn.setIdempotencyKey(request.getIdempotencyKey());
        refundTxn.setDescription("Refund of transaction " + originalTxn.getId());
        creditTransactionMapper.insert(refundTxn);

        if (originalTxn.getGrantId() != null) {
            CreditGrant grant = creditGrantMapper.selectById(originalTxn.getGrantId());
            if (grant != null) {
                grant.setRemainingAmount(grant.getRemainingAmount() + refundAmount);
                creditGrantMapper.updateById(grant);
            }
        }

        creditBalanceMapper.adjustBalance(originalTxn.getAccountId(), refundAmount, refundAmount, 0, 0);

        RefundRecord record = new RefundRecord();
        record.setId(UUID.randomUUID().toString());
        record.setOriginalTxnId(originalTxn.getId());
        record.setRefundTxnId(refundTxn.getId());
        record.setReason(request.getReason());
        record.setRefundPct(request.getRefundPct());
        record.setIncludeFees(request.isIncludeFees());
        refundRecordMapper.insert(record);

        return refundTxn;
    }

    @Override
    public List<CreditTransaction> getTransactions(String accountId, int page, int size) {
        Page<CreditTransaction> p = new Page<>(page, size);
        Page<CreditTransaction> result = creditTransactionMapper.selectPage(p,
                new LambdaQueryWrapper<CreditTransaction>()
                        .eq(CreditTransaction::getAccountId, accountId)
                        .orderByDesc(CreditTransaction::getCreatedAt));
        return result.getRecords();
    }

    @Override
    public long getTransactionCount(String accountId) {
        return creditTransactionMapper.selectCount(
                new LambdaQueryWrapper<CreditTransaction>()
                        .eq(CreditTransaction::getAccountId, accountId));
    }

    @Override
    public List<CreditGrant> getGrantsByAccount(String accountId) {
        return creditGrantMapper.selectList(
                new LambdaQueryWrapper<CreditGrant>()
                        .eq(CreditGrant::getAccountId, accountId)
                        .orderByAsc(CreditGrant::getCreatedAt));
    }
}
