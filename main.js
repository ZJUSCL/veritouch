/* VeriTouch project page: content sections (the pipeline animation lives in hero.js) */
(() => {
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const V = 'assets/video/';
const TASKS = [['chip_pick', 'Chip pick'], ['egg_pick', 'Egg pick'], ['charger_press', 'Charger press'], ['pullback_car', 'Pull-back car'], ['whiteboard_erase', 'Whiteboard erase']];
const fmt = (t) => (isFinite(t) ? t : 0).toFixed(1);

/* ------------------------------------------------ lazy, visibility-aware autoplay for data-src videos */
const io = new IntersectionObserver((es) => es.forEach((e) => {
  const v = e.target;
  if (e.isIntersecting) {
    if (!v.getAttribute('src') && v.dataset.src) v.src = v.dataset.src;
    if (!v.dataset.manual) v.play().catch(() => {});
  } else if (!v.paused) v.pause();
}), { rootMargin: '250px 0px' });
const watch = (root = document) => $$('video[data-src]', root).forEach((v) => io.observe(v));
const unwatch = (root) => $$('video', root).forEach((v) => { io.unobserve(v); v.pause(); v.removeAttribute('src'); v.load(); });
const lazy = (src, extra = '') => `<video muted playsinline loop preload="none" data-src="${V}${src}.mp4" poster="${V}${src}.jpg" ${extra}></video>`;
const tabs = (el, items, on) => {
  el.innerHTML = items.map(([k, n], i) => `<button type="button" role="tab" data-k="${k}" aria-selected="${i === 0}">${n}</button>`).join('');
  el.addEventListener('click', (e) => { const b = e.target.closest('button'); if (!b) return;
    $$('button', el).forEach((x) => x.setAttribute('aria-selected', x === b)); on(b.dataset.k); });
  on(items[0][0]);
};

/* ------------------------------------------------ navbar, mobile menu */
const nav = $('#ft-navbar'), hero = $('#top');
const onScroll = () => nav.classList.toggle('is-scrolled', scrollY > hero.offsetHeight - 90);
addEventListener('scroll', onScroll, { passive: true }); onScroll();
const menu = $('#ft-nav-mobile'), tgl = $('#ft-nav-toggle');
tgl.addEventListener('click', () => { const o = menu.classList.toggle('is-open'); tgl.setAttribute('aria-expanded', o); });
$$('a', menu).forEach((a) => a.addEventListener('click', () => { menu.classList.remove('is-open'); tgl.setAttribute('aria-expanded', false); }));

/* ------------------------------------------------ charts (HTML bars, one value axis, hover tooltips) */
const tip = document.createElement('div');
tip.className = 'vt-tip'; tip.setAttribute('role', 'tooltip'); document.body.append(tip);
const showTip = (e, html) => { tip.innerHTML = html; tip.classList.add('on');
  const r = e.currentTarget.getBoundingClientRect(); tip.style.left = (r.left + r.width / 2 + scrollX) + 'px'; tip.style.top = (r.top + scrollY - 8) + 'px'; };
const hideTip = () => tip.classList.remove('on');
const bindTips = (root) => $$('[data-tip]', root).forEach((el) => {
  el.addEventListener('mouseenter', (e) => showTip(e, el.dataset.tip)); el.addEventListener('mouseleave', hideTip);
  el.addEventListener('focus', (e) => showTip(e, el.dataset.tip)); el.addEventListener('blur', hideTip);
});
const srTable = (head, rows) => `<div class="sr-only"><table><thead><tr>${head.map((h) => `<th>${h}</th>`).join('')}</tr></thead><tbody>${rows.map((r) => `<tr>${r.map((c) => `<td>${c}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`;  // a table ignores the 1px sr-only box, so wrap it

// Table 1, mean SR over five tasks. [policy, uses touch, real only, + unfiltered synthetic (w/o VeriEval), + VeriTouch]
const POL = [['ACT', false, 6.7, 9.3, 18.3], ['π<sub>0.5</sub>', false, 19.7, 21.7, 30.0], ['N<sub>0</sub>-VTLA', true, 31.3, 33.3, 51.7], ['FTP-1', true, 20.0, 27.3, 35.0]];
const plain = (s) => s.replace(/<[^>]+>/g, '');
(() => {
  const el = $('#polChart'), MAX = 70, y = (v) => (v / MAX * 100).toFixed(2) + '%';
  const legend = `<div class="vc-legend"><span><i class="s base"></i>Real data only</span><span><i class="s raw"></i>+ unfiltered synthetic</span><span><i class="s ours"></i>+ VeriTouch data</span></div>`;
  el.innerHTML = `<div class="vc-head"><div><span class="vc-k">Real-robot success rate · mean over five tasks (%)</span>
      <h4 class="vc-h">Every policy improves with VeriTouch data</h4></div>${legend}</div>
    <div class="vb-plot">
      <div class="vb-y" aria-hidden="true">${[0, 20, 40, 60].map((v) => `<span style="bottom:${y(v)}"><em>${v}</em></span>`).join('')}</div>
      <div class="vb-groups">${POL.map(([p, tac, a, m, b], i) => `<div class="vb-g" tabindex="0" style="--i:${i}"
          data-tip="<b>${plain(p)}</b><br>Real data only ${a.toFixed(1)}%<br>+ unfiltered synthetic ${m.toFixed(1)}%<br>+ VeriTouch ${b.toFixed(1)}%">
        <div class="vb-bars">
          <i class="base" style="height:${y(a)};--j:0"><em>${a.toFixed(1)}</em></i><i class="raw" style="height:${y(m)};--j:1"><em>${m.toFixed(1)}</em></i><i class="ours" style="height:${y(b)};--j:2"><em>${b.toFixed(1)}</em><b class="vb-gain">+${(b - a).toFixed(1)}<small>pp</small></b></i>
        </div>
        <div class="vb-name"><b>${p}</b><small>${tac ? 'vision + touch' : 'vision only'}</small></div></div>`).join('')}</div>
    </div>
    <p class="vc-foot">Average over the four policies: <b class="base">19.4%</b> real data only → <b class="raw">22.9%</b> unfiltered → <b class="ours">33.8%</b> with VeriTouch data.</p>
    ${srTable(['Policy', 'Real data only (%)', '+ unfiltered synthetic (%)', '+ VeriTouch (%)'], POL.map(([p, , a, m, b]) => [plain(p), a, m, b]))}`;
  bindTips(el);
})();

// Fig. 3: N0-VTLA data scaling. (a) mean SR per synthetic/real ratio; (b) per-task SR. Per-task values for 0x-2x were read
// off the vector radar in n0_data_scaling.pdf (4x matches the printed labels, each ring's mean matches (a)).
const RATIOS = ['0×', '1×', '2×', '4×'], MEAN = [33.0, 52.7, 53.7, 67.0];
const TASK5 = ['Chip', 'Egg', 'Press', 'Car', 'Erase'];
const PER = [[30.0, 26.7, 16.7, 50.0, 41.7], [46.7, 63.3, 33.3, 73.3, 46.7], [43.3, 66.7, 36.7, 73.3, 48.3], [60.0, 83.3, 56.7, 83.3, 51.7]];
const VW = 520, VH = 330;                      // both Fig. 3 panels share one canvas, so the two cards match exactly
const head = (k, h, legend = '') => `<div class="vc-head"><div><span class="vc-k">${k}</span><h4 class="vc-h">${h}</h4></div>${legend}</div>`;
(() => {
  const el = $('#scaleChart'), L = 44, R = 28, T = 34, B = 44, max = 80;
  const X = (i) => L + 30 + i * (VW - L - R - 60) / 3, Y = (v) => T + (VH - T - B) * (1 - v / max);
  const grid = [0, 20, 40, 60, 80].map((v) => `<line class="g${v ? '' : ' z'}" x1="${L}" x2="${VW - R}" y1="${Y(v)}" y2="${Y(v)}"/>
    <text class="ax" x="${L - 10}" y="${Y(v) + 4}" text-anchor="end">${v}</text>`).join('');
  const pts = MEAN.map((v, i) => [X(i), Y(v)]);
  const line = pts.map(([px, py], i) => `${i ? 'L' : 'M'}${px.toFixed(1)},${py.toFixed(1)}`).join(' ');
  const area = `${line} L${pts[3][0].toFixed(1)},${Y(0)} L${pts[0][0].toFixed(1)},${Y(0)} Z`;
  const marks = MEAN.map((v, i) => `<g class="pt${i ? '' : ' base'}${i === 3 ? ' end' : ''}" tabindex="0" style="--i:${i}"
      data-tip="<b>${i ? RATIOS[i] + ' synthetic : real' : 'Real data only'}</b><br>${v.toFixed(1)}% mean success">
      <rect class="hit" x="${X(i) - 36}" y="${T}" width="72" height="${VH - T - B}"/>
      <circle cx="${X(i)}" cy="${Y(v)}" r="${i === 3 ? 7 : 5.5}"/>
      <text class="lbl" x="${X(i)}" y="${Y(v) - (i === 3 ? 16 : 13)}" text-anchor="middle">${v.toFixed(1)}${i === 3 ? '%' : ''}</text>
      <text class="ax xl" x="${X(i)}" y="${VH - B + 22}" text-anchor="middle">${i ? RATIOS[i] : 'real only'}</text></g>`).join('');
  el.innerHTML = head('N<sub>0</sub>-VTLA · mean over five tasks', 'Success doubles as verified data grows',
      `<div class="vc-legend"><span><i class="m base"></i>Real data only</span><span><i class="b"></i>+ VeriTouch data, by amount</span></div>`) +
    `<svg class="vc-svg" viewBox="0 0 ${VW} ${VH}" role="img" aria-label="Mean success rate rises from 33.0% with real data only to 67.0% with four times as much verified synthetic data as real data">
      <defs><linearGradient id="vcArea" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#7d5fb4" stop-opacity=".32"/><stop offset="1" stop-color="#7d5fb4" stop-opacity="0"/></linearGradient></defs>
      ${grid}
      <line class="ref" x1="${L}" x2="${VW - R}" y1="${Y(33)}" y2="${Y(33)}"/><text class="ref-t" x="${VW - R}" y="${Y(33) + 15}" text-anchor="end">real data only · 33.0</text>
      <path class="area" d="${area}"/><path class="ln" d="${line}" pathLength="1"/>${marks}
      <text class="ax at" x="${(L + VW - R) / 2}" y="${VH - 4}" text-anchor="middle">synthetic : real data</text></svg>
    ${srTable(['Synthetic / real', 'Mean success (%)'], MEAN.map((v, i) => [RATIOS[i], v]))}`;
  bindTips(el);
})();
(() => {
  const el = $('#radarChart'), cx = VW / 2, cy = 168, R = 124;
  const ang = (k) => -Math.PI / 2 + k * 2 * Math.PI / 5, P = (k, v) => [cx + Math.cos(ang(k)) * R * v / 100, cy + Math.sin(ang(k)) * R * v / 100];
  const poly = (vals) => vals.map((v, k) => P(k, v).map((q) => q.toFixed(1)).join(',')).join(' ');
  const rings = [25, 50, 75, 100].map((v) => `<polygon class="ring" points="${poly(Array(5).fill(v))}"/>`).join('') +
    [50, 100].map((v) => `<text class="ax rv" x="${cx + 4}" y="${cy - R * v / 100 + 11}">${v}</text>`).join('');
  const spokes = TASK5.map((_, k) => { const [px, py] = P(k, 100); return `<line class="spoke" x1="${cx}" y1="${cy}" x2="${px}" y2="${py}"/>`; }).join('');
  const SER = [[0, 'base', 'Real data only'], [3, 'ours', 'VeriTouch, 4× synthetic']];
  const shapes = SER.map(([r, cl]) => `<polygon class="ser ${cl}" points="${poly(PER[r])}"/>`).join('');
  // values only on hover: each vertex is its own target
  const points = SER.map(([r, cl, name]) => PER[r].map((v, k) => { const [px, py] = P(k, v);
    return `<g class="vx ${cl}" tabindex="0" data-tip="<b>${TASK5[k]}</b><br>${name}: ${v.toFixed(1)}%"><circle class="hit" cx="${px}" cy="${py}" r="13"/><circle class="dot" cx="${px}" cy="${py}" r="${cl === 'ours' ? 5 : 4}"/></g>`; }).join('')).join('');
  const labels = TASK5.map((t, k) => { const [px, py] = P(k, 118), anchor = Math.abs(px - cx) < 5 ? 'middle' : px > cx ? 'start' : 'end';
    return `<text class="tn" x="${px}" y="${py + (k === 0 ? -6 : k > 1 && k < 4 ? 16 : 5)}" text-anchor="${anchor}">${t}</text>`; }).join('');
  el.innerHTML = head('N<sub>0</sub>-VTLA · success rate per task', 'Gains on all five tasks',
      `<div class="vc-legend"><span><i class="m base"></i>Real data only</span><span><i class="b"></i>VeriTouch, 4× synthetic</span><span class="vc-hint">hover a point for its value</span></div>`) +
    `<svg class="vc-svg vc-radar" viewBox="0 0 ${VW} ${VH}" role="img" aria-label="Per-task success rate with real data only and with four times as much verified synthetic data">
      <defs><radialGradient id="vcRad" cx="50%" cy="50%" r="50%"><stop offset="0" stop-color="#7d5fb4" stop-opacity=".08"/><stop offset="1" stop-color="#7d5fb4" stop-opacity=".34"/></radialGradient></defs>
      <g class="web">${rings}${spokes}</g>${labels}<g class="grow" style="transform-origin:${cx}px ${cy}px">${shapes}${points}</g></svg>
    ${srTable(['Task', ...RATIOS.map((r) => r + ' (%)')], TASK5.map((t, k) => [t, ...PER.map((row) => row[k])]))}`;
  bindTips(el);
})();

// charts animate in once, when they first scroll into view
(() => {
  const charts = $$('.vt-chart');
  if (!('IntersectionObserver' in window) || matchMedia('(prefers-reduced-motion: reduce)').matches) { charts.forEach((c) => c.classList.add('is-in')); return; }
  charts.forEach((c) => c.classList.add('is-anim'));
  const cio = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('is-in'); cio.unobserve(e.target); } }), { threshold: .3 });
  charts.forEach((c) => cio.observe(c));
})();

