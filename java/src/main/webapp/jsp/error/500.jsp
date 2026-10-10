<%@ page contentType="text/html;charset=UTF-8" language="java" %>
<%@ taglib prefix="c" uri="jakarta.tags.core" %>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>SAS - Server error</title>
    <link rel="stylesheet" href="${pageContext.request.contextPath}/css/style.css">
</head>
<body class="auth-body">
  <main class="auth-card">
    <div class="auth-brand">
      <div class="auth-logo">SAS</div>
      <h1>500</h1>
      <p>Something went wrong on our side. The team has been notified.</p>
    </div>
    <c:if test="${not empty pageContext.exception.message}">
      <pre class="alert alert-error"><c:out value="${pageContext.exception.message}"/></pre>
    </c:if>
    <a class="btn btn-primary btn-block" href="${pageContext.request.contextPath}/login">Back to login</a>
  </main>
</body>
</html>
