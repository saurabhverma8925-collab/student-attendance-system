// student-qr.js - camera scan via BarcodeDetector + face capture.
(function () {
  "use strict";

  var BASE = window.SAS_BASE || "";
  var videoWrap = document.getElementById("videoWrap");
  var video = document.getElementById("qrVideo");
  var canvas = document.getElementById("qrCanvas");
  var faceWrap = document.getElementById("faceWrap");
  var faceVideo = document.getElementById("faceVideo");
  var captureBtn = document.getElementById("captureFaceBtn");
  var resultEl = document.getElementById("scanResult");
  var errorEl = document.getElementById("scanError");

  function api(path, opts) {
    opts = opts || {};
    opts.credentials = "same-origin";
    opts.headers = Object.assign({ Accept: "application/json" }, opts.headers || {});
    return fetch(BASE + path, opts).then(function (r) {
      return r.json().then(function (j) { return { ok: r.ok, json: j, status: r.status }; });
    });
  }

  function showError(msg) {
    errorEl.textContent = msg;
    errorEl.hidden = false;
  }
  function clearError() { errorEl.hidden = true; }

  function stopVideo(el) {
    var s = el.srcObject;
    if (s) s.getTracks().forEach(function (t) { t.stop(); });
    el.srcObject = null;
  }

  // --- Camera for QR scan -------------------------------------------------
  async function startCamera(targetEl) {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      throw new Error("Camera not supported in this browser");
    }
    var stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: "environment" },
      audio: false
    });
    targetEl.srcObject = stream;
    await targetEl.play();
    return stream;
  }

  // --- QR decode loop -----------------------------------------------------
  var detector = ("BarcodeDetector" in window) ? new window.BarcodeDetector({
    formats: ["qr_code"]
  }) : null;

  function detectLoop() {
    if (!detector) {
      showError("BarcodeDetector not supported - paste the token manually below.");
      showManualInput();
      return;
    }
    requestAnimationFrame(scan);
  }

  async function scan() {
    try {
      var codes = await detector.detect(video);
      if (codes && codes.length) {
        var token = codes[0].rawValue;
        stopVideo(video);
        videoWrap.hidden = true;
        startFaceCapture(token);
        return;
      }
    } catch (e) { /* ignore frame errors */ }
    if (!videoWrap.hidden) requestAnimationFrame(scan);
  }

  // --- Manual fallback (no BarcodeDetector) -------------------------------
  function showManualInput() {
    stopVideo(video);
    var input = document.createElement("input");
    input.type = "text";
    input.placeholder = "Paste QR token";
    input.style.cssText = "width:100%;padding:.6rem;border:1px solid #e2e8e6;border-radius:10px;margin-top:.5rem";
    var btn = document.createElement("button");
    btn.className = "btn btn-primary btn-block";
    btn.textContent = "Use token";
    btn.style.marginTop = ".5rem";
    btn.addEventListener("click", function () {
      if (input.value) {
        videoWrap.hidden = true;
        startFaceCapture(input.value.trim());
      }
    });
    videoWrap.appendChild(input);
    videoWrap.appendChild(btn);
  }

  // --- Face capture -------------------------------------------------------
  async function startFaceCapture(token) {
    faceWrap.hidden = false;
    captureBtn.dataset.token = token;
    try {
      await startCamera(faceVideo);
    } catch (e) {
      showError("Face camera unavailable - skipping verification.");
      submitToken(token, false, null);
    }
  }

  captureBtn.addEventListener("click", function () {
    var token = captureBtn.dataset.token;
    var photoHash = captureFaceHash();
    stopVideo(faceVideo);
    faceWrap.hidden = true;
    submitToken(token, true, photoHash);
  });

  function captureFaceHash() {
    canvas.width = faceVideo.videoWidth || 160;
    canvas.height = faceVideo.videoHeight || 120;
    var ctx = canvas.getContext("2d");
    ctx.drawImage(faceVideo, 0, 0, canvas.width, canvas.height);
    var data = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
    var h = 0;
    for (var i = 0; i < data.length; i += 4) h = ((h * 31) + data[i]) | 0;
    return "fp_" + (h >>> 0).toString(16);
  }

  function submitToken(token, faceVerified, photoHash) {
    var params = new URLSearchParams();
    params.append("action", "verify");
    params.append("token", token);
    params.append("studentId", window._sasStudentId || "0");
    params.append("faceVerified", String(faceVerified));
    if (photoHash) params.append("photoHash", photoHash);
    api("/qr-attendance", { method: "POST", body: params }).then(function (res) {
      resultEl.hidden = false;
      var p = resultEl.querySelector("p.ok");
      if (res.ok) p.textContent = "Attendance marked - you are present.";
      else {
        p.textContent = "Failed: " + (res.json.error || "unknown");
        showError(res.json.error || "scan failed");
      }
    });
  }

  // --- Bootstrap ---------------------------------------------------------
  var m = /studentId=(\d+)/.exec(location.search);
  if (m) window._sasStudentId = m[1];

  (async function init() {
    clearError();
    if (!window._sasStudentId) {
      var dataEl = document.querySelector("[data-student-id]");
      if (dataEl) window._sasStudentId = dataEl.getAttribute("data-student-id");
    }
    try {
      await startCamera(video);
      detectLoop();
    } catch (e) {
      showError(e.message || "Cannot start camera");
      showManualInput();
    }
  })();
})();
