package com.credits.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.credits.model.entity.GrantType;
import org.apache.ibatis.annotations.Select;

import java.util.List;
import java.util.Map;

public interface GrantTypeMapper extends BaseMapper<GrantType> {

    @Select("""
            SELECT grant_type_id AS grantTypeId,
                   COUNT(*) AS total,
                   SUM(CASE WHEN remaining_amount > 0 AND (expires_at IS NULL OR expires_at > NOW()) THEN 1 ELSE 0 END) AS active
            FROM credit_grants
            GROUP BY grant_type_id
            """)
    List<Map<String, Object>> selectGrantCountsByType();
}
