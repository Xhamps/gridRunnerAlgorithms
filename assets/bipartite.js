// Is Graph Bipartite: one step per executed line, as a snapshot for the player.
// cor[] lives in the heap (s.dp): -1 = sem cor, 0 / 1 = os dois grupos. s.bad = the conflicting edge, when found.
// DFS keeps the path in the call stack; BFS keeps the frontier in a queue.
// Runs in the browser (globals) and in node (module.exports) for the test.
if (typeof module !== 'undefined') globalThis.listing ??= require('./trace.js').listing;

// Square 0-1-2-3 (+4) is bipartite; the triangle 5-6-7 is an odd cycle. pos = drawing coordinates (0..100 box).
const BIP_GRAPH = {
  graph: [[1, 3], [0, 2], [1, 3, 4], [2, 0], [2], [6, 7], [5, 7], [5, 6]],
  pos: [[5, 15], [40, 15], [40, 55], [5, 55], [40, 95], [72, 15], [100, 55], [68, 85]],
};

const BIP_CODE = {
  dfs: listing([
    ['alloc', 'const cor = Array(n).fill(-1); let ok = true     // -1 = sem cor'],
    ['fn', 'function dfs(u, c) {'],
    ['paint', '  cor[u] = c'],
    ['for', '  for (const v of graph[u]) {'],
    ['same', '    if (cor[v] === c) return false        // vizinho com a MESMA cor: conflito'],
    ['rec', '    if (cor[v] === -1 && !dfs(v, 1 - c)) return false'],
    [null, '  }'],
    ['ok', '  return true'],
    [null, '}'],
    ['fors', 'for (let s = 0; s < n && ok; s++)          // o grafo pode ter várias partes'],
    ['start', '  if (cor[s] === -1) ok = dfs(s, 0)'],
    ['ret', 'return ok'],
  ]),
  bfs: listing([
    ['alloc', 'const cor = Array(n).fill(-1); let ok = true     // -1 = sem cor'],
    ['fors', 'for (let s = 0; s < n && ok; s++) {        // o grafo pode ter várias partes'],
    ['skip', '  if (cor[s] !== -1) continue              // já pintado por uma busca anterior'],
    ['seed', '  cor[s] = 0; const fila = [s]; let head = 0'],
    ['while', '  while (ok && head < fila.length) {'],
    ['deq', '    const u = fila[head++]'],
    ['for', '    for (const v of graph[u]) {'],
    ['same', '      if (cor[v] === cor[u]) { ok = false; break }   // conflito'],
    ['new', '      if (cor[v] === -1) { cor[v] = 1 - cor[u]; fila.push(v) }'],
    [null, '    }'],
    [null, '  }'],
    [null, '}'],
    ['ret', 'return ok'],
  ]),
};

const COR = ['ciano (0)', 'rosa (1)'];

function bipDFS({ graph } = BIP_GRAPH) {
  const L = BIP_CODE.dfs.at, n = graph.length, cor = new Array(n).fill(null), stack = [], out = [];
  let calls = 0, maxDepth = 0, ok = true, bad;
  const snap = (line, msg, s = {}) => out.push({ dp: cor.slice(), stack: stack.map((f) => ({ ...f })), read: [], write: [], calls, maxDepth, bad, line, msg, ...s });

  const dfs = (u, c) => {
    const fr = { call: `dfs(${u}, ${c})`, note: '' };
    stack.push(fr); calls++; maxDepth = Math.max(maxDepth, stack.length);
    snap(L.fn, `Entra em dfs(${u}, ${c}): empilha um frame (profundidade ${stack.length}).`, { cur: u, vars: { u, c } });
    cor[u] = c;
    snap(L.paint, `Pinta ${u} de ${COR[c]}.`, { cur: u, write: [u], vars: { u, c } });
    for (const v of graph[u]) {
      snap(L.for, `Próximo vizinho de ${u}: ${v}. (graph[${u}] = [${graph[u]}])`, { cur: u, nb: v, vars: { u, c, v } });
      if (cor[v] === c) {
        bad = [u, v]; fr.note = 'conflito!';
        snap(L.same, `cor[${v}] = ${c}, a mesma de ${u}: a aresta ${u}–${v} liga dois nós do mesmo grupo. Há um ciclo ímpar: retorna false.`,
          { cur: u, nb: v, read: [v], vars: { u, c, v } });
        stack.pop(); return false;
      }
      snap(L.same, `cor[${v}] = ${cor[v]} ≠ ${c}: sem conflito.`, { cur: u, nb: v, read: [v], vars: { u, c, v } });
      if (cor[v] !== -1) {
        snap(L.rec, `${v} já tem a cor oposta: nada a fazer.`, { cur: u, nb: v, read: [v], vars: { u, c, v } });
        continue;
      }
      fr.note = `→ ${v}`;
      snap(L.rec, `${v} sem cor: chama dfs(${v}, ${1 - c}) para pintá-lo com a cor oposta.`, { cur: u, nb: v, read: [v], vars: { u, c, v } });
      const r = dfs(v, 1 - c);
      snap(L.rec, `dfs(${v}, ${1 - c}) voltou ${r}.${r ? '' : ' Conflito lá embaixo: propaga false.'}`, { cur: u, nb: v, vars: { u, c, v } });
      if (!r) { stack.pop(); return false; }
    }
    fr.note = 'ok';
    snap(L.ok, `Todos os vizinhos de ${u} têm a cor oposta: retorna true e desempilha.`, { cur: u, vars: { u, c } });
    stack.pop(); return true;
  };

  cor.fill(-1);
  snap(L.alloc, `cor[] com ${n} posições, todas -1 (sem cor). ok = true.`, { write: [...cor.keys()], vars: { ok } });
  for (let s = 0; ; s++) {
    const go = s < n && ok;
    snap(L.fors, go ? `s = ${s}.` : s < n ? 'ok = false: para o laço.' : 'Todos os nós foram vistos.', { vars: { s, ok } });
    if (!go) break;
    if (cor[s] !== -1) {
      snap(L.start, `cor[${s}] = ${cor[s]}: ${s} já foi pintado por uma busca anterior.`, { cur: s, read: [s], vars: { s, ok } });
      continue;
    }
    snap(L.start, `${s} sem cor: começa uma parte nova do grafo. Chama dfs(${s}, 0).`, { cur: s, read: [s], vars: { s, ok } });
    ok = dfs(s, 0);
    snap(L.start, `dfs(${s}, 0) voltou ${ok}. ok = ${ok}.`, { cur: s, vars: { s, ok } });
  }
  snap(L.ret, ok ? 'Retorna true: dá para separar os nós em dois grupos.' : `Retorna false: a aresta ${bad[0]}–${bad[1]} fecha um ciclo ímpar.`, { vars: { ok }, result: ok });
  return out;
}

