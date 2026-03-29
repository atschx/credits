package com.credits.service.impl;

import com.credits.mapper.DashboardMapper;
import com.credits.model.dto.DashboardStats;
import com.credits.service.DashboardService;
import org.springframework.stereotype.Service;

@Service
public class DashboardServiceImpl implements DashboardService {

    private final DashboardMapper dashboardMapper;

    public DashboardServiceImpl(DashboardMapper dashboardMapper) {
        this.dashboardMapper = dashboardMapper;
    }

    @Override
    public DashboardStats getStats() {
        DashboardStats stats = new DashboardStats();
        stats.setTotalAccounts(dashboardMapper.countTotalAccounts());
        stats.setActiveAccounts(dashboardMapper.countActiveAccounts());
        stats.setTotalGranted(dashboardMapper.sumTotalGranted());
        stats.setTotalConsumed(dashboardMapper.sumTotalConsumed());
        stats.setRecognizedRevenue(dashboardMapper.sumRecognizedRevenue());
        stats.setDeferredRevenue(dashboardMapper.sumDeferredRevenue());
        stats.setMonthlyRevenue(dashboardMapper.selectMonthlyRevenue());
        stats.setAccountRevenue(dashboardMapper.selectAccountRevenue());
        return stats;
    }
}
