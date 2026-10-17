// Shared player for the visualizers: step navigation + panels (code, registers, memory, items).
const $ = (id) => document.getElementById(id);
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;');
const BASE = 0x7f00a000; // illustrative address for the memory model; 4 bytes per int
const hex = (n) => '0x' + n.toString(16).toUpperCase();
const addr = (k) => hex(BASE + k * 4);

// CSS class for cell k: write > read (r0 = "skip", r1 = "take") > junk
function cellClass(s, k) {
  if (s.write.includes(k)) return 'w';
  const r = s.read.indexOf(k);
  if (r === 1) return 'r1';
  if (r >= 0) return 'r0';
  return s.dp[k] === null ? 'junk' : s.dp[k] === true ? 'yes' : '';
}
const cellVal = (v) => v === true ? 'T' : v === false ? 'F' : v ?? '░░';

function renderCode(lines, active) {
  $('code').innerHTML = lines.map((l, i) =>
    `<div class="ln${i === active ? ' on' : ''}"><span>${i}</span>${esc(l)}</div>`).join('');
}

function renderVars(vars = {}) {
  const e = Object.entries(vars);
  $('vars').innerHTML = e.length ? e.map(([k, v]) => `<dt>${esc(k)}</dt><dd>${esc(v)}</dd>`).join('') : '<dt>—</dt><dd>idle</dd>';
}

function renderItems(items, active) {
  $('items').innerHTML = '<tr><th>i</th><th>item</th><th>peso</th><th>valor</th></tr>' + items.map((it, k) =>
    `<tr class="${k + 1 === active ? 'on' : ''}"><td>${k + 1}</td><td>${it.name}</td><td>${it.w}</td><td>${it.v}</td></tr>`).join('');
}

// Memory as a linear strip. label(k) = name of cell k, formula(k) = how its address is computed. rowLen marks row boundaries.
function renderMemory(s, label, formula, rowLen) {
  $('mem').innerHTML = s.dp.map((v, k) =>
    `<div class="cell ${cellClass(s, k)}${rowLen && k % rowLen === 0 ? ' rowstart' : ''}">` +
    `<small>${addr(k)}</small><b>${cellVal(v)}</b><i>${label(k)}</i></div>`).join('');
  const used = s.dp.filter((v) => v !== null).length;
  const k = s.write.length === 1 ? s.write[0] : null;
  $('memstat').innerHTML =
    `<span>alocado: <b>${s.dp.length * 4} B</b> (${s.dp.length} × int32)</span>` +
    `<span>inicializado: <b>${used}/${s.dp.length}</b></span>` +
    (k === null ? '' : `<span>write <b>${label(k)}</b> → ${formula(k)} = <b>${addr(k)}</b></span>`);
}

// Call stack (memoization). Illustrative 32 B frames, growing toward lower addresses; the top of the stack is drawn first.
const STACK_TOP = 0x7ffe1000, FRAME = 32;
function renderStack(s) {
  $('stack').innerHTML = s.stack.map((f, d) =>
    `<div class="frame${d === s.stack.length - 1 ? ' top' : ''}"><small>${hex(STACK_TOP - (d + 1) * FRAME)}</small>` +
    `<b>${esc(f.call)}</b><i>${esc(f.note)}</i></div>`).reverse().join('') || '<div class="frame">(vazia)</div>';
  $('stackstat').innerHTML =
    `<span>frames: <b>${s.stack.length}</b> (${s.stack.length * FRAME} B)</span><span>pico: <b>${s.maxDepth}</b></span>` +
    `<span>chamadas: <b>${s.calls}</b></span>` + (s.hits === undefined ? '' : `<span>cache hits: <b>${s.hits}</b></span>`);
}

// BFS queue as an array in the heap: slots before head were already dequeued (dimmed); 8 B per entry.
// s.queue = labels, s.head = index of the next dequeue, s.pushed / s.popped flag this step's operation.
const QBASE = 0x7f00b000;
function renderQueue(s) {
  const q = s.queue ?? [], h = s.head ?? 0;
  $('queue').innerHTML = q.map((v, k) => {
    const cls = s.pushed && k === q.length - 1 ? 'w' : s.popped && k === h - 1 ? 'r0' : k < h ? 'junk' : '';
    const ptr = [k === h && 'head', k === q.length - 1 && 'tail'].filter(Boolean).join(' · ');
    return `<div class="slot"><small>${hex(QBASE + k * 8)}</small><div class="cell ${cls}">${esc(v)}</div><span class="gen fresh">${ptr}</span></div>`;
  }).join('') || '<div class="frame">(vazia)</div>';
  $('queuestat').innerHTML = `<span>na fila: <b>${q.length - h}</b></span><span>já saíram: <b>${h}</b></span>` +
    `<span>alocado: <b>${q.length * 8} B</b></span><span>pico: <b>${s.maxQueue ?? 0}</b></span>`;
}

