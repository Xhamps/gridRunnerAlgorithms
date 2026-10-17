// Find if Path Exists: one step per executed line, as a snapshot for the player.
// visto[] lives in the heap (s.dp). DFS keeps the path in the call stack; BFS keeps the frontier in a queue.
// Runs in the browser (globals) and in node (module.exports) for the test.
if (typeof module !== 'undefined') globalThis.listing ??= require('./trace.js').listing;

// pos = node coordinates in the 0..100 drawing box (only used by the page).
const PATH_GRAPH = {
  n: 9, origem: 0, destino: 8,
  edges: [[0, 1], [0, 2], [1, 3], [2, 3], [3, 4], [3, 5], [4, 5], [2, 6], [7, 8]],
  pos: [[5, 50], [28, 15], [28, 85], [52, 50], [76, 15], [76, 85], [5, 100], [100, 30], [100, 75]],
};

const PATH_CODE = {
  dfs: listing([
    ['adj', 'const adj = listaDeAdjacencia(n, edges)'],
    ['vis', 'const visto = Array(n).fill(false)'],
    ['fn', 'function dfs(u) {'],
    ['dst', '  if (u === destino) return true'],
    ['mark', '  visto[u] = true'],
    ['for', '  for (const v of adj[u])'],
    ['if', '    if (!visto[v] && dfs(v)) return true'],
    ['no', '  return false                  // nenhum vizinho chegou lá'],
    [null, '}'],
    ['call', 'return dfs(origem)'],
  ]),
  bfs: listing([
    ['adj', 'const adj = listaDeAdjacencia(n, edges)'],
    ['vis', 'const visto = Array(n).fill(false)'],
    ['seed', 'visto[origem] = true; const fila = [origem]; let head = 0'],
    ['while', 'while (head < fila.length) {'],
    ['deq', '  const u = fila[head++]'],
    ['dst', '  if (u === destino) return true'],
    ['for', '  for (const v of adj[u])'],
    ['if', '    if (!visto[v]) {'],
    ['enq', '      visto[v] = true; fila.push(v)   // marca AO ENFILEIRAR'],
    [null, '    }'],
    [null, '}'],
    ['no', 'return false                    // a fila esvaziou sem achar'],
  ]),
};

const adjOf = (n, edges) => {
  const adj = Array.from({ length: n }, () => []);
  for (const [a, b] of edges) { adj[a].push(b); adj[b].push(a); }
  return adj;
};
const adjText = (adj) => adj.map((l, u) => `${u}:[${l}]`).join(' ');

function pathDFS({ n, edges, origem, destino } = PATH_GRAPH) {
  const L = PATH_CODE.dfs.at, adj = adjOf(n, edges), visto = new Array(n).fill(null), stack = [], out = [];
  let calls = 0, maxDepth = 0;
  const snap = (line, msg, s = {}) => out.push({ dp: visto.slice(), stack: stack.map((f) => ({ ...f })), read: [], write: [], calls, maxDepth, line, msg, ...s });

  const dfs = (u) => {
    const fr = { call: `dfs(${u})`, note: '' };
    stack.push(fr); calls++; maxDepth = Math.max(maxDepth, stack.length);
    snap(L.fn, `Entra em dfs(${u}): empilha um frame (profundidade ${stack.length}).`, { cur: u, vars: { u, destino } });
    if (u === destino) {
      fr.note = 'achou!';
      snap(L.dst, `${u} é o destino: retorna true.`, { cur: u, vars: { u, destino } });
      stack.pop(); return true;
    }
    snap(L.dst, `${u} ≠ ${destino}: ainda não chegou.`, { cur: u, vars: { u, destino } });
    visto[u] = true;
    snap(L.mark, `Marca visto[${u}] = true antes de descer, para não voltar a ${u} num ciclo.`, { cur: u, write: [u], vars: { u, destino } });
    for (const v of adj[u]) {
      snap(L.for, `Próximo vizinho de ${u}: ${v}. (adj[${u}] = [${adj[u]}])`, { cur: u, nb: v, vars: { u, v, destino } });
      if (visto[v]) {
        snap(L.if, `visto[${v}] = true: já visitado, pula.`, { cur: u, nb: v, read: [v], vars: { u, v, destino } });
        continue;
      }
      fr.note = `→ ${v}`;
      snap(L.if, `visto[${v}] = false: chama dfs(${v}) e desce mais um nível.`, { cur: u, nb: v, read: [v], vars: { u, v, destino } });
      const found = dfs(v);
      snap(L.if, `dfs(${v}) voltou ${found}.${found ? ' Achou: propaga true para cima.' : ' Por ali não chega, tenta o próximo vizinho.'}`, { cur: u, nb: v, vars: { u, v, destino } });
      if (found) { stack.pop(); return true; }
    }
    fr.note = 'beco sem saída';
    snap(L.no, `Nenhum vizinho de ${u} leva ao destino: retorna false e desempilha.`, { cur: u, vars: { u, destino } });
    stack.pop(); return false;
  };

  snap(L.adj, `Monta a lista de adjacência: ${adjText(adj)}. Cada aresta aparece nas duas pontas.`, { vars: { origem, destino } });
  visto.fill(false);
  snap(L.vis, `visto[] com ${n} posições, tudo false.`, { write: [...visto.keys()], vars: { origem, destino } });
  snap(L.call, `Chama dfs(${origem}).`, { cur: origem, vars: { origem, destino } });
  const ans = dfs(origem);
  snap(L.call, `dfs(${origem}) = ${ans}. ${ans ? 'Existe caminho.' : `Toda a componente de ${origem} foi explorada e o ${destino} não está nela.`} ${calls} chamadas.`,
    { vars: { origem, destino }, result: ans });
  return out;
}

