package com.credits.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.credits.model.entity.CreditBalance;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Update;

public interface CreditBalanceMapper extends BaseMapper<CreditBalance> {

    /**
     * Atomically adjust balance fields. Uses column arithmetic to avoid read-modify-write race.
     */
    @Update("""
            UPDATE credit_balances
            SET total_balance = total_balance + #{delta},
                purchased_balance = purchased_balance + #{purchasedDelta},
                promotional_balance = promotional_balance + #{promotionalDelta},
                bonus_balance = bonus_balance + #{bonusDelta}
            WHERE account_id = #{accountId}
            """)
    int adjustBalance(@Param("accountId") String accountId,
                      @Param("delta") long delta,
                      @Param("purchasedDelta") long purchasedDelta,
                      @Param("promotionalDelta") long promotionalDelta,
                      @Param("bonusDelta") long bonusDelta);
}
