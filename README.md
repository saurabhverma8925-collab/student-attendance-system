# Student Attendance System — Java Web Application

A Java web-based Student Attendance System built with Jakarta Servlet 6.0, JDBC, JSP, and MySQL.

## Tech Stack

- **Language**: Java 17
- **Build**: Maven (WAR packaging)
- **Web**: Jakarta Servlet 6.0 (jakarta.servlet.*), JSP + JSTL
- **Server**: Apache Tomcat 10.1
- **Database**: MySQL 8 + JDBC (mysql-connector-j)
- **Security**: BCrypt (org.mindrot:jbcrypt), Gson for JSON
- **No Spring, Hibernate, or ORM** — plain JDBC only

## Features

- Admin + Student login with BCrypt password hashing
- Student CRUD with search (roll number, name, branch, section, semester)
- Subject CRUD
- Manual attendance marking (Present/Absent per student, subject, date) with JDBC transaction
- QR attendance: admin generates expiring QR session, student scans + verifies face
- One-device-per-student binding (admin-controlled)
- Reports: by student, by subject, low-attendance list (<75% threshold)
- Dashboard statistics
- Study resources per subject (CRUD)
- Security: audit logs, failed-login tracking, rate limiting, input validation

## Architecture

```
Browser → Servlet → Service → DAO (interface + Impl) → JDBC → MySQL
```

### Package Structure (com.sas)
- `model/` — POJOs with encapsulation (abstract User → Admin, Student inheritance)
- `interfaces/` — GenericDAO<T,ID> + DAO + Service contracts
- `dao/` — JDBC implementations (PreparedStatement, try-with-resources)
- `service/` — Business logic (JDBC transactions in AttendanceServiceImpl)
- `servlet/` — 12 Jakarta Servlet 6.0 controllers
- `filter/` — AuthFilter (login required) + RoleFilter (ADMIN/STUDENT only)
- `exception/` — 6 custom exceptions + central ErrorHandler
- `util/` — DBConnection, PasswordUtil, InputValidator, JsonUtil, SessionUtil
- `task/` — AuditLogger (ExecutorService), LoginAttemptTracker (synchronized), QRSessionCleaner (ScheduledExecutorService)

## Java Concepts Demonstrated

| Concept | Implementation | File |
|---|---|---|
| Encapsulation | Private fields + getters/setters in all models | `model/*.java` |
| Abstraction + Inheritance | Abstract `User` class, `Admin` + `Student` extend it | `model/User.java`, `model/Admin.java`, `model/Student.java` |
| Polymorphism | `AuthenticationService` returns `User` ref; login calls `user.getDashboardPath()` | `service/AuthenticationServiceImpl.java`, `servlet/LoginServlet.java` |
| Interfaces | `GenericDAO<T,ID>` extended by all DAOs | `interfaces/GenericDAO.java` |
| Collections + Generics | `List<Student>`, `ApiResponse<T>`, `Map<String,Integer>` in reports | `service/ReportServiceImpl.java`, `model/ApiResponse.java` |
| Multithreading | `AuditLogger` (ExecutorService), `QRSessionCleaner` (ScheduledExecutorService) | `task/AuditLogger.java`, `task/QRSessionCleanerTask.java` |
| Synchronization | `LoginAttemptTracker` (ConcurrentHashMap + synchronized), QR scan prevention | `task/LoginAttemptTracker.java`, `service/QRSessionServiceImpl.java` |
| JDBC | PreparedStatement, try-with-resources, transaction in AttendanceService | `dao/*.java`, `service/AttendanceServiceImpl.java` |
| Servlets | 12 servlets, AuthFilter, RoleFilter, web.xml | `servlet/*.java`, `filter/*.java` |
| Custom Exceptions | 6 domain exceptions, central error handler | `exception/*.java` |

## Setup

### Prerequisites
- Java 17+
- Maven
- MySQL 8
- Apache Tomcat 10.1

### Database
```bash
mysql -u root -p < java/src/main/resources/database/schema.sql
mysql -u root -p sas < java/src/main/resources/database/seed.sql
```

### Configuration
```bash
cp java/src/main/resources/db.properties.example java/src/main/resources/db.properties
# Edit db.properties with your MySQL credentials
```

### Build & Deploy
```bash
cd java
mvn clean package
# Copy WAR to Tomcat:
cp target/student-attendance-system.war $CATALINA_HOME/webapps/
# Start Tomcat, visit:
# http://localhost:8080/student-attendance-system/
```

### Demo Credentials
- **Admin**: `admin` / `admin123`
- **Student**: `CSE21001` / `student123`

## Testing
```bash
cd java
mvn test
# ConcurrencyTest proves LoginAttemptTracker thread safety (50 threads)
```

## License
Educational project for Java Programming course.
