// Number of Islands: one step per executed line, as a snapshot for the player.
// The grid lives in the heap (s.dp, row-major) and is marked in place: '1' land, '0' water, '#' visited.
// DFS keeps the path in the call stack (s.stack); BFS keeps the frontier in a queue (s.queue + s.head).
// Runs in the browser (globals) and in node (module.exports) for the test.
if (typeof module !== 'undefined') globalThis.listing ??= require('./trace.js').listing;

const ISLAND_GRID = [
  '11001',
  '10011',
  '00100',
];

const DIRS = [[1, 0, 'baixo'], [-1, 0, 'cima'], [0, 1, 'direita'], [0, -1, 'esquerda']];

const ISLAND_CODE = {
  dfs: listing([
    ['fn', 'function dfs(r, c) {'],
    ['out', '  if (r < 0 || c < 0 || r >= R || c >= C) return   // fora da grade'],
    ['wat', "  if (grid[r][c] !== '1') return                  // água ou já visitado"],
    ['mark', "  grid[r][c] = '#'                                // marca: visitado"],
    ['rec', '  for (const [dr, dc] of DIRS) dfs(r + dr, c + dc)'],
    [null, '}'],
    ['init', 'let ilhas = 0'],
    ['forr', 'for (let r = 0; r < R; r++)'],
    ['forc', '  for (let c = 0; c < C; c++)'],
    ['if', "    if (grid[r][c] === '1') {"],
    ['cnt', '      ilhas++                     // terra nova: outra ilha'],
    ['call', '      dfs(r, c)                   // afunda a ilha inteira'],
    [null, '    }'],
    ['ret', 'return ilhas'],
  ]),
  bfs: listing([
    ['init', 'let ilhas = 0'],
    ['forr', 'for (let r = 0; r < R; r++)'],
    ['forc', '  for (let c = 0; c < C; c++) {'],
    ['if', "    if (grid[r][c] !== '1') continue"],
    ['cnt', '    ilhas++                                // terra nova: outra ilha'],
    ['seed', "    grid[r][c] = '#'; const fila = [[r, c]]; let head = 0"],
    ['while', '    while (head < fila.length) {'],
    ['deq', '      const [x, y] = fila[head++]           // desenfileira'],
    ['dir', '      for (const [dx, dy] of DIRS) {'],
    ['nb', '        const nx = x + dx, ny = y + dy'],
    ['chk', "        if (fora(nx, ny) || grid[nx][ny] !== '1') continue"],
    ['enq', "        grid[nx][ny] = '#'; fila.push([nx, ny])   // marca AO ENFILEIRAR"],
    [null, '      }'],
    [null, '    }'],
    [null, '  }'],
    ['ret', 'return ilhas'],
  ]),
};

const P = (r, c) => `(${r},${c})`;

function islandsDFS(rows = ISLAND_GRID) {
  const L = ISLAND_CODE.dfs.at, R = rows.length, C = rows[0].length;
  const g = rows.join('').split(''), stack = [], out = [];
  let ilhas = 0, calls = 0, maxDepth = 0;
  const snap = (line, msg, s = {}) => out.push({ dp: g.slice(), stack: stack.map((f) => ({ ...f })), read: [], write: [], calls, maxDepth, ilhas, line, msg, ...s });

  const dfs = (r, c) => {
    const fr = { call: `dfs${P(r, c)}`, note: '' };
    stack.push(fr); calls++; maxDepth = Math.max(maxDepth, stack.length);
    const v = { r, c, ilhas };
    snap(L.fn, `Entra em dfs${P(r, c)}: empilha um frame (profundidade ${stack.length}).`, { cur: [r, c], vars: v });
    if (r < 0 || c < 0 || r >= R || c >= C) {
      fr.note = 'fora';
      snap(L.out, `${P(r, c)} está fora da grade: retorna.`, { vars: v });
      stack.pop(); return;
    }
    snap(L.out, `${P(r, c)} está dentro da grade.`, { cur: [r, c], vars: v });
    const k = r * C + c;
    if (g[k] !== '1') {
      fr.note = g[k] === '#' ? 'já visitado' : 'água';
      snap(L.wat, `grid${P(r, c)} = '${g[k]}': ${g[k] === '#' ? 'já foi visitado' : 'é água'}. Retorna.`, { cur: [r, c], read: [k], vars: v });
      stack.pop(); return;
    }
    snap(L.wat, `grid${P(r, c)} = '1': terra ainda não visitada.`, { cur: [r, c], read: [k], vars: v });
    g[k] = '#';
    snap(L.mark, `Marca grid${P(r, c)} = '#'. A própria grade serve de "visitado", sem memória extra.`, { cur: [r, c], write: [k], vars: v });
    for (const [dr, dc, nome] of DIRS) {
      fr.note = nome;
      snap(L.rec, `Vizinho de ${nome}: chama dfs${P(r + dr, c + dc)}.`, { cur: [r, c], nb: [r + dr, c + dc], vars: { ...v, dir: nome } });
      dfs(r + dr, c + dc);
      snap(L.rec, `dfs${P(r + dr, c + dc)} voltou para dfs${P(r, c)}.`, { cur: [r, c], vars: { ...v, dir: nome } });
    }
    fr.note = 'fim';
    stack.pop();
  };

  snap(L.init, `Grade ${R}×${C} no heap. ilhas = 0.`, { vars: { ilhas } });
  for (let r = 0; r < R; r++) {
    snap(L.forr, `r = ${r}: varre a linha ${r}.`, { vars: { r, ilhas } });
    for (let c = 0; c < C; c++) {
      const k = r * C + c;
      snap(L.forc, `c = ${c}: olha ${P(r, c)}.`, { cur: [r, c], vars: { r, c, ilhas } });
      if (g[k] !== '1') {
        snap(L.if, `grid${P(r, c)} = '${g[k]}': ${g[k] === '#' ? 'já pertence a uma ilha contada' : 'água'}. Segue.`, { cur: [r, c], read: [k], vars: { r, c, ilhas } });
        continue;
      }
      snap(L.if, `grid${P(r, c)} = '1' e não visitado: achamos uma ilha nova!`, { cur: [r, c], read: [k], vars: { r, c, ilhas } });
      ilhas++;
      snap(L.cnt, `ilhas = ${ilhas}.`, { cur: [r, c], vars: { r, c, ilhas } });
      snap(L.call, `Chama dfs${P(r, c)} para marcar toda a ilha, assim ela não é contada de novo.`, { cur: [r, c], vars: { r, c, ilhas } });
      dfs(r, c);
      snap(L.call, `dfs${P(r, c)} voltou: a ilha ${ilhas} inteira está marcada com '#'.`, { cur: [r, c], vars: { r, c, ilhas } });
    }
  }
  snap(L.ret, `Resposta: ${ilhas} ilhas. ${calls} chamadas de dfs, profundidade máxima ${maxDepth}.`, { vars: { ilhas }, result: ilhas });
  return out;
}

