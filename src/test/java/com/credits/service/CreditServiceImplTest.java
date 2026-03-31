package com.credits.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.credits.mapper.AccountMapper;
import com.credits.mapper.CreditBalanceMapper;
import com.credits.mapper.CreditGrantMapper;
import com.credits.mapper.DashboardMapper;
import com.credits.mapper.GrantTypeMapper;
import com.credits.model.dto.ConsumeCreditsRequest;
import com.credits.model.dto.CreditGrantRequest;
import com.credits.model.dto.RefundRequest;
import com.credits.model.entity.Account;
import com.credits.model.entity.CreditBalance;
import com.credits.model.entity.CreditGrant;
import com.credits.model.entity.CreditTransaction;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

@SpringBootTest
@Transactional
class CreditServiceImplTest {

    private static final String ACCOUNT_ID = "acc-003";

    @Autowired
    private CreditService creditService;

    @Autowired
    private AccountMapper accountMapper;

    @Autowired
    private CreditBalanceMapper creditBalanceMapper;

    @Autowired
    private CreditGrantMapper creditGrantMapper;

    @Autowired
    private DashboardMapper dashboardMapper;

    @Autowired
    private GrantTypeMapper grantTypeMapper;

    @Test
    void consumeCreditsRequiresActiveAccount() {
        Account account = accountMapper.selectById("acc-001");
        account.setStatus("suspended");
        accountMapper.updateById(account);

        long beforeCount = creditService.getTransactionCount("acc-001");

        IllegalStateException error = assertThrows(IllegalStateException.class,
                () -> creditService.consumeCredits(buildConsumeRequest("acc-001", "consume-suspended")));

        assertEquals("Only active accounts can consume credits. Account status: suspended", error.getMessage());
        assertEquals(beforeCount, creditService.getTransactionCount("acc-001"));
    }

    @Test
    void refundRestoresCreditsToTheOriginalBalanceBucket() {
        CreditBalance before = getBalance(ACCOUNT_ID);

        CreditTransaction consumption = creditService.consumeCredits(buildConsumeRequest(ACCOUNT_ID, "consume-promo-refund"));
        CreditBalance afterConsume = getBalance(ACCOUNT_ID);

        assertEquals(before.getPurchasedBalance(), afterConsume.getPurchasedBalance());
        assertEquals(before.getPromotionalBalance() - 100L, afterConsume.getPromotionalBalance());
        assertEquals(before.getTotalBalance() - 100L, afterConsume.getTotalBalance());

        creditService.refund(buildRefundRequest(consumption.getId(), "refund-promo-100", "100.00"));

        CreditBalance afterRefund = getBalance(ACCOUNT_ID);
        assertEquals(before.getPurchasedBalance(), afterRefund.getPurchasedBalance());
        assertEquals(before.getPromotionalBalance(), afterRefund.getPromotionalBalance());
        assertEquals(before.getBonusBalance(), afterRefund.getBonusBalance());
        assertEquals(before.getTotalBalance(), afterRefund.getTotalBalance());
    }

    @Test
    void refundRejectsAmountsThatExceedTheRemainingRefundableBalance() {
        CreditTransaction consumption = creditService.consumeCredits(buildConsumeRequest(ACCOUNT_ID, "consume-over-refund"));

        creditService.refund(buildRefundRequest(consumption.getId(), "refund-60", "60.00"));

        IllegalStateException error = assertThrows(IllegalStateException.class,
                () -> creditService.refund(buildRefundRequest(consumption.getId(), "refund-50", "50.00")));

        assertTrue(error.getMessage().contains("Refund exceeds remaining refundable amount"));
        assertTrue(error.getMessage().contains("only 40 remaining"));
    }

    @Test
    void grantCreditsPopulatesOptimizationFields() {
        CreditGrantRequest request = new CreditGrantRequest();
        request.setAccountId("acc-001");
        request.setGrantTypeCode("promotional");
        request.setAmount(50L);
        request.setCurrency("USD");
        request.setSourceReference("PROMO-OPT-FIELDS");
        request.setExpiryDays(30);

        CreditGrant created = creditService.grantCredits(request);
        CreditGrant persisted = creditGrantMapper.selectById(created.getId());

        assertNotNull(persisted);
        assertEquals(0, persisted.getConsumptionPriority());
        assertEquals("available", persisted.getGrantStatus());
        assertEquals(persisted.getExpiresAt(), persisted.getSortExpiresAt());
    }

