<%@ page contentType="text/html;charset=UTF-8" language="java" %>
<%@ taglib prefix="c" uri="jakarta.tags.core" %>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>SAS - Student Dashboard</title>
    <link rel="stylesheet" href="${pageContext.request.contextPath}/css/style.css">
</head>
<body>
  <header class="topbar">
    <div class="topbar-brand">SAS &middot; Student</div>
    <nav class="topbar-nav">
      <a href="${pageContext.request.contextPath}/dashboard?view=html">Dashboard</a>
      <a href="${pageContext.request.contextPath}/jsp/student/qr-attendance.jsp">QR Attendance</a>
      <a href="${pageContext.request.contextPath}/resources">Resources</a>
    </nav>
    <form method="get" action="${pageContext.request.contextPath}/logout" class="topbar-logout">
      <button class="btn btn-ghost" type="submit">Logout</button>
    </form>
  </header>

  <main class="page">
    <h1>My Attendance</h1>

    <section class="stat-grid">
      <div class="stat-card">
        <div class="stat-value"><c:out value="${stats.percentage}%"/></div>
        <div class="stat-label">Overall attendance</div>
      </div>
      <div class="stat-card stat-good">
        <div class="stat-value"><c:out value="${stats.statusCounts.present}"/></div>
        <div class="stat-label">Present</div>
      </div>
      <div class="stat-card stat-warn">
        <div class="stat-value"><c:out value="${stats.statusCounts.late}"/></div>
        <div class="stat-label">Late</div>
      </div>
      <div class="stat-card stat-bad">
        <div class="stat-value"><c:out value="${stats.statusCounts.absent}"/></div>
        <div class="stat-label">Absent</div>
      </div>
    </section>

    <section class="card">
      <h2>Subject-wise</h2>
      <div class="table-wrap">
        <table class="data-table">
          <thead><tr><th>Code</th><th>Subject</th><th>Present</th><th>Late</th><th>Absent</th><th>Total</th></tr></thead>
          <tbody>
            <c:choose>
              <c:when test="${empty stats.subjects}">
                <tr><td colspan="6" class="empty">No attendance recorded yet.</td></tr>
              </c:when>
              <c:otherwise>
                <c:forEach var="s" items="${stats.subjects}">
                  <tr>
                    <td><c:out value="${s.code}"/></td>
                    <td><c:out value="${s.subjectName}"/></td>
                    <td><c:out value="${s.present}"/></td>
                    <td><c:out value="${s.late}"/></td>
                    <td><c:out value="${s.absent}"/></td>
                    <td><c:out value="${s.totalClasses}"/></td>
                  </tr>
                </c:forEach>
              </c:otherwise>
            </c:choose>
          </tbody>
        </table>
      </div>
    </section>

    <section class="card">
      <h2>Recent records</h2>
      <div class="table-wrap">
        <table class="data-table">
          <thead><tr><th>Date</th><th>Subject</th><th>Status</th><th>Via</th></tr></thead>
          <tbody>
            <c:choose>
              <c:when test="${empty stats.recent}">
                <tr><td colspan="4" class="empty">Nothing yet.</td></tr>
              </c:when>
              <c:otherwise>
                <c:forEach var="r" items="${stats.recent}">
                  <tr>
                    <td><c:out value="${r.date}"/></td>
                    <td><c:out value="${r.subjectId}"/></td>
                    <td><c:out value="${r.status}"/></td>
                    <td><c:out value="${r.markedVia}"/></td>
                  </tr>
                </c:forEach>
              </c:otherwise>
            </c:choose>
          </tbody>
        </table>
      </div>
    </section>
  </main>
</body>
</html>
