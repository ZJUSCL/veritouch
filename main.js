/* VeriTouch project page: content sections (the pipeline animation lives in hero.js) */
(() => {
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const V = 'assets/video/';
const TASKS = [['chip_pick', 'Chip pick'], ['egg_pick', 'Egg pick'], ['charger_press', 'Charger press'], ['pullback_car', 'Pull-back car'], ['whiteboard_erase', 'Whiteboard erase']];
const fmt = (t) => (isFinite(t) ? t : 0).toFixed(1);

/* ------------------------------------------------ lazy, visibility-aware autoplay for data-src / data-s videos */
const io = new IntersectionObserver((es) => es.forEach((e) => {
  const v = e.target, s = v.dataset.src || v.dataset.s;
  if (e.isIntersecting) {
    if (!v.getAttribute('src') && s) v.src = s;
    if (!v.dataset.manual) v.play().catch(() => {});
  } else if (!v.paused) v.pause();
}), { rootMargin: '250px 0px' });
const watch = (root = document) => $$('video[data-src],video[data-s]:not(.pred):not(.gt)', root).forEach((v) => io.observe(v));
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
const N0 = '<span class="vt-cal">𝒩</span><sub>0</sub>';
const POL = [['ACT', false, 6.7, 9.3, 18.3], ['<span class="vt-pi">π</span><sub>0.5</sub>', false, 19.7, 21.7, 30.0], [`${N0}-VTLA`, true, 31.3, 33.3, 51.7], ['FTP-1', true, 20.0, 27.3, 35.0]];
const plain = (s) => s.replace(/<[^>]+>/g, '');
(() => {
  const el = $('#polChart'), MAX = 70, y = (v) => (v / MAX * 100).toFixed(2) + '%';
  const legend = `<div class="vc-legend"><span><i class="s base"></i>Baseline</span><span><i class="s raw"></i>VeriTouch w/o VeriEval</span><span><i class="s ours"></i>VeriTouch</span></div>`;
  el.innerHTML = `<div class="vc-head"><h4 class="vc-h">Every policy improves with VeriTouch</h4>${legend}</div>
    <div class="vb-plot">
      <div class="vb-y" aria-hidden="true">${[0, 20, 40, 60].map((v) => `<span style="bottom:${y(v)}"><em>${v}</em></span>`).join('')}</div>
      <div class="vb-groups">${POL.map(([p, tac, a, m, b], i) => `<div class="vb-g" tabindex="0" style="--i:${i}"
          data-tip="<b>${plain(p)}</b><br>Baseline ${a.toFixed(1)}%<br>VeriTouch w/o VeriEval ${m.toFixed(1)}%<br>VeriTouch ${b.toFixed(1)}%">
        <div class="vb-bars">
          <i class="base" style="height:${y(a)};--j:0"><em>${a.toFixed(1)}</em></i><i class="raw" style="height:${y(m)};--j:1"><em>${m.toFixed(1)}</em></i><i class="ours" style="height:${y(b)};--j:2"><em>${b.toFixed(1)}</em><b class="vb-gain">+${(b - a).toFixed(1)}<small>pp</small></b></i>
        </div>
        <div class="vb-name"><b>${p}</b><small>${tac ? 'vision + touch' : 'vision only'}</small></div></div>`).join('')}</div>
    </div>
    <p class="vc-foot">Mean across 4 policies: <b class="base">19.4%</b> → <b class="raw">22.9%</b> → <b class="ours">33.8%</b></p>
    ${srTable(['Policy', 'Baseline (%)', 'VeriTouch w/o VeriEval (%)', 'VeriTouch (%)'], POL.map(([p, , a, m, b]) => [plain(p), a, m, b]))}`;
  bindTips(el);
})();

// Fig. 3: N0-VTLA data scaling across 5 tasks + Avg (0x, 1x, 2x, 4x synthetic : real).
const RATIOS = ['0脳', '1脳', '2脳', '4脳'], MEAN = [33.0, 52.7, 53.7, 67.0];
const TASK5 = ['Chip', 'Egg', 'Press', 'Car', 'Erase'];
const PER = [[30.0, 26.7, 16.7, 50.0, 41.7], [46.7, 63.3, 33.3, 73.3, 46.7], [43.3, 66.7, 36.7, 73.3, 48.3], [60.0, 83.3, 56.7, 83.3, 51.7]];
const head = (h, legend = '') => `<div class="vc-head"><h4 class="vc-h">${h}</h4>${legend}</div>`;
(() => {
  const el = $('#scaleChart'), MAX = 100, y = (v) => (v / MAX * 100).toFixed(2) + '%';
  const GROUPS = [
    ...TASK5.map((name, k) => ({ name, vals: PER.map((row) => row[k]), avg: false })),
    { name: 'Avg', vals: MEAN, avg: true },
  ];
  const CLS = ['s0', 's1', 's2', 's4'];
  const legend = `<div class="vc-legend"><span><i class="s s0"></i>0脳 (Baseline)</span><span><i class="s s1"></i>1脳</span><span><i class="s s2"></i>2脳</span><span><i class="s s4"></i>4脳</span></div>`;
  el.innerHTML = head('Success grows across all five tasks as verified data scales', legend) +
    `<div class="vb-plot vb-scale">
      <div class="vb-y" aria-hidden="true">${[0, 20, 40, 60, 80, 100].map((v) => `<span style="bottom:${y(v)}"><em>${v}</em></span>`).join('')}</div>
      <div class="vb-groups">${GROUPS.map((g, i) => {
        const [v0, v1, v2, v4] = g.vals;
        const tip = `<b>${g.name}</b><br>0脳 (Baseline) ${v0.toFixed(1)}%<br>1脳 ${v1.toFixed(1)}%<br>2脳 ${v2.toFixed(1)}%<br>4脳 ${v4.toFixed(1)}% (+${(v4 - v0).toFixed(1)} pp)`;
        return `<div class="vb-g${g.avg ? ' is-avg' : ''}" tabindex="0" style="--i:${i}" data-tip="${tip}">
          <div class="vb-bars">${g.vals.map((v, j) => `<i class="${CLS[j]}" style="height:${y(v)};--j:${j}"><em>${v.toFixed(1)}</em>${j === 3 ? `<b class="vb-gain">+${(v4 - v0).toFixed(1)}<small>pp</small></b>` : ''}</i>`).join('')}</div>
          <div class="vb-name"><b>${g.name}</b></div></div>`;
      }).join('')}</div>
    </div>
    <p class="vc-foot">Mean across 5 tasks (${N0}-VTLA): <b class="base">33.0%</b> (0脳) 鈫?<b class="s1">52.7%</b> (1脳) 鈫?<b class="s2">53.7%</b> (2脳) 鈫?<b class="ours">67.0%</b> (4脳)</p>
    ${srTable(['Task', '0脳 (%)', '1脳 (%)', '2脳 (%)', '4脳 (%)'], GROUPS.map((g) => [g.name, ...g.vals]))}`;
  bindTips(el);
})();

// segmented single-choice toggle + scientific tables
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
const seg = (el, cb) => el && el.addEventListener('click', (e) => {
  const b = e.target.closest('button'); if (!b || b.classList.contains('is-active')) return;
  $$('button', el).forEach((x) => x.classList.toggle('is-active', x === b)); cb(b);
});
const fillTable = (el, headCols, rows, { ours = -1, best = [], left = 1, sep = [] } = {}) => {
  if (!el) return;
  el.innerHTML = `<thead><tr>${headCols.map((x, i) => `<th class="${i < left ? 'l' : ''}">${x}</th>`).join('')}</tr></thead><tbody>${rows.map((r, ri) =>
    `<tr class="${ri === ours ? 'ours' : ''}${sep.includes(ri) ? ' sep' : ''}">${r.map((c, i) =>
      `<td class="${i < left ? 'l' : ''}${best.some(([R, C]) => R === ri && C === i) ? ' best' : ''}">${c}</td>`).join('')}</tr>`).join('')}</tbody>`;
};

/* ------------------------------------------------ 1 · VeriGen: 3-axis Touch Radar & 2D Video Map / Lollipop (Tables 2 & 3) */
(() => {
  const T2M = [
    { key: 'verigen', name: 'VeriGen', c: '#5a7fa3', ours: true, tok: '11.3k', vals: [0.76, 0.72, 0.80] },
    { key: 'twam', name: `${N0}-TWAM`, c: '#429488', ours: false, tok: '26.0k', vals: [0.59, 0.48, 0.74] },
    { key: 'dream', name: 'Dream-Tac', c: '#c97a4a', ours: false, tok: '318k', vals: [0.41, 0.37, 0.58] },
  ];
  const AX3 = ['Temp. IoU ↑', 'Temp. corr ↑', 'Shape cos ↑'];
  const tacViz = $('#mcTacViz'), tacLeg = $('#mcTacLeg');
  if (tacViz && tacLeg) {
    const cx = 170, cy = 128, R = 88;
    const ang = (k) => -Math.PI / 2 + k * 2 * Math.PI / 3;
    const P = (k, v) => [cx + Math.cos(ang(k)) * R * v, cy + Math.sin(ang(k)) * R * v];
    const poly = (vs) => vs.map((v, k) => P(k, v).map((q) => q.toFixed(1)).join(',')).join(' ');
    const rings = [0.25, 0.5, 0.75, 1].map((r) => `<polygon class="web${r === 1 ? ' outer' : ''}" points="${poly([r, r, r])}"/>`).join('') +
      [0.5, 1].map((r) => `<text class="ax-tick" x="${cx + 5}" y="${(cy - R * r + 10).toFixed(1)}">${r.toFixed(1)}</text>`).join('');
    const spokes = AX3.map((_, k) => { const [px, py] = P(k, 1); return `<line class="sp" x1="${cx}" y1="${cy}" x2="${px.toFixed(1)}" y2="${py.toFixed(1)}"/>`; }).join('');
    const axLbl = AX3.map((lbl, k) => {
      const [px, py] = P(k, 1.18), anc = k === 0 ? 'middle' : k === 1 ? 'start' : 'end';
      const dy = k === 0 ? -4 : 10;
      return `<text class="ax-lbl" x="${px.toFixed(1)}" y="${(py + dy).toFixed(1)}" text-anchor="${anc}">${lbl}</text>`;
    }).join('');
    const polys = [...T2M].reverse().map((m) => `<polygon class="poly${m.ours ? ' is-ours' : ''}" data-m="${m.key}" points="${poly(m.vals)}" fill="${m.c}" stroke="${m.c}"
      data-tip="<b>${plain(m.name)}</b><br>Temp. IoU ${m.vals[0].toFixed(2)} · Corr ${m.vals[1].toFixed(2)} · Cos ${m.vals[2].toFixed(2)}<br>Tokens: ${m.tok}"/>`).join('');
    const dots = [...T2M].reverse().map((m) => m.vals.map((v, k) => {
      const [px, py] = P(k, v);
      return `<circle class="vdot" data-m="${m.key}" cx="${px.toFixed(1)}" cy="${py.toFixed(1)}" r="${m.ours ? 4.8 : 3.8}" fill="${m.c}"
        data-tip="<b>${plain(m.name)}</b> · ${AX3[k]}: <b>${v.toFixed(2)}</b>"/>`;
    }).join('')).join('');
    const chips = T2M.map((m) => `<div class="vt-tok-chip" data-m="${m.key}" style="--pc:${m.c}">
      <small>${m.name}</small><b>${m.tok}</b><span>tactile tokens</span></div>`).join('');
    tacViz.innerHTML = `<svg class="vt-rad3" viewBox="0 0 340 228" role="img" aria-label="3-axis touch fidelity radar comparing VeriGen, N0-TWAM, and Dream-Tac">
      ${rings}${spokes}${polys}${dots}${axLbl}</svg><div class="vt-tok-row">${chips}</div>`;
    tacLeg.innerHTML = T2M.map((m) => `<button type="button" class="vt-rad-pill" data-m="${m.key}" style="--pc:${m.c}"><i></i><span>${m.name}</span></button>`).join('');
    const focusM = (key) => {
      $$('.poly,.vdot', tacViz).forEach((el) => {
        const hit = key && el.dataset.m === key;
        el.classList.toggle('is-hi', !!hit);
        el.classList.toggle('is-dim', !!(key && !hit));
      });
      $$('.vt-rad-pill,.vt-tok-chip', tacViz.parentElement).forEach((el) => el.classList.toggle('is-hi', !!(key && el.dataset.m === key)));
    };
    let locked = null;
    const bindM = (el) => {
      el.addEventListener('mouseenter', () => { if (!locked) focusM(el.dataset.m); });
      el.addEventListener('mouseleave', () => { if (!locked) focusM(null); });
      el.addEventListener('click', () => { locked = locked === el.dataset.m ? null : el.dataset.m; focusM(locked); });
    };
    $$('[data-m]', tacViz).forEach(bindM);
    $$('[data-m]', tacLeg).forEach(bindM);
    bindTips(tacViz);
  }

  const T3 = [
    ['Cosmos-Nano', 0, 18.06, 0.82, 0.38, 57.33, 33.33, 52.63],
    ['Wan2.2-A14B', 0, 14.04, 0.73, 0.58, 50.67, 20.00, 53.66],
    ['WoW-1', 0, 18.14, 0.82, 0.39, 58.67, 20.00, 47.69],
    ['Cosmos-Super', 0, 18.44, 0.83, 0.38, 69.33, 36.00, 52.34],
    ['MiniMax-H3', 0, 14.94, 0.69, 0.52, 81.33, 86.67, 53.48],
    [`${N0}-TWAM`, 1, 21.34, 0.86, 0.29, 66.67, 90.67, 52.43],
    ['Dream-Tac', 1, 19.23, 0.79, 0.42, 37.33, 6.67, 16.24],
    ['VeriGen', 1, 21.58, 0.87, 0.24, 69.33, 100.00, 52.56],
  ];
  const vidViz = $('#mcVidViz');
  const drawMap = () => {
    const W = 460, H = 224, L = 40, R = 26, T = 18, B = 32;
    const X = (psnr) => L + (psnr - 13) / (22.6 - 13) * (W - L - R);
    const Y = (ifg) => T + (1 - ifg / 108) * (H - T - B);
    const gridX = [14, 16, 18, 20, 22].map((v) => `<line class="sg" x1="${X(v).toFixed(1)}" x2="${X(v).toFixed(1)}" y1="${T}" y2="${H - B}"/>
      <text class="sl" x="${X(v).toFixed(1)}" y="${H - B + 14}" text-anchor="middle">${v}</text>`).join('');
    const gridY = [0, 25, 50, 75, 100].map((v) => `<line class="${v ? 'sg' : 'sa'}" x1="${L}" x2="${W - R}" y1="${Y(v).toFixed(1)}" y2="${Y(v).toFixed(1)}"/>
      <text class="sl" x="${L - 7}" y="${(Y(v) + 3.5).toFixed(1)}" text-anchor="end">${v}</text>`).join('');
    const OFF = { 'VeriGen': [-14, 18, 'end'], '𝒩0-TWAM': [-12, 16, 'end'], 'Cosmos-Super': [0, -14, 'middle'], 'Cosmos-Nano': [-12, 14, 'end'],
      'WoW-1': [12, 4, 'start'], 'Dream-Tac': [0, -12, 'middle'], 'MiniMax-H3': [11, 4, 'start'], 'Wan2.2-A14B': [10, 4, 'start'] };
    const bubs = T3.map((r) => {
      const [name, tac, psnr, , lpips, , ifg] = r, ours = name === 'VeriGen';
      const px = X(psnr), py = Y(ifg), rad = Math.max(6.5, (1 - lpips) * 16.5);
      const col = ours ? '#5a7fa3' : tac ? '#429488' : '#9ba5b4';
      const [dx, dy, anc] = OFF[plain(name)] || [10, 4, 'start'];
      return `<g class="bub${ours ? ' is-ours' : ''}" tabindex="0" data-tip="<b>${plain(name)}</b> (${tac ? 'video + touch' : 'video only'})<br>PSNR ${psnr.toFixed(2)} · LPIPS ${lpips.toFixed(2)} · IF-G ${ifg.toFixed(1)}%">
        ${ours ? `<circle class="pulse" cx="${px.toFixed(1)}" cy="${py.toFixed(1)}" r="${rad.toFixed(1)}"/>` : ''}
        <circle class="dot" cx="${px.toFixed(1)}" cy="${py.toFixed(1)}" r="${rad.toFixed(1)}" fill="${col}" fill-opacity="${ours ? '.92' : '.78'}"/>
        <text class="blbl" x="${(px + dx).toFixed(1)}" y="${(py + dy).toFixed(1)}" text-anchor="${anc}">${plain(name)}</text></g>`;
    }).join('');
    vidViz.innerHTML = `<svg class="vt-scat" viewBox="0 0 ${W} ${H}" role="img" aria-label="2D scatter plot of video PSNR vs instruction following IF-G across 8 world models">
      ${gridX}${gridY}${bubs}
      <text class="st" x="${((L + W - R) / 2).toFixed(1)}" y="${H - 2}" text-anchor="middle">Video quality (PSNR ↑)</text>
      <text class="st" x="12" y="${((T + H - B) / 2).toFixed(1)}" text-anchor="middle" transform="rotate(-90 12 ${((T + H - B) / 2).toFixed(1)})">IF-G (% ↑)</text>
    </svg><div class="vt-scat-leg">
      <div class="vt-leg-items"><span><i style="background:#5a7fa3"></i>VeriGen</span><span><i style="background:#429488"></i>Touch WM</span><span><i style="background:#9ba5b4"></i>Video-only</span></div>
    </div>`;
    bindTips(vidViz);
  };
  const VCOL = {
    psnr:  { col: 2, max: 24,  dec: 2, inv: false, unit: '',  ticks: [0, 6, 12, 18, 24],   label: 'PSNR',  hint: 'Higher is better ↑' },
    lpips: { col: 4, max: 0.6, dec: 2, inv: true,  unit: '',  ticks: [0, 0.2, 0.4, 0.6],   label: 'LPIPS', hint: 'Lower is better ↓' },
    ifg:   { col: 6, max: 100, dec: 1, inv: false, unit: '%', ticks: [0, 25, 50, 75, 100], label: 'IF-G',  hint: 'Higher is better ↑' },
  };
  const drawBars = (m) => {
    const { col, max, dec, inv, unit, ticks, label, hint } = VCOL[m];
    const rows = T3.map((r) => ({ n: r[0], v: r[col], psnr: r[2], ours: r[0] === 'VeriGen', tac: !!r[1] }))
      .sort((a, b) => (inv ? a.v - b.v : b.v - a.v) || (b.psnr - a.psnr));
    const gridLines = ticks.map((t) => `<i class="${t ? '' : 'z'}" style="left:${(t / max * 100).toFixed(2)}%"></i>`).join('');
    const tickLbls = ticks.map((t) => `<span style="left:${(t / max * 100).toFixed(2)}%">${t}${unit}</span>`).join('');
    vidViz.innerHTML = `<div class="vt-hbar-wrap">
      <div class="vt-hbar-body">
        <div class="vt-hbar-grid" aria-hidden="true">${gridLines}</div>
        <div class="vt-hbar-rows">${rows.map((r, i) => {
          const w = Math.max(2, Math.min(100, r.v / max * 100));
          const bc = r.ours ? '#5a7fa3' : r.tac ? '#429488' : '#aeb7c4';
          return `<div class="vt-hbar-row${r.ours ? ' is-ours' : ''}" tabindex="0" style="--bc:${bc};--i:${i}"
              data-tip="<b>${plain(r.n)}</b> (${r.tac ? 'video + touch' : 'video only'})<br>${label}: ${r.v.toFixed(dec)}${unit}">
            <span class="vt-hbar-lbl">${r.n}</span>
            <span class="vt-hbar-trk"><i class="vt-hbar-fill" style="width:${w.toFixed(2)}%"></i></span>
            <span class="vt-hbar-val">${r.v.toFixed(dec)}${unit}</span>
          </div>`;
        }).join('')}</div>
      </div>
      <div class="vt-hbar-axis"><span></span><div class="vt-hbar-ticks">${tickLbls}</div><span></span></div>
    </div>
    <div class="vt-scat-leg">
      <div class="vt-leg-items"><span><i style="background:#5a7fa3"></i>VeriGen</span><span><i style="background:#429488"></i>Touch WM</span><span><i style="background:#9ba5b4"></i>Video-only</span></div>
      <em class="vt-leg-dir">${hint}</em>
    </div>`;
    bindTips(vidViz);
  };
  if (vidViz) {
    drawMap();
    seg($('#mcVid'), (b) => { if (b.dataset.m === 'map') drawMap(); else drawBars(b.dataset.m); });
  }
})();

/* ------------------------------------------------ 2 · VeriEval: 3-stage interactive verifier + 7-dim ring (center detail) + Gauges + Donut Rings */
(() => {
  const steps = $('#vsSteps'), panels = $('#vsPanels');
  if (steps && panels) {
    steps.addEventListener('click', (e) => {
      const b = e.target.closest('.vt-vstep'); if (!b) return;
      const s = b.dataset.s;
      $$('.vt-vstep', steps).forEach((x) => { const on = x === b; x.classList.toggle('is-active', on); x.setAttribute('aria-selected', on); });
      $$('.vt-vpanel', panels).forEach((p) => p.classList.toggle('is-active', p.dataset.p === s));
    });
  }

  const DIMS = [
    ['R1', 'Entity continuity', 'Same objects persist without swaps or vanishing.'],
    ['R2', 'Shape & deformation', 'Shapes and deformations match object materials.'],
    ['R3', 'Articulation', 'Joints and links move along valid axes.'],
    ['R4', 'Solid exclusivity', 'No clipping or interpenetration through solids.'],
    ['R5', 'Contact coupling', 'Object motion follows a plausible grasp.'],
    ['R6', 'Motion & stability', 'Gravity, support and momentum stay physical.'],
    ['R7', 'Instruction', 'Action matches the task goal and objects.'],
  ];
  const dimsEl = $('#dims'), coreEl = $('#dimsCore');
  if (dimsEl && coreEl) {
    dimsEl.insertAdjacentHTML('beforeend', DIMS.map(([k, short], i) => {
      const a = -Math.PI / 2 + i * 2 * Math.PI / 7, x = Math.cos(a) * 39, y = Math.sin(a) * 39;
      return `<button type="button" class="vt-dim" data-i="${i}" style="--x:${x.toFixed(2)};--y:${y.toFixed(2)};--d:${(i * 0.06).toFixed(2)}s"><span class="vt-dim-b">${k}</span><span class="vt-dim-l">${short}</span></button>`;
    }).join(''));
    const showDim = (i) => {
      const [k, short, brief] = DIMS[i];
      $$('.vt-dim', dimsEl).forEach((b) => b.classList.toggle('is-active', +b.dataset.i === i));
      coreEl.innerHTML = `<span class="vt-core-k">${k}</span><b>${short}</b><p>${brief}</p>`;
    };
    let dimAuto = 0, dimTimer = null, dimUser = false;
    showDim(0);
    dimsEl.addEventListener('mouseover', (e) => { const b = e.target.closest('.vt-dim'); if (b) { dimUser = true; showDim(+b.dataset.i); } });
    dimsEl.addEventListener('focusin', (e) => { const b = e.target.closest('.vt-dim'); if (b) { dimUser = true; showDim(+b.dataset.i); } });
    dimsEl.addEventListener('click', (e) => { const b = e.target.closest('.vt-dim'); if (b) { dimUser = true; showDim(+b.dataset.i); } });
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(([e]) => {
        if (e.isIntersecting) {
          dimsEl.classList.add('on');
          if (!dimTimer && !reduce) dimTimer = setInterval(() => { if (!dimUser) showDim(dimAuto = (dimAuto + 1) % 7); }, 3000);
        } else { clearInterval(dimTimer); dimTimer = null; }
      }, { threshold: .25 }).observe(dimsEl);
    } else dimsEl.classList.add('on');
  }

  // Stage 1: Dual semi-circle arc gauges + interactive VLM mini-columns
  const vqEl = $('#vqGauges');
  if (vqEl) {
    const VLMS = [
      ['VeriEval', 'VeriEval (ours)', 74.9, true],
      ['GPT-6', 'GPT-6 Astra', 65.7, false],
      ['GPT-5.5', 'GPT-5.5', 58.6, false],
      ['GPT-5.6', 'GPT-5.6 Sol', 57.0, false],
      ['Qwen3.6', 'Qwen3.6-27B', 52.3, false],
      ['Qwen3.5', 'Qwen3.5-27B', 51.0, false],
    ];
    const arcLen = Math.PI * 52;
    const gauge = (val, label, sub, gc, id) => {
      const off = (arcLen * (1 - val)).toFixed(1);
      return `<div class="vt-gauge" style="--gc:${gc}">
        <svg viewBox="0 0 132 80"><path class="gtrk" d="M 14 68 A 52 52 0 0 1 118 68"/>
          <path class="gval" d="M 14 68 A 52 52 0 0 1 118 68" stroke-dasharray="${arcLen.toFixed(1)}" stroke-dashoffset="${off}"/>
          <text class="gnum" x="66" y="56" text-anchor="middle">${label}</text>
          <text class="gsub" x="66" y="72" text-anchor="middle">${sub}</text></svg>
        <div class="vt-gauge-cap" id="${id}"></div></div>`;
    };
    vqEl.innerHTML = `<div class="vt-vq-gauges">
        ${gauge(0.749, '74.9%', 'Judge accuracy', '#5a7fa3', 'vqCapA')}
        ${gauge(0.80, 'r = 0.80', 'Pearson r', '#429488', 'vqCapR')}
      </div>
      <div class="vt-vq-cols">${VLMS.map(([short, full, v, ours], i) => `<div class="vt-vqc${ours ? ' is-ours is-sel' : ''}" tabindex="0" data-i="${i}"
          data-tip="<b>${full}</b><br>Accuracy: ${v.toFixed(1)}%${ours ? '' : ` (−${(74.9 - v).toFixed(1)} pp vs VeriEval)`}">
        <div class="vt-vqc-trk"><div class="vt-vqc-bar" style="--h:${(v / 85 * 100).toFixed(1)}%"><em>${v.toFixed(1)}</em></div></div>
        <span>${short}</span></div>`).join('')}</div>`;
    const capA = $('#vqCapA'), capR = $('#vqCapR');
    const setCap = (i) => {
      const [, full, v, ours] = VLMS[i];
      capA.innerHTML = ours ? `<b>+9.2 pp</b> vs. GPT-6 Astra` : `${full}: <b>${v.toFixed(1)}%</b>`;
      capR.innerHTML = `vs. <b>0.66</b> GPT-6 Astra`;
      $$('.vt-vqc', vqEl).forEach((el) => el.classList.toggle('is-sel', +el.dataset.i === i));
    };
    setCap(0);
    $$('.vt-vqc', vqEl).forEach((el) => {
      el.addEventListener('mouseenter', () => setCap(+el.dataset.i));
      el.addEventListener('click', () => setCap(+el.dataset.i));
    });
    bindTips(vqEl);
  }

  // Stage 3: 3 side-by-side animated donut progress rings
  const tqEl = $('#tqRings');
  if (tqEl) {
    const TQR = [
      ['VeriEval', 'ours', 81.2, '#c97a4a', true],
      ['TACO-style', 'baseline', 67.4, '#5a7fa3', false],
      ['VITAL-style', 'baseline', 65.3, '#9ba5b4', false],
    ];
    const C = 2 * Math.PI * 38;
    tqEl.innerHTML = `<div class="vt-tq-rings">${TQR.map(([name, sub, v, rc, ours]) => {
      const off = (C * (1 - v / 100)).toFixed(1);
      return `<div class="vt-ring-card${ours ? ' is-ours' : ''}" style="--rc:${rc}" tabindex="0"
          data-tip="<b>${name}</b><br>Tactile verifier F1: ${v.toFixed(1)}%${ours ? ' (+13.8 pp over TACO-style)' : ''}">
        <svg viewBox="0 0 96 96"><circle class="rtrk" cx="48" cy="48" r="38"/>
          <circle class="rval" cx="48" cy="48" r="38" stroke-dasharray="${C.toFixed(1)}" stroke-dashoffset="${off}"/>
          <text class="rnum" x="48" y="51" text-anchor="middle">${v.toFixed(1)}</text>
          <text class="runit" x="48" y="64" text-anchor="middle">F1 %</text></svg>
        <b>${name}</b><small>${sub}</small></div>`;
    }).join('')}</div>`;
    bindTips(tqEl);
  }
})();

/* ------------------------------------------------ 3 · VeriIDM: Vertical Columns + 5-Task Dumbbell Range Plot */
(() => {
  const T4 = [
    ['TACO*', [50, 90, 50, 70, 90], 70.0],
    ['DreamGen', [60, 90, 60, 70, 90], 74.0],
    ['EVA', [80, 90, 60, 90, 100], 84.0],
    ['VeriIDM', [90, 100, 100, 80, 100], 94.0],
  ];
  const taskSeg = $('#idmTask'), idmViz = $('#idmViz'), rangeViz = $('#idmRangeViz');
  let activeTask = -1;
  const drawCols = (idx) => {
    activeTask = idx;
    if (taskSeg) $$('button', taskSeg).forEach((b) => b.classList.toggle('is-active', +b.dataset.i === idx));
    if (rangeViz) $$('.vt-db-row', rangeViz).forEach((r) => r.classList.toggle('is-active', +r.dataset.i === idx));
    if (!idmViz) return;
    const vals = T4.map(([, arr, avg]) => (idx < 0 ? avg : arr[idx]));
    const bestBase = Math.max(...vals.slice(0, 3)), gain = vals[3] - bestBase;
    const dec = idx < 0 ? 1 : 0;
    const grid = [0, 25, 50, 75, 100].map((g) => `<span class="${g ? '' : 'z'}" style="bottom:${g}%"><em>${g}</em></span>`).join('');
    idmViz.innerHTML = `<div class="vt-vcols-wrap"><div class="vt-vcols-grid" aria-hidden="true">${grid}</div>
      <div class="vt-vcols">${T4.map(([n], k) => {
        const v = vals[k], ours = k === 3;
        const badge = ours && gain > 0 ? `<b class="vt-vc-gain">+${gain.toFixed(dec)} pp</b>` : '';
        return `<div class="vt-vc${ours ? ' is-ours' : ''}" tabindex="0"
            data-tip="<b>${n}</b><br>${idx < 0 ? 'Mean' : TASK5[idx]}: ${v.toFixed(dec)}%">
          <div class="vt-vc-trk"><div class="vt-vc-bar" style="--h:${Math.max(6, v).toFixed(1)}%">${badge}<em>${v.toFixed(dec)}%</em></div></div>
          <span>${n}</span></div>`;
      }).join('')}</div></div>`;
    bindTips(idmViz);
  };
  if (taskSeg && idmViz) {
    taskSeg.innerHTML = `<button type="button" class="is-active" data-i="-1">Avg.</button>` +
      TASK5.map((t, i) => `<button type="button" data-i="${i}">${t}</button>`).join('');
    seg(taskSeg, (b) => drawCols(+b.dataset.i));
  }
  if (rangeViz) {
    const pos = (v) => ((v - 40) / 60 * 100).toFixed(1) + '%';
    rangeViz.innerHTML = `<div class="vt-db-list">${TASK5.map((t, ti) => {
      const vs = T4.map(([, arr]) => arr[ti]);
      const lo = Math.min(...vs), hi = Math.max(...vs), ours = vs[3];
      const dots = T4.map(([n], mi) => `<i class="vt-db-dot${mi === 3 ? ' is-ours' : mi === 2 ? ' is-eva' : ''}" style="left:${pos(vs[mi])}" title="${n}: ${vs[mi]}%"></i>`).join('');
      return `<div class="vt-db-row" tabindex="0" data-i="${ti}"
          data-tip="<b>${t}</b><br>${T4.map(([n], mi) => `${n}: ${vs[mi]}%`).join(' · ')}">
        <span class="vt-db-lbl">${t}</span>
        <div class="vt-db-rail"><span class="vt-db-span" style="left:${pos(lo)};width:${((hi - lo) / 60 * 100).toFixed(1)}%"></span>${dots}</div>
        <span class="vt-db-val">${ours}%</span></div>`;
    }).join('')}</div>
    <div class="vt-db-axis"><span></span><div class="vt-db-ticks"><span>40%</span><span>60%</span><span>80%</span><span>100%</span></div><span></span></div>`;
    $$('.vt-db-row', rangeViz).forEach((row) => {
      row.addEventListener('click', () => { const ti = +row.dataset.i; drawCols(activeTask === ti ? -1 : ti); });
    });
    bindTips(rangeViz);
  }
  drawCols(-1);
})();

// verification ablations (Tables 5 and 6, N0-VTLA mean SR over five tasks): one series, the full setting emphasised
function hbars(el, title, rows, gainFrom) {
  const MAX = 60, best = rows[rows.length - 1][1];
  el.innerHTML = `<div class="vc-head"><h4 class="vc-h">${title}</h4></div>
    <div class="vh-rows">${rows.map(([n, v, ours], i) => `<div class="vh-row${ours ? ' ours' : ''}" tabindex="0" style="--i:${i}" data-tip="<b>${n}</b><br>${v.toFixed(1)}% mean success">
      <span class="vh-n">${n}</span><span class="vh-t"><i style="width:${(v / MAX * 100).toFixed(2)}%"><em>${v.toFixed(1)}</em></i></span></div>`).join('')}</div>
    <p class="vh-foot"><b>+${(best - gainFrom).toFixed(1)} pp</b> over ${rows.find(([, v]) => v === gainFrom)[0].toLowerCase()}</p>
    ${srTable(['Setting', 'Mean success (%)'], rows.map(([n, v]) => [n, v]))}`;
  bindTips(el);
}
hbars($('#filterChart'), 'VeriEval filtering ablation',
  [['All, unfiltered', 33.3], ['Visual checks only', 43.3], ['VeriEval (visual + touch)', 51.7, true]], 43.3);
hbars($('#touchChart'), 'Synthetic touch ablation',
  [['No-contact touch', 26.0], ['VeriGen touch', 51.7, true]], 26.0);

// charts animate in once, when they first scroll into view
(() => {
  const charts = $$('.vt-chart');
  if (!('IntersectionObserver' in window) || reduce) { charts.forEach((c) => c.classList.add('is-in')); return; }
  charts.forEach((c) => c.classList.add('is-anim'));
  const cio = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('is-in'); cio.unobserve(e.target); } }), { threshold: .22 });
  charts.forEach((c) => cio.observe(c));
})();

