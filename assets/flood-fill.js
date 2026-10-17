// Flood Fill: one step per executed line, as a snapshot for the player.
// The image lives in the heap (s.dp, row-major). Painting a pixel is also what marks it as visited.
// DFS keeps the path in the call stack (s.stack); BFS keeps the frontier in a queue (s.queue + s.head).
// Runs in the browser (globals) and in node (module.exports) for the test.
if (typeof module !== 'undefined') globalThis.listing ??= require('./trace.js').listing;

const FILL_IMAGE = [
  [1, 1, 0, 0],
  [1, 0, 0, 1],
  [1, 1, 0, 1],
];
const FILL_START = { sr: 0, sc: 0, cor: 3 };

const FILL_DIRS = [[1, 0, 'baixo'], [-1, 0, 'cima'], [0, 1, 'direita'], [0, -1, 'esquerda']];

const FILL_CODE = {
  dfs: listing([
    ['fn', 'function dfs(r, c) {'],
    ['out', '  if (r < 0 || c < 0 || r >= R || c >= C) return   // fora da imagem'],
    ['diff', '  if (image[r][c] !== orig) return               // outra cor ou já pintado'],
    ['paint', '  image[r][c] = cor                               // pinta = marca visitado'],
    ['rec', '  for (const [dr, dc] of DIRS) dfs(r + dr, c + dc)'],
    [null, '}'],
    ['orig', 'const orig = image[sr][sc]'],
    ['same', 'if (orig === cor) return image   // nada a pintar (e evita recursão infinita)'],
    ['call', 'dfs(sr, sc)'],
    ['ret', 'return image'],
  ]),
  bfs: listing([
    ['orig', 'const orig = image[sr][sc]'],
    ['same', 'if (orig === cor) return image   // nada a pintar (e evita laço infinito)'],
    ['seed', 'image[sr][sc] = cor; const fila = [[sr, sc]]; let head = 0'],
    ['while', 'while (head < fila.length) {'],
    ['deq', '  const [x, y] = fila[head++]                  // desenfileira'],
    ['dir', '  for (const [dx, dy] of DIRS) {'],
    ['nb', '    const nx = x + dx, ny = y + dy'],
    ['chk', '    if (fora(nx, ny) || image[nx][ny] !== orig) continue'],
    ['enq', '    image[nx][ny] = cor; fila.push([nx, ny])   // pinta AO ENFILEIRAR'],
    [null, '  }'],
    [null, '}'],
    ['ret', 'return image'],
  ]),
};

const FP = (r, c) => `(${r},${c})`;
const asRows = (g, C) => Array.from({ length: g.length / C }, (_, r) => g.slice(r * C, r * C + C));

function fillDFS(image = FILL_IMAGE, { sr, sc, cor } = FILL_START) {
  const L = FILL_CODE.dfs.at, R = image.length, C = image[0].length;
  const g = image.flat(), stack = [], out = [];
  let calls = 0, maxDepth = 0, orig = null;
  const snap = (line, msg, s = {}) => out.push({ dp: g.slice(), stack: stack.map((f) => ({ ...f })), read: [], write: [], calls, maxDepth, line, msg, ...s });

  const dfs = (r, c) => {
    const fr = { call: `dfs${FP(r, c)}`, note: '' };
    stack.push(fr); calls++; maxDepth = Math.max(maxDepth, stack.length);
    const v = { r, c, orig, cor };
    snap(L.fn, `Entra em dfs${FP(r, c)}: empilha um frame (profundidade ${stack.length}).`, { cur: [r, c], vars: v });
    if (r < 0 || c < 0 || r >= R || c >= C) {
      fr.note = 'fora';
      snap(L.out, `${FP(r, c)} está fora da imagem: retorna.`, { vars: v });
      stack.pop(); return;
    }
    snap(L.out, `${FP(r, c)} está dentro da imagem.`, { cur: [r, c], vars: v });
    const k = r * C + c;
    if (g[k] !== orig) {
      fr.note = g[k] === cor ? 'já pintado' : `cor ${g[k]}`;
      snap(L.diff, `image${FP(r, c)} = ${g[k]} ≠ ${orig}: ${g[k] === cor ? 'já foi pintado' : 'outra cor, fica de fora'}. Retorna.`, { cur: [r, c], read: [k], vars: v });
      stack.pop(); return;
    }
    snap(L.diff, `image${FP(r, c)} = ${orig}: mesma cor da origem, faz parte da região.`, { cur: [r, c], read: [k], vars: v });
    g[k] = cor;
    snap(L.paint, `Pinta image${FP(r, c)} = ${cor}. Como ${cor} ≠ ${orig}, a célula não volta a ser aceita: a tinta é a marca de visitado.`, { cur: [r, c], write: [k], vars: v });
    for (const [dr, dc, nome] of FILL_DIRS) {
      fr.note = nome;
      snap(L.rec, `Vizinho de ${nome}: chama dfs${FP(r + dr, c + dc)}.`, { cur: [r, c], nb: [r + dr, c + dc], vars: { ...v, dir: nome } });
      dfs(r + dr, c + dc);
      snap(L.rec, `dfs${FP(r + dr, c + dc)} voltou para dfs${FP(r, c)}.`, { cur: [r, c], vars: { ...v, dir: nome } });
    }
    fr.note = 'fim';
    stack.pop();
  };

  const k0 = sr * C + sc;
  orig = g[k0];
  snap(L.orig, `Imagem ${R}×${C} no heap. A cor original do pixel inicial ${FP(sr, sc)} é ${orig}.`, { cur: [sr, sc], read: [k0], vars: { sr, sc, orig, cor } });
  if (orig === cor) {
    snap(L.same, `orig = cor = ${cor}: não há o que pintar. Sem esse teste, a tinta não marcaria nada e a busca giraria para sempre.`, { vars: { orig, cor }, result: asRows(g, C) });
    return out;
  }
  snap(L.same, `orig = ${orig} ≠ cor = ${cor}: segue para pintar.`, { vars: { sr, sc, orig, cor } });
  snap(L.call, `Chama dfs${FP(sr, sc)}.`, { cur: [sr, sc], vars: { sr, sc, orig, cor } });
  dfs(sr, sc);
  snap(L.call, `dfs${FP(sr, sc)} voltou: a região inteira foi pintada.`, { vars: { sr, sc, orig, cor } });
  snap(L.ret, `Retorna a imagem. ${calls} chamadas de dfs, profundidade máxima ${maxDepth}.`, { vars: { orig, cor }, result: asRows(g, C) });
  return out;
}