    @Test
    void selectNextAvailableGrantsForUpdateReturnsLimitedBatchInPriorityOrder() {
        String accountId = createTestAccount();

        CreditGrant promotionalLater = insertGrant(accountId, "gt-002", 100L, 100L, LocalDateTime.of(2027, 7, 1, 0, 0));
        CreditGrant promotionalSooner = insertGrant(accountId, "gt-002", 100L, 100L, LocalDateTime.of(2027, 5, 1, 0, 0));
        insertGrant(accountId, "gt-003", 100L, 100L, LocalDateTime.of(2027, 4, 1, 0, 0));
        insertGrant(accountId, "gt-001", 100L, 100L, LocalDateTime.of(2027, 3, 1, 0, 0));

        List<CreditGrant> grants = creditGrantMapper.selectNextAvailableGrantsForUpdate(accountId, 2);

        assertEquals(2, grants.size());
        assertEquals(promotionalSooner.getId(), grants.get(0).getId());
        assertEquals(promotionalLater.getId(), grants.get(1).getId());
    }

    @Test
    void consumeCreditsProcessesMultipleBatchesAndDepletesAllTouchedGrants() {
        String accountId = createTestAccount();
        for (int i = 0; i < 9; i++) {
            insertGrant(accountId, "gt-002", 10L, 10L, LocalDateTime.of(2027, 1, 1, 0, 0).plusDays(i));
        }
        seedBalance(accountId, 90L, 0L, 90L, 0L);

        creditService.consumeCredits(buildConsumeRequest(accountId, "consume-batch-9", 90));

        List<CreditGrant> grants = creditGrantMapper.selectList(
                new LambdaQueryWrapper<CreditGrant>()
                        .eq(CreditGrant::getAccountId, accountId)
                        .orderByAsc(CreditGrant::getSortExpiresAt));

        assertEquals(9, grants.size());
        assertTrue(grants.stream().allMatch(g -> g.getRemainingAmount() == 0L));
        assertTrue(grants.stream().allMatch(g -> "depleted".equals(g.getGrantStatus())));

        CreditBalance balance = getBalance(accountId);
        assertEquals(0L, balance.getTotalBalance());
        assertEquals(0L, balance.getPromotionalBalance());
    }

    @Test
    void selectNextAvailableGrantsForUpdateSkipsExpiredRowsEvenIfStatusIsStale() {
        String accountId = createTestAccount();
        insertGrant(accountId, "gt-002", 100L, 100L, LocalDateTime.of(2025, 1, 1, 0, 0),
                "available", LocalDateTime.of(2025, 1, 1, 0, 0), LocalDateTime.of(2024, 12, 1, 0, 0),
                BigDecimal.ZERO);
        CreditGrant futureGrant = insertGrant(accountId, "gt-002", 100L, 100L, LocalDateTime.of(2027, 1, 1, 0, 0),
                "available", LocalDateTime.of(2027, 1, 1, 0, 0), LocalDateTime.of(2024, 12, 2, 0, 0),
                BigDecimal.ZERO);

        List<CreditGrant> grants = creditGrantMapper.selectNextAvailableGrantsForUpdate(accountId, 8);

        assertEquals(1, grants.size());
        assertEquals(futureGrant.getId(), grants.get(0).getId());
    }

    @Test
    void sumDeferredRevenueUsesNewActiveGrantSemantics() {
        BigDecimal before = dashboardMapper.sumDeferredRevenue();
        String accountId = createTestAccount();

        insertGrant(accountId, "gt-001", 100L, 30L, LocalDateTime.of(2027, 6, 1, 0, 0),
                "available", LocalDateTime.of(2027, 6, 1, 0, 0), LocalDateTime.of(2026, 1, 1, 0, 0),
                new BigDecimal("2.500000"));
        insertGrant(accountId, "gt-001", 100L, 40L, LocalDateTime.of(2025, 1, 1, 0, 0),
                "available", LocalDateTime.of(2025, 1, 1, 0, 0), LocalDateTime.of(2026, 1, 2, 0, 0),
                new BigDecimal("2.500000"));

        BigDecimal after = dashboardMapper.sumDeferredRevenue();

        assertEquals(0, before.add(new BigDecimal("75.000000")).compareTo(after));
    }

    @Test
    void grantTypeCountsUseSortExpiryForActiveCount() {
        long[] before = getGrantCounts("gt-003");
        String accountId = createTestAccount();

        insertGrant(accountId, "gt-003", 100L, 100L, LocalDateTime.of(2027, 7, 1, 0, 0),
                "available", LocalDateTime.of(2027, 7, 1, 0, 0), LocalDateTime.of(2026, 2, 1, 0, 0),
                BigDecimal.ZERO);
        insertGrant(accountId, "gt-003", 100L, 100L, LocalDateTime.of(2025, 1, 1, 0, 0),
                "available", LocalDateTime.of(2025, 1, 1, 0, 0), LocalDateTime.of(2026, 2, 2, 0, 0),
                BigDecimal.ZERO);

        long[] after = getGrantCounts("gt-003");

        assertEquals(before[0] + 2, after[0]);
        assertEquals(before[1] + 1, after[1]);
    }

