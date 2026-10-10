<%@ page contentType="text/html;charset=UTF-8" language="java" %>
<%@ taglib prefix="c" uri="jakarta.tags.core" %>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>SAS - Resources</title>
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
    <h1>Study resources</h1>

    <div class="grid-3">
      <c:choose>
        <c:when test="${empty resources}">
          <p class="empty">No resources yet.</p>
        </c:when>
        <c:otherwise>
          <c:forEach var="r" items="${resources}">
            <article class="resource-card">
              <header>
                <span class="badge badge-${r.free ? 'ok' : 'warn'}">
                  <c:out value="${r.free ? 'Free' : 'Premium'}"/>
                </span>
                <span class="resource-type"><c:out value="${r.type}"/></span>
              </header>
              <h3><c:out value="${r.title}"/></h3>
              <p class="muted"><c:out value="${r.description}"/></p>
              <a class="btn btn-secondary btn-block" href="<c:out value='${r.url}'/>" target="_blank" rel="noopener">
                Open
              </a>
            </article>
          </c:forEach>
        </c:otherwise>
      </c:choose>
    </div>
  </main>
</body>
</html>