// verification ablations (Tables 5 and 6, N0-VTLA mean SR over five tasks): one series, the full setting emphasised
function hbars(el, k, title, rows, gainFrom) {
  const MAX = 60, best = rows[rows.length - 1][1];
  el.innerHTML = `<div class="vc-head"><div><span class="vc-k">${k}</span><h4 class="vc-h">${title}</h4></div></div>
    <div class="vh-rows">${rows.map(([n, v, ours], i) => `<div class="vh-row${ours ? ' ours' : ''}" tabindex="0" style="--i:${i}" data-tip="<b>${n}</b><br>${v.toFixed(1)}% mean success">
      <span class="vh-n">${n}</span><span class="vh-t"><i style="width:${(v / MAX * 100).toFixed(2)}%"><em>${v.toFixed(1)}</em></i></span></div>`).join('')}</div>
    <p class="vh-foot"><b>+${(best - gainFrom).toFixed(1)} pp</b> over ${rows.find(([, v]) => v === gainFrom)[0].toLowerCase()}</p>
    ${srTable(['Setting', 'Mean success (%)'], rows.map(([n, v]) => [n, v]))}`;
  bindTips(el);
}
hbars($('#filterChart'), 'N<sub>0</sub>-VTLA · which synthetic rollouts are kept', 'Touch checks matter on top of vision',
  [['All, unfiltered', 33.3], ['Visual checks only', 43.3], ['Visual + touch checks', 51.7, true]], 43.3);
