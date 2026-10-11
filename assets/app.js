/* SYAUTOMATION site behaviour: theme, language, currency, demos, forms, consent and chat. */
(function () {
  "use strict";
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var store = {
    get: function (k) { try { return localStorage.getItem(k); } catch (e) { return null; } },
    set: function (k, v) { try { localStorage.setItem(k, v); } catch (e) {} }
  };
  var SITE = window.SYA_SITE || { email: "", phone: "", whatsapp: "", formEndpoint: "/" };
  var root = document.documentElement;
  var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- Year ---------- */
  $$(".yr").forEach(function (el) { el.textContent = new Date().getFullYear(); });

  /* ---------- Theme ---------- */
  var themeBtn = $("#themeBtn"), themeLabel = $("#themeLabel");
  function themeName(t) { return t === "light" ? "Light" : t === "dark" ? "Dark" : "Auto"; }
  function setTheme(t) {
    if (t === "light" || t === "dark") root.setAttribute("data-theme", t); else root.removeAttribute("data-theme");
    store.set("sya-theme", t);
    if (themeLabel) themeLabel.textContent = (T("ui.theme") || "Theme") + ": " + (T("ui.theme_" + t) || themeName(t));
  }
  var theme = store.get("sya-theme") || "auto";
  if (themeBtn) themeBtn.addEventListener("click", function () {
    theme = theme === "auto" ? "light" : theme === "light" ? "dark" : "auto";
    setTheme(theme);
  });

  /* ---------- Mobile menu ---------- */
  var menuBtn = $("#menuBtn"), menu = $("#mobileMenu");
  if (menuBtn && menu) {
    menuBtn.addEventListener("click", function () {
      var open = menu.hidden;
      menu.hidden = !open;
      menuBtn.setAttribute("aria-expanded", String(open));
    });
    $$("a", menu).forEach(function (a) { a.addEventListener("click", function () { menu.hidden = true; menuBtn.setAttribute("aria-expanded", "false"); }); });
  }

  /* ---------- Language ---------- */
  var DICT = window.SYA_I18N || {};
  var LANGS = ["en", "es", "fr", "de", "ar", "hi"];
  var lang = store.get("sya-lang");
  if (LANGS.indexOf(lang) < 0) {
    var nav = (navigator.language || "en").slice(0, 2).toLowerCase();
    lang = LANGS.indexOf(nav) >= 0 ? nav : "en";
  }
  function T(key) { var d = DICT[lang] || {}; return d[key]; }
  function applyLang(l) {
    lang = l;
    root.setAttribute("lang", l);
    root.setAttribute("dir", l === "ar" ? "rtl" : "ltr");
    $$("[data-i18n]").forEach(function (el) {
      if (el.dataset.en === undefined) el.dataset.en = el.textContent;
      var v = (DICT[l] || {})[el.dataset.i18n];
      el.textContent = v !== undefined ? v : el.dataset.en;
    });
    $$("[data-i18n-html]").forEach(function (el) {
      if (el.dataset.enHtml === undefined) el.dataset.enHtml = el.innerHTML;
      var v = (DICT[l] || {})[el.dataset.i18nHtml];
      el.innerHTML = v !== undefined ? v : el.dataset.enHtml;
    });
    $$("[data-i18n-ph]").forEach(function (el) {
      if (el.dataset.enPh === undefined) el.dataset.enPh = el.getAttribute("placeholder") || "";
      var v = (DICT[l] || {})[el.dataset.i18nPh];
      el.setAttribute("placeholder", v !== undefined ? v : el.dataset.enPh);
    });
    var sel = $("#langSel"); if (sel) sel.value = l;
    store.set("sya-lang", l);
    setTheme(theme);
    renderChatQuick();
  }
  var langSel = $("#langSel");
  if (langSel) langSel.addEventListener("change", function () { applyLang(langSel.value); refreshPrices(); calc(); });

  /* ---------- Currency ---------- */
  var CUR = {
    USD: { f: 1, loc: "en-US" }, GBP: { f: 0.8, loc: "en-GB" }, EUR: { f: 0.93, loc: "en-IE" },
    AUD: { f: 1.53, loc: "en-US" }, CAD: { f: 1.37, loc: "en-US" }, AED: { f: 3.67, loc: "en-US" },
    SGD: { f: 1.33, loc: "en-US" }, INR: { f: 33, loc: "en-IN" }
  };
  function detectCurrency() {
    var tz = "";
    try { tz = Intl.DateTimeFormat().resolvedOptions().timeZone || ""; } catch (e) {}
    if (tz === "Europe/London") return "GBP";
    if (/^Europe\//.test(tz)) return "EUR";
    if (tz === "Asia/Kolkata" || tz === "Asia/Calcutta") return "INR";
    if (/^Australia\//.test(tz)) return "AUD";
    if (tz === "Asia/Dubai") return "AED";
    if (tz === "Asia/Singapore") return "SGD";
    if (/^America\/(Toronto|Vancouver|Edmonton|Winnipeg|Halifax|Regina|St_Johns)/.test(tz)) return "CAD";
    return "USD";
  }
  var cur = store.get("sya-cur");
  if (!CUR[cur]) cur = detectCurrency();
  var billing = "mo";
  function niceRound(v) {
    var step = v < 1000 ? 10 : v < 10000 ? 100 : 1000;
    return Math.max(step - 1, Math.round(v / step) * step - 1);
  }
  function convert(usd) { return cur === "USD" ? usd : niceRound(usd * CUR[cur].f); }
  function money(n) {
    try { return new Intl.NumberFormat(CUR[cur].loc, { style: "currency", currency: cur, maximumFractionDigits: 0 }).format(n); }
    catch (e) { return cur + " " + Math.round(n); }
  }
  function refreshPrices() {
    $$("[data-price]").forEach(function (el) {
      var usd = +el.dataset.price;
      var v = convert(usd);
      if (billing === "yr" && el.hasAttribute("data-mo")) v = v * 10;
      el.textContent = money(v);
    });
    $$(".per").forEach(function (el) { el.textContent = billing === "yr" ? " / year" : " / month"; });
    $$(".cur-name").forEach(function (el) { el.textContent = cur; });
    $$("[data-cur-seg] button").forEach(function (b) { b.setAttribute("aria-pressed", b.dataset.cur === cur ? "true" : "false"); });
    var sel = $("#curSel"); if (sel) sel.value = cur;
    var cf = $("#curField"); if (cf) cf.value = cur;
  }
  function setCurrency(c) { if (!CUR[c]) return; cur = c; store.set("sya-cur", c); refreshPrices(); calc(); }
  $$("[data-cur-seg]").forEach(function (seg) {
    seg.innerHTML = Object.keys(CUR).map(function (c) { return '<button type="button" data-cur="' + c + '" aria-pressed="false">' + c + "</button>"; }).join("");
    seg.addEventListener("click", function (e) { var b = e.target.closest("button[data-cur]"); if (b) setCurrency(b.dataset.cur); });
  });
  var curSel = $("#curSel");
  if (curSel) curSel.addEventListener("change", function () { setCurrency(curSel.value); });
  $$("[data-billing]").forEach(function (b) {
    b.addEventListener("click", function () {
      billing = b.dataset.billing;
      $$("[data-billing]").forEach(function (x) { x.setAttribute("aria-pressed", x === b ? "true" : "false"); });
      refreshPrices();
    });
  });

  /* ---------- Hero workflow demo ---------- */
  var scenarios = [
    { file: "missed-call-rescue.flow", saved: "23.5 h", steps: [
      ["!", "Missed call from a new patient", "+1 (555) 201-88·· · 6:42 pm", "0.0s", 1],
      ["1", "WhatsApp reply sent with booking link", "\"Sorry we missed you! Book here →\"", "0.8s"],
      ["2", "Appointment booked by the patient", "Thu 10:30 · Check-up · Dr. Mehta", "4m 12s"],
      ["3", "Reminder scheduled 24 hours before", "SMS + WhatsApp · rebook in one tap", "4m 13s"],
      ["4", "Review request queued after the visit", "Google review link · sent at 2:00 pm", "4m 13s"]] },
    { file: "quote-follow-up.flow", saved: "19.0 h", steps: [
      ["!", "Quote request from the website form", "Boiler repair · postcode M14 · urgent", "0.0s", 1],
      ["1", "Lead added to the CRM and owner alerted", "Pipeline: New enquiry · Slack alert", "1.1s"],
      ["2", "Quote drafted from the price list", "£240 + parts · sent for e-signature", "3m 05s"],
      ["3", "Signed quote turned into a booked job", "Calendar: Fri 8:00 am · van 2", "1d 2h"],
      ["4", "Invoice sent with a payment link", "Stripe · reminders at 3, 7 and 14 days", "1d 9h"]] },
    { file: "order-ops.flow", saved: "27.0 h", steps: [
      ["!", "New Shopify order", "#10482 · 3 items · ships to Dubai", "0.0s", 1],
      ["1", "Order synced to the stock sheet", "Ceramic mug (blue): 6 left", "0.6s"],
      ["2", "Low-stock alert sent to the supplier", "Reorder 120 units · draft PO attached", "0.9s"],
      ["3", "Customer question answered by AI", "\"When will it arrive?\" → tracking link", "2h 14m"],
      ["4", "Sale recorded in Xero", "Revenue + VAT categorised automatically", "2h 15m"]] }
  ];
  var list = $("#steps");
  if (list) {
    var tabs = $$(".run-tab"), current = 0, timer = null, userPicked = false;
    var esc = function (s) { return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;"); };
    var render = function (i) {
      var s = scenarios[i]; current = i;
      $("#runName").textContent = s.file;
      $("#savedHrs").textContent = s.saved;
      tabs.forEach(function (t, k) { t.setAttribute("aria-selected", k === i ? "true" : "false"); });
      list.innerHTML = s.steps.map(function (st) {
        return '<li class="step ' + (st[4] ? "trigger" : "done") + '"><span class="dot">' + esc(st[0]) + '</span><div class="step-body"><div class="step-title">' + esc(st[1]) + '</div><div class="step-meta">' + esc(st[2]) + '</div></div><span class="step-time">' + esc(st[3]) + "</span></li>";
      }).join("");
    };
    var play = function () {
      clearInterval(timer); if (reduce) return;
      var items = list.children, idx = 0; list.classList.add("playing");
      timer = setInterval(function () {
        if (idx < items.length) { items[idx].classList.add("lit"); idx++; }
        else {
          list.classList.remove("playing"); clearInterval(timer);
          if (!userPicked) setTimeout(function () { if (!userPicked) { render((current + 1) % scenarios.length); play(); } }, 3200);
        }
      }, 900);
    };
    tabs.forEach(function (t) { t.addEventListener("click", function () { userPicked = true; render(+t.dataset.s); play(); }); });
    render(0); play();
  }

  /* ---------- Calculator ---------- */
  var team = $("#team"), hrs = $("#hrs"), rate = $("#rate");
  function calc() {
    if (!team) return;
    var t = +team.value, h = +hrs.value, rUsd = +rate.value;
    var r = cur === "USD" ? rUsd : Math.round(rUsd * CUR[cur].f);
    var saved = t * h * 0.6, year = saved * r * 48;
    $("#teamOut").textContent = t;
    $("#hrsOut").textContent = h + " h";
    $("#rateOut").textContent = money(r);
    $("#outHrs").textContent = saved < 10 ? saved.toFixed(1) : Math.round(saved);
    $("#outYear").textContent = money(year);
    $("#outDays").textContent = (saved / 8).toFixed(1).replace(/\.0$/, "");
    $("#outRec").textContent = t <= 5 && saved < 15 ? "Starter" : t <= 20 ? "Growth" : "Scale";
  }
  [team, hrs, rate].forEach(function (el) { if (el) el.addEventListener("input", calc); });

  /* ---------- Contact: prefill, time zone, slots ---------- */
  var params = new URLSearchParams(location.search);
  var planSel = $("#aPlan"); if (planSel && params.get("plan")) planSel.value = params.get("plan");
  var bizSel = $("#aBiz"); if (bizSel && params.get("industry")) bizSel.value = params.get("industry");
  var userTz = "UTC";
  try { userTz = Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC"; } catch (e) {}
  var tzField = $("#tzField"); if (tzField) tzField.value = userTz;
  var tzNote = $("#tzNote"); if (tzNote) tzNote.textContent = "(times shown in " + userTz.replace(/_/g, " ") + ")";
  var slotsEl = $("#slots");
  if (slotsEl) {
    /* Call windows in UTC chosen to cover Asia, Europe and the Americas. */
    var UTC_HOURS = [4, 9, 13, 16, 20];
    var days = [], d = new Date();
    d.setUTCHours(0, 0, 0, 0);
    while (days.length < 5) {
      d = new Date(d.getTime() + 86400000);
      var wd = d.getUTCDay(); if (wd !== 0 && wd !== 6) days.push(new Date(d));
    }
    var dayFmt = new Intl.DateTimeFormat(undefined, { weekday: "short", day: "numeric", month: "short" });
    var timeFmt = new Intl.DateTimeFormat(undefined, { hour: "numeric", minute: "2-digit" });
    var dKey = new Intl.DateTimeFormat("en-CA", { year: "numeric", month: "2-digit", day: "2-digit", timeZone: userTz });
    var groups = {};
    days.forEach(function (day) {
      UTC_HOURS.forEach(function (h) {
        var s = new Date(day.getTime() + h * 3600000);
        var localHour = +new Intl.DateTimeFormat("en-GB", { hour: "2-digit", hour12: false, timeZone: userTz }).format(s);
        if (localHour < 8 || localHour > 19) return; /* only offer sensible local hours */
        var k = dKey.format(s);
        (groups[k] = groups[k] || { label: dayFmt.format(s), slots: [] }).slots.push(s);
      });
    });
    var keys = Object.keys(groups).sort().slice(0, 5);
    slotsEl.innerHTML = keys.length ? keys.map(function (k) {
      return '<div class="slot-day"><b>' + groups[k].label + '</b><div class="pills">' + groups[k].slots.map(function (s) {
        return '<label class="pill"><input type="radio" name="slot" value="' + s.toISOString() + '"><span>' + timeFmt.format(s) + "</span></label>";
      }).join("") + "</div></div>";
    }).join("") : '<p class="fine">We\'ll email you times that suit your time zone.</p>';
  }

  /* ---------- World clock ---------- */
  var clock = $("#worldClock");
  function tick() {
    $$(".clock-row", clock).forEach(function (row) {
      var tz = row.dataset.tz, now = new Date();
      var parts = new Intl.DateTimeFormat("en-GB", { hour: "2-digit", minute: "2-digit", weekday: "short", hour12: false, timeZone: tz }).formatToParts(now);
      var get = function (t) { var p = parts.filter(function (x) { return x.type === t; })[0]; return p ? p.value : ""; };
      var h = +get("hour"), wd = get("weekday");
      row.children[1].textContent = get("hour") + ":" + get("minute");
      var open = h >= 9 && h < 18 && wd !== "Sat" && wd !== "Sun";
      row.children[2].textContent = open ? "Open" : "Closed";
      row.children[2].className = "status " + (open ? "on" : "off");
    });
  }
  if (clock) { tick(); setInterval(tick, 30000); }

  /* ---------- Copy buttons ---------- */
  $$("[data-copy]").forEach(function (b) {
    b.addEventListener("click", function () {
      var text = b.dataset.copy, done = function () { b.textContent = "Copied"; setTimeout(function () { b.textContent = "Copy"; }, 1600); };
      if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(text).then(done, function () { selectSibling(b); });
      else selectSibling(b);
    });
  });
  function selectSibling(b) {
    var span = b.previousElementSibling; if (!span) return;
    var r = document.createRange(); r.selectNodeContents(span);
    var s = window.getSelection(); s.removeAllRanges(); s.addRange(r);
  }

  /* ---------- Forms (Netlify Forms when hosted) ---------- */
  var EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
  /* Sends a form either to Netlify Forms ("/") or to an AJAX endpoint such as FormSubmit. */
  function send(data, subject) {
    var ep = SITE.formEndpoint || "/";
    if (ep === "/") {
      return fetch("/", { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" }, body: new URLSearchParams(data).toString() })
        .then(function (r) { if (!r.ok) throw new Error("status " + r.status); });
    }
    var obj = {};
    data.forEach(function (v, k) { if (k === "form-name" || k === "bot_field") return; obj[k] = obj[k] ? obj[k] + ", " + v : v; });
    obj._subject = subject; obj._template = "table"; obj._captcha = "false";
    if (data.get("bot_field")) obj._honey = data.get("bot_field");
    return fetch(ep, { method: "POST", headers: { "Content-Type": "application/json", Accept: "application/json" }, body: JSON.stringify(obj) })
      .then(function (r) { return r.json().catch(function () { return {}; }).then(function (j) { if (!r.ok || String(j.success) !== "true") throw new Error("send failed"); }); });
  }
  function postForm(form) {
    var subj = form.dataset.form === "partner" ? "New partner application" : "New automation audit request";
    var name = (form.querySelector("[name=name]") || {}).value;
    return send(new FormData(form), subj + (name ? " from " + name : ""));
  }
  $$("form[data-form]").forEach(function (form) {
    var msg = $(".form-msg", form);
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var firstBad = null;
      $$("[required]", form).forEach(function (el) {
        var bad = el.type === "checkbox" ? !el.checked : el.type === "email" ? !EMAIL_RE.test(el.value.trim()) : !el.value.trim();
        el.setAttribute("aria-invalid", bad ? "true" : "false");
        if (bad && !firstBad) firstBad = el;
      });
      if (firstBad) {
        msg.className = "form-msg"; msg.hidden = false;
        msg.textContent = firstBad.type === "checkbox" ? "Please tick the consent box so we can reply to you." :
          firstBad.type === "email" ? "Please enter a valid email address, like name@business.com." : "Please fill in the highlighted fields.";
        firstBad.focus();
        return;
      }
      var btn = $("button[type=submit]", form); btn.disabled = true;
      postForm(form).then(function () {
        msg.className = "form-msg ok"; msg.hidden = false;
        msg.textContent = form.dataset.form === "partner" ?
          "Thanks! Your application is in. We'll reply within two business days." :
          "Thanks! Your audit request is in. We'll email you within one business day to confirm your time.";
        form.reset(); refreshPrices();
        track("form_submit", { form: form.dataset.form });
      }).catch(function () {
        msg.className = "form-msg"; msg.hidden = false;
        msg.textContent = "We couldn't send the form from here. Please email " + SITE.email + " and we'll reply within one business day.";
      }).then(function () { btn.disabled = false; });
    });
  });
  var news = $("#newsForm"), newsMsg = $("#newsMsg");
  if (news) news.addEventListener("submit", function (e) {
    e.preventDefault();
    var input = $("input", news);
    if (!EMAIL_RE.test(input.value.trim())) { newsMsg.textContent = "Please enter a valid email address."; input.focus(); return; }
    var fd = new FormData(); fd.append("form-name", "newsletter"); fd.append("email", input.value.trim());
    send(fd, "New newsletter subscriber")
      .then(function () { newsMsg.textContent = "You're subscribed. Look out for our next email."; news.reset(); })
      .catch(function () { newsMsg.textContent = "We couldn't subscribe you from here. Email " + SITE.email + " to join the list."; });
  });

  /* ---------- Cookie consent ---------- */
  var ck = $("#cookie"), prefs = $("#cookiePrefs");
  function getConsent() { try { return JSON.parse(store.get("sya-consent") || "null"); } catch (e) { return null; } }
  function saveConsent(c) {
    c.date = new Date().toISOString();
    store.set("sya-consent", JSON.stringify(c));
    ck.hidden = true;
    applyConsent(c);
  }
  function openCookies() {
    var c = getConsent() || {};
    $("#ckAnalytics").checked = !!c.analytics; $("#ckMarketing").checked = !!c.marketing;
    prefs.hidden = false; $("#ckSave").hidden = false; $("#ckPrefs").hidden = true;
    ck.hidden = false;
  }
  function applyConsent(c) {
    if (c && c.analytics) loadAnalytics();
    if (c && c.marketing) loadMarketing();
  }
  /* Paste your analytics snippet here. It only runs after the visitor accepts analytics cookies. */
  var analyticsLoaded = false;
  function loadAnalytics() {
    if (analyticsLoaded) return; analyticsLoaded = true;
    /* Example (Plausible):
       var s = document.createElement("script"); s.defer = true; s.dataset.domain = "syautomation.com";
       s.src = "https://plausible.io/js/script.js"; document.head.appendChild(s); */
  }
  function loadMarketing() { /* Add Meta / LinkedIn pixels here if you run ads. */ }
  function track(name, props) { if (window.plausible) window.plausible(name, { props: props }); }
  if (ck) {
    var existing = getConsent();
    if (!existing) ck.hidden = false; else applyConsent(existing);
    $("#ckAccept").addEventListener("click", function () { saveConsent({ analytics: true, marketing: true }); });
    $("#ckReject").addEventListener("click", function () { saveConsent({ analytics: false, marketing: false }); });
    $("#ckPrefs").addEventListener("click", openCookies);
    $("#ckSave").addEventListener("click", function () { saveConsent({ analytics: $("#ckAnalytics").checked, marketing: $("#ckMarketing").checked }); });
    var cs = $("#cookieSettings"); if (cs) cs.addEventListener("click", function (e) { e.preventDefault(); openCookies(); });
    $$("[data-open-cookies]").forEach(function (b) { b.addEventListener("click", openCookies); });
  }

  /* ---------- Chat assistant (demo) ---------- */
  var fab = $("#chatFab"), chat = $("#chat"), log = $("#chatLog"), quick = $("#chatQuick"), chatForm = $("#chatForm"), chatInput = $("#chatInput");
  var QUICK = [
    ["chat.q1", "Pricing"], ["chat.q2", "How fast is setup?"], ["chat.q3", "Do you work in my country?"],
    ["chat.q4", "Is my data safe?"], ["chat.q5", "Book an audit"]
  ];
  function renderChatQuick() {
    if (!quick) return;
    quick.innerHTML = QUICK.map(function (q) { return '<button type="button" data-q="' + q[1] + '">' + (T(q[0]) || q[1]) + "</button>"; }).join("");
  }
  function addMsg(html, who) {
    var m = document.createElement("div"); m.className = "msg " + who; m.innerHTML = html; log.appendChild(m);
    log.scrollTop = log.scrollHeight; return m;
  }
  function answer(q) {
    var s = q.toLowerCase();
    var has = function () { for (var i = 0; i < arguments.length; i++) if (s.indexOf(arguments[i]) >= 0) return true; return false; };
    if (has("price", "pricing", "cost", "how much", "fee", "precio", "prix", "preis", "سعر", "कीमत"))
      return "Our plans are <b>Starter</b> at " + money(convert(149)) + "/month (+ " + money(convert(750)) + " setup), <b>Growth</b> at " + money(convert(399)) + "/month (+ " + money(convert(2400)) + " setup) and <b>Scale</b> from " + money(convert(899)) + "/month. Single automations start at " + money(convert(300)) + ". <a href=\"pricing.html\">Compare plans</a>.";
    if (has("fast", "long", "time", "when", "days", "quick"))
      return "Starter goes live in about <b>7 days</b>, Growth in <b>14 days</b> and Scale in around <b>30 days</b>, counted from your audit call.";
    if (has("country", "countries", "where", "international", "worldwide", "india", "uk", "usa", "dubai", "uae", "australia", "canada", "europe", "language"))
      return "Yes, we work with small businesses worldwide, fully remotely. We schedule calls in your time zone, bill in 8 currencies and build assistants that speak your customers' languages.";
    if (has("data", "safe", "secure", "security", "gdpr", "privacy", "hipaa"))
      return "Your data stays in accounts your business owns. We use least-privilege access, encrypted credential storage and sign a data processing agreement. <a href=\"trust.html\">See our security practices</a>.";
    if (has("book", "audit", "call", "demo", "meeting", "start"))
      return "Great! The audit is free and takes 30 minutes. <a href=\"contact.html#audit\">Pick a time in your time zone</a>.";
    if (has("dentist", "dental", "clinic", "doctor", "physio")) return "For clinics we usually start with an AI receptionist and WhatsApp reminders, which cut no-shows by 30–50%. <a href=\"industries.html#clinics\">See the clinic plan</a>.";
    if (has("salon", "spa", "barber", "beauty")) return "For salons we build Instagram and WhatsApp booking, rebooking nudges and a review engine. <a href=\"industries.html#salons\">See the salon plan</a>.";
    if (has("plumb", "electric", "hvac", "clean", "trade", "builder")) return "For trades we start with missed-call text-back, quote follow-up and automatic invoices. <a href=\"industries.html#home-services\">See the trades plan</a>.";
    if (has("shop", "store", "shopify", "ecommerce", "e-commerce", "woocommerce", "amazon")) return "For online stores we build a support assistant with order tracking, stock sync and accounting sync. <a href=\"industries.html#ecommerce\">See the e-commerce plan</a>.";
    if (has("restaurant", "cafe", "café", "bar", "food")) return "For restaurants we build a WhatsApp reservation assistant, reminders and review requests. <a href=\"industries.html#restaurants\">See the hospitality plan</a>.";
    if (has("human", "person", "talk to", "email", "contact", "speak"))
      return "You can reach a person at <b>" + SITE.email + "</b>" + (SITE.phone ? " or on WhatsApp at <b>" + SITE.phone + "</b>" : "") + ". We reply within one business day.";
    if (has("whatsapp", "chatbot", "bot", "assistant", "voice", "phone") || /\bai\b/.test(s))
      return "We build AI assistants for your website, WhatsApp and Instagram, and AI voice receptionists that answer calls 24/7. This chat is a simple demo. <a href=\"services.html#communication\">See communication services</a>.";
    if (/^(hi|hello|hey|hola|bonjour|hallo|namaste|مرحبا)\b/.test(s.trim()))
      return "Hello! What would you like to automate in your business?";
    return "Good question. I'm a demo assistant, so I'll pass that to the team. Meanwhile you can <a href=\"contact.html#audit\">book a free audit</a> or email <b>" + SITE.email + "</b>.";
  }
  function ask(q, label) {
    if (!q.trim()) return;
    addMsg((label || q).replace(/</g, "&lt;"), "me");
    var t = addMsg('<span class="typing" aria-label="Typing"><i></i><i></i><i></i></span>', "bot");
    setTimeout(function () { t.innerHTML = answer(q); log.scrollTop = log.scrollHeight; }, reduce ? 0 : 650);
  }
  if (fab && chat) {
    var greeted = false;
    var toggle = function (open) {
      chat.hidden = !open; fab.setAttribute("aria-expanded", String(open));
      if (open && !greeted) { greeted = true; addMsg(T("chat.hello") || "Hi! I'm the SYAUTOMATION assistant. Ask me about services, pricing or timelines.", "bot"); }
      if (open) chatInput.focus();
    };
    fab.addEventListener("click", function () { toggle(chat.hidden); });
    $("#chatClose").addEventListener("click", function () { toggle(false); fab.focus(); });
    document.addEventListener("keydown", function (e) { if (e.key === "Escape" && !chat.hidden) { toggle(false); fab.focus(); } });
    quick.addEventListener("click", function (e) { var b = e.target.closest("button[data-q]"); if (b) ask(b.dataset.q, b.textContent); });
    chatForm.addEventListener("submit", function (e) { e.preventDefault(); ask(chatInput.value); chatInput.value = ""; });
  }

  /* ---------- Init ---------- */
  applyLang(lang);
  refreshPrices();
  calc();
})();
