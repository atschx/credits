package com.credits.model.dto;

import io.swagger.v3.oas.annotations.media.Schema;

import java.util.List;

@Schema(description = "Paginated response")
public class PageResponse<T> {

    private List<T> records;
    private long total;
    private long page;
    private long size;

    public List<T> getRecords() { return records; }
    public void setRecords(List<T> records) { this.records = records; }
    public long getTotal() { return total; }
    public void setTotal(long total) { this.total = total; }
    public long getPage() { return page; }
    public void setPage(long page) { this.page = page; }
    public long getSize() { return size; }
    public void setSize(long size) { this.size = size; }

    public static <T> PageResponse<T> of(List<T> records, long total, long page, long size) {
        PageResponse<T> r = new PageResponse<>();
        r.records = records;
        r.total = total;
        r.page = page;
        r.size = size;
        return r;
    }
}
