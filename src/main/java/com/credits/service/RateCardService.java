package com.credits.service;

import com.credits.model.dto.RateCardCreateRequest;
import com.credits.model.dto.RateCardItemRequest;
import com.credits.model.dto.RateCardUpdateRequest;
import com.credits.model.entity.RateCard;
import com.credits.model.entity.RateCardItem;

import java.util.List;

public interface RateCardService {

    RateCard createRateCard(RateCardCreateRequest request);

    RateCard getRateCard(String id);

    List<RateCard> listRateCards(String status);

    List<RateCardItem> getRateCardItems(String rateCardId);

    RateCard updateRateCard(String id, RateCardUpdateRequest request);

    RateCard changeStatus(String id, String newStatus);

    RateCardItem addItem(String rateCardId, RateCardItemRequest request);

    RateCardItem updateItem(String rateCardId, String itemId, RateCardItemRequest request);

    void deleteItem(String rateCardId, String itemId);
}
