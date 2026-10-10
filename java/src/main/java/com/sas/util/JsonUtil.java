package com.sas.util;

import com.google.gson.Gson;
import com.google.gson.GsonBuilder;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;

/**
 * Thin Gson wrapper so JSON (de)serialisation is consistent across servlets.
 */
public final class JsonUtil {

    private static final Gson GSON = new GsonBuilder()
            .registerTypeAdapter(LocalDate.class,
                    (com.google.gson.JsonSerializer<LocalDate>) (src, type, ctx) ->
                            src == null ? null : new com.google.gson.JsonPrimitive(
                                    src.format(DateTimeFormatter.ISO_LOCAL_DATE)))
            .registerTypeAdapter(LocalDateTime.class,
                    (com.google.gson.JsonSerializer<LocalDateTime>) (src, type, ctx) ->
                            src == null ? null : new com.google.gson.JsonPrimitive(
                                    src.format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss"))))
            .serializeNulls()
            .disableHtmlEscaping()
            .create();

    private JsonUtil() {
    }

    public static String toJson(Object obj) {
        return GSON.toJson(obj);
    }

    public static <T> T fromJson(String json, Class<T> type) {
        return GSON.fromJson(json, type);
    }

    public static Gson gson() {
        return GSON;
    }
}
