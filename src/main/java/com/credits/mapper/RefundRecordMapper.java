package com.credits.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.credits.model.entity.RefundRecord;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;

public interface RefundRecordMapper extends BaseMapper<RefundRecord> {

    @Select("""
            SELECT COALESCE(SUM(ct.amount), 0)
            FROM refund_records rr
            JOIN credit_transactions ct ON ct.id = rr.refund_txn_id
            WHERE rr.original_txn_id = #{originalTxnId}
            """)
    long sumRefundedAmountByOriginalTxnId(@Param("originalTxnId") String originalTxnId);
}
