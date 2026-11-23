(function () {
  "use strict";

  var C = window.HOME_CONFIG;
  var F = C.features || {};
  var ADHKAR = window.ADHKAR || null;
  if (!ADHKAR) F.adhkar = false; // run scripts/fetch_assets.py --adhkar to enable
  var $ = function (id) { return document.getElementById(id); };
  var stage = $("stage");
  var onTV = typeof window.tizen !== "undefined" && tizen.application;

  var CLOCK_OFFSET = 0;
  (function () {
    var m = !onTV && /[?&]now=([^&]+)/.exec(location.search);
    if (m) CLOCK_OFFSET = new Date(decodeURIComponent(m[1])).getTime() - Date.now();
  })();
  function nowDate() { return new Date(Date.now() + CLOCK_OFFSET); }

  var KEY = { LEFT: 37, UP: 38, RIGHT: 39, DOWN: 40, ENTER: 13, BACK: 10009, ESC: 27 };

  function store(k, v) {
    try {
      if (v === undefined) return JSON.parse(localStorage.getItem("home." + k));
      localStorage.setItem("home." + k, JSON.stringify(v));
    } catch (e) { return null; }
  }

  /* ---------------- fit 1920×1080 to the screen ---------------- */
  function fit() {
    var s = Math.min(window.innerWidth / 1920, window.innerHeight / 1080);
    stage.style.transform = "translate(" + (window.innerWidth - 1920 * s) / 2 + "px," +
      (window.innerHeight - 1080 * s) / 2 + "px) scale(" + s + ")";
  }
  window.addEventListener("resize", fit);
  fit();

  /* ---------------- stars ---------------- */
  (function () {
    var box = $("stars"), html = "";
    for (var i = 0; i < 70; i++) {
      var size = Math.random() < 0.15 ? 3 : 2;
      html += '<i class="star" style="left:' + (Math.random() * 100).toFixed(2) + "%;top:" +
        (Math.random() * 62).toFixed(2) + "%;width:" + size + "px;height:" + size + "px;animation-delay:" +
        (Math.random() * 4).toFixed(2) + "s;animation-duration:" + (3 + Math.random() * 4).toFixed(2) + 's"></i>';
    }
    box.innerHTML = html;
  })();

  /* ---------------- clock, greeting, phase ---------------- */
  var DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  var MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  function pad(n) { return (n < 10 ? "0" : "") + n; }

  function phaseFor(h) {
    if (h >= 5 && h < 12) return "morning";
    if (h >= 12 && h < 17) return "day";
    if (h >= 17 && h < 22) return "evening";
    return "night";
  }
  var GREET = { morning: "Good morning", day: "Good afternoon", evening: "Good evening", night: "Sweet dreams soon" };
  var EYEBROW = {
    morning: "A fresh start",
    day: "Welcome home",
    evening: "Welcome home",
    night: "Late night"
  };

  function tick() {
    var d = nowDate(), h = d.getHours();
    $("clock").innerHTML = pad(h) + '<span class="colon">:</span>' + pad(d.getMinutes());
    var ds = DAYS[d.getDay()] + " · " + d.getDate() + " " + MONTHS[d.getMonth()];
    $("date").textContent = ds;
    $("ambClock").textContent = pad(h) + ":" + pad(d.getMinutes());
    $("ambDate").textContent = DAYS[d.getDay()] + " " + d.getDate() + " " + MONTHS[d.getMonth()];
    var ph = phaseFor(h);
    if (stage.getAttribute("data-phase") !== ph) stage.setAttribute("data-phase", ph);
    var weekend = d.getDay() === 0 || d.getDay() === 6 || (d.getDay() === 5 && h >= 17);
    $("greet").textContent = GREET[ph];
    $("eyebrow").textContent = weekend && ph !== "night" ? "Hello, weekend" : EYEBROW[ph];
  }
  var NAMES = C.names.length > 1 ? C.names.slice(0, -1).join(", ") + " & " + C.names[C.names.length - 1] : C.names[0];
  $("names").textContent = NAMES;
  $("monoA").textContent = C.names[0].charAt(0);
  $("monoB").textContent = C.names.length > 1 ? C.names[C.names.length - 1].charAt(0) : "";
  if (C.names.length < 2) document.querySelector(".mono-heart").style.display = "none";
  tick();
  setInterval(tick, 1000);

  /* ---------------- rotating messages ---------------- */
  var msgIdx = Math.floor(Math.random() * C.messages.length);
  function isArabic(s) { return /[؀-ۿ]/.test(s); }
  function showMessage(first) {
    var el = $("message"), text = C.messages[msgIdx % C.messages.length];
    msgIdx++;
    var apply = function () {
      el.textContent = text;
      el.className = "message" + (isArabic(text) ? " ar" : "");
      $("ambMsg").textContent = isArabic(text) ? "" : text;
    };
    if (first) { apply(); return; }
    el.classList.add("out");
    setTimeout(function () { apply(); }, 900);
  }
  showMessage(true);
  setInterval(showMessage, 11000);

  /* ---------------- days together ---------------- */
  if (C.since) {
    var days = Math.floor((Date.now() - new Date(C.since + "T00:00:00").getTime()) / 864e5);
    if (days > 0) {
      var t = $("together");
      t.innerHTML = "♥ &nbsp;<b>" + days.toLocaleString("en-GB") + "</b> days together";
      t.hidden = false;
    }
  }

  /* ---------------- right-hand card: prayer times, or a "tonight" card ---------------- */
  if (!F.prayer) {
    $("prayer").innerHTML = '<div class="moment-art"><i class="ring r1"></i><i class="ring r2"></i><i class="ring r3"></i>' +
      '<div class="pair">' + $("monoA").textContent + (C.names.length > 1 ? "<span>&amp;</span>" + $("monoB").textContent : "") + "</div></div>" +
      '<div class="moment-caption"><div class="k">Tonight</div><div class="v" id="tonightLine"></div></div>';
    var LINES = { morning: "Coffee first, then the world.", day: "A quiet afternoon at home.", evening: "Lights low. Something good on.", night: "One last episode, then sleep." };
    var updLine = function () { $("tonightLine").textContent = LINES[phaseFor(nowDate().getHours())]; };
    updLine();
    setInterval(updLine, 60000);
    $("hijri").style.display = "none";
  }
  (function () {
    var box = $("photos");
    if (!C.photos || !C.photos.length) return;
    C.photos.forEach(function (src) {
      var d = document.createElement("div");
      d.className = "ph";
      d.style.backgroundImage = "url('" + src + "')";
      box.appendChild(d);
    });
    var i = 0, nodes = box.children;
    var next = function () {
      for (var j = 0; j < nodes.length; j++) nodes[j].classList.remove("on");
      nodes[i % nodes.length].classList.add("on");
      i++;
    };
    next();
    setInterval(next, 12000);
  })();

  /* ---------------- weather (Open-Meteo) ---------------- */
  var ICONS = {
    sun: '<svg viewBox="0 0 64 64" fill="none" stroke="#ffd36b" stroke-width="3" stroke-linecap="round"><circle cx="32" cy="32" r="11" fill="#ffd36b" stroke="none"/><path d="M32 8v7M32 49v7M8 32h7M49 32h7M15 15l5 5M44 44l5 5M15 49l5-5M44 20l5-5"/></svg>',
    moon: '<svg viewBox="0 0 64 64"><path d="M42 44a18 18 0 0 1-20-28 18 18 0 1 0 24 24 18 18 0 0 1-4 4z" fill="#dfe4ff"/></svg>',
    partly: '<svg viewBox="0 0 64 64" fill="none"><circle cx="24" cy="24" r="10" fill="#ffd36b"/><path d="M20 48h26a9 9 0 0 0 0-18 13 13 0 0 0-25 3 7.5 7.5 0 0 0-1 15z" fill="#eef1f8"/></svg>',
    cloud: '<svg viewBox="0 0 64 64"><path d="M18 46h28a10 10 0 0 0 0-20 14 14 0 0 0-27 4 8 8 0 0 0-1 16z" fill="#e3e7f0"/></svg>',
    rain: '<svg viewBox="0 0 64 64" fill="none" stroke="#7cc4ff" stroke-width="3" stroke-linecap="round"><path d="M18 38h28a10 10 0 0 0 0-20 14 14 0 0 0-27 4 8 8 0 0 0-1 16z" fill="#e3e7f0" stroke="none"/><path d="M24 44l-3 8M34 44l-3 8M44 44l-3 8"/></svg>',
    snow: '<svg viewBox="0 0 64 64" fill="#fff"><path d="M18 38h28a10 10 0 0 0 0-20 14 14 0 0 0-27 4 8 8 0 0 0-1 16z" fill="#e3e7f0"/><circle cx="23" cy="47" r="2.5"/><circle cx="33" cy="51" r="2.5"/><circle cx="43" cy="47" r="2.5"/></svg>',
    fog: '<svg viewBox="0 0 64 64" fill="none" stroke="#dfe3ea" stroke-width="3.5" stroke-linecap="round"><path d="M12 24h40M8 34h44M14 44h38"/></svg>',
    storm: '<svg viewBox="0 0 64 64"><path d="M18 36h28a10 10 0 0 0 0-20 14 14 0 0 0-27 4 8 8 0 0 0-1 16z" fill="#c9cfdc"/><path d="M34 38l-8 12h7l-3 10 10-14h-7l3-8z" fill="#ffd36b"/></svg>'
  };
  function wx(code, isDay) {
    if (code === 0) return [isDay ? "sun" : "moon", "Clear"];
    if (code <= 2) return [isDay ? "partly" : "moon", "Partly cloudy"];
    if (code === 3) return ["cloud", "Cloudy"];
    if (code === 45 || code === 48) return ["fog", "Foggy"];
    if (code >= 51 && code <= 67) return ["rain", code >= 61 ? "Rain" : "Drizzle"];
    if (code >= 71 && code <= 77) return ["snow", "Snow"];
    if (code >= 80 && code <= 82) return ["rain", "Showers"];
    if (code >= 85 && code <= 86) return ["snow", "Snow showers"];
    if (code >= 95) return ["storm", "Thunderstorm"];
    return ["cloud", ""];
  }
  function loadWeather() {
    var url = "https://api.open-meteo.com/v1/forecast?latitude=" + C.city.lat + "&longitude=" + C.city.lon +
      "&current=temperature_2m,weather_code,is_day&daily=temperature_2m_max,temperature_2m_min&timezone=auto&forecast_days=1";
    var x = new XMLHttpRequest();
    x.open("GET", url);
    x.timeout = 10000;
    x.onload = function () {
      try {
        var r = JSON.parse(x.responseText), cur = r.current, hh = nowDate().getHours();
        var w = wx(cur.weather_code, CLOCK_OFFSET ? (hh >= 7 && hh < 18) : cur.is_day);
        $("wIcon").innerHTML = ICONS[w[0]];
        $("wTemp").textContent = Math.round(cur.temperature_2m) + "°";
        $("wDesc").textContent = w[1] + "  ·  " + Math.round(r.daily.temperature_2m_max[0]) + "° / " + Math.round(r.daily.temperature_2m_min[0]) + "°";
        $("wCity").textContent = C.city.name;
        $("weather").hidden = false;
      } catch (e) { /* keep hidden */ }
    };
    x.send();
  }
  if (F.weather !== false) { loadWeather(); setInterval(loadWeather, 30 * 60 * 1000); }

  /* ---------------- apps ---------------- */
  function wordmark(a) {
    switch (a.theme) {
      case "youtube": return '<div class="wm wm-youtube"><i class="play"></i>YouTube</div>';
      case "netflix": return '<div class="wm wm-netflix">NETFLIX</div>';
      case "prime":   return '<div class="wm wm-prime">prime<small>VIDEO</small></div>';
      case "disney":  return '<div class="wm wm-disney">Disney<sup>+</sup></div>';
      case "apple":   return '<div class="wm wm-apple">Apple TV</div>';
      default:        return '<div class="wm wm-generic">' + a.label + "</div>";
    }
  }

  var zone = "tiles";
  var tiles = [], focus = 0, lastUsed = store("last");

  function build(installed) {
    var rail = $("rail");
    C.apps.forEach(function (a) {
      var hit = null;
      for (var i = 0; i < installed.length; i++) {
        var ap = installed[i];
        if (a.match.test(ap.name || "") || a.match.test(ap.id || "")) { hit = ap; break; }
      }
      if (!hit) return; // only show apps that are installed
      var el = document.createElement("div");
      el.className = "tile t-" + a.theme;
      el.innerHTML = wordmark(a);
      rail.appendChild(el);
      tiles.push({ cfg: a, el: el, appId: hit ? hit.id : null });
    });
    var start = 0;
    for (var k = 0; k < tiles.length; k++) if (tiles[k].cfg.key === lastUsed) start = k;
    if (!lastUsed) for (var m = 0; m < tiles.length; m++) if (tiles[m].cfg.key === "youtube") { start = m; break; }
    setFocus(start);
  }

  function setFocus(i) {
    if (!tiles.length) return;
    focus = Math.max(0, Math.min(tiles.length - 1, i));
    tiles.forEach(function (t, j) {
      t.el.classList.toggle("focus", zone === "tiles" && j === focus);
      var dot = t.el.querySelector(".last-dot");
      if (t.cfg.key === lastUsed && !dot) { dot = document.createElement("i"); dot.className = "last-dot"; t.el.appendChild(dot); }
    });
    var t = tiles[focus];
    $("focusTag").textContent = t.cfg.label + "  —  " + t.cfg.tag;
    $("focusLast").textContent = t.cfg.key === lastUsed ? "Where you left off" : "";
    // keep focused tile within the visible rail
    var step = 268 + 34, visible = 1920 - 220, x = focus * step;
    var offset = Math.max(0, Math.min(x - visible + 268 + 40, tiles.length * step - 34 - visible));
    if (x - offset < 0) offset = x;
    $("rail").style.transform = "translateX(" + -Math.max(0, offset) + "px)";
  }

  function toast(text, ms) {
    var el = $("toast");
    el.textContent = text;
    el.classList.add("show");
    clearTimeout(toast._t);
    toast._t = setTimeout(function () { el.classList.remove("show"); }, ms || 2600);
  }

  function launch() {
    var t = tiles[focus];
    if (!t) return;
    lastUsed = t.cfg.key;
    store("last", lastUsed);
    t.el.classList.remove("launch"); void t.el.offsetWidth; t.el.classList.add("launch");
    setTimeout(function () { t.el.classList.remove("launch"); setFocus(focus); }, 900);
    if (!onTV) { toast("Opening " + t.cfg.label + "…"); return; }
    tizen.application.launch(t.appId, function () {}, function () { toast("Couldn't open " + t.cfg.label); });
  }

  if (onTV) {
    try {
      tizen.application.getAppsInfo(function (list) {
        build(list.map(function (a) { return { id: a.id, name: a.name }; }));
      }, function () { build([]); });
    } catch (e) { build([]); }
  } else {
    // Browser preview: pretend every configured app is installed.
    build(C.apps.map(function (a) { return { id: a.key, name: a.label }; }));
  }

  /* ======================= prayer times ======================= */
  var PRAYERS = [["Fajr", "الفجر"], ["Dhuhr", "الظهر"], ["Asr", "العصر"], ["Maghrib", "المغرب"], ["Isha", "العشاء"]];
  var prayerDays = {}, today = null, tomorrow = null, prevNext = null;
  function ymd(d) { return d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate()); }
  function hm(d) { return pad(d.getHours()) + ":" + pad(d.getMinutes()); }
  function at(d, s) { var p = String(s).slice(0, 5).split(":"); return new Date(d.getFullYear(), d.getMonth(), d.getDate(), +p[0], +p[1], 0, 0); }
  var P = C.prayer || { method: 3, school: 0, tune: {} };
  var PSIG = P.method + ":" + (P.school || 0) + ":" + JSON.stringify(P.tune || {}) + ":" + C.city.lat + "," + C.city.lon;

  function fetchDay(d, cb) {
    var key = ymd(d), cached = prayerDays[key] || store("pt." + key);
    if (cached && cached.m === PSIG) { prayerDays[key] = cached; cb(cached); return; }
    var t = P.tune || {};
    // aladhan tune order: Imsak,Fajr,Sunrise,Dhuhr,Asr,Maghrib,Sunset,Isha,Midnight
    var tune = [0, t.Fajr || 0, 0, t.Dhuhr || 0, t.Asr || 0, t.Maghrib || 0, 0, t.Isha || 0, 0].join(",");
    var url = "https://api.aladhan.com/v1/timings/" + pad(d.getDate()) + "-" + pad(d.getMonth() + 1) + "-" + d.getFullYear() +
      "?latitude=" + C.city.lat + "&longitude=" + C.city.lon + "&method=" + P.method + "&school=" + (P.school || 0) + "&tune=" + tune;
    var x = new XMLHttpRequest();
    x.open("GET", url);
    x.timeout = 12000;
    x.onload = function () {
      try {
        var r = JSON.parse(x.responseText).data, h = r.date.hijri;
        var v = { t: r.timings, h: h.day + " " + h.month.ar + " " + h.year + " هـ", m: PSIG };
        prayerDays[key] = v; store("pt." + key, v); cb(v);
      } catch (e) {}
    };
    x.send();
  }
  function loadPrayers() {
    var now = nowDate(), tm = new Date(now.getTime() + 864e5);
    fetchDay(now, function (v) { today = { d: now, v: v }; renderPrayer(); });
    fetchDay(tm, function (v) { tomorrow = { d: tm, v: v }; renderPrayer(); });
  }
  function schedule() {
    var list = [];
    [today, tomorrow].forEach(function (day) {
      if (!day) return;
      PRAYERS.forEach(function (p) { list.push({ name: p[0], ar: p[1], at: at(day.d, day.v.t[p[0]]), isToday: day === today }); });
    });
    return list;
  }
  function renderPrayer() {
    if (!today) return;
    var now = nowDate();
    if (ymd(today.d) !== ymd(now)) { today = tomorrow = null; loadPrayers(); return; }
    if (!F.prayer) { refreshActions(); return; }
    $("hijri").textContent = today.v.h;
    var sched = schedule(), next = null;
    for (var i = 0; i < sched.length; i++) if (sched[i].at > now) { next = sched[i]; break; }
    var html = "";
    PRAYERS.forEach(function (p) {
      var t = at(today.d, today.v.t[p[0]]);
      var cls = next && next.isToday && next.name === p[0] ? "next" : (t <= now ? "past" : "");
      html += '<div class="p-item ' + cls + '">' + p[1] + "<b>" + hm(t) + "</b></div>";
    });
    $("pList").innerHTML = html;
    if (next) {
      $("pName").textContent = next.name;
      $("pNameAr").textContent = next.ar;
      $("pTime").textContent = hm(next.at);
      var mins = Math.ceil((next.at - now) / 60000), h = Math.floor(mins / 60), m = mins % 60;
      $("pCount").innerHTML = "in <b>" + (h ? h + " h " : "") + m + " min</b>" + (next.isToday ? "" : " · tomorrow");
    }
    // gentle announcement when a prayer time arrives
    if (prevNext && next && prevNext.at.getTime() !== next.at.getTime() && now - prevNext.at < 3 * 60000) {
      toast("حان الآن موعد صلاة " + prevNext.ar + "  ·  It's time for " + prevNext.name, 15000);
    }
    prevNext = next;
    refreshActions();
  }

  /* ======================= actions: adhkar & Al-Kahf ======================= */
  var ICON = {
    sun: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="5"/><path d="M12 1v3M12 20v3M1 12h3M20 12h3M4.2 4.2l2.1 2.1M17.7 17.7l2.1 2.1M4.2 19.8l2.1-2.1M17.7 6.3l2.1-2.1" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>',
    moon: '<svg viewBox="0 0 24 24"><path d="M20 15.5A8.5 8.5 0 0 1 8.5 4a8.5 8.5 0 1 0 11.5 11.5z"/></svg>',
    play: '<svg viewBox="0 0 24 24"><path d="M7 4.5v15l12.5-7.5z"/></svg>',
    pause: '<svg viewBox="0 0 24 24"><path d="M6 4h4.5v16H6zM13.5 4H18v16h-4.5z"/></svg>'
  };
  var actions = [], actionFocus = 0, actionsSig = "";
  function adhkarWindow() {
    if (!F.adhkar) return null;
    var now = nowDate();
    if (!today) { var hh = now.getHours(); return hh >= 5 && hh < 12 ? "morning" : (hh >= 15 ? "evening" : null); }
    var t = today.v.t;
    if (now >= at(today.d, t.Fajr) && now < at(today.d, t.Dhuhr)) return "morning";
    if (now >= at(today.d, t.Asr)) return "evening";
    return null;
  }
  function isFriday() { return F.kahf && nowDate().getDay() === 5; }

  function refreshActions(force) {
    var win = adhkarWindow(), fri = isFriday() || !audio.paused;
    var sig = (win || "") + "|" + (fri ? "kahf" : "") + "|" + (win ? store("adhkar." + win) === ymd(nowDate()) : "");
    if (sig === actionsSig && !force) return;
    actionsSig = sig;
    var keepId = actions[actionFocus] && actions[actionFocus].id;
    var box = $("actions");
    box.innerHTML = "";
    actions = [];
    if (win) {
      var done = store("adhkar." + win) === ymd(nowDate());
      addAction(win, '<span class="ic">' + ICON[win === "morning" ? "sun" : "moon"] + "</span>" +
        '<span class="ar">' + (win === "morning" ? "أذكار الصباح" : "أذكار المساء") + "</span>" +
        '<span class="en">' + (done ? "Done today ✓" : (win === "morning" ? "Morning adhkar" : "Evening adhkar")) + "</span>",
        (win === "morning" ? "Morning" : "Evening") + " adhkar  —  " + ADHKAR[win].length + " adhkar, with counter",
        function () { openReader(win); });
    }
    if (fri) {
      addAction("kahf", "", "Surat Al-Kahf  —  " + C.kahf.reciter, kahfToggle);
      paintKahf();
    }
    actionFocus = 0;
    for (var i = 0; i < actions.length; i++) if (actions[i].id === keepId) actionFocus = i;
    if (!actions.length && zone === "actions") { zone = "tiles"; setFocus(focus); }
    paintActions();
  }
  function addAction(id, html, info, run) {
    var el = document.createElement("div");
    el.className = "pill";
    el.innerHTML = html;
    $("actions").appendChild(el);
    actions.push({ id: id, el: el, info: info, run: run });
  }
  function paintActions() {
    actions.forEach(function (a, i) { a.el.classList.toggle("focus", zone === "actions" && i === actionFocus); });
    if (zone === "actions" && actions[actionFocus]) {
      $("focusTag").textContent = actions[actionFocus].info;
      $("focusLast").textContent = "▼ back to apps";
    }
    $("dockHint").innerHTML = (actions.length ? "<kbd>▲</kbd> " + (zone === "actions" ? "" : "more &nbsp; ") : "") +
      "<kbd>◀</kbd><kbd>▶</kbd> choose &nbsp; <kbd>OK</kbd> open";
  }

  /* ---------- Surat Al-Kahf (Fridays) ---------- */
  var audio = $("kahfAudio");
  function fmt(sec) { sec = Math.max(0, Math.floor(sec || 0)); var h = Math.floor(sec / 3600), m = Math.floor(sec / 60) % 60, s2 = sec % 60; return (h ? h + ":" + pad(m) : m) + ":" + pad(s2); }
  function kahfPill() { for (var i = 0; i < actions.length; i++) if (actions[i].id === "kahf") return actions[i].el; return null; }
  function paintKahf() {
    var el = kahfPill();
    if (!el) return;
    if (!el.firstChild) { // build once; later calls only update text, so the equalizer animation keeps running
      el.innerHTML = '<span class="ic"></span><span class="ar">سورة الكهف</span><span class="en"></span>' +
        '<span class="eq"><i></i><i></i><i></i></span><span class="sub"></span>';
    }
    var playing = !audio.paused, started = audio.currentTime > 0;
    var q = function (c) { return el.querySelector("." + c); };
    var icon = playing ? "pause" : "play";
    if (q("ic").getAttribute("data-i") !== icon) { q("ic").innerHTML = ICON[icon]; q("ic").setAttribute("data-i", icon); }
    q("en").textContent = playing ? (started ? "" : "Loading…") : started ? "Paused" : "Al-Kahf · " + C.kahf.reciter;
    q("en").style.display = q("en").textContent ? "" : "none";
    q("eq").style.display = playing && started ? "" : "none";
    q("sub").textContent = started ? fmt(audio.currentTime) + (audio.duration ? " / " + fmt(audio.duration) : "") : "";
    q("sub").style.display = started ? "" : "none";
  }
  function kahfToggle() {
    if (!audio.getAttribute("src")) audio.src = C.kahf.url;
    if (audio.paused) {
      var p = audio.play();
      if (p && p.catch) p.catch(function () { var el = kahfPill(); if (el) el.classList.add("nudge"); toast("Press OK to play Surat Al-Kahf", 5000); });
    } else audio.pause();
  }
  var lastSave = 0;
  audio.addEventListener("loadedmetadata", function () {
    var saved = store("kahf.pos");
    if (saved && saved.d === ymd(nowDate()) && saved.t < audio.duration - 5) audio.currentTime = saved.t;
  });
  audio.addEventListener("play", function () { refreshActions(true); paintKahf(); });
  audio.addEventListener("pause", paintKahf);
  audio.addEventListener("timeupdate", function () {
    paintKahf();
    if (Date.now() - lastSave > 10000) { lastSave = Date.now(); store("kahf.pos", { d: ymd(nowDate()), t: audio.currentTime }); }
  });
  audio.addEventListener("ended", function () {
    store("kahf.pos", null);
    toast("صدق الله العظيم", 6000);
    refreshActions(true);
  });
  audio.addEventListener("error", function () { toast("Couldn't load Surat Al-Kahf — check the internet connection", 6000); });
  function maybeAutoplayKahf() {
    if (!C.kahf || !C.kahf.autoplay || !isFriday() || nowDate().getHours() < 6) return;
    if (store("kahf.auto") === ymd(nowDate())) return;
    store("kahf.auto", ymd(nowDate()));
    setTimeout(function () { if (audio.paused) kahfToggle(); }, 3500);
  }

  /* ---------- adhkar reader ---------- */
  var reading = null;
  function openReader(key) {
    var list = ADHKAR[key];
    reading = { key: key, list: list, i: 0, left: list[0].n };
    $("rTitleAr").textContent = key === "morning" ? "أذكار الصباح" : "أذكار المساء";
    $("rTitleEn").textContent = key === "morning" ? "Morning adhkar" : "Evening adhkar";
    stage.classList.add("is-reading");
    showZekr(true);
  }
  function fitText(el) {
    var box = el.parentNode, size = 66;
    el.style.fontSize = size + "px";
    while (el.offsetHeight > box.clientHeight && size > 26) { size -= 2; el.style.fontSize = size + "px"; }
  }
  function showZekr(first) {
    var z = reading.list[reading.i], el = $("rText");
    var apply = function () {
      el.textContent = z.t;
      fitText(el);
      el.classList.remove("out");
      $("rRef").textContent = z.r || "";
      $("rDesc").textContent = z.d || "";
    };
    if (first) apply(); else { el.classList.add("out"); setTimeout(apply, 300); }
    $("rIdx").textContent = (reading.i + 1) + " / " + reading.list.length;
    $("rBar").style.width = ((reading.i + 1) / reading.list.length * 100) + "%";
    paintCount();
  }
  function paintCount() {
    $("rCountN").textContent = reading.left > 0 ? reading.left : "✓";
    $("rCount").classList.toggle("done", reading.left <= 0);
  }
  function readerGo(d) {
    var ni = reading.i + d;
    if (ni < 0) return;
    if (ni >= reading.list.length) { finishReader(); return; }
    reading.i = ni;
    reading.left = reading.list[ni].n;
    showZekr(false);
  }
  function readerTap() {
    if (reading.left <= 0) { readerGo(1); return; }
    reading.left--;
    var c = $("rCount");
    c.classList.add("tap");
    setTimeout(function () { c.classList.remove("tap"); }, 150);
    paintCount();
    if (reading.left === 0) {
      var at0 = reading.i;
      setTimeout(function () { if (reading && reading.i === at0) readerGo(1); }, 700);
    }
  }
  function finishReader() {
    store("adhkar." + reading.key, ymd(nowDate()));
    closeReader();
    toast("تقبّل الله  ·  May Allah accept", 4000);
    refreshActions(true);
  }
  function closeReader() { reading = null; stage.classList.remove("is-reading"); }
  function readerKey(code) {
    if (code === KEY.ENTER) readerTap();
    else if (code === KEY.LEFT || code === KEY.DOWN) readerGo(1);   // Arabic reads right-to-left: ◀ = next
    else if (code === KEY.RIGHT || code === KEY.UP) readerGo(-1);
    else if (code === KEY.BACK || code === KEY.ESC) closeReader();
  }

  refreshActions(true);
  if (F.prayer || F.adhkar) { loadPrayers(); setInterval(renderPrayer, 15000); } // adhkar windows follow Fajr/Dhuhr/Asr
  maybeAutoplayKahf();

  /* ---------------- ambient mode ---------------- */
  var idleTimer;
  function wake() {
    var was = stage.classList.contains("is-ambient");
    stage.classList.remove("is-ambient");
    clearTimeout(idleTimer);
    idleTimer = setTimeout(function () { if (!reading) stage.classList.add("is-ambient"); }, C.ambientAfterMinutes * 60000);
    return was;
  }
  wake();

  /* ---------------- remote control ---------------- */
  document.addEventListener("keydown", function (e) {
    if (wake()) { e.preventDefault(); return; } // first key only wakes the screen
    var code = e.keyCode;
    if (reading) { if (code in KEYSET) { readerKey(code); e.preventDefault(); } return; }
    switch (code) {
      case KEY.UP:
        if (zone === "tiles" && actions.length) { zone = "actions"; setFocus(focus); paintActions(); }
        break;
      case KEY.DOWN:
        if (zone === "actions") { zone = "tiles"; paintActions(); setFocus(focus); }
        break;
      case KEY.LEFT:
        if (zone === "actions") { actionFocus = Math.max(0, actionFocus - 1); paintActions(); } else setFocus(focus - 1);
        break;
      case KEY.RIGHT:
        if (zone === "actions") { actionFocus = Math.min(actions.length - 1, actionFocus + 1); paintActions(); } else setFocus(focus + 1);
        break;
      case KEY.ENTER:
        if (zone === "actions" && actions[actionFocus]) actions[actionFocus].run(); else launch();
        break;
      case KEY.BACK: case KEY.ESC:
        // Stay on the welcome page: leaving it would drop the TV to live channels.
        break;
      default: return;
    }
    e.preventDefault();
  });
  var KEYSET = {}; for (var k in KEY) KEYSET[KEY[k]] = true;

  /* ---------------- optional diagnostics (C.debugLogUrl + scripts/logserver.py) ---------------- */
  function log(ev, data) {
    if (!C.debugLogUrl) return;
    try {
      var x = new XMLHttpRequest();
      x.open("POST", C.debugLogUrl);
      x.send(JSON.stringify({ ev: ev, hidden: document.hidden, data: data || null }));
    } catch (e) {}
  }
  log("start", navigator.userAgent);
  window.onerror = function (msg, src, line) { log("error", msg + " @" + line); };

  // Coming back to the app: refresh greeting & weather, reset the idle timer.
  document.addEventListener("visibilitychange", function () {
    if (!document.hidden) { tick(); if (F.weather !== false) loadWeather(); wake(); setFocus(focus); renderPrayer(); refreshActions(true); maybeAutoplayKahf(); }
  });
})();
