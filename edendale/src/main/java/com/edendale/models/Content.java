package com.edendale.models;

/**
 * Content
 * Represents a single editable content field on a page.
 *
 * Maps to the `content` table in the database.
 *
 * Example row:
 *   page="home", field_name="hero_title", value="Edendale Primary School", type="text"
 */
public class Content {

    private int    id;
    private String page;        // e.g. "home", "grades", "events", "contact", "extracurriculars"
    private String fieldName;   // matches data-field attribute in HTML
    private String value;       // the actual content (text or image URL)
    private String type;        // "text" or "image"

    // ── Constructors ──────────────────────────────────────────────────────────

    public Content() {}

    public Content(int id, String page, String fieldName, String value, String type) {
        this.id        = id;
        this.page      = page;
        this.fieldName = fieldName;
        this.value     = value;
        this.type      = type;
    }

    // ── Getters & Setters ─────────────────────────────────────────────────────

    public int getId()                        { return id; }
    public void setId(int id)                 { this.id = id; }

    public String getPage()                   { return page; }
    public void setPage(String page)          { this.page = page; }

    public String getFieldName()              { return fieldName; }
    public void setFieldName(String name)     { this.fieldName = name; }

    public String getValue()                  { return value; }
    public void setValue(String value)        { this.value = value; }

    public String getType()                   { return type; }
    public void setType(String type)          { this.type = type; }

    @Override
    public String toString() {
        return "Content{page='" + page + "', field='" + fieldName + "', type='" + type + "'}";
    }
}
