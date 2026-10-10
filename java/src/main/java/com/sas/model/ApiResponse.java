package com.sas.model;

/**
 * Generic API response envelope used by servlets when emitting JSON.
 *
 * Demonstrates Java Generics: the {@code data} payload can be any type
 * (single object, list, map, ...) while the success / error metadata
 * is shared across every endpoint.
 *
 * @param <T> the type of the payload carried on success
 */
public class ApiResponse<T> {

    private boolean success;
    private T data;
    private String error;

    public ApiResponse() {
    }

    public ApiResponse(boolean success, T data, String error) {
        this.success = success;
        this.data = data;
        this.error = error;
    }

    public static <T> ApiResponse<T> ok(T data) {
        return new ApiResponse<>(true, data, null);
    }

    public static <T> ApiResponse<T> fail(String error) {
        return new ApiResponse<>(false, null, error);
    }

    public boolean isSuccess() {
        return success;
    }

    public void setSuccess(boolean success) {
        this.success = success;
    }

    public T getData() {
        return data;
    }

    public void setData(T data) {
        this.data = data;
    }

    public String getError() {
        return error;
    }

    public void setError(String error) {
        this.error = error;
    }
}
