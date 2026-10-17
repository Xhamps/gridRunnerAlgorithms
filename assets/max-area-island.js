// Max Area of Island: one step per executed line, as a snapshot for the player.
// The grid lives in the heap (s.dp, row-major) and is marked in place: '1' land, '0' water, '#' visited.
// DFS returns each island's area up the call stack; BFS counts cells as they leave the queue.
// Runs in the browser (globals) and in node (module.exports) for the test.
if (typeof module !== 'undefined') globalThis.listing ??= require('./trace.js').listing;

const AREA_GRID = [
  '1100',
  '1011',
  '0011',
];

const AREA_DIRS = [[1, 0, 'baixo'], [-1, 0, 'cima'], [0, 1, 'direita'], [0, -1, 'esquerda']];

const AREA_CODE = {
  dfs: listing([
    ['fn', 'function dfs(r, c) {'],
    ['out', '  if (r < 0 || c < 0 || r >= R || c >= C) return 0   // fora da grade'],
    ['wat', "  if (grid[r][c] !== '1') return 0                  // água ou já visitado"],
    ['mark', "  grid[r][c] = '#'                                  // marca: visitado"],
    ['area', '  let area = 1                                      // a própria célula'],
    ['rec', '  for (const [dr, dc] of DIRS) area += dfs(r + dr, c + dc)'],
    ['retd', '  return area'],
    [null, '}'],
    ['init', 'let melhor = 0'],
    ['forr', 'for (let r = 0; r < R; r++)'],
    ['forc', '  for (let c = 0; c < C; c++)'],
    ['if', "    if (grid[r][c] === '1')"],
    ['call', '      melhor = max(melhor, dfs(r, c))   // área da ilha inteira'],
    ['ret', 'return melhor'],
  ]),
  bfs: listing([
    ['init', 'let melhor = 0'],
    ['forr', 'for (let r = 0; r < R; r++)'],
    ['forc', '  for (let c = 0; c < C; c++) {'],
    ['if', "    if (grid[r][c] !== '1') continue"],
    ['seed', "    grid[r][c] = '#'; const fila = [[r, c]]; let head = 0, area = 0"],
    ['while', '    while (head < fila.length) {'],
    ['deq', '      const [x, y] = fila[head++]; area++     // conta ao desenfileirar'],
    ['dir', '      for (const [dx, dy] of DIRS) {'],
    ['nb', '        const nx = x + dx, ny = y + dy'],
    ['chk', "        if (fora(nx, ny) || grid[nx][ny] !== '1') continue"],
    ['enq', "        grid[nx][ny] = '#'; fila.push([nx, ny])   // marca AO ENFILEIRAR"],
    [null, '      }'],
    [null, '    }'],
    ['best', '    melhor = max(melhor, area)'],
    [null, '  }'],
    ['ret', 'return melhor'],
  ]),
};

const AP = (r, c) => `(${r},${c})`;

