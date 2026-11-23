// Share-preview image (assets/fig/og.jpg, 1200x630): the title plus the finished "How it works" flowchart,
// rendered from the live page. Serve the site first (python3 -m http.server 8767), then: node _build/make_og.cjs
// Needs playwright-core and a Chromium build (CHROME=/path/to/chrome if it is not the bundled one).
const path = require('path');
const { chromium } = require('playwright-core');
const URL = process.env.URL || 'http://127.0.0.1:8767/';
const OUT = path.join(__dirname, '..', 'assets', 'fig', 'og.jpg');
(async () => {
  const b = await chromium.launch(process.env.CHROME ? { executablePath: process.env.CHROME } : {});
  const p = await b.newPage({ viewport: { width: 1200, height: 630 }, deviceScaleFactor: 1 });
  await p.goto(URL + '?og=1', { waitUntil: 'load' });
  await p.waitForTimeout(1200);
  await p.evaluate(() => {
    window.vtHero.seek(window.vtHero.END);
    const flow = document.querySelector('.vt-flow').cloneNode(true);
    flow.style.cssText = 'width:1420px;grid-template-columns:minmax(0,1fr) 30px minmax(0,1.55fr) 30px minmax(0,.95fr) 30px minmax(0,.95fr);gap:0;transform:scale(.79);transform-origin:0 0';
    flow.querySelectorAll('.vt-link').forEach((l) => { l.style.display = 'block'; });
    const card = document.createElement('div');
    card.style.cssText = 'position:fixed;inset:0;z-index:999;background:radial-gradient(900px 420px at 50% 0%,#fff,rgba(255,255,255,0) 70%),#f5f6f4;padding:30px 40px;overflow:hidden';
    card.innerHTML = `<div style="display:flex;align-items:baseline;gap:22px;margin-bottom:22px">
        <span style="font:800 64px/1 var(--vt-display);letter-spacing:-.045em;color:#1b2027">VeriTouch</span>
        <span style="font:500 23px/1.25 var(--vt-display);color:#38404a;max-width:600px">Verified Visuo-Tactile World Models that Improve Robot Policy Learning</span></div>`;
    const wrap = document.createElement('div'); wrap.className = 'vt-pipe'; wrap.style.cssText = 'position:relative;height:420px;max-width:none;margin:0';
    wrap.append(flow); card.append(wrap); document.body.append(card);
    document.querySelectorAll('.ft-navbar,.vt-tip').forEach((n) => { n.style.display = 'none'; });
  });
  await p.waitForTimeout(900);
  await p.screenshot({ path: OUT, type: 'jpeg', quality: 88 });
  await b.close();
  console.log('wrote', OUT);
})();
