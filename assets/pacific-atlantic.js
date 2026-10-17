// Pacific Atlantic Water Flow: one step per executed line, as a snapshot for the player.
// Reverse search: start at each ocean's border and go UPHILL (h[next] >= h[cur]), marking pac / atl.
// Heap (s.dp) = pac[] followed by atl[], both row-major booleans. Answer = cells marked in both.
// Runs in the browser (globals) and in node (module.exports) for the test.
if (typeof module !== 'undefined') globalThis.listing ??= require('./trace.js').listing;

const HEIGHTS = [
  [1, 2, 2],
  [3, 5, 1],
  [2, 4, 3],
];

const PA_CODE = {
  dfs: listing([
    ['alloc', 'const pac = grade R×C de false, atl = grade R×C de false'],
    ['fn', 'function dfs(r, c, vis) {                  // sobe a partir do oceano'],
    ['seen', '  if (vis[r][c]) return'],
    ['mark', '  vis[r][c] = true                            // a água daqui chega ao oceano'],
    ['for', '  for (const [nr, nc] of vizinhos(r, c))'],
    ['up', '    if (h[nr][nc] >= h[r][c]) dfs(nr, nc, vis)   // só SOBE (ou plano)'],
    [null, '}'],
    ['pac', 'for (const [r, c] of bordaPacifico) dfs(r, c, pac)    // linha 0 + coluna 0'],
    ['atl', 'for (const [r, c] of bordaAtlantico) dfs(r, c, atl)   // última linha + última coluna'],
    ['res', 'const res = []'],
    ['each', 'for (const [r, c] of todasAsCelulas)'],
    ['both', '  if (pac[r][c] && atl[r][c]) res.push([r, c])'],
    ['ret', 'return res'],
  ]),
  bfs: listing([
    ['alloc', 'const pac = grade R×C de false, atl = grade R×C de false'],
    ['fn', 'function bfs(fila, vis) {                  // a fila começa com a borda do oceano'],
    ['seed', '  for (const [r, c] of fila) vis[r][c] = true'],
    ['head', '  let head = 0'],
    ['while', '  while (head < fila.length) {'],
    ['deq', '    const [r, c] = fila[head++]'],
    ['for', '    for (const [nr, nc] of vizinhos(r, c)) {'],
    ['chk', '      if (vis[nr][nc] || h[nr][nc] < h[r][c]) continue   // já visto ou desce'],
    ['enq', '      vis[nr][nc] = true; fila.push([nr, nc])'],
    [null, '    }'],
    [null, '  }'],
    [null, '}'],
    ['pac', 'bfs(bordaPacifico(), pac)'],
    ['atl', 'bfs(bordaAtlantico(), atl)'],
    ['res', 'const res = []'],
    ['each', 'for (const [r, c] of todasAsCelulas)'],
    ['both', '  if (pac[r][c] && atl[r][c]) res.push([r, c])'],
    ['ret', 'return res'],
  ]),
};

const P = (r, c) => `(${r},${c})`;
const nbrs = (R, C, r, c) => [[r + 1, c], [r - 1, c], [r, c + 1], [r, c - 1]].filter(([a, b]) => a >= 0 && b >= 0 && a < R && b < C);
// Border cells in row-major order: Pacific = row 0 + column 0, Atlantic = last row + last column.
const borders = (R, C) => {
  const cells = [...Array(R * C).keys()].map((k) => [Math.floor(k / C), k % C]);
  return { pac: cells.filter(([r, c]) => r === 0 || c === 0), atl: cells.filter(([r, c]) => r === R - 1 || c === C - 1) };
};
const OCEAN = { pac: 'Pacífico', atl: 'Atlântico' };
const resText = (res) => `[${res.map(([r, c]) => P(r, c)).join(' ')}]`;

