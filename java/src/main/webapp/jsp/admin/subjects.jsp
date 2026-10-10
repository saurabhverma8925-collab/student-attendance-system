<%@ page contentType="text/html;charset=UTF-8" language="java" %>
<%@ taglib prefix="c" uri="jakarta.tags.core" %>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>SAS - Subjects</title>
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
    <div class="page-head">
      <h1>Subjects</h1>
      <button class="btn btn-primary" id="newSubjectBtn">+ New subject</button>
    </div>

    <div class="table-wrap">
      <table class="data-table">
        <thead>
          <tr><th>Code</th><th>Name</th><th>Branch</th><th>Sem</th><th>Total classes</th><th></th></tr>
        </thead>
        <tbody id="subjectRows"></tbody>
      </table>
    </div>
  </main>

  <div id="subjectModal" class="modal" hidden>
    <div class="modal-card">
      <h2 id="modalTitle">New subject</h2>
      <form id="subjectForm">
        <input type="hidden" name="id">
        <label class="field"><span>Code</span><input type="text" name="code" required></label>
        <label class="field"><span>Name</span><input type="text" name="name" required></label>
        <label class="field"><span>Branch</span>
          <select name="branch" required>
            <option value="CSE">CSE</option>
            <option value="ECE">ECE</option>
          </select>
        </label>
        <label class="field"><span>Semester</span><input type="number" name="semester" min="1" max="8" value="3" required></label>
        <label class="field"><span>Total classes</span><input type="number" name="totalClasses" min="0" value="40" required></label>
        <div class="modal-actions">
          <button type="button" class="btn btn-ghost" id="modalCancel">Cancel</button>
          <button type="submit" class="btn btn-primary">Save</button>
        </div>
      </form>
    </div>
  </div>

  <script>window.SAS_BASE = "${pageContext.request.contextPath}";</script>
  <script src="${pageContext.request.contextPath}/js/admin-subjects.js"></script>
</body>
</html>
