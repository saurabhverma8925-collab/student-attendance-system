<%@ page contentType="text/html;charset=UTF-8" language="java" %>
<%@ taglib prefix="c" uri="jakarta.tags.core" %>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>SAS - Reports</title>
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
    <h1>Reports</h1>

    <nav class="report-tabs">
      <a class="report-tab ${reportType == 'low-attendance' ? 'active' : ''}"
         href="${pageContext.request.contextPath}/reports?type=low-attendance&threshold=75&_=html">Low attendance</a>
    </nav>

    <div class="table-wrap">
      <table class="data-table">
        <thead>
          <tr>
            <th>Roll No</th><th>Name</th><th>Branch</th><th>Section</th>
            <th>Marked</th><th>Present</th><th>%</th>
          </tr>
        </thead>
        <tbody>
          <c:choose>
            <c:when test="${empty data}">
              <tr><td colspan="7" class="empty">No students below threshold.</td></tr>
            </c:when>
            <c:otherwise>
              <c:forEach var="row" items="${data}">
                <tr>
                  <td><c:out value="${row.rollNo}"/></td>
                  <td><c:out value="${row.name}"/></td>
                  <td><c:out value="${row.branch}"/></td>
                  <td><c:out value="${row.section}"/></td>
                  <td><c:out value="${row.marked}"/></td>
                  <td><c:out value="${row.present}"/></td>
                  <td><span class="badge badge-warn"><c:out value="${row.pct}%"/></span></td>
                </tr>
              </c:forEach>
            </c:otherwise>
          </c:choose>
        </tbody>
      </table>
    </div>
  </main>
</body>
</html>
