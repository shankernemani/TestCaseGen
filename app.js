/* QA Test Case Generator — runs entirely in the browser, no dependencies. */
(function () {
  "use strict";

  // ---------- element refs ----------
  const form = document.getElementById("tc-form");
  const fieldsContainer = document.getElementById("fields-container");
  const addFieldBtn = document.getElementById("add-field");
  const loadSampleBtn = document.getElementById("load-sample");
  const resetBtn = document.getElementById("reset-btn");
  const resultsBody = document.getElementById("results-body");
  const resultsWrapper = document.getElementById("results-wrapper");
  const emptyState = document.getElementById("empty-state");
  const countBadge = document.getElementById("count-badge");
  const copyBtn = document.getElementById("copy-btn");
  const csvBtn = document.getElementById("csv-btn");
  const filterInput = document.getElementById("filter");

  let generated = []; // last generated test cases

  // ---------- dynamic input-field rows ----------
  const FIELD_TYPES = ["text", "email", "password", "number", "date", "dropdown", "checkbox", "file"];

  function addFieldRow(preset) {
    preset = preset || {};
    const row = document.createElement("div");
    row.className = "field-row";

    const name = document.createElement("input");
    name.type = "text";
    name.placeholder = "Field name (e.g. Email)";
    name.className = "f-name";
    name.value = preset.name || "";

    const type = document.createElement("select");
    type.className = "f-type";
    FIELD_TYPES.forEach(function (t) {
      const opt = document.createElement("option");
      opt.value = t;
      opt.textContent = t;
      if (preset.type === t) opt.selected = true;
      type.appendChild(opt);
    });

    const required = document.createElement("select");
    required.className = "f-required";
    [["true", "Required"], ["false", "Optional"]].forEach(function (pair) {
      const opt = document.createElement("option");
      opt.value = pair[0];
      opt.textContent = pair[1];
      if (String(preset.required) === pair[0]) opt.selected = true;
      required.appendChild(opt);
    });

    const remove = document.createElement("button");
    remove.type = "button";
    remove.className = "remove-field";
    remove.textContent = "×";
    remove.title = "Remove field";
    remove.addEventListener("click", function () { row.remove(); });

    row.append(name, type, required, remove);
    fieldsContainer.appendChild(row);
  }

  function readFields() {
    const rows = fieldsContainer.querySelectorAll(".field-row");
    const fields = [];
    rows.forEach(function (row) {
      const name = row.querySelector(".f-name").value.trim();
      if (!name) return;
      fields.push({
        name: name,
        type: row.querySelector(".f-type").value,
        required: row.querySelector(".f-required").value === "true",
      });
    });
    return fields;
  }

  // ---------- test-case generation ----------
  function makeId(n) {
    return "TC-" + String(n).padStart(3, "0");
  }

  // sample invalid values by field type, used for negative/boundary tests
  const INVALID_SAMPLES = {
    email: "not-an-email",
    number: "abc (non-numeric)",
    date: "31/02/2024 (impossible date)",
    password: "123 (too short / weak)",
    text: "string exceeding the maximum allowed length",
    file: "an unsupported file type (e.g. .exe)",
  };

  function generate(input) {
    const cases = [];
    const cats = input.categories;
    const prio = input.priority;
    const feature = input.feature;

    function push(category, title, steps, expected, priority) {
      cases.push({
        category: category,
        title: title,
        steps: steps,
        expected: expected,
        priority: priority || prio,
      });
    }

    // --- Functional / positive from acceptance criteria ---
    if (cats.includes("functional")) {
      if (input.criteria.length) {
        input.criteria.forEach(function (crit) {
          push(
            "functional",
            "Verify: " + crit,
            ["Open the " + feature + " screen", "Provide valid inputs as per the requirement", "Perform the action"],
            "System behaves as expected: " + crit,
            "High"
          );
        });
      } else {
        push(
          "functional",
          "Verify " + feature + " works with valid inputs",
          ["Open the " + feature + " screen", "Enter valid data in all fields", "Submit"],
          feature + " completes successfully with a confirmation",
          "High"
        );
      }

      // each required field present -> happy path coverage
      input.fields.forEach(function (f) {
        push(
          "functional",
          "Verify " + f.name + " accepts a valid " + f.type + " value",
          ["Open the " + feature + " screen", "Enter a valid value in '" + f.name + "'", "Submit the form"],
          "The value is accepted and the form proceeds without error"
        );
      });
    }

    // --- Negative ---
    if (cats.includes("negative")) {
      input.fields.forEach(function (f) {
        if (f.required) {
          push(
            "negative",
            "Submit with '" + f.name + "' left empty",
            ["Open the " + feature + " screen", "Leave '" + f.name + "' blank", "Fill remaining fields validly", "Submit"],
            "Submission is blocked and a clear 'required field' error is shown for '" + f.name + "'",
            "High"
          );
        }
        const invalid = INVALID_SAMPLES[f.type] || INVALID_SAMPLES.text;
        push(
          "negative",
          "Enter invalid data in '" + f.name + "'",
          ["Open the " + feature + " screen", "Enter " + invalid + " in '" + f.name + "'", "Submit"],
          "A validation error is shown and the submission is rejected"
        );
      });

      if (!input.fields.length) {
        push(
          "negative",
          "Verify " + feature + " rejects invalid input",
          ["Open the " + feature + " screen", "Enter invalid / malformed data", "Submit"],
          "An appropriate error message is displayed and the action is not performed"
        );
      }
    }

    // --- Boundary ---
    if (cats.includes("boundary")) {
      input.fields.forEach(function (f) {
        if (f.type === "number") {
          push("boundary", "Boundary values for '" + f.name + "'",
            ["Open the " + feature + " screen",
             "Enter the minimum, maximum, just-below-min and just-above-max values in '" + f.name + "'",
             "Submit after each"],
            "Min and max are accepted; out-of-range values are rejected with a clear message");
        } else if (f.type === "text" || f.type === "password" || f.type === "email") {
          push("boundary", "Length limits for '" + f.name + "'",
            ["Open the " + feature + " screen",
             "Enter an empty value, a single character, the max allowed length, and one over the limit in '" + f.name + "'",
             "Submit after each"],
            "Values within limits are accepted; over-limit input is truncated or rejected gracefully");
        } else if (f.type === "date") {
          push("boundary", "Date boundaries for '" + f.name + "'",
            ["Open the " + feature + " screen",
             "Enter past, present, future and edge dates (e.g. leap day) in '" + f.name + "'", "Submit"],
            "Allowed dates are accepted; out-of-range dates are rejected appropriately");
        } else if (f.type === "file") {
          push("boundary", "File size / type limits for '" + f.name + "'",
            ["Open the " + feature + " screen",
             "Upload a 0-byte file, a max-size file, and an over-size file to '" + f.name + "'", "Submit"],
            "Valid files upload; empty or oversized files are rejected with a clear message");
        }
      });
    }

    // --- UI / Usability ---
    if (cats.includes("ui")) {
      push("ui", "Verify " + feature + " layout and labels render correctly",
        ["Open the " + feature + " screen", "Inspect all labels, buttons, and field alignment"],
        "All elements are visible, correctly labelled, and aligned per the design");
      push("ui", "Verify responsive behaviour of " + feature,
        ["Open the " + feature + " screen", "Resize the browser / view on mobile, tablet and desktop widths"],
        "Layout adapts without overlap, clipping, or horizontal scrolling");
      push("ui", "Verify tab order and keyboard navigation",
        ["Open the " + feature + " screen", "Navigate through all fields using Tab and Shift+Tab"],
        "Focus moves in a logical order and the active element is clearly indicated");
    }

    // --- Security ---
    if (cats.includes("security")) {
      push("security", "Verify " + feature + " is resistant to SQL injection",
        ["Open the " + feature + " screen", "Enter SQL payloads (e.g. ' OR 1=1 --) in text fields", "Submit"],
        "Input is sanitised; no data is exposed and no error reveals the backend", "High");
      push("security", "Verify " + feature + " is resistant to XSS",
        ["Open the " + feature + " screen", "Enter <script>alert(1)</script> in text fields", "Submit and view the output"],
        "Script is escaped/encoded and does not execute", "High");
      if (input.fields.some(function (f) { return f.type === "password"; })) {
        push("security", "Verify password is masked and not logged",
          ["Open the " + feature + " screen", "Type into the password field", "Inspect network requests and storage"],
          "Password is masked on screen and never stored or transmitted in plain text", "High");
      }
      push("security", "Verify access control / unauthorised access is blocked",
        ["Attempt to access " + feature + " without authentication or with insufficient permissions"],
        "Access is denied and the user is redirected to login / shown a 403", "High");
    }

    // --- Performance ---
    if (cats.includes("performance")) {
      push("performance", "Verify " + feature + " response time under normal load",
        ["Open the " + feature + " screen", "Perform the main action", "Measure the response time"],
        "The action completes within the agreed SLA (e.g. < 2 seconds)");
      push("performance", "Verify " + feature + " under concurrent / load conditions",
        ["Simulate multiple concurrent users performing the action"],
        "The system remains responsive and stable with no errors or data loss");
    }

    // --- Accessibility ---
    if (cats.includes("accessibility")) {
      push("accessibility", "Verify " + feature + " is screen-reader accessible",
        ["Open the " + feature + " screen with a screen reader (e.g. NVDA/VoiceOver)", "Navigate all controls"],
        "All fields, labels and errors are announced clearly");
      push("accessibility", "Verify colour contrast meets WCAG AA",
        ["Open the " + feature + " screen", "Check text and control contrast ratios"],
        "Contrast ratios meet WCAG 2.1 AA (>= 4.5:1 for normal text)");
    }

    // assign IDs
    return cases.map(function (c, i) {
      c.id = makeId(i + 1);
      return c;
    });
  }

  // ---------- rendering ----------
  function render(cases) {
    resultsBody.innerHTML = "";
    cases.forEach(function (c) {
      const tr = document.createElement("tr");
      tr.dataset.search = (c.id + " " + c.category + " " + c.title + " " + c.expected).toLowerCase();

      const stepsHtml = "<ol class='steps'>" +
        c.steps.map(function (s) { return "<li>" + escapeHtml(s) + "</li>"; }).join("") + "</ol>";

      tr.innerHTML =
        "<td>" + c.id + "</td>" +
        "<td><span class='cat-tag'>" + escapeHtml(c.category) + "</span></td>" +
        "<td>" + escapeHtml(c.title) + "</td>" +
        "<td>" + stepsHtml + "</td>" +
        "<td>" + escapeHtml(c.expected) + "</td>" +
        "<td><span class='prio " + c.priority + "'>" + c.priority + "</span></td>";
      resultsBody.appendChild(tr);
    });

    const has = cases.length > 0;
    emptyState.hidden = has;
    resultsWrapper.hidden = !has;
    countBadge.hidden = !has;
    countBadge.textContent = cases.length;
    copyBtn.disabled = !has;
    csvBtn.disabled = !has;
    filterInput.hidden = !has;
  }

  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  // ---------- export helpers ----------
  function toCsv(cases) {
    const header = ["ID", "Category", "Title", "Steps", "Expected Result", "Priority"];
    const rows = cases.map(function (c) {
      return [c.id, c.category, c.title, c.steps.join(" | "), c.expected, c.priority].map(csvCell);
    });
    return [header.map(csvCell).join(","), rows.map(function (r) { return r.join(","); }).join("\n")].join("\n");
  }
  function csvCell(v) {
    v = String(v == null ? "" : v);
    if (/[",\n]/.test(v)) v = '"' + v.replace(/"/g, '""') + '"';
    return v;
  }
  function toPlainText(cases) {
    return cases.map(function (c) {
      return [
        c.id + " [" + c.category + "] (" + c.priority + ")",
        "Title: " + c.title,
        "Steps:",
        c.steps.map(function (s, i) { return "  " + (i + 1) + ". " + s; }).join("\n"),
        "Expected: " + c.expected,
      ].join("\n");
    }).join("\n\n");
  }

  // ---------- event wiring ----------
  form.addEventListener("submit", function (e) {
    e.preventDefault();
    const feature = document.getElementById("feature").value.trim();
    if (!feature) return;

    const criteria = document.getElementById("criteria").value
      .split("\n").map(function (s) { return s.trim(); }).filter(Boolean);

    const categories = Array.prototype.slice
      .call(document.querySelectorAll(".cat:checked"))
      .map(function (c) { return c.value; });

    const input = {
      feature: feature,
      description: document.getElementById("description").value.trim(),
      criteria: criteria,
      fields: readFields(),
      categories: categories,
      priority: document.getElementById("priority").value,
    };

    if (!categories.length) {
      alert("Please select at least one test category.");
      return;
    }

    generated = generate(input);
    render(generated);
    resultsWrapper.scrollIntoView({ behavior: "smooth", block: "nearest" });
  });

  addFieldBtn.addEventListener("click", function () { addFieldRow(); });

  filterInput.addEventListener("input", function () {
    const q = filterInput.value.toLowerCase();
    resultsBody.querySelectorAll("tr").forEach(function (tr) {
      tr.style.display = tr.dataset.search.indexOf(q) === -1 ? "none" : "";
    });
  });

  copyBtn.addEventListener("click", function () {
    const text = toPlainText(generated);
    navigator.clipboard.writeText(text).then(
      function () { flash(copyBtn, "Copied!"); },
      function () { fallbackCopy(text); flash(copyBtn, "Copied!"); }
    );
  });

  csvBtn.addEventListener("click", function () {
    const blob = new Blob([toCsv(generated)], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "test-cases.csv";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  });

  function fallbackCopy(text) {
    const ta = document.createElement("textarea");
    ta.value = text;
    document.body.appendChild(ta);
    ta.select();
    try { document.execCommand("copy"); } catch (e) { /* ignore */ }
    document.body.removeChild(ta);
  }

  function flash(btn, msg) {
    const old = btn.textContent;
    btn.textContent = msg;
    setTimeout(function () { btn.textContent = old; }, 1400);
  }

  resetBtn.addEventListener("click", function () {
    form.reset();
    fieldsContainer.innerHTML = "";
    generated = [];
    render([]);
  });

  loadSampleBtn.addEventListener("click", function () {
    document.getElementById("feature").value = "User Login";
    document.getElementById("description").value =
      "As a registered user, I want to log in with my email and password so that I can access my dashboard.";
    document.getElementById("criteria").value =
      "Valid email and password logs the user in and redirects to the dashboard\n" +
      "Invalid password shows an 'incorrect credentials' error\n" +
      "User can reset their password via the 'Forgot password' link\n" +
      "Account is locked after 5 failed attempts";
    fieldsContainer.innerHTML = "";
    addFieldRow({ name: "Email", type: "email", required: true });
    addFieldRow({ name: "Password", type: "password", required: true });
    addFieldRow({ name: "Remember me", type: "checkbox", required: false });
    document.getElementById("priority").value = "Medium";
    // ensure security & ui are on for a fuller sample
    document.querySelector('.cat[value="ui"]').checked = true;
    document.querySelector('.cat[value="security"]').checked = true;
  });

  // start with one empty field row for convenience
  addFieldRow();
})();