hbars($('#touchChart'), 'N<sub>0</sub>-VTLA · touch input during training', 'Generated touch doubles success',
  [['No-contact touch', 26.0], ['Generated touch', 51.7, true]], 26.0);

// Table 4: real-robot replay of extracted actions, 10 held-out trajectories per task
(() => {
  const el = $('#idmChart');
  const M = [['TACO*', [50, 90, 50, 70, 90]], ['DreamGen', [60, 90, 60, 70, 90]], ['EVA', [80, 90, 60, 90, 100]], ['VeriIDM (ours)', [90, 100, 100, 80, 100], true]];
  const avg = (a) => a.reduce((x, y) => x + y, 0) / a.length;
  el.innerHTML = `<div class="vc-head"><div><span class="vc-k">Real-robot replay success · mean over five tasks (%)</span>
      <h4 class="vc-h">94% of VeriIDM's extracted actions succeed when replayed</h4></div></div>
    <div class="vh-rows vh-idm">${M.map(([n, t, ours], i) => `<div class="vh-row${ours ? ' ours' : ''}" tabindex="0" style="--i:${i}"
        data-tip="<b>${n}</b><br>${TASK5.map((k, j) => `${k} ${t[j]}%`).join(' · ')}<br>mean ${avg(t).toFixed(1)}%">
      <span class="vh-n">${n}</span><span class="vh-t"><i style="width:${avg(t).toFixed(2)}%"><em>${avg(t).toFixed(1)}</em></i></span></div>`).join('')}</div>
    <p class="vh-foot">*Reimplementation of TACO's action-prediction branch. Hover a method for its per-task results.</p>
    ${srTable(['Method', ...TASK5.map((k) => k + ' (%)'), 'Mean (%)'], M.map(([n, t]) => [n, ...t, avg(t).toFixed(1)]))}`;
  bindTips(el);
})();