function fillBFS(image = FILL_IMAGE, { sr, sc, cor } = FILL_START) {
  const L = FILL_CODE.bfs.at, R = image.length, C = image[0].length;
  const g = image.flat(), out = [], fila = [];
  let head = 0, maxQueue = 0;
  const snap = (line, msg, s = {}) => out.push({ dp: g.slice(), queue: fila.map(([x, y]) => FP(x, y)), head, maxQueue, read: [], write: [], line, msg, ...s });

  const k0 = sr * C + sc, orig = g[k0];
  snap(L.orig, `Imagem ${R}×${C} no heap. A cor original do pixel inicial ${FP(sr, sc)} é ${orig}.`, { cur: [sr, sc], read: [k0], vars: { sr, sc, orig, cor } });
  if (orig === cor) {
    snap(L.same, `orig = cor = ${cor}: não há o que pintar. Sem esse teste, a tinta não marcaria nada e a fila nunca esvaziaria.`, { vars: { orig, cor }, result: asRows(g, C) });
    return out;
  }
  snap(L.same, `orig = ${orig} ≠ cor = ${cor}: segue para pintar.`, { vars: { sr, sc, orig, cor } });
  g[k0] = cor; fila.push([sr, sc]); maxQueue = 1;
  snap(L.seed, `Pinta ${FP(sr, sc)} e cria a fila com ele. A tinta se espalha em camadas a partir daqui.`, { cur: [sr, sc], write: [k0], pushed: true, vars: { sr, sc, orig, cor } });
  for (;;) {
    const more = head < fila.length;
    snap(L.while, more ? `Fila com ${fila.length - head} item(ns): continua.` : 'Fila vazia: a região inteira foi pintada.', { vars: { orig, cor } });
    if (!more) break;
    const [x, y] = fila[head++];
    snap(L.deq, `Desenfileira ${FP(x, y)} (head avança para ${head}).`, { cur: [x, y], popped: true, vars: { x, y, orig, cor } });
    for (const [dx, dy, nome] of FILL_DIRS) {
      snap(L.dir, `Direção ${nome}.`, { cur: [x, y], vars: { x, y, dir: nome, orig, cor } });
      const nx = x + dx, ny = y + dy, nk = nx * C + ny, fora = nx < 0 || ny < 0 || nx >= R || ny >= C;
      snap(L.nb, `Vizinho ${FP(nx, ny)}.`, { cur: [x, y], nb: [nx, ny], vars: { x, y, nx, ny, orig, cor } });
      if (fora || g[nk] !== orig) {
        snap(L.chk, fora ? `${FP(nx, ny)} está fora da imagem: continue.` : `image${FP(nx, ny)} = ${g[nk]} ≠ ${orig}: ${g[nk] === cor ? 'já pintado' : 'outra cor'}. continue.`,
          { cur: [x, y], nb: fora ? undefined : [nx, ny], read: fora ? [] : [nk], vars: { x, y, nx, ny, orig, cor } });
        continue;
      }
      snap(L.chk, `image${FP(nx, ny)} = ${orig}: mesma região.`, { cur: [x, y], nb: [nx, ny], read: [nk], vars: { x, y, nx, ny, orig, cor } });
      g[nk] = cor; fila.push([nx, ny]); maxQueue = Math.max(maxQueue, fila.length - head);
      snap(L.enq, `Pinta ${FP(nx, ny)} já ao enfileirar (senão ele entraria na fila duas vezes) e coloca no fim da fila.`,
        { cur: [x, y], nb: [nx, ny], write: [nk], pushed: true, vars: { x, y, nx, ny, orig, cor } });
    }
  }
  snap(L.ret, `Retorna a imagem. A fila chegou a ter no máximo ${maxQueue} itens.`, { vars: { orig, cor }, result: asRows(g, C) });
  return out;
}

if (typeof module !== 'undefined') module.exports = { FILL_IMAGE, FILL_START, FILL_CODE, fillDFS, fillBFS };
