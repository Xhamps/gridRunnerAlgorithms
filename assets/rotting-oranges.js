// Rotting Oranges: one step per executed line, as a snapshot for the player.
// 0 empty, 1 fresh, 2 rotten. s.tm = minute each orange rots (drawn in the grid).
// DFS relaxes a time grid t[] in the heap (s.dp) and must revisit cells; BFS is multi-source, level = minute.
// Runs in the browser (globals) and in node (module.exports) for the test.
if (typeof module !== 'undefined') globalThis.listing ??= require('./trace.js').listing;

const ORANGES = [
  [2, 1, 1],
  [1, 1, 0],
  [0, 1, 1],
];

const ORANGE_CODE = {
  dfs: listing([
    ['alloc', 'const t = grade R×C cheia de ∞      // minuto em que cada laranja apodrece'],
    ['fn', 'function dfs(r, c, min) {'],
    ['empty', '  if (g[r][c] === 0) return                    // célula vazia: nada passa'],
    ['imp', '  if (min >= t[r][c]) return                   // não melhora: já apodrece antes'],
    ['set', '  t[r][c] = min                                 // relaxa: tempo menor'],
    ['rec', '  for (const [nr, nc] of vizinhos(r, c)) dfs(nr, nc, min + 1)'],
    [null, '}'],
    ['forr', 'for (let r = 0; r < R; r++)'],
    ['forc', '  for (let c = 0; c < C; c++)'],
    ['src', '    if (g[r][c] === 2) dfs(r, c, 0)             // cada podre é uma fonte'],
    ['max', 'let min = 0'],
    ['each', 'for (const [r, c] of todasAsCelulas)'],
    ['fresh', '  if (g[r][c] === 1) min = max(min, t[r][c])'],
    ['ret', 'return min === ∞ ? -1 : min'],
  ]),
  bfs: listing([
    ['init', 'const fila = []; let head = 0, frescas = 0, min = 0'],
    ['forr', 'for (let r = 0; r < R; r++)'],
    ['forc', '  for (let c = 0; c < C; c++)'],
    ['seed', '    if (g[r][c] === 2) fila.push([r, c])         // TODAS as podres de uma vez'],
    ['fresh', '    else if (g[r][c] === 1) frescas++'],
    ['while', 'while (head < fila.length && frescas > 0) {'],
    ['lvl', '  const fim = fila.length; min++              // uma camada = 1 minuto'],
    ['inner', '  while (head < fim) {'],
    ['deq', '    const [x, y] = fila[head++]'],
    ['for', '    for (const [nx, ny] of vizinhos(x, y)) {'],
    ['chk', '      if (g[nx][ny] !== 1) continue              // vazia ou já podre'],
    ['rot', '      g[nx][ny] = 2; frescas--; fila.push([nx, ny])'],
    [null, '    }'],
    [null, '  }'],
    [null, '}'],
    ['ret', 'return frescas === 0 ? min : -1'],
  ]),
};

const P = (r, c) => `(${r},${c})`;
const nbrs = (R, C, r, c) => [[r + 1, c], [r - 1, c], [r, c + 1], [r, c - 1]].filter(([a, b]) => a >= 0 && b >= 0 && a < R && b < C);
const showT = (v) => v === null ? null : v === Infinity ? '∞' : v;