function pathBFS({ n, edges, origem, destino } = PATH_GRAPH) {
  const L = PATH_CODE.bfs.at, adj = adjOf(n, edges), visto = new Array(n).fill(null), out = [];
  const fila = []; let head = 0, maxQueue = 0;
  const snap = (line, msg, s = {}) => out.push({ dp: visto.slice(), queue: fila.slice(), head, maxQueue, read: [], write: [], line, msg, ...s });

  snap(L.adj, `Monta a lista de adjacência: ${adjText(adj)}. Cada aresta aparece nas duas pontas.`, { vars: { origem, destino } });
  visto.fill(false);
  snap(L.vis, `visto[] com ${n} posições, tudo false.`, { write: [...visto.keys()], vars: { origem, destino } });
  visto[origem] = true; fila.push(origem); maxQueue = 1;
  snap(L.seed, `Marca a origem ${origem} e coloca na fila.`, { cur: origem, write: [origem], pushed: true, vars: { origem, destino } });
  for (;;) {
    const more = head < fila.length;
    snap(L.while, more ? `Fila com ${fila.length - head} nó(s): continua.` : 'Fila vazia.', { vars: { origem, destino } });
    if (!more) break;
    const u = fila[head++];
    snap(L.deq, `Desenfileira ${u}. A BFS visita os nós em ordem de distância até a origem.`, { cur: u, popped: true, vars: { u, destino } });
    if (u === destino) {
      snap(L.dst, `${u} é o destino: retorna true.`, { cur: u, vars: { u, destino }, result: true });
      return out;
    }
    snap(L.dst, `${u} ≠ ${destino}.`, { cur: u, vars: { u, destino } });
    for (const v of adj[u]) {
      snap(L.for, `Próximo vizinho de ${u}: ${v}. (adj[${u}] = [${adj[u]}])`, { cur: u, nb: v, vars: { u, v, destino } });
      if (visto[v]) {
        snap(L.if, `visto[${v}] = true: já está ou já passou pela fila. Pula.`, { cur: u, nb: v, read: [v], vars: { u, v, destino } });
        continue;
      }
      snap(L.if, `visto[${v}] = false: nó novo.`, { cur: u, nb: v, read: [v], vars: { u, v, destino } });
      visto[v] = true; fila.push(v); maxQueue = Math.max(maxQueue, fila.length - head);
      snap(L.enq, `Marca visto[${v}] e enfileira ${v}.`, { cur: u, nb: v, write: [v], pushed: true, vars: { u, v, destino } });
    }
  }
  snap(L.no, `A fila esvaziou: toda a componente de ${origem} foi visitada e o ${destino} não apareceu. Retorna false.`, { vars: { origem, destino }, result: false });
  return out;
}

if (typeof module !== 'undefined') module.exports = { PATH_GRAPH, PATH_CODE, pathDFS, pathBFS };
