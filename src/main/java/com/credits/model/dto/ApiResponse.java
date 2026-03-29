package com.credits.model.dto;

import io.swagger.v3.oas.annotations.media.Schema;

@Schema(description = "Unified API response wrapper")
public class ApiResponse<T> {

    @Schema(description = "Whether the request succeeded")
    private boolean success;

    @Schema(description = "Error message when success=false")
    private String message;

    @Schema(description = "Response payload")
    private T data;

    public boolean isSuccess() { return success; }
    public void setSuccess(boolean success) { this.success = success; }
    public String getMessage() { return message; }
    public void setMessage(String message) { this.message = message; }
    public T getData() { return data; }
    public void setData(T data) { this.data = data; }

    public static <T> ApiResponse<T> ok(T data) {
        ApiResponse<T> r = new ApiResponse<>();
        r.success = true;
        r.data = data;
        return r;
    }

    public static <T> ApiResponse<T> error(String message) {
        ApiResponse<T> r = new ApiResponse<>();
        r.success = false;
        r.message = message;
        return r;
    }
}
