// Pathfinder (Dijkstra): one step per executed line, as a snapshot for the player.
// Height map: a step between neighbors costs 1 + |height difference|, 0 is a wall. Path from (0,0) to (R-1,C-1).
// The weight is on the edge on purpose: with a per-cell cost the first relaxation would already be optimal.
// array: picks the closest open cell with a linear scan (O(V²)); heap: a min-heap with lazy deletion.
// s.dp = dist[] (row-major), s.done = closed cells, s.prev = predecessor, s.path = final path (last step).
// Runs in the browser (globals) and in node (module.exports) for the test.
if (typeof module !== 'undefined') globalThis.listing ??= require('./trace.js').listing;

const DIJ_GRID = [
  [5, 0, 2],
  [6, 7, 2],
  [5, 5, 6],
];

const DIJ_CODE = {
  array: listing([
    ['alloc', 'const dist = R·C × ∞, feito = R·C × false, ant = R·C × -1'],
    ['src', 'dist[origem] = 0'],
    ['loop', 'while (true) {'],
    ['pick', '  let u = -1                                  // a aberta mais perto'],
    ['scan', '  for (let v = 0; v < R·C; v++)'],
    ['best', '    if (!feito[v] && dist[v] < (u < 0 ? ∞ : dist[u])) u = v'],
    ['none', '  if (u < 0) break                            // nada alcançável sobrou'],
    ['goal', '  if (u === alvo) break                       // alvo fechado: custo final'],
    ['close', '  feito[u] = true                             // dist[u] não muda mais'],
    ['for', '  for (const v of vizinhos(u)) {'],
    ['wall', '    if (g[v] === 0 || feito[v]) continue      // parede ou já fechada'],
    ['nd', '    const nd = dist[u] + 1 + |g[u] − g[v]|    // passo + desnível'],
    ['relax', '    if (nd < dist[v]) { dist[v] = nd; ant[v] = u }'],
    [null, '  }'],
    [null, '}'],
    ['ret', 'return dist[alvo] === ∞ ? -1 : dist[alvo]'],
  ]),
  heap: listing([
    ['alloc', 'const dist = R·C × ∞, ant = R·C × -1'],
    ['src', 'dist[origem] = 0; const pq = [[0, origem]]  // min-heap por d'],
    ['while', 'while (pq.length > 0) {'],
    ['pop', '  const [d, u] = pq.pop()                    // menor d: O(log n)'],
    ['stale', '  if (d > dist[u]) continue                  // entrada velha: u já melhorou'],
    ['goal', '  if (u === alvo) break                      // alvo saiu do heap: custo final'],
    ['for', '  for (const v of vizinhos(u)) {'],
    ['wall', '    if (g[v] === 0) continue                 // parede'],
    ['nd', '    const nd = d + 1 + |g[u] − g[v]|         // passo + desnível'],
    ['relax', '    if (nd < dist[v]) {'],
    ['set', '      dist[v] = nd; ant[v] = u'],
    ['push', '      pq.push([nd, v])                       // O(log n): sobe no heap'],
    [null, '    }'],
    [null, '  }'],
    [null, '}'],
    ['ret', 'return dist[alvo] === ∞ ? -1 : dist[alvo]'],
  ]),
};

const DIJ_P = (C, k) => `(${Math.floor(k / C)},${k % C})`;
const dijNbrs = (R, C, k) => {
  const r = Math.floor(k / C), c = k % C;
  return [[r - 1, c], [r, c + 1], [r + 1, c], [r, c - 1]].filter(([a, b]) => a >= 0 && b >= 0 && a < R && b < C).map(([a, b]) => a * C + b);
};
const dijShow = (v) => v === null ? null : v === Infinity ? '∞' : v;
const dijPath = (prev, t) => { const p = []; for (let k = t; k >= 0; k = prev[k]) p.unshift(k); return p; };
const dijRC = (C, k) => [Math.floor(k / C), k % C];

