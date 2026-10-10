<%@ page contentType="text/html;charset=UTF-8" language="java" %>
<%@ taglib prefix="c" uri="jakarta.tags.core" %>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>SAS - Page not found</title>
    <link rel="stylesheet" href="${pageContext.request.contextPath}/css/style.css">
</head>
<body class="auth-body">
  <main class="auth-card">
    <div class="auth-brand">
      <div class="auth-logo">SAS</div>
      <h1>404</h1>
      <p>The page you were looking for does not exist.</p>
    </div>
    <a class="btn btn-primary btn-block" href="${pageContext.request.contextPath}/login">Back to login</a>
  </main>
</body>
</html>