/* ------------------------------------------------ contact timing: kept vs. rejected (VeriEval records of demo_0034 / demo_0066) */
(() => {
  const el = $('#timingFig');
  const ROWS = [ // [verdict, rollout, camera contact (s), touch contact (s), note]
    ['Kept', 'egg 34', [9.2, 13.67], [9.27, 13.73], 'contact lines up'],
    ['Rejected', 'egg 66', [7.6, 11.27], [8.25, 13.57], 'touch ends 2.3 s after the camera'],
  ];
  const t0 = 6, t1 = 15, W = 1000, L = 150, X = (t) => L + (t - t0) / (t1 - t0) * (W - L - 10);
  let y = 8, svg = '';
  ROWS.forEach(([v, id, cam, tch, note], k) => {
    const bad = k === 1;
    if (bad) [[cam[0], tch[0]], [cam[1], tch[1]]].forEach(([a, b]) => { if (Math.abs(b - a) > 1)
      svg += `<rect class="mis" x="${X(Math.min(a, b))}" y="${y - 4}" width="${Math.abs(X(b) - X(a))}" height="64" rx="4"/>`; });
    svg += `<text class="v ${bad ? 'bad' : 'ok'}" x="0" y="${y + 18}">${v}</text><text class="id" x="0" y="${y + 38}">${id}</text>
      <rect class="cam" x="${X(cam[0])}" y="${y}" width="${X(cam[1]) - X(cam[0])}" height="22" rx="4"/>
      <rect class="tch" x="${X(tch[0])}" y="${y + 30}" width="${X(tch[1]) - X(tch[0])}" height="22" rx="4"/>
      <text class="note ${bad ? 'bad' : 'ok'}" x="${X(Math.max(cam[1], tch[1])) + 10}" y="${y + 33}">${note}</text>`;
    y += 92;
  });
  svg += [6, 8, 10, 12, 14].map((t) => `<text class="tk" x="${X(t)}" y="${y}" text-anchor="middle">${t} s</text>`).join('');
  el.insertAdjacentHTML('afterbegin', `<div class="vt-tl-legend"><span><i class="cam"></i>camera sees contact</span><span><i class="tch"></i>touch feels contact</span></div>
    <svg class="vt-tl2" viewBox="0 0 ${W + 260} ${y + 6}" role="img" aria-label="Kept rollout: camera contact 9.2 to 13.7 s, touch contact 9.3 to 13.7 s. Rejected rollout: camera contact 7.6 to 11.3 s, touch contact 8.3 to 13.6 s.">${svg}</svg>`);
})();

