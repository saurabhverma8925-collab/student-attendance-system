// admin-dashboard.js - load subjects, generate QR sessions, render QR.
(function () {
  "use strict";

  var BASE = window.SAS_BASE || "";
  var subjectSelect = document.getElementById("qrSubject");
  var ttlInput = document.getElementById("qrTtl");
  var form = document.getElementById("qrForm");
  var result = document.getElementById("qrResult");
  var img = document.getElementById("qrImage");
  var tokenEl = document.getElementById("qrToken");
  var expiresEl = document.getElementById("qrExpires");

  function api(path, opts) {
    opts = opts || {};
    opts.credentials = "same-origin";
    opts.headers = Object.assign({ Accept: "application/json" }, opts.headers || {});
    return fetch(BASE + path, opts).then(function (r) {
      return r.json().then(function (j) { return { ok: r.ok, json: j, status: r.status }; });
    });
  }

  function loadSubjects() {
    api("/subjects").then(function (res) {
      if (!res.ok || !res.json.data) return;
      res.json.data.forEach(function (s) {
        var opt = document.createElement("option");
        opt.value = s.id;
        opt.textContent = s.code + " - " + s.name;
        subjectSelect.appendChild(opt);
      });
    });
  }

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    var fd = new FormData(form);
    var params = new URLSearchParams();
    params.append("action", "generate");
    params.append("subjectId", fd.get("subjectId"));
    params.append("ttl", fd.get("ttl"));
    api("/qr-attendance", { method: "POST", body: params })
      .then(function (res) {
        if (res.ok && res.json.data) {
          var s = res.json.data;
          tokenEl.textContent = s.token;
          expiresEl.textContent = "Expires: " + (s.expiresAt || "");
          // Use the public qrserver.com endpoint to render the token as an image.
          img.src = "https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=" +
                    encodeURIComponent(s.token);
          img.alt = "QR token " + s.token;
          result.hidden = false;
        } else {
          alert(res.json && res.json.error ? res.json.error : "Failed to generate QR");
        }
      })
      .catch(function () { alert("Network error"); });
  });

  loadSubjects();
})();
