// Making a Large Island: one step per executed line, as a snapshot for the player.
// Phase 1 labels each island in place (ids 2, 3, ...) and measures area[id] — DFS (call stack) or BFS (queue).
// Phase 2 is the same in both tabs: for each 0, sum the areas of the DISTINCT neighbor ids + 1.
// The grid lives in the heap (s.dp, row-major): 0 water, 1 unlabeled land, >= 2 island id.
// Runs in the browser (globals) and in node (module.exports) for the test.
if (typeof module !== 'undefined') globalThis.listing ??= require('./trace.js').listing;

const LARGE_GRID = [
  [1, 1, 0],
  [1, 0, 1],
  [0, 0, 1],
];

const LARGE_DIRS = [[1, 0, 'baixo'], [-1, 0, 'cima'], [0, 1, 'direita'], [0, -1, 'esquerda']];

// Phase 2 rows, shared by both listings.
const LARGE_PHASE2 = [
  ['best', 'let best = max(0, ...Object.values(area))   // sem 0 para virar: a maior ilha'],
  ['f2r', 'for (let r = 0; r < n; r++)'],
  ['f2c', '  for (let c = 0; c < n; c++) {'],
  ['is0', '    if (grid[r][c] !== 0) continue'],
  ['set', '    const ids = new Set()                    // ids DISTINTOS!'],
  ['dir', '    for (const [dr, dc] of DIRS) {'],
  ['lab', '      const v = rotulo(r + dr, c + dc)          // 0 se fora ou água'],
  ['add', '      if (v > 1) ids.add(v)'],
  [null, '    }'],
  ['tot', '    let total = 1; for (const v of ids) total += area[v]'],
  ['max', '    best = max(best, total)'],
  [null, '  }'],
  ['ret', 'return best'],
];

const LARGE_CODE = {
  dfs: listing([
    ['fn', 'function dfs(r, c, id) {'],
    ['out', '  if (fora(r, c) || grid[r][c] !== 1) return 0   // fora, água ou já rotulado'],
    ['mark', '  grid[r][c] = id                                 // rótulo da ilha'],
    ['sum', '  let a = 1'],
    ['rec', '  for (const [dr, dc] of DIRS) a += dfs(r + dr, c + dc, id)'],
    ['ret1', '  return a'],
    [null, '}'],
    ['init', 'const area = {}; let id = 2'],
    ['forr', 'for (let r = 0; r < n; r++)'],
    ['forc', '  for (let c = 0; c < n; c++)'],
    ['if', '    if (grid[r][c] === 1) {'],
    ['call', '      area[id] = dfs(r, c, id)          // fase 1: rotula e mede'],
    ['next', '      id++'],
    [null, '    }'],
    ...LARGE_PHASE2,
  ]),
  bfs: listing([
    ['init', 'const area = {}; let id = 2'],
    ['forr', 'for (let r = 0; r < n; r++)'],
    ['forc', '  for (let c = 0; c < n; c++) {'],
    ['if', '    if (grid[r][c] !== 1) continue'],
    ['seed', '    grid[r][c] = id; const fila = [[r, c]]; let head = 0; area[id] = 0'],
    ['while', '    while (head < fila.length) {'],
    ['deq', '      const [x, y] = fila[head++]; area[id]++'],
    ['dir1', '      for (const [dx, dy] of DIRS) {'],
    ['nb', '        const nx = x + dx, ny = y + dy'],
    ['chk', '        if (fora(nx, ny) || grid[nx][ny] !== 1) continue'],
    ['enq', '        grid[nx][ny] = id; fila.push([nx, ny])   // rotula AO ENFILEIRAR'],
    [null, '      }'],
    [null, '    }'],
    ['next', '    id++'],
    [null, '  }'],
    ...LARGE_PHASE2,
  ]),
};

const LP = (r, c) => `(${r},${c})`;
const areaText = (area) => Object.entries(area).map(([k, v]) => `${k}:${v}`).join(' ') || '{}';

