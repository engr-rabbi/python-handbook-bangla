/* Complete Python Course — app.js
   Vanilla JS, no build step, works from any static host. */
(function () {
  "use strict";

  /* ---------------- Theme ---------------- */
  var THEME_KEY = "pyacademy_theme";
  function applyTheme(t) {
    if (t === "system") {
      var prefersDark = window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
      document.documentElement.setAttribute("data-theme", prefersDark ? "dark" : "light");
    } else {
      document.documentElement.setAttribute("data-theme", t);
    }
  }
  function initTheme() {
    var saved = localStorage.getItem(THEME_KEY) || "system";
    applyTheme(saved);
    var btn = document.getElementById("theme-toggle");
    if (!btn) return;
    updateThemeLabel(saved);
    btn.addEventListener("click", function () {
      var cur = localStorage.getItem(THEME_KEY) || "system";
      var order = ["light", "dark", "system"];
      var next = order[(order.indexOf(cur) + 1) % order.length];
      localStorage.setItem(THEME_KEY, next);
      applyTheme(next);
      updateThemeLabel(next);
    });
  }
  var THEME_LABEL_BN = { light: "লাইট", dark: "ডার্ক", system: "সিস্টেম" };
  function updateThemeLabel(t) {
    var btn = document.getElementById("theme-toggle");
    if (!btn) return;
    var icon = t === "dark" ? "🌙" : t === "light" ? "☀️" : "🖥";
    btn.innerHTML = icon + " <span class='vis-label'>" + (THEME_LABEL_BN[t] || t) + "</span>";
    btn.setAttribute("aria-label", "থিম: " + (THEME_LABEL_BN[t] || t) + "। পরিবর্তন করতে ক্লিক করুন।");
  }

  /* ---------------- Sidebar (mobile) ---------------- */
  function initSidebar() {
    var toggle = document.getElementById("menu-toggle");
    var sidebar = document.querySelector(".sidebar");
    if (!toggle || !sidebar) return;
    toggle.addEventListener("click", function () {
      sidebar.classList.toggle("open");
    });
    document.addEventListener("click", function (e) {
      if (sidebar.classList.contains("open") && !sidebar.contains(e.target) && e.target !== toggle && !toggle.contains(e.target)) {
        sidebar.classList.remove("open");
      }
    });
  }

  /* ---------------- Progress tracking ---------------- */
  var PROGRESS_KEY = "pyacademy_progress_v1";
  var TOTAL_LESSONS = window.PY_TOTAL_LESSONS || 20;

  function getProgress() {
    try { return JSON.parse(localStorage.getItem(PROGRESS_KEY)) || {}; }
    catch (e) { return {}; }
  }
  function setProgress(p) { localStorage.setItem(PROGRESS_KEY, JSON.stringify(p)); }

  function markComplete(slug, done) {
    var p = getProgress();
    if (done) p[slug] = true; else delete p[slug];
    setProgress(p);
    refreshProgressUI();
  }

  function refreshProgressUI() {
    var p = getProgress();
    var doneCount = Object.keys(p).length;
    var pct = Math.round((doneCount / TOTAL_LESSONS) * 100);

    document.querySelectorAll("[data-progress-fill]").forEach(function (el) { el.style.width = pct + "%"; });
    document.querySelectorAll("[data-progress-text]").forEach(function (el) { el.textContent = doneCount + " / " + TOTAL_LESSONS + " টি লেসন (" + pct + "%)"; });
    document.querySelectorAll("[data-progress-pct]").forEach(function (el) { el.textContent = pct + "%"; });

    document.querySelectorAll(".side-check[data-slug]").forEach(function (el) {
      el.classList.toggle("done", !!p[el.getAttribute("data-slug")]);
    });
    document.querySelectorAll(".rm-check[data-slug]").forEach(function (el) {
      el.classList.toggle("done", !!p[el.getAttribute("data-slug")]);
    });

    var thisSlug = document.body.getAttribute("data-slug");
    var btn = document.getElementById("mark-complete-btn");
    if (btn && thisSlug) {
      var isDone = !!p[thisSlug];
      btn.textContent = isDone ? "✓ সম্পন্ন হিসেবে চিহ্নিত" : "এই লেসনটি সম্পন্ন হিসেবে চিহ্নিত করুন";
      btn.classList.toggle("btn-primary", !isDone);
      btn.classList.toggle("btn-ghost", isDone);
    }
  }

  function initProgress() {
    refreshProgressUI();
    var btn = document.getElementById("mark-complete-btn");
    if (btn) {
      btn.addEventListener("click", function () {
        var slug = document.body.getAttribute("data-slug");
        var p = getProgress();
        markComplete(slug, !p[slug]);
      });
    }
    var resetBtn = document.getElementById("reset-progress-btn");
    if (resetBtn) {
      resetBtn.addEventListener("click", function () {
        if (confirm("কোর্সের সব অগ্রগতি রিসেট করবেন? এটি আর ফিরিয়ে আনা যাবে না।")) {
          localStorage.removeItem(PROGRESS_KEY);
          refreshProgressUI();
        }
      });
    }
  }

  /* ---------------- Copy buttons ---------------- */
  function initCopyButtons() {
    document.querySelectorAll(".cb-copy").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var pre = btn.closest(".codeblock").querySelector("pre");
        var text = pre.innerText;
        navigator.clipboard.writeText(text).then(function () {
          var orig = btn.textContent;
          btn.textContent = "কপি হয়েছে!";
          setTimeout(function () { btn.textContent = orig; }, 1400);
        });
      });
    });
  }

  /* ---------------- Search ---------------- */
  function initSearch() {
    var input = document.getElementById("search-input");
    var results = document.getElementById("search-results");
    if (!input || !results) return;
    var index = null;
    var base = document.body.getAttribute("data-root") || "";

    function ensureIndex(cb) {
      if (index) return cb();
      fetch(base + "search-index.json").then(function (r) { return r.json(); }).then(function (data) {
        index = data; cb();
      }).catch(function () { index = []; cb(); });
    }

    function render(items, q) {
      if (!items.length) {
        results.innerHTML = '<div class="sr-empty">"' + escapeHtml(q) + '" এর জন্য কোনো ফল পাওয়া যায়নি।</div>';
        results.classList.add("open");
        return;
      }
      var html = items.slice(0, 12).map(function (it) {
        return '<a href="' + base + it.url + '"><div class="sr-title">' + highlight(it.title, q) + '</div>' +
          '<div class="sr-meta">' + escapeHtml(it.section) + ' — ' + escapeHtml(it.snippet) + '</div></a>';
      }).join("");
      results.innerHTML = html;
      results.classList.add("open");
    }

    function escapeHtml(s) { return (s || "").replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
    function highlight(text, q) {
      var esc = escapeHtml(text);
      if (!q) return esc;
      try {
        var re = new RegExp("(" + q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + ")", "ig");
        return esc.replace(re, "<mark>$1</mark>");
      } catch (e) { return esc; }
    }

    var debounceTimer;
    input.addEventListener("input", function () {
      var q = input.value.trim();
      clearTimeout(debounceTimer);
      if (!q) { results.classList.remove("open"); return; }
      debounceTimer = setTimeout(function () {
        ensureIndex(function () {
          var ql = q.toLowerCase();
          var scored = index.map(function (it) {
            var hay = (it.title + " " + it.keywords + " " + it.section).toLowerCase();
            var score = -1;
            if (it.title.toLowerCase().indexOf(ql) === 0) score = 3;
            else if (it.title.toLowerCase().indexOf(ql) > -1) score = 2;
            else if (hay.indexOf(ql) > -1) score = 1;
            return { it: it, score: score };
          }).filter(function (x) { return x.score > 0; })
            .sort(function (a, b) { return b.score - a.score; })
            .map(function (x) { return x.it; });
          render(scored, q);
        });
      }, 120);
    });
    document.addEventListener("click", function (e) {
      if (!results.contains(e.target) && e.target !== input) results.classList.remove("open");
    });
    input.addEventListener("keydown", function (e) {
      if (e.key === "Escape") { results.classList.remove("open"); input.blur(); }
    });
    // keyboard shortcut: "/" focuses search
    document.addEventListener("keydown", function (e) {
      if (e.key === "/" && document.activeElement.tagName !== "INPUT" && document.activeElement.tagName !== "TEXTAREA") {
        e.preventDefault(); input.focus();
      }
    });
  }

  /* ---------------- Code tracer (step execution) ---------------- */
  function initTracers() {
    document.querySelectorAll(".tracer[data-trace]").forEach(function (el) {
      var trace;
      try { trace = JSON.parse(el.getAttribute("data-trace")); } catch (e) { return; }
      var codeLines = el.querySelectorAll(".trace-code .cb-line");
      var memBox = el.querySelector(".trace-mem");
      var outBox = el.querySelector(".trace-out");
      var descBox = el.querySelector(".tracer-desc");
      var stepOf = el.querySelector(".tracer-step-of");
      var slider = el.querySelector(".trace-range");
      var playBtn = el.querySelector(".trace-play");
      var stepBtn = el.querySelector(".trace-step");
      var restartBtn = el.querySelector(".trace-restart");
      var speedSel = el.querySelector(".trace-speed");
      var idx = 0, playing = false, timer = null;

      function renderStep(i) {
        idx = Math.max(0, Math.min(i, trace.length - 1));
        codeLines.forEach(function (l, li) { l.classList.toggle("active-line", li === trace[idx].line); });
        var mem = trace[idx].vars || {};
        memBox.innerHTML = Object.keys(mem).length
          ? Object.keys(mem).map(function (k) { return '<span class="mem-card"><span class="k">' + k + ' =</span><span class="v">' + escapeAttr(mem[k]) + '</span></span>'; }).join("")
          : '<span style="color:var(--ink-faint);font-size:.85rem">(এখনো কোনো ভ্যারিয়েবল নেই)</span>';
        outBox.textContent = trace[idx].output || "";
        descBox.textContent = trace[idx].desc || "";
        stepOf.textContent = "ধাপ " + (idx + 1) + " / " + trace.length;
        slider.value = idx;
        restartBtn.disabled = idx === 0 && !playing;
        stepBtn.disabled = idx === trace.length - 1;
        if (idx === trace.length - 1) { stopPlay(); }
      }
      function escapeAttr(v) { return String(v).replace(/</g, "&lt;"); }
      function stopPlay() { playing = false; clearInterval(timer); playBtn.textContent = "▶ চালান"; }
      function startPlay() {
        if (idx >= trace.length - 1) idx = -1;
        playing = true; playBtn.textContent = "⏸ থামান";
        var speed = parseInt(speedSel.value, 10) || 1000;
        timer = setInterval(function () {
          if (idx >= trace.length - 1) { stopPlay(); return; }
          renderStep(idx + 1);
        }, speed);
      }
      playBtn.addEventListener("click", function () { playing ? stopPlay() : startPlay(); });
      stepBtn.addEventListener("click", function () { stopPlay(); renderStep(idx + 1); });
      restartBtn.addEventListener("click", function () { stopPlay(); renderStep(0); });
      slider.addEventListener("input", function () { stopPlay(); renderStep(parseInt(slider.value, 10)); });
      slider.max = trace.length - 1;
      renderStep(0);
    });
  }

  /* ---------------- Disclosures analytics-free toggle (native <details>) ---------------- */

  /* ---------------- Quiz ---------------- */
  function initQuizzes() {
    document.querySelectorAll(".quiz").forEach(function (quiz) {
      var questions = quiz.querySelectorAll(".quiz-q");
      var scoreBox = quiz.querySelector(".quiz-score");
      var submitBtn = quiz.querySelector(".quiz-submit");
      var retryBtn = quiz.querySelector(".quiz-retry");

      questions.forEach(function (q) {
        q.querySelectorAll(".quiz-opt").forEach(function (opt) {
          opt.addEventListener("click", function () {
            if (q.getAttribute("data-answered") === "true") return;
            q.querySelectorAll(".quiz-opt").forEach(function (o) { o.setAttribute("aria-pressed", "false"); });
            opt.setAttribute("aria-pressed", "true");
            q.setAttribute("data-selected", opt.getAttribute("data-idx"));
          });
        });
      });

      if (submitBtn) {
        submitBtn.addEventListener("click", function () {
          var correct = 0;
          questions.forEach(function (q) {
            var selected = q.getAttribute("data-selected");
            var correctIdx = q.getAttribute("data-correct");
            q.setAttribute("data-answered", "true");
            q.querySelectorAll(".quiz-opt").forEach(function (o) {
              if (o.getAttribute("data-idx") === correctIdx) o.classList.add("correct");
              else if (o.getAttribute("data-idx") === selected) o.classList.add("incorrect");
            });
            var explain = q.querySelector(".quiz-explain");
            if (explain) explain.classList.add("shown");
            if (selected === correctIdx) correct++;
          });
          var pct = Math.round((correct / questions.length) * 100);
          if (scoreBox) {
            var verdict = pct >= 80 ? "অসাধারণ! 🎉" : pct >= 50 ? "ভালো চেষ্টা — রিভিউ করে আবার চেষ্টা করুন।" : "চর্চা চালিয়ে যান — উপরের লেসনটি আবার পড়ুন।";
            scoreBox.innerHTML = '<div class="big">' + correct + ' / ' + questions.length + '</div><div>' + pct + '% — ' + verdict + '</div>';
            scoreBox.style.display = "block";
          }
          submitBtn.style.display = "none";
          if (retryBtn) retryBtn.style.display = "inline-flex";
        });
      }
      if (retryBtn) {
        retryBtn.addEventListener("click", function () {
          questions.forEach(function (q) {
            q.removeAttribute("data-answered"); q.removeAttribute("data-selected");
            q.querySelectorAll(".quiz-opt").forEach(function (o) { o.classList.remove("correct", "incorrect"); o.removeAttribute("aria-pressed"); });
            var explain = q.querySelector(".quiz-explain");
            if (explain) explain.classList.remove("shown");
          });
          if (scoreBox) scoreBox.style.display = "none";
          submitBtn.style.display = "inline-flex";
          retryBtn.style.display = "none";
        });
      }
    });
  }

  /* ---------------- Predict-output / fill-in-blank exercises ---------------- */
  function initExercises() {
    document.querySelectorAll(".exercise-box[data-answer]").forEach(function (box) {
      var answers = box.getAttribute("data-answer").split("|").map(function (s) { return s.trim().toLowerCase(); });
      var input = box.querySelector(".ex-input");
      var checkBtn = box.querySelector(".ex-check");
      var feedback = box.querySelector(".ex-feedback");
      var hintBtn = box.querySelector(".ex-hint-btn");
      var hint = box.querySelector(".ex-hint");
      var solBtn = box.querySelector(".ex-sol-btn");
      var sol = box.querySelector(".ex-sol");
      if (checkBtn) {
        checkBtn.addEventListener("click", function () {
          var val = (input.value || "").trim().toLowerCase().replace(/\s+/g, " ");
          var isCorrect = answers.some(function (a) { return a.replace(/\s+/g, " ") === val; });
          feedback.className = "ex-feedback shown " + (isCorrect ? "good" : "bad");
          feedback.textContent = isCorrect ? "সঠিক হয়েছে! " + (box.getAttribute("data-explain") || "") : "সঠিক হয়নি — আবার চেষ্টা করুন, অথবা ইঙ্গিতটি দেখুন।";
        });
      }
      if (hintBtn) hintBtn.addEventListener("click", function () { hint.style.display = hint.style.display === "block" ? "none" : "block"; });
      if (solBtn) solBtn.addEventListener("click", function () { sol.style.display = sol.style.display === "block" ? "none" : "block"; });
    });
  }

  /* ---------------- Live Playground (Pyodide) ---------------- */
  var pyodideReady = null;
  function loadPyodide_() {
    if (pyodideReady) return pyodideReady;
    pyodideReady = new Promise(function (resolve, reject) {
      var script = document.createElement("script");
      script.src = "https://cdn.jsdelivr.net/pyodide/v0.26.2/full/pyodide.js";
      script.onload = function () {
        window.loadPyodide().then(resolve).catch(reject);
      };
      script.onerror = reject;
      document.head.appendChild(script);
    });
    return pyodideReady;
  }

  function initRunners() {
    document.querySelectorAll("[data-runner]").forEach(function (wrap) {
      var editor = wrap.querySelector(".run-editor, #pg-editor");
      var output = wrap.querySelector(".run-output, #pg-output");
      var runBtn = wrap.querySelector(".run-btn");
      var resetBtn = wrap.querySelector(".run-reset");
      var starter = editor ? editor.value : "";
      if (!runBtn || !editor || !output) return;

      runBtn.addEventListener("click", function () {
        output.textContent = "আপনার ব্রাউজারে Python লোড হচ্ছে (শুধু প্রথমবার)…";
        runBtn.disabled = true;
        loadPyodide_().then(function (pyodide) {
          var code = editor.value;
          var capturedOut = "";
          pyodide.setStdout({ batched: function (s) { capturedOut += s + "\n"; } });
          pyodide.setStderr({ batched: function (s) { capturedOut += s + "\n"; } });
          try {
            pyodide.runPython(code);
            output.innerHTML = escapeHtml_(capturedOut || "(কোনো আউটপুট নেই)");
          } catch (err) {
            output.innerHTML = escapeHtml_(capturedOut) + '<span class="err">' + escapeHtml_(String(err)) + "</span>";
          }
          runBtn.disabled = false;
        }).catch(function (err) {
          output.innerHTML = '<span class="err">ব্রাউজারের ভেতরে Python ইঞ্জিন (Pyodide) লোড করা যায়নি। এর জন্য ইন্টারনেট সংযোগ প্রয়োজন। ' + escapeHtml_(String(err)) + "</span>";
          runBtn.disabled = false;
        });
      });
      if (resetBtn) resetBtn.addEventListener("click", function () { editor.value = starter; output.textContent = ""; });
    });
  }
  function escapeHtml_(s) { return String(s).replace(/[&<>]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;" }[c]; }); }

  /* ---------------- Init ---------------- */
  document.addEventListener("DOMContentLoaded", function () {
    initTheme();
    initSidebar();
    initProgress();
    initCopyButtons();
    initSearch();
    initTracers();
    initQuizzes();
    initExercises();
    initRunners();

    // open the sidebar module containing the current page
    var current = document.querySelector(".side-module a[aria-current='page']");
    if (current) { var det = current.closest("details"); if (det) det.open = true; current.scrollIntoView({ block: "center" }); }
  });
})();
