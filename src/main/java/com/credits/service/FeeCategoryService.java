package com.credits.service;

import com.credits.model.dto.FeeCategoryRequest;
import com.credits.model.entity.FeeCategory;

import java.util.List;

public interface FeeCategoryService {

    List<FeeCategory> list();

    FeeCategory getById(String id);

    FeeCategory create(FeeCategoryRequest request);

    FeeCategory update(String id, FeeCategoryRequest request);

    void delete(String id);
}
