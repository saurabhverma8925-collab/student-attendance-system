<%@ page contentType="text/html;charset=UTF-8" language="java" %>
<%@ taglib prefix="c" uri="jakarta.tags.core" %>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>SAS - Admin Dashboard</title>
    <link rel="stylesheet" href="${pageContext.request.contextPath}/css/style.css">
</head>
<body>
  <header class="topbar">
    <div class="topbar-brand">SAS &middot; Admin</div>
    <nav class="topbar-nav">
      <a href="${pageContext.request.contextPath}/dashboard?view=html">Dashboard</a>
      <a href="${pageContext.request.contextPath}/jsp/admin/students.jsp">Students</a>
      <a href="${pageContext.request.contextPath}/jsp/admin/subjects.jsp">Subjects</a>
      <a href="${pageContext.request.contextPath}/jsp/admin/attendance.jsp">Attendance</a>
      <a href="${pageContext.request.contextPath}/reports?type=low-attendance&threshold=75&_=html">Reports</a>
      <a href="${pageContext.request.contextPath}/security?view=html">Security</a>
    </nav>
    <form method="get" action="${pageContext.request.contextPath}/logout" class="topbar-logout">
      <button class="btn btn-ghost" type="submit">Logout</button>
    </form>
  </header>

  <main class="page">
    <h1>Admin Dashboard</h1>

    <section class="stat-grid">
      <div class="stat-card">
        <div class="stat-value"><c:out value="${stats.studentCount}"/></div>
        <div class="stat-label">Students</div>
      </div>
      <div class="stat-card">
        <div class="stat-value"><c:out value="${stats.subjectCount}"/></div>
        <div class="stat-label">Subjects</div>
      </div>
      <div class="stat-card">
        <div class="stat-value"><c:out value="${stats.activeQrSessions}"/></div>
        <div class="stat-label">Active QR sessions</div>
      </div>
      <div class="stat-card">
        <div class="stat-value"><c:out value="${stats.qrScansToday}"/></div>
        <div class="stat-label">QR scans</div>
      </div>
      <div class="stat-card">
        <div class="stat-value"><c:out value="${stats.adminCount}"/></div>
        <div class="stat-label">Admins</div>
      </div>
    </section>

    <section class="card">
      <h2>Students by branch</h2>
      <ul class="branch-list">
        <c:forEach var="entry" items="${stats.studentsByBranch}">
          <li>
            <span class="branch-name"><c:out value="${entry.key}"/></span>
            <span class="branch-count"><c:out value="${entry.value}"/></span>
          </li>
        </c:forEach>
      </ul>
    </section>

    <section class="card">
      <h2>Generate a QR session</h2>
      <form id="qrForm" class="inline-form">
        <label>Subject
          <select name="subjectId" id="qrSubject" required></select>
        </label>
        <label>TTL (min)
          <input type="number" name="ttl" id="qrTtl" value="5" min="1" max="60" required>
        </label>
        <button type="submit" class="btn btn-primary">Generate</button>
      </form>
      <div id="qrResult" class="qr-result" hidden>
        <img id="qrImage" alt="QR code" />
        <p class="qr-token"><code id="qrToken"></code></p>
        <p class="qr-expires" id="qrExpires"></p>
      </div>
    </section>
  </main>

  <script>
    window.SAS_BASE = "${pageContext.request.contextPath}";
  </script>
  <script src="${pageContext.request.contextPath}/js/admin-dashboard.js"></script>
</body>
</html>