function islandsBFS(rows = ISLAND_GRID) {
  const L = ISLAND_CODE.bfs.at, R = rows.length, C = rows[0].length;
  const g = rows.join('').split(''), out = [];
  let ilhas = 0, fila = [], head = 0, maxQueue = 0;
  const snap = (line, msg, s = {}) => out.push({ dp: g.slice(), queue: fila.map(([x, y]) => P(x, y)), head, maxQueue, read: [], write: [], ilhas, line, msg, ...s });

  snap(L.init, `Grade ${R}×${C} no heap. ilhas = 0.`, { vars: { ilhas } });
  for (let r = 0; r < R; r++) {
    snap(L.forr, `r = ${r}: varre a linha ${r}.`, { vars: { r, ilhas } });
    for (let c = 0; c < C; c++) {
      const k = r * C + c;
      snap(L.forc, `c = ${c}: olha ${P(r, c)}.`, { cur: [r, c], vars: { r, c, ilhas } });
      if (g[k] !== '1') {
        snap(L.if, `grid${P(r, c)} = '${g[k]}': ${g[k] === '#' ? 'já pertence a uma ilha contada' : 'água'}. continue.`, { cur: [r, c], read: [k], vars: { r, c, ilhas } });
        continue;
      }
      snap(L.if, `grid${P(r, c)} = '1' e não visitado: ilha nova!`, { cur: [r, c], read: [k], vars: { r, c, ilhas } });
      ilhas++;
      snap(L.cnt, `ilhas = ${ilhas}.`, { cur: [r, c], vars: { r, c, ilhas } });
      g[k] = '#'; fila = [[r, c]]; head = 0; maxQueue = Math.max(maxQueue, 1);
      snap(L.seed, `Marca ${P(r, c)} e cria a fila com ele. A BFS vai espalhar a partir daqui, camada por camada.`, { cur: [r, c], write: [k], pushed: true, vars: { r, c, ilhas } });
      for (;;) {
        const more = head < fila.length;
        snap(L.while, more ? `Fila com ${fila.length - head} item(ns): continua.` : `Fila vazia: a ilha ${ilhas} acabou.`, { vars: { r, c, ilhas } });
        if (!more) break;
        const [x, y] = fila[head++];
        snap(L.deq, `Desenfileira ${P(x, y)} (head avança para ${head}).`, { cur: [x, y], popped: true, vars: { x, y, ilhas } });
        for (const [dx, dy, nome] of DIRS) {
          snap(L.dir, `Direção ${nome}.`, { cur: [x, y], vars: { x, y, dir: nome, ilhas } });
          const nx = x + dx, ny = y + dy, nk = nx * C + ny, out_ = nx < 0 || ny < 0 || nx >= R || ny >= C;
          snap(L.nb, `Vizinho ${P(nx, ny)}.`, { cur: [x, y], nb: [nx, ny], vars: { x, y, nx, ny, ilhas } });
          if (out_ || g[nk] !== '1') {
            snap(L.chk, out_ ? `${P(nx, ny)} está fora da grade: continue.` : `grid${P(nx, ny)} = '${g[nk]}': ${g[nk] === '#' ? 'já marcado' : 'água'}. continue.`,
              { cur: [x, y], nb: out_ ? undefined : [nx, ny], read: out_ ? [] : [nk], vars: { x, y, nx, ny, ilhas } });
            continue;
          }
          snap(L.chk, `grid${P(nx, ny)} = '1': terra nova da mesma ilha.`, { cur: [x, y], nb: [nx, ny], read: [nk], vars: { x, y, nx, ny, ilhas } });
          g[nk] = '#'; fila.push([nx, ny]); maxQueue = Math.max(maxQueue, fila.length - head);
          snap(L.enq, `Marca ${P(nx, ny)} já ao enfileirar (senão ele entraria na fila duas vezes) e coloca no fim da fila.`,
            { cur: [x, y], nb: [nx, ny], write: [nk], pushed: true, vars: { x, y, nx, ny, ilhas } });
        }
      }
    }
  }
  snap(L.ret, `Resposta: ${ilhas} ilhas. A fila chegou a ter no máximo ${maxQueue} itens.`, { vars: { ilhas }, result: ilhas });
  return out;
}

if (typeof module !== 'undefined') module.exports = { ISLAND_GRID, ISLAND_CODE, DIRS, islandsDFS, islandsBFS };