function areaDFS(rows = AREA_GRID) {
  const L = AREA_CODE.dfs.at, R = rows.length, C = rows[0].length;
  const g = rows.join('').split(''), stack = [], out = [];
  let melhor = 0, calls = 0, maxDepth = 0;
  const snap = (line, msg, s = {}) => out.push({ dp: g.slice(), stack: stack.map((f) => ({ ...f })), read: [], write: [], calls, maxDepth, line, msg, ...s });

  const dfs = (r, c) => {
    const fr = { call: `dfs${AP(r, c)}`, note: '' };
    stack.push(fr); calls++; maxDepth = Math.max(maxDepth, stack.length);
    const v = { r, c, melhor };
    snap(L.fn, `Entra em dfs${AP(r, c)}: empilha um frame (profundidade ${stack.length}).`, { cur: [r, c], vars: v });
    if (r < 0 || c < 0 || r >= R || c >= C) {
      fr.note = 'ret 0';
      snap(L.out, `${AP(r, c)} está fora da grade: retorna 0.`, { vars: v });
      stack.pop(); return 0;
    }
    snap(L.out, `${AP(r, c)} está dentro da grade.`, { cur: [r, c], vars: v });
    const k = r * C + c;
    if (g[k] !== '1') {
      fr.note = 'ret 0';
      snap(L.wat, `grid${AP(r, c)} = '${g[k]}': ${g[k] === '#' ? 'já foi contado' : 'é água'}. Retorna 0.`, { cur: [r, c], read: [k], vars: v });
      stack.pop(); return 0;
    }
    snap(L.wat, `grid${AP(r, c)} = '1': terra ainda não contada.`, { cur: [r, c], read: [k], vars: v });
    g[k] = '#';
    snap(L.mark, `Marca grid${AP(r, c)} = '#', para não somar esta célula duas vezes.`, { cur: [r, c], write: [k], vars: v });
    let area = 1;
    fr.note = 'area=1';
    snap(L.area, 'area = 1: esta célula. Os vizinhos somam o resto.', { cur: [r, c], vars: { ...v, area } });
    for (const [dr, dc, nome] of AREA_DIRS) {
      snap(L.rec, `Vizinho de ${nome}: chama dfs${AP(r + dr, c + dc)}.`, { cur: [r, c], nb: [r + dr, c + dc], vars: { ...v, area, dir: nome } });
      const a = dfs(r + dr, c + dc);
      area += a; fr.note = `area=${area}`;
      snap(L.rec, `dfs${AP(r + dr, c + dc)} voltou ${a} → area = ${area - a} + ${a} = ${area}.`, { cur: [r, c], vars: { ...v, area, dir: nome } });
    }
    fr.note = `ret ${area}`;
    snap(L.retd, `Retorna area = ${area} para quem chamou e desempilha.`, { cur: [r, c], vars: { ...v, area } });
    stack.pop(); return area;
  };

  snap(L.init, `Grade ${R}×${C} no heap. melhor = 0.`, { vars: { melhor } });
  for (let r = 0; r < R; r++) {
    snap(L.forr, `r = ${r}: varre a linha ${r}.`, { vars: { r, melhor } });
    for (let c = 0; c < C; c++) {
      const k = r * C + c;
      snap(L.forc, `c = ${c}: olha ${AP(r, c)}.`, { cur: [r, c], vars: { r, c, melhor } });
      if (g[k] !== '1') {
        snap(L.if, `grid${AP(r, c)} = '${g[k]}': ${g[k] === '#' ? 'já pertence a uma ilha medida' : 'água'}. Segue.`, { cur: [r, c], read: [k], vars: { r, c, melhor } });
        continue;
      }
      snap(L.if, `grid${AP(r, c)} = '1': ilha nova, vamos medir.`, { cur: [r, c], read: [k], vars: { r, c, melhor } });
      snap(L.call, `Chama dfs${AP(r, c)}: ela devolve a área da ilha inteira.`, { cur: [r, c], vars: { r, c, melhor } });
      const a = dfs(r, c), old = melhor;
      melhor = Math.max(melhor, a);
      snap(L.call, `dfs${AP(r, c)} voltou ${a} → melhor = max(${old}, ${a}) = ${melhor}.`, { cur: [r, c], vars: { r, c, area: a, melhor } });
    }
  }
  snap(L.ret, `Resposta: a maior ilha tem área ${melhor}. ${calls} chamadas de dfs, profundidade máxima ${maxDepth}.`, { vars: { melhor }, result: melhor });
  return out;
}

