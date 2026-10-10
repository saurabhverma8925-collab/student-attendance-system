// login.js - tab switcher + role-aware field label.
(function () {
  "use strict";

  var BASE = window.SAS_BASE || "";
  var tabs = Array.prototype.slice.call(document.querySelectorAll(".tab"));
  var roleField = document.getElementById("roleField");
  var usernameLabel = document.getElementById("usernameLabel");
  var username = document.getElementById("username");
  var password = document.getElementById("password");

  function selectRole(role) {
    tabs.forEach(function (t) {
      var active = t.getAttribute("data-role") === role;
      t.classList.toggle("active", active);
      t.setAttribute("aria-selected", active ? "true" : "false");
    });
    roleField.value = role;
    usernameLabel.textContent = role === "student" ? "Student ID (e.g. CSE21001)" : "Username";
    username.placeholder = role === "student" ? "CSE21001" : "admin";
    password.placeholder = role === "student" ? "student123" : "admin123";
    username.focus();
  }

  tabs.forEach(function (t) {
    t.addEventListener("click", function () {
      selectRole(t.getAttribute("data-role"));
    });
  });

  // Honour ?role=student for the "as student" deep link from reports.
  var initial = roleField.value || "admin";
  if (initial) selectRole(initial);
})();
