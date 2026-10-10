<%@ page contentType="text/html;charset=UTF-8" language="java" %>
<%@ taglib prefix="c" uri="jakarta.tags.core" %>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>SAS - Students</title>
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
      <h1>Students</h1>
      <button class="btn btn-primary" id="newStudentBtn">+ New student</button>
    </div>

    <form id="searchForm" class="inline-form">
      <input type="text" name="q" id="searchQ" placeholder="Search by roll no, name, branch, section&hellip;">
      <button type="submit" class="btn btn-secondary">Search</button>
    </form>

    <div class="table-wrap">
      <table class="data-table">
        <thead>
          <tr>
            <th>Roll No</th><th>Name</th><th>Branch</th><th>Section</th>
            <th>Sem</th><th>Email</th><th>Phone</th><th>Device</th><th></th>
          </tr>
        </thead>
        <tbody id="studentRows"></tbody>
      </table>
    </div>
  </main>

  <!-- Edit / create modal -->
  <div id="studentModal" class="modal" hidden>
    <div class="modal-card">
      <h2 id="modalTitle">New student</h2>
      <form id="studentForm">
        <input type="hidden" name="id">
        <label class="field"><span>Student ID</span><input type="text" name="studentId" required></label>
        <label class="field"><span>Name</span><input type="text" name="name" required></label>
        <label class="field"><span>Branch</span>
          <select name="branch" required>
            <option value="CSE">CSE</option>
            <option value="ECE">ECE</option>
            <option value="ME">ME</option>
            <option value="EE">EE</option>
          </select>
        </label>
        <label class="field"><span>Section</span>
          <select name="section" required>
            <option value="A">A</option>
            <option value="B">B</option>
            <option value="C">C</option>
          </select>
        </label>
        <label class="field"><span>Semester</span><input type="number" name="semester" min="1" max="8" value="3" required></label>
        <label class="field"><span>Email</span><input type="email" name="email" required></label>
        <label class="field"><span>Phone</span><input type="text" name="phone" required></label>
        <label class="field"><span>Default password</span><input type="text" name="password" value="ChangeMe@1" required></label>
        <div class="modal-actions">
          <button type="button" class="btn btn-ghost" id="modalCancel">Cancel</button>
          <button type="submit" class="btn btn-primary">Save</button>
        </div>
      </form>
    </div>
  </div>

  <script>window.SAS_BASE = "${pageContext.request.contextPath}";</script>
  <script src="${pageContext.request.contextPath}/js/admin-students.js"></script>
</body>
</html>