/* ------------------------------------------------ same robot, same task: real-only vs. + VeriTouch (N0-VTLA) */
const EXEC = {
  chip_pick: ['strip_chip_n0', 'Never transfers the chip into the cup.', 'Picks up the chip and drops it into the cup.'],
  egg_pick: ['strip_egg_n0_l8', 'Closes beside the egg without lifting it.', 'Grasps the egg, carries it over and releases it onto the tray.'],
  charger_press: ['strip_press_n0', 'Reaches the power strip but does not press the plug home.', 'Presses the pre-aligned plug down into the socket.'],
  pullback_car: ['case_pullback_car', 'Lowers onto the car but does not pull it back and launch it.', 'Pulls the car back and releases it; the car shoots off the board.', true],
  whiteboard_erase: ['case_whiteboard_erase', 'Runs for a full minute without completing the erase.', 'Erases the mark with the sponge.', true],
};
const pair = $('#execPair');
tabs($('#execTabs'), TASKS, (k) => {
  unwatch(pair);
  const [src, fail, ok, one] = EXEC[k];
  const fig = (side, good, txt) => `<figure>
    <div class="vt-ph"><b class="${good ? 'is-ok' : 'is-bad'}">${good ? '+ VeriTouch data' : 'Real data only'}</b><span>${one ? 'third-person' : 'third-person | wrist'}</span></div>
    ${lazy(one ? `policy/${src}_${side === 'base' ? 'base' : 'vt'}` : `policy/${src}_${side}`, 'controls')}
    <figcaption><strong class="${good ? 'pc-outcome-success' : 'pc-outcome-failure'}">${good ? 'Success' : 'Failure'} · </strong>${txt}</figcaption></figure>`;
  pair.innerHTML = `<div class="vt-pair ${one ? 'one' : ''}">${fig('base', false, fail)}${fig('vt', true, ok)}</div>`;
  watch(pair);
});

