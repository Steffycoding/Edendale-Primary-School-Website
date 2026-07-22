package com.edendale.util;

import com.google.gson.Gson;
import com.google.gson.GsonBuilder;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.io.PrintWriter;

/**
 * JsonUtil
 * Centralises Gson instance creation and HTTP JSON response writing.
 */
public class JsonUtil {

    private static final Gson GSON = new GsonBuilder()
            .setPrettyPrinting()
            .setDateFormat("yyyy-MM-dd")
            .create();

    /**
     * Write a JSON response to the servlet response.
     *
     * @param response   HttpServletResponse
     * @param statusCode HTTP status code (e.g. 200, 400, 500)
     * @param object     Object to serialise as JSON
     */
    public static void writeJson(HttpServletResponse response, int statusCode, Object object)
            throws IOException {
        response.setStatus(statusCode);
        response.setContentType("application/json");
        response.setCharacterEncoding("UTF-8");
        // Allow cross-origin requests during development
        response.setHeader("Access-Control-Allow-Origin", "*");
        response.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE, OPTIONS");
        response.setHeader("Access-Control-Allow-Headers", "Content-Type");

        try (PrintWriter out = response.getWriter()) {
            out.print(GSON.toJson(object));
            out.flush();
        }
    }

    public static Gson getGson() {
        return GSON;
    }

    private JsonUtil() {}
}
