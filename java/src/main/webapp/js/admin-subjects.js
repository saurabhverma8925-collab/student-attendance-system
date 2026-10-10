// admin-subjects.js - list + create / update / delete subjects.
(function () {
  "use strict";

  var BASE = window.SAS_BASE || "";
  var rows = document.getElementById("subjectRows");
  var modal = document.getElementById("subjectModal");
  var modalTitle = document.getElementById("modalTitle");
  var form = document.getElementById("subjectForm");
  var newBtn = document.getElementById("newSubjectBtn");
  var cancel = document.getElementById("modalCancel");

  function api(path, opts) {
    opts = opts || {};
    opts.credentials = "same-origin";
    opts.headers = Object.assign({ Accept: "application/json" }, opts.headers || {});
    return fetch(BASE + path, opts).then(function (r) {
      return r.json().then(function (j) { return { ok: r.ok, json: j, status: r.status }; });
    });
  }
  function esc(s) { return String(s == null ? "" : s); }

  function render(list) {
    rows.innerHTML = "";
    if (!list || !list.length) {
      rows.innerHTML = '<tr><td colspan="6" class="empty">No subjects.</td></tr>';
      return;
    }
    list.forEach(function (s) {
      var tr = document.createElement("tr");
      tr.innerHTML =
        '<td>' + esc(s.code) + '</td>' +
        '<td>' + esc(s.name) + '</td>' +
        '<td>' + esc(s.branch) + '</td>' +
        '<td>' + esc(s.semester) + '</td>' +
        '<td>' + esc(s.totalClasses) + '</td>' +
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

  function loadAll() {
    api("/subjects").then(function (res) {
      render(res.ok && res.json.data ? res.json.data : []);
    });
  }

  function loadOne(id) {
    api("/subjects?id=" + id).then(function (res) {
      if (!res.ok || !res.json.data) { alert("Not found"); return; }
      openModal(res.json.data, "Edit subject");
    });
  }

  function delOne(id) {
    if (!confirm("Delete this subject?")) return;
    api("/subjects?id=" + id, { method: "DELETE" }).then(loadAll);
  }

  function openModal(s, title) {
    modalTitle.textContent = title;
    form.id.value = s.id || "";
    form.code.value = s.code || "";
    form.code.disabled = !!s.id;
    form.name.value = s.name || "";
    form.branch.value = s.branch || "CSE";
    form.semester.value = s.semester || 3;
    form.totalClasses.value = s.totalClasses || 40;
    modal.hidden = false;
  }

  newBtn.addEventListener("click", function () { openModal({}, "New subject"); });
  cancel.addEventListener("click", function () { modal.hidden = true; });

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    var fd = new FormData(form);
    var params = new URLSearchParams(fd);
    var id = fd.get("id");
    var method = id ? "PUT" : "POST";
    var url = "/subjects";
    if (id) url += "?id=" + id;
    api(url, { method: method, body: params }).then(function (res) {
      if (res.ok) { modal.hidden = true; loadAll(); }
      else alert(res.json.error || "Save failed");
    });
  });

  loadAll();
})();