/* ------------------------------------------------ generated vs. real: drag-to-compare, four synced views (main, wrist, left and right fingertip) */
const VIEWS = [['main', 'Main camera'], ['wrist', 'Wrist camera'], ['touchl', 'Left fingertip'], ['touchr', 'Right fingertip']];
const views = $('#wmViews'), wctl = $('#wmCmp .vt-cmp3-ctl'), wbtn = $('button', wctl), wrng = $('input', wctl), wout = $('output', wctl);
let wvids = [], wlead = null, wx = 50, wpaused = false, won = false, wtask = 'chip_pick';
const setX = (p) => { wx = Math.max(0, Math.min(100, p)); views.style.setProperty('--x', wx + '%'); $$('.vt-surf', views).forEach((s) => s.setAttribute('aria-valuenow', Math.round(wx))); };
const wicon = () => { wbtn.innerHTML = `<i class="fa-solid fa-${wpaused ? 'play' : 'pause'}"></i>`; };
const wplay = () => { if (!won || wpaused) return; wvids.forEach((v) => { if (!v.getAttribute('src')) v.src = v.dataset.s; v.play().catch(() => {}); }); };
function wrender(k) {
  wtask = k;
  wvids.forEach((v) => { v.pause(); v.removeAttribute('src'); v.load(); });
  views.innerHTML = VIEWS.map(([v, label]) => `<figure class="vt-v3 is-${v}"><figcaption>${label}</figcaption>
    <div class="vt-surf" tabindex="0" role="slider" aria-label="${label}: drag to compare the real recording and VeriGen" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${Math.round(wx)}">
      <video class="pred" muted playsinline loop preload="none" data-s="${V}wm/${k}_pred_${v}.mp4" poster="${V}wm/${k}_pred_${v}.jpg"></video>
      <video class="gt" muted playsinline loop preload="none" data-s="${V}wm/${k}_gt_${v}.mp4" poster="${V}wm/${k}_gt_${v}.jpg"></video>
      <span class="vt-sl is-gt">Real</span><span class="vt-sl is-pred">VeriGen</span>
      <div class="vt-div"><i class="fa-solid fa-arrows-left-right"></i></div></div></figure>`).join('');
  wvids = $$('video', views); wlead = wvids[1];          // the real main camera is the clock; the other seven follow it
  $$('.vt-surf', views).forEach((surf) => {               // one divider for every view
    let drag = false;
    const pos = (e) => { const r = surf.getBoundingClientRect(); setX((e.clientX - r.left) / r.width * 100); };
    surf.addEventListener('pointerdown', (e) => { drag = true; surf.setPointerCapture(e.pointerId); pos(e); });
    surf.addEventListener('pointermove', (e) => { if (drag) pos(e); });
    surf.addEventListener('pointerup', () => { drag = false; });
    surf.addEventListener('keydown', (e) => { if (e.key === 'ArrowLeft') { setX(wx - 5); e.preventDefault(); } if (e.key === 'ArrowRight') { setX(wx + 5); e.preventDefault(); } });
  });
  wlead.addEventListener('loadedmetadata', () => { wrng.max = wlead.duration.toFixed(2); });
  wlead.addEventListener('timeupdate', () => {
    const t = wlead.currentTime;
    wvids.forEach((v) => { if (v !== wlead && v.readyState > 1 && Math.abs(v.currentTime - t) > .08) v.currentTime = t; });
    wrng.value = t; wout.textContent = `${fmt(t)} / ${fmt(wlead.duration)} s`;
  });
  setX(wx); wplay();
  if (models.open) mrender();
}
wbtn.addEventListener('click', () => { wpaused = !wpaused; wicon(); if (wpaused) wvids.forEach((v) => v.pause()); else wplay(); });
wrng.addEventListener('input', () => wvids.forEach((v) => { v.currentTime = +wrng.value; }));
new IntersectionObserver(([e]) => { won = e.isIntersecting; if (won) wplay(); else wvids.forEach((v) => v.pause()); }, { rootMargin: '150px 0px' }).observe(views);

