<%@ page contentType="text/html;charset=UTF-8" language="java" %>
<%@ taglib prefix="c" uri="jakarta.tags.core" %>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>SAS - Security</title>
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
    <h1>Security Overview</h1>

    <section class="stat-grid">
      <div class="stat-card"><div class="stat-value"><c:out value="${overview.adminCount}"/></div><div class="stat-label">Admins</div></div>
      <div class="stat-card stat-good"><div class="stat-value"><c:out value="${overview.loginSuccesses}"/></div><div class="stat-label">Successful logins</div></div>
      <div class="stat-card stat-bad"><div class="stat-value"><c:out value="${overview.loginFailures}"/></div><div class="stat-label">Failed logins</div></div>
      <div class="stat-card"><div class="stat-value"><c:out value="${overview.qrScans}"/></div><div class="stat-label">QR scans</div></div>
      <div class="stat-card"><div class="stat-value"><c:out value="${overview.deviceBindings}"/></div><div class="stat-label">Device bindings</div></div>
    </section>

    <div class="grid-2">
      <section class="card">
        <h2>Recent audit events</h2>
        <div class="table-wrap">
          <table class="data-table">
            <thead><tr><th>Time</th><th>Actor</th><th>Action</th><th>Target</th><th>IP</th></tr></thead>
            <tbody>
              <c:forEach var="a" items="${overview.recentAudits}">
                <tr>
                  <td><c:out value="${a.createdAt}"/></td>
                  <td><c:out value="${a.actorId}"/> (<c:out value="${a.actorRole}"/>)</td>
                  <td><c:out value="${a.action}"/></td>
                  <td><c:out value="${a.target}"/></td>
                  <td><c:out value="${a.ip}"/></td>
                </tr>
              </c:forEach>
            </tbody>
          </table>
        </div>
      </section>

      <section class="card">
        <h2>Recent failed logins</h2>
        <div class="table-wrap">
          <table class="data-table">
            <thead><tr><th>Time</th><th>Username</th><th>Role</th><th>IP</th></tr></thead>
            <tbody>
              <c:choose>
                <c:when test="${empty overview.recentFailures}">
                  <tr><td colspan="4" class="empty">None.</td></tr>
                </c:when>
                <c:otherwise>
                  <c:forEach var="f" items="${overview.recentFailures}">
                    <tr>
                      <td><c:out value="${f.createdAt}"/></td>
                      <td><c:out value="${f.username}"/></td>
                      <td><c:out value="${f.role}"/></td>
                      <td><c:out value="${f.ip}"/></td>
                    </tr>
                  </c:forEach>
                </c:otherwise>
              </c:choose>
            </tbody>
          </table>
        </div>
      </section>
    </div>
  </main>
</body>
</html>