    private ConsumeCreditsRequest buildConsumeRequest(String accountId, String idempotencyKey) {
        return buildConsumeRequest(accountId, idempotencyKey, 100);
    }

    private ConsumeCreditsRequest buildConsumeRequest(String accountId, String idempotencyKey, int units) {
        ConsumeCreditsRequest request = new ConsumeCreditsRequest();
        request.setAccountId(accountId);
        request.setActionCode("api_call");
        request.setUnits(units);
        request.setIdempotencyKey(idempotencyKey);
        request.setDescription("Integration test consumption");
        return request;
    }

    private RefundRequest buildRefundRequest(String originalTransactionId, String idempotencyKey, String refundPct) {
        RefundRequest request = new RefundRequest();
        request.setOriginalTransactionId(originalTransactionId);
        request.setIdempotencyKey(idempotencyKey);
        request.setReason("customer_request");
        request.setRefundPct(new BigDecimal(refundPct));
        request.setIncludeFees(false);
        return request;
    }

    private CreditBalance getBalance(String accountId) {
        return creditBalanceMapper.selectOne(
                new LambdaQueryWrapper<CreditBalance>().eq(CreditBalance::getAccountId, accountId));
    }

    private String createTestAccount() {
        String accountId = UUID.randomUUID().toString();
        Account account = new Account();
        account.setId(accountId);
        account.setName("Test Account");
        account.setBillingEmail("test-" + accountId.substring(0, 8) + "@example.com");
        account.setRateCardId("rc-001");
        account.setStatus("active");
        account.setCreatedAt(LocalDateTime.now());
        accountMapper.insert(account);
        return accountId;
    }

    private void seedBalance(String accountId, long total, long purchased, long promotional, long bonus) {
        CreditBalance balance = new CreditBalance();
        balance.setId(UUID.randomUUID().toString());
        balance.setAccountId(accountId);
        balance.setTotalBalance(total);
        balance.setPurchasedBalance(purchased);
        balance.setPromotionalBalance(promotional);
        balance.setBonusBalance(bonus);
        creditBalanceMapper.insert(balance);
    }

    private CreditGrant insertGrant(String accountId, String grantTypeId, long originalAmount, long remainingAmount, LocalDateTime expiresAt) {
        return insertGrant(accountId, grantTypeId, originalAmount, remainingAmount, expiresAt,
                remainingAmount > 0 ? "available" : "depleted", expiresAt, LocalDateTime.now(),
                "gt-001".equals(grantTypeId) ? BigDecimal.ONE : BigDecimal.ZERO);
    }

    private CreditGrant insertGrant(String accountId,
                                    String grantTypeId,
                                    long originalAmount,
                                    long remainingAmount,
                                    LocalDateTime expiresAt,
                                    String grantStatus,
                                    LocalDateTime sortExpiresAt,
                                    LocalDateTime createdAt,
                                    BigDecimal costBasisPerUnit) {
        CreditGrant grant = new CreditGrant();
        grant.setId(UUID.randomUUID().toString());
        grant.setAccountId(accountId);
        grant.setGrantTypeId(grantTypeId);
        grant.setSourceReference("TEST-" + grant.getId().substring(0, 8));
        grant.setOriginalAmount(originalAmount);
        grant.setRemainingAmount(remainingAmount);
        grant.setCostBasisPerUnit(costBasisPerUnit);
        grant.setCurrency("USD");
        grant.setExpiresAt(expiresAt);
        grant.setCreatedAt(createdAt);
        grant.setConsumptionPriority(resolvePriority(grantTypeId));
        grant.setGrantStatus(grantStatus);
        grant.setSortExpiresAt(sortExpiresAt);
        creditGrantMapper.insert(grant);
        return grant;
    }

    private long[] getGrantCounts(String grantTypeId) {
        return grantTypeMapper.selectGrantCountsByType().stream()
                .filter(row -> grantTypeId.equals(row.get("GRANTTYPEID")))
                .findFirst()
                .map(row -> new long[]{
                        ((Number) row.get("TOTAL")).longValue(),
                        ((Number) row.get("ACTIVE")).longValue()
                })
                .orElse(new long[]{0L, 0L});
    }

    private int resolvePriority(String grantTypeId) {
        return switch (grantTypeId) {
            case "gt-002" -> 0;
            case "gt-003" -> 1;
            default -> 2;
        };
    }
}