function dijkstraArray(grid = DIJ_GRID) {
  const L = DIJ_CODE.array.at, R = grid.length, C = grid[0].length, g = grid.flat(), n = R * C, alvo = n - 1;
  const dist = new Array(n).fill(null), done = new Array(n).fill(false), prev = new Array(n).fill(-1), out = [];
  const P = (k) => DIJ_P(C, k);
  const snap = (line, msg, s = {}) => out.push({ dp: dist.map(dijShow), done: done.slice(), prev: prev.slice(),
    read: [], write: [], line, msg, ...s, cur: s.cur === undefined ? undefined : dijRC(C, s.cur), nb: s.nb === undefined ? undefined : dijRC(C, s.nb) });

  dist.fill(Infinity);
  snap(L.alloc, `Aloca dist[] com ${n} células, todas ∞ ("ainda não sei chegar"), feito[] todo false e ant[] todo -1.`, { write: [...dist.keys()] });
  dist[0] = 0;
  snap(L.src, 'dist(0,0) = 0: começar na origem não custa nada.', { cur: 0, write: [0] });
  for (;;) {
    snap(L.loop, 'Nova rodada: escolhe a célula aberta mais barata.', {});
    let u = -1;
    snap(L.pick, 'u = -1: ainda não escolheu ninguém.', { vars: { u } });
    for (let v = 0; v < n; v++) {
      snap(L.scan, `v = ${v} ${P(v)}.`, { nb: v, vars: { u: u < 0 ? -1 : P(u), v: P(v) } });
      const take = !done[v] && dist[v] < (u < 0 ? Infinity : dist[u]);
      const why = done[v] ? 'já está fechada' : dist[v] === Infinity ? 'dist = ∞, inalcançada até agora'
        : take ? (u < 0 ? `dist = ${dist[v]}, a primeira aberta alcançada` : `dist = ${dist[v]} < ${dist[u]}: mais perto`) : `dist = ${dist[v]} ≥ ${dist[u]}: não ganha`;
      if (take) u = v;
      snap(L.best, `${P(v)}: ${why}.${take ? ` u = ${P(v)}.` : ''}`, { nb: v, read: done[v] ? [] : [v], vars: { u: u < 0 ? -1 : P(u), v: P(v) } });
    }
    snap(L.none, u < 0 ? 'u = -1: nenhuma célula aberta é alcançável. Para.' : `u = ${P(u)} com dist ${dist[u]}: existe para onde andar.`,
      { cur: u < 0 ? undefined : u, vars: { u: u < 0 ? -1 : P(u) } });
    if (u < 0) break;
    snap(L.goal, u === alvo ? `u é o alvo ${P(alvo)}: como é a aberta mais barata, nenhum caminho por outra célula sai mais em conta. Para.`
      : `${P(u)} não é o alvo ${P(alvo)}.`, { cur: u, read: [u], vars: { u: P(u), 'dist[u]': dist[u] } });
    if (u === alvo) break;
    done[u] = true;
    snap(L.close, `Fecha ${P(u)}: todo caminho por outra aberta já custa ≥ ${dist[u]} e os custos são positivos, então dist[u] = ${dist[u]} é definitivo.`,
      { cur: u, read: [u], vars: { u: P(u), 'dist[u]': dist[u] } });
    for (const v of dijNbrs(R, C, u)) {
      const vs = { u: P(u), v: P(v), 'dist[u]': dist[u] };
      snap(L.for, `Vizinho ${P(v)}.`, { cur: u, nb: v, vars: vs });
      if (g[v] === 0 || done[v]) {
        snap(L.wall, `${P(v)} ${g[v] === 0 ? 'é parede' : 'já está fechada'}: continue.`, { cur: u, nb: v, vars: vs });
        continue;
      }
      snap(L.wall, `${P(v)} tem altura ${g[v]} e está aberta.`, { cur: u, nb: v, vars: vs });
      const nd = dist[u] + 1 + Math.abs(g[u] - g[v]);
      snap(L.nd, `nd = ${dist[u]} + 1 + |${g[u]} − ${g[v]}| = ${nd}.`, { cur: u, nb: v, read: [u], vars: { ...vs, nd } });
      const better = nd < dist[v], old = dist[v];
      if (better) { dist[v] = nd; prev[v] = u; }
      snap(L.relax, better ? `${nd} < ${dijShow(old)}: achou caminho melhor até ${P(v)}. dist = ${nd}, ant = ${P(u)}.`
        : `${nd} ≥ ${old}: o caminho que já tinha até ${P(v)} é melhor. Nada muda.`,
        { cur: u, nb: v, read: better ? [] : [v], write: better ? [v] : [], vars: { ...vs, nd } });
    }
  }
  const ans = dist[alvo] === Infinity ? -1 : dist[alvo];
  snap(L.ret, ans < 0 ? 'Resposta: -1. O alvo ficou isolado pelas paredes.'
    : `Resposta: ${ans}. O caminho (refeito seguindo ant[] a partir do alvo) está marcado na grade.`,
    { read: [alvo], vars: { 'dist[alvo]': dijShow(dist[alvo]) }, path: ans < 0 ? [] : dijPath(prev, alvo), result: ans });
  return out;
}