function areaBFS(rows = AREA_GRID) {
  const L = AREA_CODE.bfs.at, R = rows.length, C = rows[0].length;
  const g = rows.join('').split(''), out = [];
  let melhor = 0, fila = [], head = 0, maxQueue = 0;
  const snap = (line, msg, s = {}) => out.push({ dp: g.slice(), queue: fila.map(([x, y]) => AP(x, y)), head, maxQueue, read: [], write: [], line, msg, ...s });

  snap(L.init, `Grade ${R}×${C} no heap. melhor = 0.`, { vars: { melhor } });
  for (let r = 0; r < R; r++) {
    snap(L.forr, `r = ${r}: varre a linha ${r}.`, { vars: { r, melhor } });
    for (let c = 0; c < C; c++) {
      const k = r * C + c;
      snap(L.forc, `c = ${c}: olha ${AP(r, c)}.`, { cur: [r, c], vars: { r, c, melhor } });
      if (g[k] !== '1') {
        snap(L.if, `grid${AP(r, c)} = '${g[k]}': ${g[k] === '#' ? 'já pertence a uma ilha medida' : 'água'}. continue.`, { cur: [r, c], read: [k], vars: { r, c, melhor } });
        continue;
      }
      snap(L.if, `grid${AP(r, c)} = '1': ilha nova, vamos medir.`, { cur: [r, c], read: [k], vars: { r, c, melhor } });
      let area = 0;
      g[k] = '#'; fila = [[r, c]]; head = 0; maxQueue = Math.max(maxQueue, 1);
      snap(L.seed, `Marca ${AP(r, c)}, cria a fila com ele e zera area.`, { cur: [r, c], write: [k], pushed: true, vars: { r, c, area, melhor } });
      for (;;) {
        const more = head < fila.length;
        snap(L.while, more ? `Fila com ${fila.length - head} item(ns): continua.` : `Fila vazia: a ilha tem área ${area}.`, { vars: { r, c, area, melhor } });
        if (!more) break;
        const [x, y] = fila[head++];
        area++;
        snap(L.deq, `Desenfileira ${AP(x, y)} e conta: area = ${area}. Cada célula sai da fila uma única vez.`, { cur: [x, y], popped: true, vars: { x, y, area, melhor } });
        for (const [dx, dy, nome] of AREA_DIRS) {
          snap(L.dir, `Direção ${nome}.`, { cur: [x, y], vars: { x, y, dir: nome, area, melhor } });
          const nx = x + dx, ny = y + dy, nk = nx * C + ny, fora = nx < 0 || ny < 0 || nx >= R || ny >= C;
          snap(L.nb, `Vizinho ${AP(nx, ny)}.`, { cur: [x, y], nb: [nx, ny], vars: { x, y, nx, ny, area, melhor } });
          if (fora || g[nk] !== '1') {
            snap(L.chk, fora ? `${AP(nx, ny)} está fora da grade: continue.` : `grid${AP(nx, ny)} = '${g[nk]}': ${g[nk] === '#' ? 'já marcado' : 'água'}. continue.`,
              { cur: [x, y], nb: fora ? undefined : [nx, ny], read: fora ? [] : [nk], vars: { x, y, nx, ny, area, melhor } });
            continue;
          }
          snap(L.chk, `grid${AP(nx, ny)} = '1': terra nova da mesma ilha.`, { cur: [x, y], nb: [nx, ny], read: [nk], vars: { x, y, nx, ny, area, melhor } });
          g[nk] = '#'; fila.push([nx, ny]); maxQueue = Math.max(maxQueue, fila.length - head);
          snap(L.enq, `Marca ${AP(nx, ny)} já ao enfileirar e coloca no fim da fila.`,
            { cur: [x, y], nb: [nx, ny], write: [nk], pushed: true, vars: { x, y, nx, ny, area, melhor } });
        }
      }
      const old = melhor;
      melhor = Math.max(melhor, area);
      snap(L.best, `melhor = max(${old}, ${area}) = ${melhor}.`, { vars: { r, c, area, melhor } });
    }
  }
  snap(L.ret, `Resposta: a maior ilha tem área ${melhor}. A fila chegou a ter no máximo ${maxQueue} itens.`, { vars: { melhor }, result: melhor });
  return out;
}

if (typeof module !== 'undefined') module.exports = { AREA_GRID, AREA_CODE, areaDFS, areaBFS };