// Grid of a graph problem: cells = [[text, class], ...] row-major.
function renderGrid(id, cols, cells) {
  $(id).style.gridTemplateColumns = `repeat(${cols}, 44px)`;
  $(id).innerHTML = cells.map(([v, c], k) =>
    `<div class="gc ${c}" title="(${Math.floor(k / cols)}, ${k % cols})">${esc(v)}</div>`).join('');
}

// Node-link graph as SVG. g = { pos: [[x, y]] in a 0..100 box, edges: [[a, b]], directed }.
// nodeCls(k) / edgeCls(a, b) return CSS classes (cur, seen, nb, on, ...); label(k) the text inside the node.
function renderGraph(id, g, nodeCls, edgeCls = () => '', label = (k) => k) {
  const R = 6, P = (k) => g.pos[k];
  const edges = g.edges.map(([a, b]) => {
    const [x1, y1] = P(a), [x2, y2] = P(b), d = Math.hypot(x2 - x1, y2 - y1) || 1;
    const t = g.directed ? (R + 1.5) / d : 0;  // stop the arrow at the target's border
    return `<line class="${edgeCls(a, b)}" x1="${x1}" y1="${y1}" x2="${x2 - (x2 - x1) * t}" y2="${y2 - (y2 - y1) * t}"${g.directed ? ' marker-end="url(#arrow)"' : ''}/>`;
  }).join('');
  const nodes = g.pos.map(([x, y], k) =>
    `<g class="${nodeCls(k)}"><circle cx="${x}" cy="${y}" r="${R}"/><text x="${x}" y="${y}">${esc(label(k))}</text></g>`).join('');
  $(id).innerHTML = `<svg class="graph" viewBox="-8 -8 116 116" role="img"><defs><marker id="arrow" viewBox="0 0 10 10" refX="9" refY="5" ` +
    `markerWidth="5" markerHeight="5" orient="auto"><path d="M0 0L10 5L0 10z" fill="currentColor"/></marker></defs>${edges}${nodes}</svg>`;
}

let stopCurrent = () => {};

// Mounting again (tab switch) replaces the previous player: stops its timer and overwrites the handlers.
function mountPlayer(steps, render) {
  stopCurrent();
  let k = 0, timer = null;
  const last = steps.length - 1, scrub = $('scrub'), playBtn = $('play');
  scrub.max = last;

  const go = (n) => {
    k = Math.max(0, Math.min(last, n));
    scrub.value = k;
    $('stepno').textContent = `STEP ${String(k).padStart(3, '0')}/${last}`;
    $('msg').textContent = steps[k].msg;
    render(steps[k]);
  };
  const stop = () => { clearTimeout(timer); timer = null; playBtn.textContent = '▶ RUN'; };
  const tick = () => {
    if (k >= last) return stop();
    go(k + 1);
    timer = setTimeout(tick, 1100 - $('speed').value);
  };
  const toggle = () => {
    if (timer) return stop();
    if (k >= last) go(0);
    playBtn.textContent = '❚❚ PAUSE';
    tick();
  };
  const jump = (n) => { stop(); go(n); };
  stopCurrent = stop;

  playBtn.onclick = toggle;
  $('first').onclick = () => jump(0);
  $('prev').onclick = () => jump(k - 1);
  $('next').onclick = () => jump(k + 1);
  $('lastbtn').onclick = () => jump(last);
  scrub.oninput = () => jump(+scrub.value);
  document.onkeydown = (e) => {
    if (e.target.tagName === 'INPUT') return;
    const act = { ArrowRight: () => jump(k + 1), ArrowLeft: () => jump(k - 1), Home: () => jump(0), End: () => jump(last), ' ': toggle }[e.key];
    if (act) { e.preventDefault(); act(); }
  };
  go(0);
}

// Tabs: each variant is a <template id="tpl-{id}" data-label="...">; the active tab lives in the URL hash.
function mountTabs(mounts) {
  const ids = Object.keys(mounts), tabs = $('tabs');
  const tpl = (id) => document.getElementById('tpl-' + id);
  tabs.innerHTML = ids.map((id) => `<a role="tab" href="#${id}" data-id="${id}">${tpl(id).dataset.label}</a>`).join('');
  const show = () => {
    const h = location.hash.slice(1), id = ids.includes(h) ? h : ids[0];
    tabs.querySelectorAll('a').forEach((a) => a.setAttribute('aria-selected', a.dataset.id === id));
    $('variant').replaceChildren(tpl(id).content.cloneNode(true));
    mounts[id]();
  };
  window.onhashchange = show;
  show();
}
