<%@ page contentType="text/html;charset=UTF-8" language="java" %>
<%@ taglib prefix="c" uri="jakarta.tags.core" %>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>SAS - QR Attendance</title>
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
    <h1>Scan to mark attendance</h1>
    <p class="muted">Open your camera, point at the QR shown by your teacher, then complete face verification.</p>
    <div data-student-id="<%= ((com.sas.model.User) session.getAttribute("sas.user")) == null ? 0 : ((com.sas.model.User) session.getAttribute("sas.user")).getId() %>"></div>

    <section class="qr-scanner">
      <div id="videoWrap" class="video-wrap">
        <video id="qrVideo" playsinline muted></video>
        <canvas id="qrCanvas" hidden></canvas>
      </div>
      <div id="faceWrap" class="face-wrap" hidden>
        <video id="faceVideo" playsinline muted autoplay></video>
        <p class="muted">Center your face in the frame.</p>
        <button class="btn btn-secondary" id="captureFaceBtn">Capture &amp; verify</button>
      </div>
      <div id="scanResult" class="scan-result" hidden>
        <p class="ok"></p>
      </div>
      <p id="scanError" class="alert alert-error" hidden></p>
    </section>
  </main>

  <script>window.SAS_BASE = "${pageContext.request.contextPath}";</script>
  <script src="${pageContext.request.contextPath}/js/student-qr.js"></script>
</body>
</html>
