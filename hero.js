/* VeriTouch hero: one batch through the pipeline, drawn as a flowchart.
   VeriGen generates six rollouts -> VeriEval runs four checks in order and drops a rollout at its first failure ->
   VeriIDM labels the survivors with per-frame actions -> they join real demos 1:1 for policy learning.
   Every verdict and number comes from window.VT_BATCH (hero-data.js). The state is a pure function of t (seek),
   it plays once; stage buttons jump, the button replays/pauses, hovering a rollout or a check shows its evidence. */
(() => {
  const pipe = document.getElementById('vtPipe'), B = window.VT_BATCH;
  if (!pipe || !B) return;
  const $ = (s, r = pipe) => r.querySelector(s), $$ = (s, r = pipe) => [...r.querySelectorAll(s)];
  const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
  const ease = (x) => 1 - Math.pow(1 - clamp(x), 3);
  const easeIO = (x) => { x = clamp(x); return x < .5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2; };
  const prog = (t, t0, d = .5) => ease((t - t0) / d);
  const setP = (el, p, k = '--p') => el && el.style.setProperty(k, p.toFixed(3));
  const sum = (a) => a.reduce((x, y) => x + y, 0);

  const GATES = [
    { name: 'Visual', icon: 'fa-eye', how: 'A fine-tuned VLM judge checks the physics on both cameras.' },
    { name: 'Timing', icon: 'fa-stopwatch', how: 'Contact seen by the wrist camera must line up with contact felt by touch.' },
    { name: 'Touch', icon: 'fa-fingerprint', how: 'The generated touch must look like real tactile data.' },
    { name: 'Force', icon: 'fa-hand', how: 'The contact force must be physically plausible.' },
  ];
  const FAIL = { visual: 0, timestamp: 1, tactile: 2, force: 3 };
  B.forEach((r) => { r.fail = r.retained ? 4 : FAIL[r.first]; r.name = r.task; });
  // tactile magnitude curve (0..1 over the clip) as an SVG path, for the hover readout on each generated tile
  const curvePath = (c) => 'M' + c.map((v, k) => `${(k / (c.length - 1) * 100).toFixed(2)},${(23 - v * 20).toFixed(2)}`).join(' L');
  const kept = B.filter((r) => r.fail === 4);
  const worst = (r) => (Math.abs(r.on) >= Math.abs(r.rel) ? ['starts', r.on] : ['ends', r.rel]);

  /* ---------- build ---------- */
  const batch = $('#vtBatch'), grid = $('#vtGrid'), lab = $('#vtLab'), lens = $('#vtLens');
  batch.innerHTML = B.map((r, i) => `<figure class="vt-tile" data-i="${i}" tabindex="0" aria-label="Generated rollout ${r.name}">
    <img src="${r.img}_main.jpg" alt=""><img class="vt-tac" src="${r.img}_left.jpg" alt="">
    <svg class="vt-tcurve" viewBox="0 0 100 24" preserveAspectRatio="none" aria-hidden="true"><path class="a" d="${curvePath(r.curve)} L100,24 L0,24 Z"/><path class="l" d="${curvePath(r.curve)}"/><line class="ph" x1="0" x2="0" y1="0" y2="24"/></svg>
    <figcaption>${r.name}</figcaption></figure>`).join('');
  grid.innerHTML = `<div class="vt-row vt-th"><span></span>${GATES.map((g, k) =>
      `<button type="button" data-g="${k}" aria-label="${g.name} check"><i class="fa-solid ${g.icon}" aria-hidden="true"></i>${g.name}</button>`).join('')}</div>` +
    B.map((r, i) => `<div class="vt-row" data-i="${i}" tabindex="0"><span class="vt-who"><img src="${r.img}_main.jpg" alt="">${r.name}</span>${GATES.map((_, g) => {
      if (g > r.fail) return `<span class="vt-cell" data-g="${g}">—</span>`;
      const ok = g < r.fail;
      return `<span class="vt-cell ${ok ? 'is-ok' : 'is-bad'}" data-g="${g}"><i class="fa-solid ${ok ? 'fa-check' : 'fa-xmark'}"></i></span>`;
    }).join('')}</div>`).join('');
  lab.innerHTML = kept.map((r) => `<div class="vt-lrow"><span class="vt-views"><figure><img src="${r.img}_main.jpg" alt=""><figcaption>third-person</figcaption></figure><figure><img src="${r.img}_wrist.jpg" alt=""><figcaption>wrist</figcaption></figure></span>
    <span class="vt-who3">${r.name}</span><b class="vt-badge" title="${r.name}: actions extracted">&acirc;</b></div>`).join('');

  const tiles = $$('.vt-tile'), rows = $$('.vt-row[data-i]'), heads = $$('.vt-th button'), lrows = $$('.vt-lrow');
  const cells = rows.map((row) => $$('.vt-cell', row));
  const stages = $$('.vt-stage'), rail = $$('.vt-rail button'), links = $$('.vt-link');
  const inputs = $('#vtInputs'), downs = $$('.vt-down'), wm = $('#vtWM'), idm = $('#vtIDM'), acts = $('#vtActs'), mix = $('#vtMix'), mixS = $('#vtMix .s');
  const pols = $('#vtPols'), robot = $('#vtRobot'), robotV = $('#vtRobot video'), sr = $('#vtSR'), srv = $('#vtSRv'), ctl = $('#vtCtl');
  const idmSR = $('#vtIDMsr'), sra = $('#vtSRa'), srn = $('#vtSRn'), robotCap = $('#vtRobotCap'), robotTag = $('#vtRobotTag');

  /* ---------- policy picker: the four policies of Table 1; click one to see its same-layout real-only vs. +VeriTouch rollout ---------- */
  const MODELS = [
    { name: 'π0.5', html: '<span class="pi">π</span><sub>0.5</sub>', srHtml: '<span class="vt-pi">π</span><sub>0.5</sub>', cls: 'm-pi', a: 19.7, b: 30.0,
      clip: 'assets/video/policy/hero_pi05_cmp', tag: 'egg · same layout', fail: 'Fails to lift egg', ok: 'Places egg on tray' },
    { name: 'ACT', html: 'ACT', srHtml: 'ACT', cls: 'm-act', a: 6.7, b: 18.3,
      clip: 'assets/video/policy/hero_act_cmp', tag: 'egg · same layout', fail: 'Misses egg completely', ok: 'Places egg on tray' },
    { name: '𝒩0-VTLA', html: '<span class="vt-cal">𝒩</span><sub>0</sub><span class="vtla">-VTLA</span>', srHtml: '<span class="vt-cal">𝒩</span><sub>0</sub>-VTLA', cls: 'm-n0', a: 31.3, b: 51.7,
      clip: 'assets/video/policy/hero_n0_cmp', tag: 'egg · same layout', fail: 'Closes beside egg', ok: 'Places egg on tray' },
    { name: 'FTP-1', html: '<span class="ftp">FTP</span>-1', srHtml: 'FTP-1', cls: 'm-ftp', a: 20.0, b: 35.0,
      clip: 'assets/video/policy/hero_ftp1_cmp', tag: 'egg · same layout', fail: 'Knocks egg off cup', ok: 'Places egg on tray' },
  ];
  let sel = 2;
  pols.innerHTML = MODELS.map((m, k) => `<button type="button" class="${m.cls}" data-k="${k}" aria-pressed="false" title="${m.name}">${m.html}</button>`).join('');
  const polBtns = $$('button', pols);
  function pick(k, first) {
    sel = k; const m = MODELS[k];
    polBtns.forEach((b, j) => { b.classList.toggle('is-sel', j === k); b.setAttribute('aria-pressed', j === k); });
    robotTag.textContent = m.tag;
    robotCap.innerHTML = `<span class="is-bad">✗ ${m.fail}</span><span class="is-ok">✓ ${m.ok}</span>`;
    srn.innerHTML = m.srHtml;
    sra.textContent = m.a.toFixed(1) + '%';
    if (!first) {
      robotV.poster = `${m.clip}.jpg`; robotV.src = `${m.clip}.mp4`; robotV.load();
      if (t >= K.robot && !reduce) robotV.play().catch(() => {});
      seek(t);
    }
  }
  polBtns.forEach((b, k) => b.addEventListener('click', () => pick(k)));

  /* ---------- timeline ---------- */
  const P = { inputs: .15, gen: .75, genStep: .22, link0: 2.45, fly1: 2.7, fly1Step: .1, flyD: .6 };
  const T0 = 4.2, sched = [], gS = [], gE = [];
  let tt = T0;
  for (let g = 0; g < 4; g++) {
    gS[g] = tt; tt += .25;
    B.forEach((r, i) => { if (r.fail >= g) { sched.push({ g, i, t: tt }); tt += r.fail === g ? .85 : (g < 2 ? .28 : .45); } });
    tt += .35; gE[g] = tt;
  }
  const E = tt;
  const at = {};
  sched.forEach((s) => { at[s.i + ':' + s.g] = s.t; });
  B.forEach((r) => { r.out = r.fail < 4 ? gE[r.fail] - .2 : Infinity; });
  // the evidence panel follows the checks: first rollout of each gate, every rejection, every rollout on the last two gates
  const lensPlan = sched.filter((s, k) => k === 0 || s.g !== sched[k - 1].g || B[s.i].fail === s.g || s.g >= 2);
  const LDEF = { i: B.findIndex((r) => r.fail === 1 && Math.abs(r.rel) > 3) , g: 1 };
  if (LDEF.i < 0) LDEF.i = 0;
  const K = { kept: E, link1: E + .15, fly2: E + .35, flyStep: .14, idm: E + 1.0, acts: E + 1.6, badge: E + 1.95,
              mixR: E + 2.45, link2: E + 2.7, fly3: E + 2.9, mixS: E + 3.45, pols: E + 3.7, robot: E + 4.0, sr: E + 4.4, srD: 1 };
  const END = E + 5.6;
  const STAGE_AT = [0, P.fly1, K.fly2, K.fly3];

  /* travelling thumbnails */
  const box = (el) => { const a = el.getBoundingClientRect(), p = pipe.getBoundingClientRect(); return { x: a.left - p.left, y: a.top - p.top, w: a.width, h: a.height }; };
  const toks = [];
  const tok = (src, from, to, t0, d) => {
    const el = document.createElement('div');
    el.className = 'vt-token'; el.setAttribute('aria-hidden', 'true'); el.innerHTML = `<img src="${src}" alt="">`;
    pipe.append(el); toks.push({ el, from, to, t0, d });
  };
  B.forEach((r, i) => tok(`${r.img}_main.jpg`, () => box($('img', tiles[i])), () => box($('.vt-who img', rows[i])), P.fly1 + i * P.fly1Step, P.flyD));
  kept.forEach((r, k) => {
    const i = B.indexOf(r);
    tok(`${r.img}_main.jpg`, () => box($('.vt-who img', rows[i])), () => box($('.vt-views img', lrows[k])), K.fly2 + k * K.flyStep, .7);
    tok(`${r.img}_main.jpg`, () => box($('.vt-views img', lrows[k])), () => {
      const s = box(mixS), h = s.h, w = h * 4 / 3;
      return { x: s.x + s.w * (.3 + .4 * k) - w / 2, y: s.y, w, h };
    }, K.fly3 + k * K.flyStep, .75);
  });
  function place(o, t) {
    const e = (t - o.t0) / o.d;
    if (e < 0 || e > 1.35) { o.el.style.opacity = 0; return; }
    const a = o.from(), b = o.to(), q = easeIO(e);
    const x = a.x + (b.x - a.x) * q, y = a.y + (b.y - a.y) * q - Math.sin(Math.PI * clamp(e)) * 26;
    o.el.style.width = (a.w + (b.w - a.w) * q).toFixed(1) + 'px';
    o.el.style.height = (a.h + (b.h - a.h) * q).toFixed(1) + 'px';
    o.el.style.transform = `translate(${x.toFixed(1)}px,${y.toFixed(1)}px)`;
    o.el.style.opacity = (prog(e, 0, .12) * (1 - prog(e, 1, .3))).toFixed(3);
  }

  /* ---------- evidence panel ---------- */
  function timingSVG(r) {
    const w0 = 6, w1 = 15.5, X = (s) => 50 + (clamp(s, w0, w1) - w0) / (w1 - w0) * 304;
    const n = r.curve.length, pts = [];
    for (let k = 0; k < n; k++) {
      const s = (k + .5) * 16 / n;
      if (s >= w0 && s <= w1) pts.push(`${X(s).toFixed(1)},${(70 - r.curve[k] * 22).toFixed(1)}`);
    }
    const sig = `M${X(w0)},70 L${pts.join(' L')} L${X(w1)},70 Z`;
    const zones = [[r.vI[0], r.tI[0], r.on], [r.vI[1], r.tI[1], r.rel]].filter((z) => Math.abs(z[2]) > 1);
    const mis = zones.map(([a, b]) => {
      const x = Math.min(X(a), X(b)), w = Math.abs(X(b) - X(a));
      return `<rect class="mis" x="${x.toFixed(1)}" y="4" width="${w.toFixed(1)}" height="68" rx="2"/>`;
    }).join('');
    return `<svg class="vt-tl" viewBox="0 0 360 74" role="img" aria-label="${r.name}: contact seen by the camera ${r.vI[0]}–${r.vI[1]} s, felt by touch ${r.tI[0]}–${r.tI[1]} s">
      ${mis}<text class="lb" x="0" y="17">camera</text><rect class="bar cam" x="${X(r.vI[0]).toFixed(1)}" y="8" width="${(X(r.vI[1]) - X(r.vI[0])).toFixed(1)}" height="12" rx="3"/>
      <text class="lb" x="0" y="39">touch</text><rect class="bar tch" x="${X(r.tI[0]).toFixed(1)}" y="30" width="${Math.max(2, X(r.tI[1]) - X(r.tI[0])).toFixed(1)}" height="12" rx="3"/>
      <path class="sig" d="${sig}"/><line class="base" x1="50" x2="354" y1="70.5" y2="70.5"/></svg>`;
  }
  function timingNote(r) {
    if (r.fail > 1) return 'contact lines up';
    const [verb, d] = worst(r);
    return `touch contact ${verb} ${Math.abs(d).toFixed(1)} s ${d > 0 ? 'late' : 'early'}`;
  }
  function lensHTML(i, g) {
    const r = B[i], G = GATES[g], pass = r.fail > g;
    let body = '';
    if (g === 0 && !pass && r.quote) body = `<q>${r.quote}</q>`;
    else if (g === 1) body = timingSVG(r) + `<p class="vt-note ${pass ? 'ok' : 'bad'}">${timingNote(r)}</p>`;
    return `<div class="vt-lh"><i class="fa-solid ${G.icon}" aria-hidden="true"></i><b>${G.name}</b><span>${r.name}</span><em class="${pass ? 'ok' : 'bad'}">${pass ? '✓ pass' : '✗ rejected'}</em></div>
      <p class="vt-how">${G.how}</p>${body ? `<div class="vt-lb">${body}</div>` : ''}`;
  }
  let lensKey = '', hold = null, pin = null;
  function showLens(L) {
    const key = L ? L.i + ':' + L.g : '';
    if (key === lensKey) return;
    lensKey = key;
    lens.classList.toggle('is-empty', !L);
    lens.innerHTML = L ? lensHTML(L.i, L.g) : '';
    rows.forEach((el, i) => el.classList.toggle('is-hot', !!L && L.i === i && !!(hold || pin)));
    tiles.forEach((el, i) => el.classList.toggle('is-hot', !!L && L.i === i && !!(hold || pin)));
  }
  const deciding = (i) => Math.min(B[i].fail, 1);              // rejected: the failing check; kept: contact timing
  const forGate = (g) => { const i = B.findIndex((r) => r.fail === g); return { i: i < 0 ? 0 : i, g }; };

  /* ---------- state at time t ---------- */
  let t = 0;
  function seek(x) {
    t = clamp(x, 0, END);
    let s = 0;
    STAGE_AT.forEach((a, k) => { if (t >= a) s = k; });
    stages.forEach((el, k) => { el.classList.toggle('is-on', k === s); el.classList.toggle('is-past', k < s); });
    rail.forEach((el, k) => { el.classList.toggle('is-on', k === s); el.classList.toggle('is-past', k < s); });

    setP(inputs, prog(t, P.inputs, .5));
    setP(downs[0], prog(t, P.inputs + .3, .4)); setP(wm, prog(t, P.inputs + .45, .45)); setP(downs[1], prog(t, P.gen - .25, .4));
    wm.classList.toggle('is-busy', t >= P.gen - .1 && t < P.gen + B.length * P.genStep + .5);
    tiles.forEach((el, i) => { setP(el, clamp((t - P.gen - i * P.genStep) / .75)); el.classList.toggle('is-out', t >= B[i].out); });
    setP(links[0], prog(t, P.link0, .4)); setP(links[1], prog(t, K.link1, .4)); setP(links[2], prog(t, K.link2, .4));

    let g = -1;
    for (let k = 0; k < 4; k++) if (t >= gS[k] && t < gE[k]) g = k;
    grid.dataset.g = g;
    heads.forEach((el, k) => el.classList.toggle('is-done', t >= gE[k]));
    rows.forEach((el, i) => {
      const r = B[i];
      setP(el, prog(t, P.fly1 + i * P.fly1Step + P.flyD - .1, .25));
      el.classList.toggle('is-out', t >= r.out);
      el.classList.toggle('is-kept', r.fail === 4 && t >= K.kept);
      cells[i].forEach((c, k) => {
        const ta = at[i + ':' + k];
        c.classList.toggle('is-shown', ta !== undefined && t >= ta);
        c.classList.toggle('is-run', ta !== undefined && t >= ta - .25 && t < ta);
        c.classList.toggle('is-dash', ta === undefined && t >= r.out);
      });
    });
    if (!hold && !pin) {
      let L = null;
      for (const e of lensPlan) if (t >= e.t) L = e;
      if (t >= E + .3) L = LDEF;
      showLens(L);
    }

    lrows.forEach((el, k) => {
      setP(el, prog(t, K.fly2 + k * K.flyStep + .6, .25));
      setP(el, prog(t, K.badge + k * .15, .35), '--q');
    });
    setP(downs[2], prog(t, K.idm - .3, .4)); setP(idm, prog(t, K.idm - .2, .45)); setP(downs[3], prog(t, K.acts - .2, .4));
    idm.classList.toggle('is-busy', t >= K.idm && t < K.badge + .4);
    setP(acts, prog(t, K.acts, .5));
    setP(mix, prog(t, K.mixR, .6), '--pr'); setP(mix, prog(t, K.mixS, .6), '--ps');
    setP(pols, prog(t, K.pols, .45)); setP(robot, prog(t, K.robot, .5)); setP(sr, prog(t, K.sr - .2, .4));
    const M = MODELS[sel];
    srv.textContent = (M.a + (M.b - M.a) * prog(t, K.sr, K.srD)).toFixed(1) + '%';
    setP(idmSR, prog(t, K.badge + .35, .45));
    if (t >= K.robot) { if (robotV.paused && !reduce) robotV.play().catch(() => {}); }
    else if (!robotV.paused) { robotV.pause(); robotV.currentTime = 0; }
    toks.forEach((o) => place(o, t));
  }

  /* ---------- playback ---------- */
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  let playing = false, visible = !('IntersectionObserver' in window), last = 0;
  function frame(now) {
    if (!playing) return;
    if (visible && !document.hidden) {
      seek(t + Math.min(.05, (now - last) / 1000));
      if (t >= END) { playing = false; setCtl(); }
    }
    last = now;
    if (playing) requestAnimationFrame(frame);
  }
  function play(from) {
    if (from !== undefined) seek(from);
    if (t >= END) seek(0);
    playing = true; last = performance.now(); setCtl(); requestAnimationFrame(frame);
  }
  function pause() { playing = false; setCtl(); }
  function setCtl() {
    const ended = !playing && t >= END;
    const [icon, label] = playing ? ['fa-pause', 'Pause'] : ended ? ['fa-rotate-right', 'Replay'] : ['fa-play', 'Play'];
    ctl.innerHTML = `<i class="fa-solid ${icon}" aria-hidden="true"></i>`;
    ctl.setAttribute('aria-label', label); ctl.title = label;
  }
  ctl.addEventListener('click', () => (playing ? pause() : play()));
  rail.forEach((el, k) => el.addEventListener('click', () => { pin = hold = null; lensKey = '#'; play(STAGE_AT[k] + (k ? .01 : 0)); }));

  /* ---------- inspect: hover/focus a rollout or a check; click to pin ---------- */
  const inspect = (L) => { hold = L; lensKey = '#'; showLens(L || pin); if (!L && !pin) seek(t); };
  const bind = (el, get) => {
    el.addEventListener('mouseenter', () => inspect(get()));
    el.addEventListener('focus', () => inspect(get()));
    el.addEventListener('mouseleave', () => inspect(null));
    el.addEventListener('blur', () => inspect(null));
    el.addEventListener('click', () => { const L = get(); pin = pin && pin.i === L.i && pin.g === L.g ? null : L; inspect(L); });
  };
  rows.forEach((el, i) => bind(el, () => ({ i, g: deciding(i) })));
  heads.forEach((el, g) => bind(el, () => forGate(g)));
  /* ---------- floating tactile zoom loupe on hover OR click of any VeriGen tile ---------- */
  const pop = document.createElement('aside');
  pop.className = 'vt-tpop';
  pop.setAttribute('aria-hidden', 'true');
  pop.innerHTML = `<div class="vt-tpop-hd"><b>Generated rollout &amp; touch</b><div class="vt-tpop-meta"><span class="vt-tpop-task">egg</span><button type="button" class="vt-tpop-x" aria-label="Close"><i class="fa-solid fa-xmark" aria-hidden="true"></i></button></div></div>
    <div class="vt-tpop-bd">
      <figure class="vt-tpop-cam"><video muted playsinline loop preload="auto"></video><figcaption>camera</figcaption></figure>
      <figure class="vt-tpop-tac"><video muted playsinline loop preload="auto"></video><figcaption>fingertip touch</figcaption></figure>
    </div>
    <div class="vt-tpop-ft">
      <svg class="vt-tpop-cv" viewBox="0 0 100 24" preserveAspectRatio="none"><path class="a" d=""/><path class="l" d=""/><line class="ph" x1="0" x2="0" y1="0" y2="24"/></svg>
      <span>contact window · click curve to seek</span>
    </div>`;
  pipe.append(pop);
  const popTask = $('.vt-tpop-task', pop), popClose = $('.vt-tpop-x', pop), popCv = $('.vt-tpop-cv', pop);
  const popCam = $('.vt-tpop-cam video', pop), popTac = $('.vt-tpop-tac video', pop);
  const popA = $('.vt-tpop-cv .a', pop), popL = $('.vt-tpop-cv .l', pop), popPh = $('.vt-tpop-cv .ph', pop);
  let popIdx = -1, popRaf = 0, popWin = [7, 14.5], popPinned = -1, popHoverTile = -1, popHoverCard = false, hideTimer = 0;

  const contactWin = (r) => {
    let pk = 0, pi = 60;
    r.curve.forEach((v, k) => { if (v > pk) { pk = v; pi = k; } });
    const nz = [];
    r.curve.forEach((v, k) => { if (v > .12) nz.push(k / r.curve.length * 16); });
    const a = nz.length ? Math.max(6.5, Math.min(...nz) - .4) : Math.max(6.5, pi / r.curve.length * 16 - .8);
    const b = nz.length ? Math.min(15.5, Math.max(a + 3.2, Math.max(...nz) + .6)) : Math.min(15.5, a + 4.0);
    return [a, b];
  };
  function placePop(el) {
    const a = box(el), pw = pipe.clientWidth, w = pop.offsetWidth || 356, h = pop.offsetHeight || 268;
    const x = clamp(a.x + a.w / 2 - w / 2, 6, Math.max(6, pw - w - 6));
    const y = Math.max(6, a.y - h - 10);
    pop.style.transform = `translate(${x.toFixed(1)}px,${y.toFixed(1)}px)`;
  }
  function startVid(v, tStart) {
    const go = () => {
      try { if (v.currentTime < tStart - .15 || v.currentTime > 15.6) v.currentTime = tStart; } catch (_) {}
      if (pop.classList.contains('is-on')) v.play().catch(() => {});
    };
    if (v.readyState >= 1) go();
    else {
      v.addEventListener('loadedmetadata', go, { once: true });
      v.addEventListener('canplay', () => { if (pop.classList.contains('is-on') && v.paused) v.play().catch(() => {}); }, { once: true });
    }
  }
  function tickPop() {
    if (!pop.classList.contains('is-on') || popIdx < 0) return;
    const [w0, w1] = popWin, dur = popTac.duration || 16;
    if (popTac.readyState >= 2) {
      if (popTac.paused) popTac.play().catch(() => {});
      if (popCam.readyState >= 2 && popCam.paused) popCam.play().catch(() => {});
      if (popTac.currentTime < w0 - .15 || popTac.currentTime >= Math.min(dur - .06, w1)) {
        popTac.currentTime = w0;
        if (popCam.readyState >= 1) popCam.currentTime = Math.min(popCam.duration || 16, w0);
      } else if (popCam.readyState >= 2 && Math.abs(popCam.currentTime - popTac.currentTime) > .22) {
        popCam.currentTime = popTac.currentTime;
      }
      const f = clamp(popTac.currentTime / 16);
      popPh.setAttribute('x1', (f * 100).toFixed(2));
      popPh.setAttribute('x2', (f * 100).toFixed(2));
    }
    popRaf = requestAnimationFrame(tickPop);
  }
  function openPop(i, el) {
    clearTimeout(hideTimer);
    if (reduce) return;
    const r = B[i];
    tiles.forEach((tl, k) => tl.classList.toggle('is-play', k === i));
    pop.classList.toggle('is-pinned', popPinned === i);
    pop.classList.add('is-on');
    placePop(el);
    if (popIdx !== i) {
      popIdx = i;
      popWin = contactWin(r);
      popTask.textContent = r.name;
      const cp = curvePath(r.curve);
      popA.setAttribute('d', `${cp} L100,24 L0,24 Z`);
      popL.setAttribute('d', cp);
      popCam.poster = `${r.img}_main.jpg`;
      popTac.poster = `${r.img}_left.jpg`;
      popCam.src = `${r.img}_main.mp4`;
      popTac.src = `${r.img}_left.mp4`;
      popCam.load();
      popTac.load();
    }
    startVid(popTac, popWin[0]);
    startVid(popCam, popWin[0]);
    cancelAnimationFrame(popRaf);
    popRaf = requestAnimationFrame(tickPop);
  }
  function forceClosePop() {
    clearTimeout(hideTimer);
    popPinned = -1;
    pop.classList.remove('is-on', 'is-pinned');
    tiles.forEach((tl) => tl.classList.remove('is-play'));
    cancelAnimationFrame(popRaf);
    popTac.pause();
    popCam.pause();
  }
  function maybeClosePop() {
    clearTimeout(hideTimer);
    hideTimer = setTimeout(() => {
      if (popHoverTile >= 0 || popHoverCard) return;
      if (popPinned >= 0) {
        if (popIdx !== popPinned) openPop(popPinned, tiles[popPinned]);
        return;
      }
      forceClosePop();
    }, 110);
  }
  pop.addEventListener('mouseenter', () => { popHoverCard = true; clearTimeout(hideTimer); });
  pop.addEventListener('mouseleave', () => { popHoverCard = false; maybeClosePop(); });
  popClose.addEventListener('click', (e) => { e.stopPropagation(); forceClosePop(); });
  popCv.addEventListener('click', (e) => {
    const rect = popCv.getBoundingClientRect();
    const sec = clamp((e.clientX - rect.left) / rect.width) * 16;
    if (popTac.readyState >= 1) popTac.currentTime = sec;
    if (popCam.readyState >= 1) popCam.currentTime = sec;
    popTac.play().catch(() => {});
    popCam.play().catch(() => {});
  });
  document.addEventListener('click', (e) => {
    if (popPinned >= 0 && !e.target.closest('.vt-tile') && !e.target.closest('.vt-tpop')) forceClosePop();
  });

  tiles.forEach((el, i) => {
    el.addEventListener('mouseenter', () => { popHoverTile = i; inspect({ i, g: deciding(i) }); openPop(i, el); });
    el.addEventListener('focus', () => { popHoverTile = i; inspect({ i, g: deciding(i) }); openPop(i, el); });
    el.addEventListener('mouseleave', () => { if (popHoverTile === i) popHoverTile = -1; inspect(null); maybeClosePop(); });
    el.addEventListener('blur', () => { if (popHoverTile === i) popHoverTile = -1; inspect(null); maybeClosePop(); });
    el.addEventListener('click', (e) => {
      e.stopPropagation();
      const L = { i, g: deciding(i) };
      if (popPinned === i) {
        pin = null; inspect(null); forceClosePop();
      } else {
        popPinned = i; pin = L; inspect(L); openPop(i, el);
      }
    });
  });

  if ('IntersectionObserver' in window) new IntersectionObserver(([e]) => { visible = e.isIntersecting; }, { threshold: .15 }).observe(pipe);
  addEventListener('resize', () => seek(t));
  pick(sel, true);
  if (reduce) { seek(END); setCtl(); }
  else { seek(0); play(); }
  window.vtHero = { END, E, seek: (x) => { pause(); seek(x); setCtl(); } };
})();