function bipBFS({ graph } = BIP_GRAPH) {
  const L = BIP_CODE.bfs.at, n = graph.length, cor = new Array(n).fill(null), out = [];
  let fila = [], head = 0, maxQueue = 0, ok = true, bad;
  const snap = (line, msg, s = {}) => out.push({ dp: cor.slice(), queue: fila.slice(), head, maxQueue, read: [], write: [], bad, line, msg, ...s });

  cor.fill(-1);
  snap(L.alloc, `cor[] com ${n} posições, todas -1 (sem cor). ok = true.`, { write: [...cor.keys()], vars: { ok } });
  for (let s = 0; ; s++) {
    const go = s < n && ok;
    snap(L.fors, go ? `s = ${s}.` : s < n ? 'ok = false: para o laço.' : 'Todos os nós foram vistos.', { vars: { s, ok } });
    if (!go) break;
    if (cor[s] !== -1) {
      snap(L.skip, `cor[${s}] = ${cor[s]}: já pintado. continue.`, { cur: s, read: [s], vars: { s, ok } });
      continue;
    }
    snap(L.skip, `${s} sem cor: começa uma parte nova do grafo.`, { cur: s, read: [s], vars: { s, ok } });
    cor[s] = 0; fila = [s]; head = 0; maxQueue = Math.max(maxQueue, 1);
    snap(L.seed, `Pinta ${s} de ${COR[0]} e cria a fila com ele.`, { cur: s, write: [s], pushed: true, vars: { s, ok } });
    for (;;) {
      const more = ok && head < fila.length;
      snap(L.while, !ok ? 'ok = false: sai do while.' : more ? `Fila com ${fila.length - head} nó(s): continua.` : 'Fila vazia: esta parte está pintada sem conflitos.', { vars: { s, ok } });
      if (!more) break;
      const u = fila[head++];
      snap(L.deq, `Desenfileira ${u} (${COR[cor[u]]}).`, { cur: u, popped: true, vars: { u, 'cor[u]': cor[u], ok } });
      for (const v of graph[u]) {
        snap(L.for, `Próximo vizinho de ${u}: ${v}. (graph[${u}] = [${graph[u]}])`, { cur: u, nb: v, vars: { u, v, 'cor[u]': cor[u], ok } });
        if (cor[v] === cor[u]) {
          ok = false; bad = [u, v];
          snap(L.same, `cor[${v}] = ${cor[v]}, a mesma de ${u}: a aresta ${u}–${v} liga dois nós do mesmo grupo. ok = false, break.`,
            { cur: u, nb: v, read: [u, v], vars: { u, v, 'cor[u]': cor[u], ok } });
          break;
        }
        snap(L.same, `cor[${v}] = ${cor[v]} ≠ ${cor[u]}: sem conflito.`, { cur: u, nb: v, read: [u, v], vars: { u, v, 'cor[u]': cor[u], ok } });
        if (cor[v] !== -1) {
          snap(L.new, `${v} já tem a cor oposta: nada a fazer.`, { cur: u, nb: v, read: [v], vars: { u, v, 'cor[u]': cor[u], ok } });
          continue;
        }
        cor[v] = 1 - cor[u]; fila.push(v); maxQueue = Math.max(maxQueue, fila.length - head);
        snap(L.new, `${v} sem cor: pinta de ${COR[cor[v]]} (oposta a ${u}) e enfileira.`, { cur: u, nb: v, write: [v], pushed: true, vars: { u, v, 'cor[u]': cor[u], ok } });
      }
    }
  }
  snap(L.ret, ok ? 'Retorna true: dá para separar os nós em dois grupos.' : `Retorna false: a aresta ${bad[0]}–${bad[1]} fecha um ciclo ímpar.`, { vars: { ok }, result: ok });
  return out;
}

if (typeof module !== 'undefined') module.exports = { BIP_GRAPH, BIP_CODE, bipDFS, bipBFS };
