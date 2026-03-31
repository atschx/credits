package com.credits.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.credits.model.entity.CreditGrant;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;
import org.apache.ibatis.annotations.Update;

import java.util.List;

public interface CreditGrantMapper extends BaseMapper<CreditGrant> {

    /**
     * Pick a small ordered batch of currently available grants for a single account.
     * This keeps the locking set bounded instead of locking every active grant row.
     */
    @Select("""
            SELECT cg.id, cg.grant_type_id, cg.remaining_amount, cg.cost_basis_per_unit,
                   cg.consumption_priority, cg.grant_status, cg.sort_expires_at
            FROM credit_grants cg
            WHERE cg.account_id = #{accountId}
              AND cg.grant_status = 'available'
              AND cg.sort_expires_at > NOW()
            ORDER BY cg.consumption_priority ASC, cg.sort_expires_at ASC, cg.id ASC
            LIMIT #{limit}
            FOR UPDATE
            """)
    List<CreditGrant> selectNextAvailableGrantsForUpdate(@Param("accountId") String accountId,
                                                         @Param("limit") int limit);

    @Update("""
            UPDATE credit_grants
            SET remaining_amount = #{remainingAmount},
                grant_status = #{grantStatus}
            WHERE id = #{id}
            """)
    int updateRemainingAmountAndStatus(@Param("id") String id,
                                       @Param("remainingAmount") long remainingAmount,
                                       @Param("grantStatus") String grantStatus);

    @Select("""
            SELECT cg.id, cg.account_id, cg.grant_type_id, cg.source_reference, cg.original_amount,
                   cg.remaining_amount, cg.cost_basis_per_unit, cg.currency, cg.expires_at, cg.created_at,
                   cg.consumption_priority, cg.grant_status, cg.sort_expires_at, cg.metadata
            FROM credit_grants cg
            WHERE cg.account_id = #{accountId}
            ORDER BY cg.created_at ASC, cg.id ASC
            """)
    List<CreditGrant> selectByAccountOrderByCreated(@Param("accountId") String accountId);
}
