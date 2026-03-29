package com.credits.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.credits.mapper.RateCardItemMapper;
import com.credits.mapper.RateCardMapper;
import com.credits.model.dto.RateCardCreateRequest;
import com.credits.model.dto.RateCardItemRequest;
import com.credits.model.dto.RateCardUpdateRequest;
import com.credits.model.entity.RateCard;
import com.credits.model.entity.RateCardItem;
import com.credits.service.RateCardService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
public class RateCardServiceImpl implements RateCardService {

    private final RateCardMapper rateCardMapper;
    private final RateCardItemMapper rateCardItemMapper;

    public RateCardServiceImpl(RateCardMapper rateCardMapper, RateCardItemMapper rateCardItemMapper) {
        this.rateCardMapper = rateCardMapper;
        this.rateCardItemMapper = rateCardItemMapper;
    }

    @Override
    @Transactional
    public RateCard createRateCard(RateCardCreateRequest request) {
        RateCard card = new RateCard();
        card.setId(UUID.randomUUID().toString());
        card.setName(request.getName());
        card.setCurrency(request.getCurrency());
        card.setStatus("draft");
        card.setEffectiveFrom(request.getEffectiveFrom());
        card.setEffectiveTo(request.getEffectiveTo());
        rateCardMapper.insert(card);

        if (request.getItems() != null) {
            for (RateCardCreateRequest.Item item : request.getItems()) {
                RateCardItem rci = new RateCardItem();
                rci.setId(UUID.randomUUID().toString());
                rci.setRateCardId(card.getId());
                rci.setActionCode(item.getActionCode());
                rci.setActionName(item.getActionName());
                rci.setUnitOfMeasure(item.getUnitOfMeasure());
                rci.setBaseCreditCost(item.getBaseCreditCost());
                rci.setFeeCreditCost(item.getFeeCreditCost());
                rci.setFeeCategoryId(item.getFeeCategoryId());
                rateCardItemMapper.insert(rci);
            }
        }
        return card;
    }

    @Override
    public RateCard getRateCard(String id) {
        RateCard card = rateCardMapper.selectById(id);
        if (card == null) {
            throw new IllegalArgumentException("Rate card not found: " + id);
        }
        return card;
    }

    @Override
    public List<RateCard> listRateCards(String status) {
        LambdaQueryWrapper<RateCard> wrapper = new LambdaQueryWrapper<>();
        if (status != null && !status.isBlank()) {
            wrapper.eq(RateCard::getStatus, status);
        }
        wrapper.orderByDesc(RateCard::getEffectiveFrom);
        return rateCardMapper.selectList(wrapper);
    }

    @Override
    public List<RateCardItem> getRateCardItems(String rateCardId) {
        return rateCardItemMapper.selectList(
                new LambdaQueryWrapper<RateCardItem>().eq(RateCardItem::getRateCardId, rateCardId));
    }

    @Override
    public RateCard updateRateCard(String id, RateCardUpdateRequest request) {
        RateCard card = getRateCard(id);
        if (request.getName() != null) card.setName(request.getName());
        if (request.getCurrency() != null) card.setCurrency(request.getCurrency());
        if (request.getEffectiveFrom() != null) card.setEffectiveFrom(request.getEffectiveFrom());
        if (request.getEffectiveTo() != null) card.setEffectiveTo(request.getEffectiveTo());
        rateCardMapper.updateById(card);
        return card;
    }

    private static final Map<String, String> VALID_TRANSITIONS = Map.of(
            "draft", "active",
            "active", "archived"
    );

    @Override
    public RateCard changeStatus(String id, String newStatus) {
        RateCard card = getRateCard(id);
        String allowed = VALID_TRANSITIONS.get(card.getStatus());
        if (!newStatus.equals(allowed)) {
            throw new IllegalStateException(
                    "Cannot transition from '" + card.getStatus() + "' to '" + newStatus + "'");
        }
        card.setStatus(newStatus);
        rateCardMapper.updateById(card);
        return card;
    }

    @Override
    @Transactional
    public RateCardItem addItem(String rateCardId, RateCardItemRequest request) {
        getRateCard(rateCardId);
        RateCardItem item = new RateCardItem();
        item.setId(UUID.randomUUID().toString());
        item.setRateCardId(rateCardId);
        item.setActionCode(request.getActionCode());
        item.setActionName(request.getActionName());
        item.setUnitOfMeasure(request.getUnitOfMeasure());
        item.setBaseCreditCost(request.getBaseCreditCost());
        item.setFeeCreditCost(request.getFeeCreditCost());
        item.setFeeCategoryId(request.getFeeCategoryId());
        rateCardItemMapper.insert(item);
        return item;
    }

    @Override
    public RateCardItem updateItem(String rateCardId, String itemId, RateCardItemRequest request) {
        RateCardItem item = rateCardItemMapper.selectById(itemId);
        if (item == null || !item.getRateCardId().equals(rateCardId)) {
            throw new IllegalArgumentException("Rate card item not found: " + itemId);
        }
        item.setActionName(request.getActionName());
        item.setUnitOfMeasure(request.getUnitOfMeasure());
        item.setBaseCreditCost(request.getBaseCreditCost());
        item.setFeeCreditCost(request.getFeeCreditCost());
        item.setFeeCategoryId(request.getFeeCategoryId());
        rateCardItemMapper.updateById(item);
        return item;
    }

    @Override
    public void deleteItem(String rateCardId, String itemId) {
        RateCardItem item = rateCardItemMapper.selectById(itemId);
        if (item == null || !item.getRateCardId().equals(rateCardId)) {
            throw new IllegalArgumentException("Rate card item not found: " + itemId);
        }
        rateCardItemMapper.deleteById(itemId);
    }
}
