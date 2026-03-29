package com.credits.service;

import com.credits.model.dto.GrantTypeRequest;
import com.credits.model.entity.GrantType;

import java.util.List;

public interface GrantTypeService {

    List<GrantType> list();

    GrantType getById(String id);

    GrantType create(GrantTypeRequest request);

    GrantType update(String id, GrantTypeRequest request);

    void delete(String id);
}