// Shared tail: intersection of both marks, one step per cell.
function collect(snap, L, R, C, vis, extra) {
  const res = [];
  snap(L.res, 'As duas buscas acabaram. Resposta = células marcadas pelos dois oceanos.', extra({ res: '[]' }));
  for (let k = 0; k < R * C; k++) {
    const r = Math.floor(k / C), c = k % C;
    snap(L.each, `Célula ${P(r, c)}.`, extra({ r, c, res: resText(res) }, { cur: [r, c] }));
    const ok = vis[k] && vis[R * C + k];
    if (ok) res.push([r, c]);
    snap(L.both, `pac${P(r, c)} = ${vis[k]}, atl${P(r, c)} = ${vis[R * C + k]}${ok ? ': chega aos dois, entra na resposta.' : '.'}`,
      extra({ r, c, res: resText(res) }, { cur: [r, c], read: [k, R * C + k] }));
  }
  snap(L.ret, `Resposta: ${resText(res)} (${res.length} célula(s)).`, extra({ res: resText(res) }, { result: res }));
}

function pacificDFS(h = HEIGHTS) {
  const L = PA_CODE.dfs.at, R = h.length, C = h[0].length, N = R * C, b = borders(R, C);
  const vis = new Array(2 * N).fill(null), stack = [], out = [];
  let calls = 0, maxDepth = 0, ocean = '';
  const snap = (line, msg, s = {}) => out.push({ dp: vis.slice(), stack: stack.map((f) => ({ ...f })), read: [], write: [], calls, maxDepth, line, msg, ...s });

  const dfs = (r, c, which) => {
    const base = which === 'atl' ? N : 0, k = base + r * C + c, fr = { call: `dfs(${r}, ${c}, ${which})`, note: '' };
    stack.push(fr); calls++; maxDepth = Math.max(maxDepth, stack.length);
    const v = { oceano: OCEAN[which], r, c, h: h[r][c] };
    snap(L.fn, `Entra em ${fr.call}: a água de ${P(r, c)} (altura ${h[r][c]}) chega ao ${OCEAN[which]}? Profundidade ${stack.length}.`, { cur: [r, c], vars: v });
    if (vis[k]) {
      fr.note = 'já marcado';
      snap(L.seen, `${which}${P(r, c)} já é true: já foi visitado. Retorna.`, { cur: [r, c], read: [k], vars: v });
      stack.pop(); return;
    }
    snap(L.seen, `${which}${P(r, c)} ainda é false.`, { cur: [r, c], read: [k], vars: v });
    vis[k] = true;
    snap(L.mark, `Marca ${which}${P(r, c)} = true: a água daqui escorre até o ${OCEAN[which]}.`, { cur: [r, c], write: [k], vars: v });
    for (const [nr, nc] of nbrs(R, C, r, c)) {
      snap(L.for, `Vizinho ${P(nr, nc)} (altura ${h[nr][nc]}).`, { cur: [r, c], nb: [nr, nc], vars: { ...v, viz: P(nr, nc), 'h viz': h[nr][nc] } });
      if (h[nr][nc] < h[r][c]) {
        snap(L.up, `${h[nr][nc]} < ${h[r][c]}: é mais baixo. A água de lá não sobe até aqui, então não chama.`, { cur: [r, c], nb: [nr, nc], vars: { ...v, viz: P(nr, nc), 'h viz': h[nr][nc] } });
        continue;
      }
      fr.note = `→ ${P(nr, nc)}`;
      snap(L.up, `${h[nr][nc]} ≥ ${h[r][c]}: a água de ${P(nr, nc)} desce até aqui. Chama dfs(${nr}, ${nc}, ${which}).`, { cur: [r, c], nb: [nr, nc], vars: { ...v, viz: P(nr, nc), 'h viz': h[nr][nc] } });
      dfs(nr, nc, which);
      snap(L.up, `dfs(${nr}, ${nc}, ${which}) voltou para ${fr.call}.`, { cur: [r, c], vars: v });
    }
    fr.note = 'fim';
    stack.pop();
  };

  vis.fill(false);
  snap(L.alloc, `Aloca pac[] e atl[]: ${N} + ${N} booleanos, tudo false.`, { write: [...vis.keys()] });
  for (const which of ['pac', 'atl']) {
    ocean = OCEAN[which];
    for (const [r, c] of b[which]) {
      snap(L[which], `Borda do ${ocean}: ${P(r, c)} encosta no oceano. Chama dfs(${r}, ${c}, ${which}).`, { cur: [r, c], vars: { oceano: ocean, r, c } });
      dfs(r, c, which);
      snap(L[which], `dfs(${r}, ${c}, ${which}) voltou.`, { cur: [r, c], vars: { oceano: ocean, r, c } });
    }
  }
  collect(snap, L, R, C, vis, (vars, s = {}) => ({ vars, ...s }));
  return out;
}