// Phase 2: identical lines in both tabs, so one function drives both (L = that tab's line indices).
function largePhase2(L, g, n, area, snap) {
  let best = Math.max(0, ...Object.values(area));
  snap(L.best, `Fase 2. Começa com a maior ilha existente: best = ${best}. (Se não houver nenhum 0, essa já é a resposta.)`,
    { vars: { area: areaText(area), best } });
  for (let r = 0; r < n; r++) {
    snap(L.f2r, `r = ${r}: procura água na linha ${r}.`, { vars: { r, best } });
    for (let c = 0; c < n; c++) {
      const k = r * n + c, v0 = { r, c, best };
      snap(L.f2c, `c = ${c}: olha ${LP(r, c)}.`, { cur: [r, c], vars: v0 });
      if (g[k] !== 0) {
        snap(L.is0, `grid${LP(r, c)} = ${g[k]}: é terra, não dá para virar. continue.`, { cur: [r, c], read: [k], vars: v0 });
        continue;
      }
      snap(L.is0, `grid${LP(r, c)} = 0: e se virássemos esta água em terra?`, { cur: [r, c], read: [k], vars: v0 });
      const ids = new Set();
      const v = () => ({ ...v0, ids: `{${[...ids]}}`, area: areaText(area) });
      snap(L.set, 'Set vazio: guarda quais ilhas encostam aqui, sem repetir.', { cur: [r, c], vars: v() });
      for (const [dr, dc, nome] of LARGE_DIRS) {
        snap(L.dir, `Direção ${nome}.`, { cur: [r, c], vars: { ...v(), dir: nome } });
        const nr = r + dr, nc = c + dc, inside = nr >= 0 && nc >= 0 && nr < n && nc < n, nk = nr * n + nc;
        const lab = inside ? g[nk] : 0;
        snap(L.lab, inside ? `rotulo${LP(nr, nc)} = ${lab}${lab > 1 ? `: ilha ${lab}` : ': água'}.` : `${LP(nr, nc)} está fora da grade: 0.`,
          { cur: [r, c], nb: inside ? [nr, nc] : undefined, read: inside ? [nk] : [], vars: { ...v(), dir: nome, v: lab } });
        const dup = lab > 1 && ids.has(lab);
        if (lab > 1) ids.add(lab);
        snap(L.add, lab <= 1 ? `${lab} não é ilha: não entra no Set.` : dup
          ? `A ilha ${lab} JÁ está no Set: ela encosta aqui por dois lados, mas só pode ser somada uma vez. É por isso que usamos um Set!`
          : `Ilha ${lab} entra no Set.`, { cur: [r, c], nb: inside ? [nr, nc] : undefined, vars: { ...v(), dir: nome, v: lab } });
      }
      const total = 1 + [...ids].reduce((s, id) => s + area[id], 0);
      snap(L.tot, `total = 1 (a própria célula)${[...ids].map((id) => ` + area[${id}]=${area[id]}`).join('')} = ${total}.`,
        { cur: [r, c], vars: { ...v(), total } });
      const was = best;
      best = Math.max(best, total);
      snap(L.max, `best = max(${was}, ${total}) = ${best}.`, { cur: [r, c], vars: { ...v(), total, best } });
    }
  }
  snap(L.ret, `Resposta: ${best}. Virar um único 0 pode juntar ilhas vizinhas numa só de área ${best}.`, { vars: { area: areaText(area), best }, result: best });
}

