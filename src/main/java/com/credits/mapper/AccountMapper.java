package com.credits.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.baomidou.mybatisplus.core.metadata.IPage;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.credits.model.dto.AccountSearchRequest;
import com.credits.model.entity.Account;
import org.apache.ibatis.annotations.Param;

public interface AccountMapper extends BaseMapper<Account> {

    IPage<Account> searchAccounts(Page<Account> page, @Param("q") AccountSearchRequest params);
}
