# Edendale Primary School Website

A full-stack school website built with **HTML, CSS, JavaScript** (frontend) and **Java Servlets + MySQL** (backend).

## Quick Overview

Edendale Primary School website is a comprehensive digital platform that provides information about the school, facilitates admissions inquiries, showcases events, and allows admin staff to manage content without technical expertise.

---

## Table of Contents
1. [Project Architecture](#project-architecture)
2. [Project Structure](#project-structure)
3. [Pages Overview](#pages-overview)
4. [Admin Panel](#admin-panel)
5. [Tech Stack](#tech-stack)
6. [How to Run on Windows](#how-to-run-on-windows)
7. [How to Run on Linux](#how-to-run-on-linux)
8. [Database Setup](#database-setup)
9. [Developer Notes](#developer-notes)

---

## Project Architecture

```
Browser (HTML/CSS/JS)
       │
       │  HTTP (GET pages / AJAX calls to /api/*)
       ▼
Apache Tomcat (Java Servlet Container)
       │
       ├── Serves static files (HTML, CSS, JS, images)
       │
       └── Routes /api/* to Java Servlets
               │
               ├── AdminLoginServlet  → /api/admin/login
               ├── ContentServlet     → /api/content
               └── EventServlet       → /api/events, /api/events/{id}
                       │
                       ▼
               MySQL Database (edendale_db)
               ├── admin_users  (login credentials)
               ├── content      (all editable page fields)
               └── events       (calendar events)
```

### How it fits together

| Layer | Technology | Role |
|---|---|---|
| Frontend | HTML5 + CSS3 + Vanilla JS | Pages, styling, admin edit UI |
| Backend | Java 17 + Jakarta Servlets | REST-style API endpoints |
| Database | MySQL 8.x | Persistent storage |
| Server | Apache Tomcat 10.x | Serves app + handles requests |
| Build | Maven | Compiles Java, packages WAR file |

---

## Project Structure

This project follows **Maven's standard directory layout** for optimal development, testing, and deployment.

```
edendale/
│
├── pom.xml                             ← Maven configuration
├── README.md                           ← This file
│
├── sql/
│   └── schema.sql                      ← Database creation + seed data (run once)
│
└── src/
    └── main/
        ├── java/com/edendale/
        │   ├── controllers/
        │   │   ├── AdminLoginServlet.java   ← POST /api/admin/login
        │   │   ├── ContentServlet.java      ← GET/PATCH /api/content
        │   │   └── EventServlet.java        ← CRUD /api/events
        │   ├── dao/
        │   │   ├── AdminUserDAO.java        ← DB access for admin users
        │   │   ├── ContentDAO.java          ← DB access for content fields
        │   │   └── EventDAO.java            ← DB access for events
        │   ├── models/
        │   │   ├── AdminUser.java           ← Admin user model
        │   │   ├── Content.java             ← Content field model
        │   │   └── Event.java               ← Calendar event model
        │   └── util/
        │       ├── DatabaseUtil.java        ← JDBC connection helper
        │       └── JsonUtil.java            ← Gson JSON response writer
        │
        └── webapp/
            ├── index.html                   ← Home/About page
            │
            ├── pages/
            │   ├── about.html               ← About school (mission, vision, values)
            │   ├── grades.html              ← Admissions & Subjects (all grades R–7)
            │   ├── grade-detail.html        ← Individual grade detail (Grade R, etc.)
            │   ├── extracurriculars.html    ← Extras & Co-Curriculars
            │   ├── events.html              ← Events Calendar (interactive)
            │   ├── contact.html             ← Contact & Donors
            │   └── _nav.html                ← Nav partial reference snippet
            │
            ├── css/
            │   ├── global.css               ← Global styles (navy/gold theme)
            │   ├── admin.css                ← Admin panel styles (edit mode, modals)
            │   └── style.css                ← Additional page styles
            │
            ├── js/
            │   ├── main.js                  ← General site JS (nav, content loader)
            │   ├── admin.js                 ← Admin toggle, login, inline editing, save
            │   └── calendar.js              ← Calendar grid render + event CRUD
            │
            ├── assets/
            │   ├── images/
            │   │   └── logo.svg             ← School logo
            │   └── icons/                   ← Additional icon assets
            │
            └── WEB-INF/
                └── web.xml                  ← Tomcat servlet configuration
```

### Benefits of This Standard Structure
✅ **Maven Recognition**: IDEs (IntelliJ, Eclipse, VS Code) automatically recognize the layout  
✅ **Unified Build**: Single `mvn clean package` builds everything into one WAR  
✅ **Easy Deployment**: WAR file works with any servlet container  
✅ **Scalability**: Ready for frameworks like Spring MVC, Spring Boot  
✅ **Testing**: Clear separation of source and test code  
✅ **CI/CD**: Pipeline-friendly structure  

---

## Pages Overview

| Page | File | Description |
|---|---|---|
| Home / About | `index.html` | Hero section, about school, stats, mission/vision, values, community context |
| Admissions & Subjects | `pages/grades.html` | Grid of all 8 grades (R–7) with subject info, ages, and phases |
| Grade Detail | `pages/grade-detail.html` | Detailed view for individual grades (loaded via `?grade=R`) |
| Extras & Co-Curriculars | `pages/extracurriculars.html` | Sports, cultural, and enrichment activities |
| Events Calendar | `pages/events.html` | Interactive monthly calendar with school events |
| Contact | `pages/contact.html` | Contact information and communication channels |

### Navigation Links
All pages include consistent navigation with the following routes:
- **About** → `index.html` or `pages/about.html`
- **Admissions & Subjects** → `pages/grades.html`
- **Grade R** → `pages/grade-detail.html?grade=R`
- **Extra & Co-Curriculars** → `pages/extracurriculars.html`
- **Events Calendar** → `pages/events.html`
- **Contact** → `pages/contact.html`

---

## Admin Panel

The admin panel allows authorised staff to **edit all content on all pages** without touching code.

### How it works
1. A **nearly invisible gear icon** sits in the top-right corner of every page (15% opacity).
2. Clicking it opens the **Admin Login modal**.
3. After successful login, the page enters **edit mode**:
   - All editable elements are highlighted with a gold dashed border.
   - Clicking any element opens an **inline edit popup**.
   - Text fields show a textarea; image fields show a URL input.
4. A **bottom admin bar** appears with "Save All Changes" and "Logout" buttons.
5. Clicking **Save All Changes** sends all edits to the Java backend in one request.

### Default Login
```
Username: admin
Password: Admin@1234
```
> ⚠ Change this immediately after first deployment by updating the BCrypt hash in `schema.sql`.

### What can be edited
Everything marked with `data-editable` in the HTML:
- All text, headings, descriptions, quotes
- All button labels
- Image URLs (for news cards, gallery images, etc.)
- Contact details (phone, email, address)
- Event titles, dates, times, descriptions

---

## Tech Stack

| Component | Version |
|---|---|
| Java | 17 (LTS) |
| Jakarta Servlet API | 6.0 |
| Apache Tomcat | 10.x |
| Maven | 3.8+ |
| MySQL | 8.x |
| Gson (JSON) | 2.10.1 |
| BCrypt | 0.10.2 |
| JUnit | 5.10.0 |

---

## How to Run on Windows

### Prerequisites
Install the following (all free):

| Tool | Download |
|---|---|
| JDK 17 | https://adoptium.net |
| Maven | https://maven.apache.org/download.cgi |
| Apache Tomcat 10 | https://tomcat.apache.org/download-10.cgi |
| MySQL 8 | https://dev.mysql.com/downloads/installer/ |
| MySQL Workbench (optional) | https://www.mysql.com/products/workbench/ |

---

### Step 1 — Set Up the Database

1. Open **MySQL Workbench** or the MySQL command line.
2. Run the schema file:
```sql
SOURCE C:/path/to/edendale/sql/schema.sql;
```
Or copy-paste the contents of `sql/schema.sql` and execute it.

3. Verify tables were created:
```sql
USE edendale_db;
SHOW TABLES;
```
You should see: `admin_users`, `content`, `events`.

---

### Step 2 — Configure Database Connection

Open `src/main/java/com/edendale/util/DatabaseUtil.java` and update:

```java
private static final String DB_URL      = "jdbc:mysql://localhost:3306/edendale_db?useSSL=false&serverTimezone=UTC";
private static final String DB_USER     = "root";        // ← your MySQL username
private static final String DB_PASSWORD = "yourpassword"; // ← your MySQL password
```

---

### Step 3 — Build the Project

Open **Command Prompt** or **PowerShell** in the project root folder:

```cmd
cd C:\path\to\edendale
mvn clean package
```

This creates a WAR file at:
```
target/edendale-school-1.0-SNAPSHOT.war
```

---

### Step 4 — Deploy to Tomcat

1. **Copy** the WAR file into Tomcat's `webapps/` folder:
```cmd
copy target\edendale-school-1.0-SNAPSHOT.war C:\tomcat\webapps\edendale.war
```

2. **Start Tomcat**:
```cmd
C:\tomcat\bin\startup.bat
```

3. Open your browser and go to:
```
http://localhost:8080/edendale/
```

---

### Step 5 — Place Your Logo

Copy your school logo file to:
```
C:\tomcat\webapps\edendale\assets\images\logo.svg
```
Make sure it is named exactly `logo.svg`.

---

## How to Run on Linux

### Step 1 — Install Prerequisites

```bash
# Ubuntu/Debian
sudo apt update
sudo apt install openjdk-17-jdk maven mysql-server -y

# Download Tomcat 10
wget https://downloads.apache.org/tomcat/tomcat-10/v10.1.20/bin/apache-tomcat-10.1.20.tar.gz
tar -xzf apache-tomcat-10.1.20.tar.gz
sudo mv apache-tomcat-10.1.20 /opt/tomcat
sudo chmod +x /opt/tomcat/bin/*.sh
```

---

### Step 2 — Set Up the Database

```bash
sudo systemctl start mysql
sudo mysql -u root -p
```

Inside MySQL:
```sql
SOURCE /path/to/edendale/sql/schema.sql;
EXIT;
```

---

### Step 3 — Configure Database Connection

Same as Windows — edit `DatabaseUtil.java` with your MySQL credentials.

---

### Step 4 — Build the Project

```bash
cd /path/to/edendale
mvn clean package
```

---

### Step 5 — Deploy to Tomcat

```bash
# Copy WAR
cp target/edendale-school-1.0-SNAPSHOT.war /opt/tomcat/webapps/edendale.war

# Start Tomcat
/opt/tomcat/bin/startup.sh
```

Open browser:
```
http://localhost:8080/edendale/
```

---

### Step 6 — Place Your Logo

Copy your school logo file to:
```
/opt/tomcat/webapps/edendale/assets/images/logo.svg
```
Make sure it is named exactly `logo.svg`.

---

## Database Setup

The `sql/schema.sql` file creates:

| Table | Purpose |
|---|---|
| `admin_users` | Admin login credentials (BCrypt hashed) |
| `content` | All editable text and image fields, keyed by page + field name |
| `events` | School calendar events |

### Resetting the Admin Password

Generate a new BCrypt hash (cost 12) at https://bcrypt-generator.com/, then run:

```sql
UPDATE admin_users
SET password_hash = '$2a$12$your_new_hash_here'
WHERE username = 'admin';
```

---

## Developer Notes

### Adding a New Editable Field
1. Add `data-editable data-field="your_field_name"` to the HTML element.
2. For images, also add `data-type="image"`.
3. The admin.js will automatically detect it — no JS changes needed.
4. The `ContentDAO` will store it in the database using `(page, field_name)` as the key.

### API Reference (Quick)

| Method | URL | Auth | Description |
|---|---|---|---|
| POST | `/api/admin/login` | None | Login with username + password |
| GET | `/api/content?page=home` | None | Fetch content for a page |
| PATCH | `/api/content` | Session | Save batch of edits |
| GET | `/api/events?year=2026&month=4` | None | Get events for a month |
| POST | `/api/events` | Session | Create new event |
| PUT | `/api/events/{id}` | Session | Update event |
| DELETE | `/api/events/{id}` | Session | Delete event |

### File Naming Convention
- HTML pages: `lowercase-hyphen.html`
- JS files: `camelCase.js`
- CSS files: `lowercase.css`
- Java classes: `PascalCase.java`
- SQL: `snake_case` table and column names

### TODO Checklist for the Team
- [x] Project restructured to standard Maven layout
- [x] Navigation links unified and tested across all pages
- [x] Admin panel fully integrated
- [ ] Replace `assets/images/logo.svg` with the actual school logo
- [ ] Fill in all `<!-- TODO -->` placeholder text in HTML files
- [ ] Update `DatabaseUtil.java` with real DB credentials
- [ ] Change the default admin password
- [ ] Populate grade subjects lists in `grades.html`
- [ ] Add gallery images to `grade-detail.html`
- [ ] Wire up the contact form to the Java backend (servlet + email)
- [ ] Test the admin edit flow end-to-end
- [ ] Set up production server (Apache/Nginx reverse proxy → Tomcat)

### Recent Updates (Latest Deployment)
- ✅ Standardized project structure to Maven best practices
- ✅ Updated all page navigation links for consistency
- ✅ Fixed "Extra & Co-Curriculars" capitalization across all pages
- ✅ Ensured all internal links use correct relative paths
- ✅ Removed duplicate style.css references
- ✅ Project ready for deployment

---
