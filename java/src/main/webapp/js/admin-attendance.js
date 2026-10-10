// admin-attendance.js - load students for a subject + bulk-mark.
(function () {
  "use strict";

  var BASE = window.SAS_BASE || "";
  var subjectSelect = document.getElementById("subjectSelect");
  var dateInput = document.getElementById("dateInput");
  var loadForm = document.getElementById("loadForm");
  var gridWrap = document.getElementById("gridWrap");
  var gridRows = document.getElementById("gridRows");
  var saveBtn = document.getElementById("saveBtn");

  function api(path, opts) {
    opts = opts || {};
    opts.credentials = "same-origin";
    opts.headers = Object.assign({ Accept: "application/json" }, opts.headers || {});
    return fetch(BASE + path, opts).then(function (r) {
      return r.json().then(function (j) { return { ok: r.ok, json: j, status: r.status }; });
    });
  }
  function esc(s) { return String(s == null ? "" : s); }

  function init() {
    api("/subjects").then(function (res) {
      if (res.ok && res.json.data) {
        res.json.data.forEach(function (s) {
          var o = document.createElement("option");
          o.value = s.id;
          o.textContent = s.code + " - " + s.name;
          subjectSelect.appendChild(o);
        });
      }
    });
    dateInput.value = new Date().toISOString().slice(0, 10);
  }

  loadForm.addEventListener("submit", function (e) {
    e.preventDefault();
    api("/students").then(function (res) {
      var list = res.ok && res.json.data ? res.json.data : [];
      gridRows.innerHTML = "";
      if (!list.length) {
        gridRows.innerHTML = '<tr><td colspan="3" class="empty">No students.</td></tr>';
      } else {
        list.forEach(function (s) {
          var tr = document.createElement("tr");
          tr.innerHTML =
            '<td>' + esc(s.rollNo) + '</td>' +
            '<td>' + esc(s.name) + '</td>' +
            '<td><select data-student="' + s.id + '">' +
              '<option value="present">Present</option>' +
              '<option value="absent">Absent</option>' +
              '<option value="late">Late</option>' +
            '</select></td>';
          gridRows.appendChild(tr);
        });
      }
      gridWrap.hidden = false;
    });
  });

  saveBtn.addEventListener("click", function () {
    var records = [];
    gridRows.querySelectorAll("select[data-student]").forEach(function (sel) {
      records.push({
        studentId: Number(sel.getAttribute("data-student")),
        subjectId: Number(subjectSelect.value),
        date: dateInput.value,
        status: sel.value
      });
    });
    if (!records.length) { alert("Nothing to save"); return; }
    api("/attendance?action=bulk", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(records)
    }).then(function (res) {
      if (res.ok) alert("Saved " + (res.json.data ? res.json.data.marked : records.length) + " records");
      else alert(res.json.error || "Save failed");
    });
  });

  init();
})();
