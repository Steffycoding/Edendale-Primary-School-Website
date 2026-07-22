package com.edendale.models;

/**
 * Event
 * Represents a school calendar event.
 *
 * Maps to the `events` table in the database.
 */
public class Event {

    private int    id;
    private String title;
    private String date;        // Stored as String "YYYY-MM-DD" for easy JSON/JS use
    private String time;        // e.g. "08:00"
    private String description;

    // ── Constructors ──────────────────────────────────────────────────────────

    public Event() {}

    public Event(int id, String title, String date, String time, String description) {
        this.id          = id;
        this.title       = title;
        this.date        = date;
        this.time        = time;
        this.description = description;
    }

    // ── Getters & Setters ─────────────────────────────────────────────────────

    public int getId()                   { return id; }
    public void setId(int id)            { this.id = id; }

    public String getTitle()             { return title; }
    public void setTitle(String title)   { this.title = title; }

    public String getDate()              { return date; }
    public void setDate(String date)     { this.date = date; }

    public String getTime()              { return time; }
    public void setTime(String time)     { this.time = time; }

    public String getDescription()                    { return description; }
    public void setDescription(String description)    { this.description = description; }

    @Override
    public String toString() {
        return "Event{id=" + id + ", title='" + title + "', date='" + date + "'}";
    }
}
