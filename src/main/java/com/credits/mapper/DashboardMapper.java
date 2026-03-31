package com.credits.mapper;

import com.credits.model.dto.DashboardStats;
import org.apache.ibatis.annotations.Select;

import java.math.BigDecimal;
import java.util.List;

public interface DashboardMapper {

    @Select("SELECT COUNT(*) FROM accounts")
    long countTotalAccounts();

    @Select("SELECT COUNT(*) FROM credit_balances WHERE total_balance > 0")
    long countActiveAccounts();

    @Select("SELECT COALESCE(SUM(amount), 0) FROM credit_transactions WHERE amount > 0")
    BigDecimal sumTotalGranted();

    @Select("SELECT COALESCE(SUM(ABS(amount)), 0) FROM credit_transactions WHERE amount < 0")
    BigDecimal sumTotalConsumed();

    @Select("SELECT COALESCE(SUM(revenue_impact), 0) FROM credit_transactions WHERE type = 'consumption'")
    BigDecimal sumRecognizedRevenue();

    @Select("""
            SELECT COALESCE(SUM(remaining_amount * cost_basis_per_unit), 0)
            FROM credit_grants
            WHERE grant_status = 'available'
              AND sort_expires_at > NOW()
            """)
    BigDecimal sumDeferredRevenue();

    @Select("""
            SELECT FORMATDATETIME(created_at, 'yyyy-MM') AS "month",
                   SUM(revenue_impact) AS recognizedRevenue
            FROM credit_transactions
            WHERE type = 'consumption'
            GROUP BY FORMATDATETIME(created_at, 'yyyy-MM')
            ORDER BY "month"
            """)
    List<DashboardStats.MonthlyRevenue> selectMonthlyRevenue();

    @Select("""
            SELECT t.account_id AS accountId,
                   a.name AS accountName,
                   SUM(t.revenue_impact) AS recognizedRevenue,
                   SUM(ABS(t.amount)) AS totalConsumed
            FROM credit_transactions t
            JOIN accounts a ON a.id = t.account_id
            WHERE t.type = 'consumption'
            GROUP BY t.account_id, a.name
            ORDER BY SUM(t.revenue_impact) DESC
            """)
    List<DashboardStats.AccountRevenue> selectAccountRevenue();
}