/* ------------------------------------------------ contact timing: kept vs. rejected (VeriEval records of demo_0034 / demo_0066) */
(() => {
  const el = $('#timingFig');
  const ROWS = [ // [verdict, rollout, camera contact (s), touch contact (s), note]
    ['Kept', 'egg', [9.2, 13.67], [9.27, 13.73], 'contact lines up'],
    ['Rejected', 'egg', [7.6, 11.27], [8.25, 13.57], 'touch ends 2.3 s after the camera'],
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
  chip_pick: ['pair_chip_n0', 'Never transfers the chip into the cup.', 'Picks up the chip and drops it into the cup.'],
  egg_pick: ['pair_egg_n0_l8', 'Closes beside the egg without lifting it.', 'Grasps the egg, carries it over and releases it onto the tray.'],
  charger_press: ['pair_press_n0', 'Reaches the power strip but does not press the plug home.', 'Presses the pre-aligned plug down into the socket.'],
  pullback_car: ['pair_car_n0', 'Misses the car and pushes it aside without pulling back.', 'Grasps the car, pulls it back and launches it off the board.'],
  whiteboard_erase: ['pair_erase_n0', 'Leaves part of the marker stroke on the whiteboard.', 'Picks up the sponge and wipes the whiteboard clean.'],
};
const pair = $('#execPair');
tabs($('#execTabs'), TASKS, (k) => {
  unwatch(pair);
  const [src, fail, ok] = EXEC[k];
  const fig = (side, good, txt) => `<figure>
    <div class="vt-ph"><b class="${good ? 'is-ok' : 'is-bad'}">${good ? 'VeriTouch' : 'Baseline'}</b></div>
    ${lazy(`policy/${src}_${side}_main`, 'controls')}
    <figcaption><strong class="${good ? 'pc-outcome-success' : 'pc-outcome-failure'}">${good ? 'Success' : 'Failure'} · </strong>${txt}</figcaption></figure>`;
  pair.innerHTML = `<div class="vt-pair one">${fig('base', false, fail)}${fig('vt', true, ok)}</div>`;
  watch(pair);
});

/* ------------------------------------------------ generated vs. real: drag-to-compare, four synced views (main, wrist, left and right fingertip) */
const VIEWS = [['main', 'Main camera'], ['wrist', 'Wrist camera'], ['touchl', 'Left fingertip'], ['touchr', 'Right fingertip']];
const views = $('#wmViews'), wctl = $('#wmCmp .vt-cmp3-ctl'), wbtn = $('button', wctl), wrng = $('input', wctl), wout = $('output', wctl);
let wvids = [], wlead = null, wx = 50, wpaused = false, won = false, wtask = 'chip_pick', wgen = 0, wtimer = 0;
const setX = (p) => { wx = Math.max(0, Math.min(100, p)); views.style.setProperty('--x', wx + '%'); $$('.vt-surf', views).forEach((s) => s.setAttribute('aria-valuenow', Math.round(wx))); };
const wicon = () => { wbtn.innerHTML = `<i class="fa-solid fa-${wpaused ? 'play' : 'pause'}"></i>`; };
const loadVid = (v, playNow) => {
  const s = v.dataset.s || v.dataset.src;
  if (!s) return;
  if (!v.getAttribute('src')) {
    v.preload = 'auto';
    v.src = s;
    v.addEventListener('error', () => {
      if (v.dataset.retried) return;
      v.dataset.retried = '1';
      setTimeout(() => { if (!v.isConnected) return; v.src = s + (s.includes('?') ? '&' : '?') + 'r=1'; v.load(); if (playNow()) v.play().catch(() => {}); }, 350);
    }, { once: true });
    v.load();
  }
  if (playNow()) v.play().catch(() => {});
};
const wplay = () => {
  if (!won || wpaused) return;
  const g = wgen;
  wvids.slice(0, 4).forEach((v) => loadVid(v, () => won && !wpaused && g === wgen));
  clearTimeout(wtimer);
  wtimer = setTimeout(() => {
    if (g !== wgen) return;
    wvids.slice(4).forEach((v) => loadVid(v, () => won && !wpaused && g === wgen));
  }, 90);
};
function wrender(k) {
  wtask = k; wgen++; clearTimeout(wtimer);
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
  wlead.addEventListener('loadedmetadata', () => { wrng.max = wlead.duration.toFixed(2); wout.textContent = `0.0 / ${fmt(wlead.duration)} s`; });
  wlead.addEventListener('timeupdate', () => {
    const t = wlead.currentTime;
    wvids.forEach((v) => { if (v !== wlead && v.readyState > 1 && Math.abs(v.currentTime - t) > .25) v.currentTime = t; });
    wrng.value = t; wout.textContent = `${fmt(t)} / ${fmt(wlead.duration)} s`;
  });
  setX(wx);
  if (won) {
    if (wpaused) {
      const g = wgen;
      wvids.slice(0, 4).forEach((v) => loadVid(v, () => false));
      wtimer = setTimeout(() => { if (g === wgen) wvids.slice(4).forEach((v) => loadVid(v, () => false)); }, 90);
    } else wplay();
  }
  if (models.open) mrender();
}
wbtn.addEventListener('click', () => { wpaused = !wpaused; wicon(); if (wpaused) wvids.forEach((v) => v.pause()); else wplay(); });
wrng.addEventListener('input', () => wvids.forEach((v) => { if (v.readyState >= 1) v.currentTime = +wrng.value; }));
new IntersectionObserver(([e]) => { won = e.isIntersecting; if (won) wplay(); else wvids.forEach((v) => v.pause()); }, { rootMargin: '150px 0px' }).observe(views);

/* ------------------------------------------------ other world models: collapsed by default, staggered loading so all 9 clips load reliably */
const MODELS = [
  ['Real recording', 'ground truth', 'gt'], ['VeriGen (ours)', 'video + touch', 'ours'], [`${N0}-TWAM`, 'video + touch', '', 'n0twam'],
  ['Dream-Tac', 'video + touch', '', 'dreamtac'], ['Cosmos-Super', 'video only', '', 'cosmossuper'], ['MiniMax-H3', 'video only', '', 'minimaxh3'],
  ['Cosmos-Nano', 'video only', '', 'cosmosnano'], ['Wan2.2-A14B', 'video only', '', 'wan22a14b'], ['WoW-1', 'video only', '', 'wow1'],
];
const READY = new Set(TASKS.flatMap(([t]) => ['n0twam', 'dreamtac', 'cosmossuper', 'minimaxh3', 'cosmosnano', 'wan22a14b', 'wow1'].map((m) => `${t}_${m}`)));
const CMP_OWN = new Set(['chip_pick', 'egg_pick']);
const slug = (n) => plain(n).toLowerCase().replace(/[^a-z0-9]+/g, '');
const models = $('#models'), cmp = $('#cmpGrid');
let mgen = 0;
function mrender() {
  mgen++;
  const g = mgen;
  unwatch(cmp);
  cmp.innerHTML = MODELS.map(([n, kind, role, key]) => {
    const file = `${wtask}_${key || slug(n)}`;
    const src = role === 'gt' ? (CMP_OWN.has(wtask) ? `cmp/${wtask}_gt` : `wm/${wtask}_gt_main`)
      : role === 'ours' ? (CMP_OWN.has(wtask) ? `cmp/${wtask}_verigen` : `wm/${wtask}_pred_main`)
      : READY.has(file) ? `cmp/${file}` : '';
    const media = src ? `<video muted playsinline loop preload="none" data-s="${V}${src}.mp4" poster="${V}${src}.jpg"></video>`
      : `<div class="vt-pend" title="expected file: assets/video/cmp/${file}.mp4"><i class="fa-regular fa-clock" aria-hidden="true"></i><span>output pending</span></div>`;
    return `<figure class="vt-mdl ${role || ''}"><figcaption><b>${n}</b><span>${kind}</span></figcaption>${media}</figure>`;
  }).join('');
  // Load in waves of 3 so Chrome's 6-connection HTTP/1.1 limit never stalls the last clips
  const vids = $$('video', cmp);
  const runWave = (start) => {
    if (g !== mgen || start >= vids.length) return;
    const chunk = vids.slice(start, start + 3);
    let ready = 0, done = false;
    const next = () => { if (done || g !== mgen) return; done = true; runWave(start + 3); };
    const fallback = setTimeout(next, 260);
    chunk.forEach((v) => {
      v.addEventListener('loadeddata', () => {
        if (++ready >= Math.min(2, chunk.length)) { clearTimeout(fallback); next(); }
      }, { once: true });
      loadVid(v, () => g === mgen && models.open);
      io.observe(v);
    });
  };
  runWave(0);
}
models.addEventListener('toggle', () => { if (models.open) mrender(); else { mgen++; unwatch(cmp); cmp.innerHTML = ''; } });
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