/* ------------------------------------------------ other world models: collapsed by default, rendered only when opened */
// A model's clip goes to assets/video/cmp/<task>_<slug>.mp4 (+ .jpg poster), e.g. cmp/chip_pick_cosmossuper.mp4; then add that name to READY.
const MODELS = [
  ['Real recording', 'ground truth', 'gt'], ['VeriGen (ours)', 'video + touch', 'ours'], ['N<sub>0</sub>-TWAM', 'video + touch'],
  ['Dream-Tac', 'video + touch'], ['Cosmos-Super', 'video only'], ['MiniMax-H3', 'video only'],
  ['Cosmos-Nano', 'video only'], ['Wan2.2-A14B', 'video only'], ['WoW-1', 'video only'],
];
const READY = new Set([]);
const slug = (n) => plain(n).toLowerCase().replace(/[^a-z0-9]+/g, '');
const models = $('#models'), cmp = $('#cmpGrid');
function mrender() {
  unwatch(cmp);
  cmp.innerHTML = MODELS.map(([n, kind, role]) => {
    const file = `${wtask}_${slug(n)}`;
    const media = role === 'gt' ? lazy(`wm/${wtask}_gt_main`) : role === 'ours' ? lazy(`wm/${wtask}_pred_main`)
      : READY.has(file) ? lazy(`cmp/${file}`)
      : `<div class="vt-pend" title="expected file: assets/video/cmp/${file}.mp4"><i class="fa-regular fa-clock" aria-hidden="true"></i><span>output pending</span></div>`;
    return `<figure class="vt-mdl ${role || ''}"><figcaption><b>${n}</b><span>${kind}</span></figcaption>${media}</figure>`;
  }).join('');
  watch(cmp);
}
models.addEventListener('toggle', () => { if (models.open) mrender(); else { unwatch(cmp); cmp.innerHTML = ''; } });
tabs($('#wmTasks'), TASKS, wrender);

/* ------------------------------------------------ lightbox, bibtex */
const lb = $('#lb');
document.addEventListener('click', (e) => { const im = e.target.closest('img.zoom'); if (!im) return; $('img', lb).src = im.src; $('img', lb).alt = im.alt; lb.classList.add('on'); });
lb.addEventListener('click', () => lb.classList.remove('on'));
addEventListener('keydown', (e) => { if (e.key === 'Escape') lb.classList.remove('on'); });
$('#copyBib').addEventListener('click', (e) => {
  const lab = $('span', e.currentTarget);
  navigator.clipboard?.writeText($('#bib').textContent.trim()).then(() => { lab.textContent = 'Copied'; setTimeout(() => (lab.textContent = 'Copy'), 1400); });
});

/* ------------------------------------------------ hero: affiliations fold away on phones */
$('#vtAffT').addEventListener('click', (e) => { const o = hero.classList.toggle('aff-open'); e.currentTarget.setAttribute('aria-expanded', o); });

watch();
})();
