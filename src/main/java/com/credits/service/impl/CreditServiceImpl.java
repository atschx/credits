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

    private static final String ACCOUNT_STATUS_ACTIVE = "active";
    private static final String GRANT_STATUS_AVAILABLE = "available";
    private static final String GRANT_STATUS_DEPLETED = "depleted";
    private static final String GRANT_STATUS_EXPIRED = "expired";
    private static final LocalDateTime NON_EXPIRING_SORT_EXPIRES_AT = LocalDateTime.of(2038, 1, 19, 3, 14, 7);
    private static final int CONSUME_GRANT_BATCH_SIZE = 8;

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

        LocalDateTime expiresAt = LocalDateTime.now().plusDays(expiryDays);
        LocalDateTime sortExpiresAt = normalizeSortExpiresAt(expiresAt);

        CreditGrant grant = new CreditGrant();
        grant.setId(UUID.randomUUID().toString());
        grant.setAccountId(request.getAccountId());
        grant.setGrantTypeId(grantType.getId());
        grant.setSourceReference(request.getSourceReference());
        grant.setOriginalAmount(request.getAmount());
        grant.setRemainingAmount(request.getAmount());
        grant.setCostBasisPerUnit(costBasis);
        grant.setCurrency(request.getCurrency());
        grant.setExpiresAt(expiresAt);
        grant.setConsumptionPriority(resolveConsumptionPriority(grantType));
        grant.setGrantStatus(resolveGrantStatus(request.getAmount(), sortExpiresAt));
        grant.setSortExpiresAt(sortExpiresAt);
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
        if (!ACCOUNT_STATUS_ACTIVE.equals(account.getStatus())) {
            throw new IllegalStateException(
                    "Only active accounts can consume credits. Account status: " + account.getStatus());
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

        long remaining = totalCost;
        CreditTransaction firstTxn = null;
        int seq = 0;
        long purchasedDelta = 0, promotionalDelta = 0, bonusDelta = 0;

        while (remaining > 0) {
            List<CreditGrant> grants = creditGrantMapper.selectNextAvailableGrantsForUpdate(
                    request.getAccountId(), CONSUME_GRANT_BATCH_SIZE);
            if (grants.isEmpty()) {
                break;
            }

            long remainingBeforeBatch = remaining;
            for (CreditGrant grant : grants) {
                if (remaining <= 0) break;

                long deduct = Math.min(remaining, grant.getRemainingAmount());
                grant.setRemainingAmount(grant.getRemainingAmount() - deduct);
                grant.setGrantStatus(resolveGrantStatus(grant.getRemainingAmount(), grant.getSortExpiresAt()));
                creditGrantMapper.updateRemainingAmountAndStatus(
                        grant.getId(), grant.getRemainingAmount(), grant.getGrantStatus());

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
                BalanceAdjustment adjustment = resolveBalanceAdjustment(grantType, deduct);
                purchasedDelta -= adjustment.purchasedDelta();
                promotionalDelta -= adjustment.promotionalDelta();
                bonusDelta -= adjustment.bonusDelta();

                remaining -= deduct;
            }

            if (remaining == remainingBeforeBatch) {
                break;
            }
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

        long originalAmount = Math.abs(originalTxn.getAmount());
        BigDecimal pct = request.getRefundPct().divide(BigDecimal.valueOf(100));
        long refundAmount = pct.multiply(BigDecimal.valueOf(originalAmount)).longValue();
        if (refundAmount <= 0) {
            throw new IllegalArgumentException("Refund percentage is too small for the original transaction amount");
        }

        long alreadyRefundedAmount = refundRecordMapper.sumRefundedAmountByOriginalTxnId(originalTxn.getId());
        long remainingRefundableAmount = originalAmount - alreadyRefundedAmount;
        if (refundAmount > remainingRefundableAmount) {
            throw new IllegalStateException(
                    "Refund exceeds remaining refundable amount. Requested " + refundAmount
                            + " but only " + remainingRefundableAmount + " remaining");
        }

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

        CreditGrant grant = null;
        if (originalTxn.getGrantId() != null) {
            grant = creditGrantMapper.selectById(originalTxn.getGrantId());
            if (grant != null) {
                grant.setRemainingAmount(grant.getRemainingAmount() + refundAmount);
                grant.setGrantStatus(resolveGrantStatus(grant.getRemainingAmount(), grant.getSortExpiresAt()));
                creditGrantMapper.updateRemainingAmountAndStatus(
                        grant.getId(), grant.getRemainingAmount(), grant.getGrantStatus());
            }
        }

        BalanceAdjustment refundAdjustment = resolveBalanceAdjustment(grant, refundAmount);
        creditBalanceMapper.adjustBalance(originalTxn.getAccountId(), refundAmount,
                refundAdjustment.purchasedDelta(), refundAdjustment.promotionalDelta(), refundAdjustment.bonusDelta());

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
        return creditGrantMapper.selectByAccountOrderByCreated(accountId);
    }

    @Override
    public List<TransactionLineItem> getLineItems(String transactionId) {
        return lineItemMapper.selectList(
                new LambdaQueryWrapper<TransactionLineItem>()
                        .eq(TransactionLineItem::getTransactionId, transactionId));
    }

    private BalanceAdjustment resolveBalanceAdjustment(CreditGrant grant, long amount) {
        if (grant == null) {
            return new BalanceAdjustment(amount, 0, 0);
        }
        GrantType grantType = grantTypeMapper.selectById(grant.getGrantTypeId());
        return resolveBalanceAdjustment(grantType, amount);
    }

    private BalanceAdjustment resolveBalanceAdjustment(GrantType grantType, long amount) {
        if (grantType == null || Boolean.TRUE.equals(grantType.getIsRevenueBearing())) {
            return new BalanceAdjustment(amount, 0, 0);
        }
        return switch (grantType.getCode()) {
            case "promotional" -> new BalanceAdjustment(0, amount, 0);
            case "bonus" -> new BalanceAdjustment(0, 0, amount);
            default -> new BalanceAdjustment(amount, 0, 0);
        };
    }

    private int resolveConsumptionPriority(GrantType grantType) {
        if (grantType == null || Boolean.TRUE.equals(grantType.getIsRevenueBearing())) {
            return 2;
        }
        return switch (grantType.getCode()) {
            case "promotional" -> 0;
            case "bonus" -> 1;
            default -> 2;
        };
    }

    private String resolveGrantStatus(long remainingAmount, LocalDateTime sortExpiresAt) {
        if (remainingAmount <= 0) {
            return GRANT_STATUS_DEPLETED;
        }
        if (sortExpiresAt != null && !sortExpiresAt.isAfter(LocalDateTime.now())) {
            return GRANT_STATUS_EXPIRED;
        }
        return GRANT_STATUS_AVAILABLE;
    }

    private LocalDateTime normalizeSortExpiresAt(LocalDateTime expiresAt) {
        return expiresAt != null ? expiresAt : NON_EXPIRING_SORT_EXPIRES_AT;
    }

    private record BalanceAdjustment(long purchasedDelta, long promotionalDelta, long bonusDelta) {
    }
}
