const { chromium } = require("playwright"); const fs = require("fs");
(async () => {
  const b = await chromium.launch({ channel: "chrome", headless: true, args: ["--window-size=1920,1080"] });
  const p = await b.newPage({ viewport: { width: 1920, height: 1080 } });
  await p.route("**/config.js", async (r) => {
    const res = await r.fetch(); let s = await res.text();
    s = s.replace("prayer: true", "prayer: false").replace("adhkar: true", "adhkar: false").replace("kahf: true", "kahf: false").replace('since: "2021-06-12"', "since: null");
    r.fulfill({ response: res, body: s });
  });
  await p.goto("http://localhost:8812/app/?now=2026-11-24T21:10:00");
  await p.addStyleTag({ content: ".top,.eyebrow,.greeting,.moment,.dock{animation:none!important;opacity:1!important}" });
  await p.waitForTimeout(3000);
  await p.screenshot({ path: process.argv[2], type: "jpeg", quality: 88 });
  await b.close();
})();