function dijkstraHeap(grid = DIJ_GRID) {
  const L = DIJ_CODE.heap.at, R = grid.length, C = grid[0].length, g = grid.flat(), n = R * C, alvo = n - 1;
  const dist = new Array(n).fill(null), done = new Array(n).fill(false), prev = new Array(n).fill(-1), pq = [], out = [];
  let maxQueue = 0;
  const P = (k) => DIJ_P(C, k);
  const lt = (a, b) => a[0] < b[0] || (a[0] === b[0] && a[1] < b[1]);
  const swap = (i, j) => { [pq[i], pq[j]] = [pq[j], pq[i]]; };
  // binary heap kept for real, so the panel shows the actual array layout; returns the final slot of the new entry
  const push = (e) => {
    pq.push(e); maxQueue = Math.max(maxQueue, pq.length);
    let i = pq.length - 1;
    while (i > 0 && lt(pq[i], pq[(i - 1) >> 1])) { swap(i, (i - 1) >> 1); i = (i - 1) >> 1; }
    return i;
  };
  const pop = () => {
    const top = pq[0], last = pq.pop();
    if (pq.length) {
      pq[0] = last;
      for (let i = 0; ;) {
        const l = 2 * i + 1, r = l + 1;
        let m = i;
        if (l < pq.length && lt(pq[l], pq[m])) m = l;
        if (r < pq.length && lt(pq[r], pq[m])) m = r;
        if (m === i) break;
        swap(i, m); i = m;
      }
    }
    return top;
  };
  const snap = (line, msg, s = {}) => out.push({ dp: dist.map(dijShow), done: done.slice(), prev: prev.slice(),
    heap: pq.map(([d, k]) => ({ d, k, label: `${d}:${P(k)}` })), maxQueue, read: [], write: [], line, msg, ...s,
    cur: s.cur === undefined ? undefined : dijRC(C, s.cur), nb: s.nb === undefined ? undefined : dijRC(C, s.nb) });

  dist.fill(Infinity);
  snap(L.alloc, `Aloca dist[] com ${n} células, todas ∞, e ant[] todo -1. Não precisa de feito[]: o heap decide a ordem.`, { write: [...dist.keys()] });
  dist[0] = 0;
  const h0 = push([0, 0]);
  snap(L.src, 'dist(0,0) = 0 e a origem entra no heap como [0, (0,0)].', { cur: 0, write: [0], hw: h0 });
  for (;;) {
    snap(L.while, pq.length ? `${pq.length} entrada(s) no heap.` : 'Heap vazio: não há mais para onde andar.', {});
    if (!pq.length) break;
    const [d, u] = pop();
    snap(L.pop, `pop: sai [${d}, ${P(u)}], a menor distância do heap.` +
      (pq.length ? ' O último item vai para a raiz e desce até o lugar certo.' : ' O heap ficou vazio.'),
      { cur: u, vars: { d, u: P(u) }, popped: `${d}:${P(u)}` });
    const vs = { d, u: P(u), 'dist[u]': dist[u] };
    if (d > dist[u]) {
      snap(L.stale, `${d} > dist${P(u)} = ${dist[u]}: entrada velha. ${P(u)} entrou de novo com custo menor e já foi tratada. Descarta.`,
        { cur: u, read: [u], vars: vs });
      continue;
    }
    snap(L.stale, `${d} = dist${P(u)}: entrada válida. É a primeira vez que ${P(u)} sai, então ${d} é definitivo.`, { cur: u, read: [u], vars: vs });
    done[u] = true;
    snap(L.goal, u === alvo ? `u é o alvo ${P(alvo)}: saiu do heap com o menor custo possível. Para.` : `${P(u)} não é o alvo ${P(alvo)}.`,
      { cur: u, vars: vs });
    if (u === alvo) break;
    for (const v of dijNbrs(R, C, u)) {
      const vv = { ...vs, v: P(v) };
      snap(L.for, `Vizinho ${P(v)}.`, { cur: u, nb: v, vars: vv });
      if (g[v] === 0) {
        snap(L.wall, `${P(v)} é parede: continue.`, { cur: u, nb: v, vars: vv });
        continue;
      }
      snap(L.wall, `${P(v)} tem altura ${g[v]}.`, { cur: u, nb: v, vars: vv });
      const nd = d + 1 + Math.abs(g[u] - g[v]);
      snap(L.nd, `nd = ${d} + 1 + |${g[u]} − ${g[v]}| = ${nd}.`, { cur: u, nb: v, vars: { ...vv, nd } });
      if (!(nd < dist[v])) {
        snap(L.relax, `${nd} ≥ dist${P(v)} = ${dist[v]}: não melhora. Não empilha nada.`, { cur: u, nb: v, read: [v], vars: { ...vv, nd } });
        continue;
      }
      snap(L.relax, `${nd} < dist${P(v)} = ${dijShow(dist[v])}: melhora.`, { cur: u, nb: v, read: [v], vars: { ...vv, nd } });
      const again = dist[v] !== Infinity;
      dist[v] = nd; prev[v] = u;
      snap(L.set, `dist${P(v)} = ${nd}, ant = ${P(u)}.`, { cur: u, nb: v, write: [v], vars: { ...vv, nd } });
      const hw = push([nd, v]);
      snap(L.push, `push [${nd}, ${P(v)}]: entra no fim do heap e sobe enquanto for menor que o pai.` +
        (again ? ` A entrada antiga de ${P(v)} continua lá dentro: em vez de procurá-la e removê-la, ela será descartada quando sair.` : ''),
        { cur: u, nb: v, hw, vars: { ...vv, nd } });
    }
  }
  const ans = dist[alvo] === Infinity ? -1 : dist[alvo];
  snap(L.ret, ans < 0 ? 'Resposta: -1. O alvo ficou isolado pelas paredes.'
    : `Resposta: ${ans}. O caminho (refeito seguindo ant[] a partir do alvo) está marcado na grade.`,
    { read: [alvo], vars: { 'dist[alvo]': dijShow(dist[alvo]) }, path: ans < 0 ? [] : dijPath(prev, alvo), result: ans });
  return out;
}

if (typeof module !== 'undefined') module.exports = { DIJ_GRID, DIJ_CODE, dijkstraArray, dijkstraHeap };
