<%@ page contentType="text/html;charset=UTF-8" language="java" %>
<%@ taglib prefix="c" uri="jakarta.tags.core" %>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>SAS - Login</title>
    <link rel="stylesheet" href="${pageContext.request.contextPath}/css/style.css">
</head>
<body class="auth-body">
  <main class="auth-card">
    <div class="auth-brand">
      <div class="auth-logo">SAS</div>
      <h1>Student Attendance System</h1>
      <p>Secure QR-based attendance with face verification.</p>
    </div>

    <c:if test="${not empty error}">
      <div class="alert alert-error" role="alert">
        <c:out value="${error}"/>
      </div>
    </c:if>

    <div class="tabs" role="tablist">
      <button type="button" class="tab active" data-role="admin"   role="tab" aria-selected="true">Admin</button>
      <button type="button" class="tab"        data-role="student" role="tab" aria-selected="false">Student</button>
    </div>

    <form id="loginForm" method="post" action="${pageContext.request.contextPath}/login" novalidate>
      <input type="hidden" name="role" id="roleField" value="${not empty role ? role : 'admin'}">

      <label class="field">
        <span id="usernameLabel">Username</span>
        <input type="text" name="username" id="username" required autocomplete="username"
               placeholder="admin" maxlength="50">
      </label>

      <label class="field">
        <span>Password</span>
        <input type="password" name="password" id="password" required autocomplete="current-password"
               placeholder="admin123" minlength="4">
      </label>

      <button type="submit" class="btn btn-primary btn-block">Sign in</button>
    </form>

    <p class="hint">
      Demo: <strong>admin / admin123</strong> &middot;
      <strong>CSE21001 / student123</strong>
    </p>
  </main>

  <script src="${pageContext.request.contextPath}/js/login.js"></script>
</body>
</html>