function pacificBFS(h = HEIGHTS) {
  const L = PA_CODE.bfs.at, R = h.length, C = h[0].length, N = R * C, b = borders(R, C);
  const vis = new Array(2 * N).fill(null), out = [];
  let fila = [], head = 0, maxQueue = 0;
  const snap = (line, msg, s = {}) => out.push({ dp: vis.slice(), queue: fila.map(([x, y]) => P(x, y)), head, maxQueue, read: [], write: [], line, msg, ...s });

  const bfs = (which) => {
    const base = which === 'atl' ? N : 0, oc = OCEAN[which];
    fila = b[which].map((p) => p.slice()); head = 0; maxQueue = Math.max(maxQueue, fila.length);
    snap(L.fn, `bfs(borda do ${oc}, ${which}): a fila já começa com as ${fila.length} células da borda, todas de uma vez (multi-source).`, { vars: { oceano: oc } });
    for (const [r, c] of fila) {
      vis[base + r * C + c] = true;
      snap(L.seed, `Marca ${which}${P(r, c)}: está na borda, então escorre direto para o ${oc}.`, { cur: [r, c], write: [base + r * C + c], vars: { oceano: oc, r, c } });
    }
    snap(L.head, 'head = 0: começa a percorrer a fila.', { vars: { oceano: oc, head } });
    for (;;) {
      const more = head < fila.length;
      snap(L.while, more ? `${fila.length - head} célula(s) na fila.` : `Fila vazia: terminou a busca do ${oc}.`, { vars: { oceano: oc, head } });
      if (!more) break;
      const [r, c] = fila[head++];
      snap(L.deq, `Desenfileira ${P(r, c)} (altura ${h[r][c]}).`, { cur: [r, c], popped: true, vars: { oceano: oc, r, c, h: h[r][c] } });
      for (const [nr, nc] of nbrs(R, C, r, c)) {
        const nk = base + nr * C + nc, v = { oceano: oc, r, c, h: h[r][c], viz: P(nr, nc), 'h viz': h[nr][nc] };
        snap(L.for, `Vizinho ${P(nr, nc)} (altura ${h[nr][nc]}).`, { cur: [r, c], nb: [nr, nc], vars: v });
        if (vis[nk] || h[nr][nc] < h[r][c]) {
          snap(L.chk, vis[nk] ? `${which}${P(nr, nc)} já é true: continue.` : `${h[nr][nc]} < ${h[r][c]}: desce. A água de lá não chega aqui. continue.`,
            { cur: [r, c], nb: [nr, nc], read: [nk], vars: v });
          continue;
        }
        snap(L.chk, `${h[nr][nc]} ≥ ${h[r][c]} e ainda não marcado: a água de ${P(nr, nc)} escorre por ${P(r, c)} até o ${oc}.`, { cur: [r, c], nb: [nr, nc], read: [nk], vars: v });
        vis[nk] = true; fila.push([nr, nc]); maxQueue = Math.max(maxQueue, fila.length - head);
        snap(L.enq, `Marca ${which}${P(nr, nc)} e enfileira.`, { cur: [r, c], nb: [nr, nc], write: [nk], pushed: true, vars: v });
      }
    }
  };

  vis.fill(false);
  snap(L.alloc, `Aloca pac[] e atl[]: ${N} + ${N} booleanos, tudo false.`, { write: [...vis.keys()] });
  for (const which of ['pac', 'atl']) {
    snap(L[which], `Chama bfs para o ${OCEAN[which]}.`, { vars: { oceano: OCEAN[which] } });
    bfs(which);
    snap(L[which], `bfs do ${OCEAN[which]} voltou: ${vis.slice(which === 'atl' ? N : 0, which === 'atl' ? 2 * N : N).filter(Boolean).length} célula(s) chegam a ele.`, { vars: { oceano: OCEAN[which] } });
  }
  fila = []; head = 0;
  collect(snap, L, R, C, vis, (vars, s = {}) => ({ vars, ...s }));
  return out;
}

if (typeof module !== 'undefined') module.exports = { HEIGHTS, PA_CODE, pacificDFS, pacificBFS };
