<%@ page contentType="text/html;charset=UTF-8" language="java" %>
<%@ taglib prefix="c" uri="jakarta.tags.core" %>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>SAS - Attendance</title>
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
    <h1>Mark Attendance</h1>

    <form class="inline-form" id="loadForm">
      <label>Subject
        <select name="subjectId" id="subjectSelect" required></select>
      </label>
      <label>Date
        <input type="date" name="date" id="dateInput" required>
      </label>
      <button type="submit" class="btn btn-secondary">Load class</button>
    </form>

    <div id="gridWrap" hidden>
      <div class="table-wrap">
        <table class="data-table">
          <thead>
            <tr><th>Roll No</th><th>Name</th><th>Status</th></tr>
          </thead>
          <tbody id="gridRows"></tbody>
        </table>
      </div>
      <button class="btn btn-primary" id="saveBtn">Save attendance</button>
    </div>
  </main>

  <script>window.SAS_BASE = "${pageContext.request.contextPath}";</script>
  <script src="${pageContext.request.contextPath}/js/admin-attendance.js"></script>
</body>
</html>
