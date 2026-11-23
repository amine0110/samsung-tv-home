// Records the studio page with CDP screencast frames → frames/ + frames.txt (ffmpeg concat) + markers.json
const { chromium } = require("playwright");
const fs = require("fs"), path = require("path");
const OUT = path.join(__dirname, "frames");
fs.rmSync(OUT, { recursive: true, force: true }); fs.mkdirSync(OUT);

(async () => {
  const browser = await chromium.launch({ channel: "chrome", headless: true,
    args: ["--autoplay-policy=no-user-gesture-required", "--mute-audio", "--force-device-scale-factor=1", "--window-size=1920,1080"] });
  const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
  await page.goto("http://localhost:8812/studio.html");
  await page.evaluate(() => { localStorage.clear(); localStorage.setItem("home.kahf.auto", JSON.stringify("2026-11-27")); });
  await page.waitForTimeout(1500);

  const cdp = await page.context().newCDPSession(page);
  const frames = []; let t0 = null;
  cdp.on("Page.screencastFrame", async (f) => {
    const ts = f.metadata.timestamp; if (t0 === null) t0 = ts;
    const file = path.join(OUT, String(frames.length).padStart(5, "0") + ".jpg");
    fs.writeFileSync(file, Buffer.from(f.data, "base64"));
    frames.push({ file, t: ts - t0 });
    try { await cdp.send("Page.screencastFrameAck", { sessionId: f.sessionId }); } catch (e) {}
  });
  await cdp.send("Page.startScreencast", { format: "jpeg", quality: 93, maxWidth: 1920, maxHeight: 1080, everyNthFrame: 1 });
  const start = Date.now(); const markers = {};
  const mark = (n) => { markers[n] = (Date.now() - start) / 1000; };
  const w = (ms) => page.waitForTimeout(ms);
  const S = (fn, ...a) => page.evaluate(([fn, a]) => window.studio[fn](...a), [fn, a]);
  const press = async (code, gap = 650) => { await S("press", code); await w(gap); };
  const K = { L: 37, U: 38, R: 39, D: 40, OK: 13, BACK: 27 };

  // ---- intro
  mark("intro"); await w(3200);
  await S("load", "?now=2026-11-27T07:40:00");
  await S("title", false); await w(500); await S("tvOn"); await w(400);
  // ---- greeting
  mark("greeting");
  await S("cap", "Greets you every time", "Time-of-day colours, weather, the date and the next prayer.");
  await w(5200);
  // ---- apps
  mark("apps");
  await S("cap", "Your apps, nothing else", "Big tiles for the apps installed on the TV. OK opens them.");
  await w(900);
  for (const k of [K.R, K.R, K.R, K.R, K.L, K.L, K.L]) await press(k, 620);
  await press(K.L, 900);
  await w(600);
  // ---- adhkar
  mark("adhkar");
  await S("cap", "Morning & evening adhkar", "Press ▲, then OK: full-screen reader with a counter.");
  await w(700);
  await press(K.U, 1000);
  await press(K.OK, 2200);      // opens reader on Ayat al-Kursi (x1)
  await press(K.OK, 1700);      // count → auto-advance to Al-Ikhlas (x3)
  await press(K.OK, 600); await press(K.OK, 600); await press(K.OK, 1900);
  await press(K.OK, 700); await press(K.OK, 700); await press(K.OK, 1700);
  await press(K.BACK, 1200);
  // ---- kahf
  mark("kahf");
  await S("cap", "Fridays: Surat Al-Kahf", "Starts by itself on Friday, remembers where you stopped.");
  await w(600);
  await press(K.R, 900);
  await press(K.OK, 4200);
  await press(K.D, 900);
  // ---- evening
  mark("evening");
  await S("cap", "Changes with the day", "Evening adhkar after Asr, a night sky after dark.");
  await S("load", "?now=2026-11-23T20:15:00"); await w(5200);
  // ---- ambient
  mark("ambient");
  await S("cap", "An ambient clock when idle", "After a few minutes, any key brings the page back.");
  await page.evaluate(() => window.studio.app().document.getElementById("stage").classList.add("is-ambient"));
  await w(5200);
  await press(K.OK, 1500);
  // ---- outro
  mark("outro");
  await S("cap", "", ""); await S("tvOff"); await w(900);
  await S("title", true, true); await w(4200);
  mark("end");

  await cdp.send("Page.stopScreencast");
  await w(300);
  // ffmpeg concat list with real durations
  let txt = "";
  for (let i = 0; i < frames.length; i++) {
    const d = i + 1 < frames.length ? frames[i + 1].t - frames[i].t : 0.04;
    txt += `file '${frames[i].file}'\nduration ${Math.max(0.001, d).toFixed(4)}\n`;
  }
  txt += `file '${frames[frames.length - 1].file}'\n`;
  fs.writeFileSync(path.join(__dirname, "frames.txt"), txt);
  fs.writeFileSync(path.join(__dirname, "markers.json"), JSON.stringify(markers, null, 1));
  console.log("frames", frames.length, "duration", frames[frames.length - 1].t.toFixed(1), "markers", JSON.stringify(markers));
  await browser.close();
})().catch((e) => { console.error(e); process.exit(1); });