function orangesDFS(grid = ORANGES) {
  const L = ORANGE_CODE.dfs.at, R = grid.length, C = grid[0].length, g = grid.flat();
  const t = new Array(R * C).fill(null), stack = [], out = [];
  let calls = 0, maxDepth = 0;
  const snap = (line, msg, s = {}) => out.push({ dp: t.map(showT), tm: t.slice(), g: g.slice(), stack: stack.map((f) => ({ ...f })),
    read: [], write: [], calls, maxDepth, line, msg, ...s });

  const dfs = (r, c, min) => {
    const k = r * C + c, fr = { call: `dfs(${r}, ${c}, ${min})`, note: '' };
    stack.push(fr); calls++; maxDepth = Math.max(maxDepth, stack.length);
    const v = { r, c, min };
    snap(L.fn, `Entra em ${fr.call}: "a podridão chega em ${P(r, c)} no minuto ${min}". Profundidade ${stack.length}.`, { cur: [r, c], vars: v });
    if (g[k] === 0) {
      fr.note = 'vazia';
      snap(L.empty, `${P(r, c)} está vazia: a podridão não atravessa. Retorna.`, { cur: [r, c], vars: v });
      stack.pop(); return;
    }
    snap(L.empty, `${P(r, c)} tem laranja (${g[k] === 2 ? 'podre' : 'fresca'}).`, { cur: [r, c], vars: v });
    if (min >= t[k]) {
      fr.note = 'não melhora';
      snap(L.imp, `${min} ≥ t${P(r, c)} = ${showT(t[k])}: ela já apodrece antes por outro caminho. Corta aqui.`, { cur: [r, c], read: [k], vars: { ...v, 't[r][c]': showT(t[k]) } });
      stack.pop(); return;
    }
    snap(L.imp, `${min} < t${P(r, c)} = ${showT(t[k])}: chegamos mais cedo, então vale atualizar.`, { cur: [r, c], read: [k], vars: { ...v, 't[r][c]': showT(t[k]) } });
    const old = t[k]; t[k] = min;
    snap(L.set, `t${P(r, c)} = ${min}${old === Infinity ? '' : ` (antes era ${old}: a DFS tinha chegado por um caminho mais longo, e agora corrige)`}.`,
      { cur: [r, c], write: [k], vars: { ...v, 't[r][c]': min } });
    for (const [nr, nc] of nbrs(R, C, r, c)) {
      fr.note = `→ ${P(nr, nc)}`;
      snap(L.rec, `Espalha para o vizinho ${P(nr, nc)}: chama dfs(${nr}, ${nc}, ${min + 1}).`, { cur: [r, c], nb: [nr, nc], vars: v });
      dfs(nr, nc, min + 1);
      snap(L.rec, `dfs(${nr}, ${nc}, ${min + 1}) voltou para ${fr.call}.`, { cur: [r, c], vars: v });
    }
    stack.pop();
  };

  t.fill(Infinity);
  snap(L.alloc, `Aloca t[] com ${R * C} células, todas ∞ ("ainda não apodreceu"). A grade original não é alterada.`, { write: [...t.keys()] });
  for (let r = 0; r < R; r++) {
    snap(L.forr, `r = ${r}.`, { vars: { r } });
    for (let c = 0; c < C; c++) {
      const k = r * C + c;
      snap(L.forc, `c = ${c}: olha ${P(r, c)}.`, { cur: [r, c], vars: { r, c } });
      if (g[k] !== 2) {
        snap(L.src, `g${P(r, c)} = ${g[k]}: não é fonte.`, { cur: [r, c], vars: { r, c } });
        continue;
      }
      snap(L.src, `g${P(r, c)} = 2: laranja podre, é uma fonte. Chama dfs(${r}, ${c}, 0).`, { cur: [r, c], vars: { r, c } });
      dfs(r, c, 0);
      snap(L.src, `dfs(${r}, ${c}, 0) voltou: tudo o que essa fonte alcança tem o melhor tempo conhecido até agora.`, { cur: [r, c], vars: { r, c } });
    }
  }
  let min = 0;
  snap(L.max, 'Agora a resposta é o maior tempo entre as laranjas frescas.', { vars: { min } });
  for (let k = 0; k < R * C; k++) {
    const r = Math.floor(k / C), c = k % C;
    snap(L.each, `Célula ${P(r, c)}.`, { cur: [r, c], vars: { r, c, min: showT(min) } });
    if (g[k] !== 1) {
      snap(L.fresh, `g${P(r, c)} = ${g[k]}: não é fresca, ignora.`, { cur: [r, c], vars: { r, c, min: showT(min) } });
      continue;
    }
    min = Math.max(min, t[k]);
    snap(L.fresh, `Fresca: apodrece no minuto ${showT(t[k])}. min = ${showT(min)}.`, { cur: [r, c], read: [k], vars: { r, c, min: showT(min) } });
  }
  const ans = min === Infinity ? -1 : min;
  snap(L.ret, `Resposta: ${ans}${ans === -1 ? ' (alguma laranja nunca é alcançada)' : ' minutos'}. ${calls} chamadas de dfs: a DFS revisita células sempre que acha um tempo menor.`,
    { vars: { min: showT(min) }, result: ans });
  return out;
}