function largeDFS(grid = LARGE_GRID) {
  const L = LARGE_CODE.dfs.at, n = grid.length, g = grid.flat(), stack = [], out = [], area = {};
  let calls = 0, maxDepth = 0;
  const snap = (line, msg, s = {}) => out.push({ dp: g.slice(), stack: stack.map((f) => ({ ...f })), read: [], write: [], calls, maxDepth, line, msg, ...s });

  const dfs = (r, c, id) => {
    const fr = { call: `dfs${LP(r, c)}`, note: '' };
    stack.push(fr); calls++; maxDepth = Math.max(maxDepth, stack.length);
    const v = { r, c, id, area: areaText(area) };
    snap(L.fn, `Entra em dfs${LP(r, c)} com id = ${id}: empilha um frame (profundidade ${stack.length}).`, { cur: [r, c], vars: v });
    const inside = r >= 0 && c >= 0 && r < n && c < n, k = r * n + c;
    if (!inside || g[k] !== 1) {
      fr.note = 'ret 0';
      snap(L.out, !inside ? `${LP(r, c)} está fora da grade: retorna 0.`
        : `grid${LP(r, c)} = ${g[k]}: ${g[k] === 0 ? 'água' : `já rotulado com ${g[k]}`}. Retorna 0.`,
      { cur: inside ? [r, c] : undefined, read: inside ? [k] : [], vars: v });
      stack.pop(); return 0;
    }
    snap(L.out, `grid${LP(r, c)} = 1: terra sem rótulo.`, { cur: [r, c], read: [k], vars: v });
    g[k] = id;
    snap(L.mark, `Rotula grid${LP(r, c)} = ${id}. O rótulo também serve de "visitado".`, { cur: [r, c], write: [k], vars: v });
    let a = 1;
    snap(L.sum, 'a = 1: esta célula.', { cur: [r, c], vars: { ...v, a } });
    for (const [dr, dc, nome] of LARGE_DIRS) {
      fr.note = `a=${a} · ${nome}`;
      snap(L.rec, `Vizinho de ${nome}: chama dfs${LP(r + dr, c + dc)}.`, { cur: [r, c], nb: [r + dr, c + dc], vars: { ...v, a, dir: nome } });
      const got = dfs(r + dr, c + dc, id);
      a += got;
      snap(L.rec, `dfs${LP(r + dr, c + dc)} voltou ${got} → a = ${a}.`, { cur: [r, c], vars: { ...v, a, dir: nome } });
    }
    fr.note = `ret ${a}`;
    snap(L.ret1, `dfs${LP(r, c)} retorna a = ${a} e desempilha.`, { cur: [r, c], vars: { ...v, a } });
    stack.pop(); return a;
  };

  let id = 2;
  snap(L.init, `Grade ${n}×${n} no heap. Os rótulos começam em 2, porque 0 e 1 já significam água e terra.`, { vars: { id, area: '{}' } });
  for (let r = 0; r < n; r++) {
    snap(L.forr, `r = ${r}: varre a linha ${r}.`, { vars: { r, id } });
    for (let c = 0; c < n; c++) {
      const k = r * n + c;
      snap(L.forc, `c = ${c}: olha ${LP(r, c)}.`, { cur: [r, c], vars: { r, c, id } });
      if (g[k] !== 1) {
        snap(L.if, `grid${LP(r, c)} = ${g[k]}: ${g[k] === 0 ? 'água' : `já é da ilha ${g[k]}`}. Segue.`, { cur: [r, c], read: [k], vars: { r, c, id } });
        continue;
      }
      snap(L.if, `grid${LP(r, c)} = 1: ilha nova! Vai ganhar o rótulo ${id}.`, { cur: [r, c], read: [k], vars: { r, c, id } });
      snap(L.call, `Chama dfs${LP(r, c)} com id = ${id}: rotula a ilha inteira e devolve a área.`, { cur: [r, c], vars: { r, c, id } });
      area[id] = dfs(r, c, id);
      snap(L.call, `dfs${LP(r, c)} voltou ${area[id]}: area[${id}] = ${area[id]}.`, { cur: [r, c], vars: { r, c, id, area: areaText(area) } });
      id++;
      snap(L.next, `id = ${id} para a próxima ilha.`, { vars: { r, c, id, area: areaText(area) } });
    }
  }
  largePhase2(L, g, n, area, snap);
  return out;
}

