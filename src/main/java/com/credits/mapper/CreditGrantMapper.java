package com.credits.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.credits.model.entity.CreditGrant;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;

import java.util.List;

public interface CreditGrantMapper extends BaseMapper<CreditGrant> {

    /**
     * FIFO query: find grants with remaining balance, not expired.
     * Consumption order: promotional → bonus → purchased (non-revenue first),
     * within same priority by expires_at ASC (soonest expiry first).
     * Uses SELECT ... FOR UPDATE for pessimistic locking during consumption.
     */
    @Select("""
            SELECT cg.id, cg.account_id, cg.grant_type_id, cg.remaining_amount, cg.cost_basis_per_unit
            FROM credit_grants cg
            JOIN grant_types gt ON gt.id = cg.grant_type_id
            WHERE cg.account_id = #{accountId}
              AND cg.remaining_amount > 0
              AND (cg.expires_at IS NULL OR cg.expires_at > NOW())
            ORDER BY
              gt.is_revenue_bearing ASC,
              CASE gt.code WHEN 'promotional' THEN 0 WHEN 'bonus' THEN 1 ELSE 2 END,
              cg.expires_at ASC
            FOR UPDATE
            """)
    List<CreditGrant> selectAvailableGrantsForUpdate(@Param("accountId") String accountId);
}
