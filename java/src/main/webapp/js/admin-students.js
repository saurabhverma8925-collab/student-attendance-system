// admin-students.js - list + search + create / update / delete.
(function () {
  "use strict";

  var BASE = window.SAS_BASE || "";
  var rows = document.getElementById("studentRows");
  var searchForm = document.getElementById("searchForm");
  var searchQ = document.getElementById("searchQ");
  var modal = document.getElementById("studentModal");
  var modalTitle = document.getElementById("modalTitle");
  var form = document.getElementById("studentForm");
  var newBtn = document.getElementById("newStudentBtn");
  var cancel = document.getElementById("modalCancel");

  function api(path, opts) {
    opts = opts || {};
    opts.credentials = "same-origin";
    opts.headers = Object.assign({ Accept: "application/json" }, opts.headers || {});
    return fetch(BASE + path, opts).then(function (r) {
      return r.json().then(function (j) { return { ok: r.ok, json: j, status: r.status }; });
    });
  }

  function escapeHtml(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c];
    });
  }

  function render(list) {
    rows.innerHTML = "";
    if (!list || !list.length) {
      rows.innerHTML = '<tr><td colspan="9" class="empty">No students.</td></tr>';
      return;
    }
    list.forEach(function (s) {
      var tr = document.createElement("tr");
      tr.innerHTML =
        '<td>' + escapeHtml(s.rollNo) + '</td>' +
        '<td>' + escapeHtml(s.name) + '</td>' +
        '<td>' + escapeHtml(s.branch) + '</td>' +
        '<td>' + escapeHtml(s.section) + '</td>' +
        '<td>' + escapeHtml(s.semester) + '</td>' +
        '<td>' + escapeHtml(s.email) + '</td>' +
        '<td>' + escapeHtml(s.phone) + '</td>' +
        '<td>' + (s.deviceFingerprint ? '<span class="badge badge-ok">Bound</span>'
                                      : '<span class="badge badge-warn">Unbound</span>') + '</td>' +
        '<td><button class="btn btn-ghost" data-edit="' + s.id + '">Edit</button> ' +
            '<button class="btn btn-ghost" data-del="' + s.id + '">Del</button></td>';
      rows.appendChild(tr);
    });
    rows.querySelectorAll("[data-edit]").forEach(function (b) {
      b.addEventListener("click", function () { loadOne(b.getAttribute("data-edit")); });
    });
    rows.querySelectorAll("[data-del]").forEach(function (b) {
      b.addEventListener("click", function () { delOne(b.getAttribute("data-del")); });
    });
  }

  function loadAll(q) {
    var url = "/students";
    if (q) url += "?q=" + encodeURIComponent(q);
    api(url).then(function (res) {
      render(res.ok && res.json.data ? res.json.data : []);
    });
  }

  function loadOne(id) {
    api("/students?id=" + id).then(function (res) {
      if (!res.ok || !res.json.data) { alert("Not found"); return; }
      openModal(res.json.data, "Edit student");
    });
  }

  function delOne(id) {
    if (!confirm("Delete this student?")) return;
    api("/students?id=" + id, { method: "DELETE" }).then(function () { loadAll(searchQ.value); });
  }

  function openModal(s, title) {
    modalTitle.textContent = title;
    form.id.value = s.id || "";
    form.studentId.value = s.rollNo || "";
    form.studentId.disabled = !!s.id;
    form.name.value = s.name || "";
    form.branch.value = s.branch || "CSE";
    form.section.value = s.section || "A";
    form.semester.value = s.semester || 3;
    form.email.value = s.email || "";
    form.phone.value = s.phone || "";
    form.password.value = "ChangeMe@1";
    modal.hidden = false;
  }

  function closeModal() { modal.hidden = true; }

  newBtn.addEventListener("click", function () { openModal({}, "New student"); });
  cancel.addEventListener("click", closeModal);
  searchForm.addEventListener("submit", function (e) {
    e.preventDefault(); loadAll(searchQ.value);
  });

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    var fd = new FormData(form);
    var params = new URLSearchParams(fd);
    var id = fd.get("id");
    var method = id ? "PUT" : "POST";
    var url = "/students";
    if (id) url += "?id=" + id;
    api(url, { method: method, body: params }).then(function (res) {
      if (res.ok) { closeModal(); loadAll(searchQ.value); }
      else alert(res.json.error || "Save failed");
    });
  });

  loadAll("");
})();