function orangesBFS(grid = ORANGES) {
  const L = ORANGE_CODE.bfs.at, R = grid.length, C = grid[0].length, g = grid.flat();
  const tm = g.map((v) => v === 2 ? 0 : Infinity), fila = [], out = [];
  let head = 0, frescas = 0, min = 0, maxQueue = 0;
  const snap = (line, msg, s = {}) => out.push({ dp: g.slice(), tm: tm.slice(), queue: fila.map(([x, y]) => P(x, y)), head, maxQueue,
    read: [], write: [], line, msg, ...s });
  const v = (x = {}) => ({ ...x, frescas, min });

  snap(L.init, 'Fila vazia, nenhuma fresca contada, minuto 0.', { vars: v() });
  for (let r = 0; r < R; r++) {
    snap(L.forr, `r = ${r}.`, { vars: v({ r }) });
    for (let c = 0; c < C; c++) {
      const k = r * C + c;
      snap(L.forc, `c = ${c}: olha ${P(r, c)}.`, { cur: [r, c], vars: v({ r, c }) });
      if (g[k] === 2) {
        fila.push([r, c]); maxQueue = Math.max(maxQueue, fila.length);
        snap(L.seed, `g${P(r, c)} = 2: podre desde o minuto 0. Entra na fila junto com as outras fontes (BFS multi-source).`,
          { cur: [r, c], read: [k], pushed: true, vars: v({ r, c }) });
        continue;
      }
      snap(L.seed, `g${P(r, c)} = ${g[k]}: não é podre.`, { cur: [r, c], read: [k], vars: v({ r, c }) });
      if (g[k] === 1) frescas++;
      snap(L.fresh, g[k] === 1 ? `Fresca: frescas = ${frescas}.` : 'Vazia: não conta.', { cur: [r, c], vars: v({ r, c }) });
    }
  }
  for (;;) {
    const more = head < fila.length && frescas > 0;
    snap(L.while, more ? `${fila.length - head} podre(s) na fila e ${frescas} fresca(s): mais um minuto.` :
      frescas === 0 ? 'Nenhuma fresca sobrou: fim.' : `A fila acabou com ${frescas} fresca(s) isolada(s).`, { vars: v() });
    if (!more) break;
    const fim = fila.length; min++;
    snap(L.lvl, `Minuto ${min}: processa exatamente as ${fim - head} laranjas que estão na fila agora (a camada atual).`, { vars: v({ fim }) });
    for (;;) {
      const inLevel = head < fim;
      snap(L.inner, inLevel ? `head = ${head} < fim = ${fim}: ainda na camada.` : `head = fim = ${fim}: a camada do minuto ${min} acabou.`, { vars: v({ head, fim }) });
      if (!inLevel) break;
      const [x, y] = fila[head++];
      snap(L.deq, `Desenfileira ${P(x, y)}.`, { cur: [x, y], popped: true, vars: v({ x, y, fim }) });
      for (const [nx, ny] of nbrs(R, C, x, y)) {
        const nk = nx * C + ny;
        snap(L.for, `Vizinho ${P(nx, ny)}.`, { cur: [x, y], nb: [nx, ny], vars: v({ x, y, nx, ny }) });
        if (g[nk] !== 1) {
          snap(L.chk, `g${P(nx, ny)} = ${g[nk]}: ${g[nk] === 0 ? 'vazia' : 'já podre'}. continue.`, { cur: [x, y], nb: [nx, ny], read: [nk], vars: v({ x, y, nx, ny }) });
          continue;
        }
        snap(L.chk, `g${P(nx, ny)} = 1: fresca, vai apodrecer.`, { cur: [x, y], nb: [nx, ny], read: [nk], vars: v({ x, y, nx, ny }) });
        g[nk] = 2; tm[nk] = min; frescas--; fila.push([nx, ny]); maxQueue = Math.max(maxQueue, fila.length - head);
        snap(L.rot, `${P(nx, ny)} apodrece no minuto ${min} e entra na fila para espalhar no minuto seguinte. Cada laranja apodrece uma vez só.`,
          { cur: [x, y], nb: [nx, ny], write: [nk], pushed: true, vars: v({ x, y, nx, ny }) });
      }
    }
  }
  const ans = frescas === 0 ? min : -1;
  snap(L.ret, `Resposta: ${ans}${ans === -1 ? ' (sobrou laranja fresca que a podridão não alcança)' : ' minutos'}.`, { vars: v(), result: ans });
  return out;
}

if (typeof module !== 'undefined') module.exports = { ORANGES, ORANGE_CODE, orangesDFS, orangesBFS };