function largeBFS(grid = LARGE_GRID) {
  const L = LARGE_CODE.bfs.at, n = grid.length, g = grid.flat(), out = [], area = {};
  let fila = [], head = 0, maxQueue = 0;
  const snap = (line, msg, s = {}) => out.push({ dp: g.slice(), queue: fila.map(([x, y]) => LP(x, y)), head, maxQueue, read: [], write: [], line, msg, ...s });

  let id = 2;
  snap(L.init, `Grade ${n}×${n} no heap. Os rótulos começam em 2, porque 0 e 1 já significam água e terra.`, { vars: { id, area: '{}' } });
  for (let r = 0; r < n; r++) {
    snap(L.forr, `r = ${r}: varre a linha ${r}.`, { vars: { r, id } });
    for (let c = 0; c < n; c++) {
      const k = r * n + c;
      snap(L.forc, `c = ${c}: olha ${LP(r, c)}.`, { cur: [r, c], vars: { r, c, id } });
      if (g[k] !== 1) {
        snap(L.if, `grid${LP(r, c)} = ${g[k]}: ${g[k] === 0 ? 'água' : `já é da ilha ${g[k]}`}. continue.`, { cur: [r, c], read: [k], vars: { r, c, id } });
        continue;
      }
      snap(L.if, `grid${LP(r, c)} = 1: ilha nova! Vai ganhar o rótulo ${id}.`, { cur: [r, c], read: [k], vars: { r, c, id } });
      g[k] = id; fila = [[r, c]]; head = 0; area[id] = 0; maxQueue = Math.max(maxQueue, 1);
      snap(L.seed, `Rotula ${LP(r, c)} com ${id}, cria a fila com ele e zera area[${id}].`,
        { cur: [r, c], write: [k], pushed: true, vars: { r, c, id, area: areaText(area) } });
      for (;;) {
        const more = head < fila.length;
        snap(L.while, more ? `Fila com ${fila.length - head} item(ns): continua.` : `Fila vazia: a ilha ${id} tem área ${area[id]}.`,
          { vars: { id, area: areaText(area) } });
        if (!more) break;
        const [x, y] = fila[head++];
        area[id]++;
        snap(L.deq, `Desenfileira ${LP(x, y)} e conta: area[${id}] = ${area[id]}.`, { cur: [x, y], popped: true, vars: { x, y, id, area: areaText(area) } });
        for (const [dx, dy, nome] of LARGE_DIRS) {
          snap(L.dir1, `Direção ${nome}.`, { cur: [x, y], vars: { x, y, id, dir: nome } });
          const nx = x + dx, ny = y + dy, nk = nx * n + ny, fora = nx < 0 || ny < 0 || nx >= n || ny >= n;
          snap(L.nb, `Vizinho ${LP(nx, ny)}.`, { cur: [x, y], nb: fora ? undefined : [nx, ny], vars: { x, y, nx, ny, id } });
          if (fora || g[nk] !== 1) {
            snap(L.chk, fora ? `${LP(nx, ny)} está fora da grade: continue.`
              : `grid${LP(nx, ny)} = ${g[nk]}: ${g[nk] === 0 ? 'água' : 'já rotulado'}. continue.`,
            { cur: [x, y], nb: fora ? undefined : [nx, ny], read: fora ? [] : [nk], vars: { x, y, nx, ny, id } });
            continue;
          }
          snap(L.chk, `grid${LP(nx, ny)} = 1: terra da mesma ilha.`, { cur: [x, y], nb: [nx, ny], read: [nk], vars: { x, y, nx, ny, id } });
          g[nk] = id; fila.push([nx, ny]); maxQueue = Math.max(maxQueue, fila.length - head);
          snap(L.enq, `Rotula ${LP(nx, ny)} com ${id} já ao enfileirar e coloca no fim da fila.`,
            { cur: [x, y], nb: [nx, ny], write: [nk], pushed: true, vars: { x, y, nx, ny, id } });
        }
      }
      id++;
      snap(L.next, `id = ${id} para a próxima ilha.`, { vars: { r, c, id, area: areaText(area) } });
    }
  }
  fila = []; head = 0;
  largePhase2(L, g, n, area, snap);
  return out;
}

if (typeof module !== 'undefined') module.exports = { LARGE_GRID, LARGE_CODE, largeDFS, largeBFS };
