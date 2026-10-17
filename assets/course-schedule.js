// Course Schedule: one step per executed line, as a snapshot for the player.
// prerequisite [a, b] = "b antes de a" = edge b → a. Possible to finish everything ⇔ the graph has no cycle.
// DFS: estado[] in the heap (0 novo · 1 visitando · 2 concluído); an edge to a node in state 1 closes a cycle.
// BFS (Kahn): grau[] in the heap; the queue holds courses with no pending prerequisite.
// Runs in the browser (globals) and in node (module.exports) for the test.
if (typeof module !== 'undefined') globalThis.listing ??= require('./trace.js').listing;

// 0 → 1 → 2 and 0 → 2 can be finished; 3 → 4 → 5 → 3 is a cycle. pos = drawing coordinates (0..100 box).
const COURSE_GRAPH = {
  n: 6,
  pre: [[1, 0], [2, 1], [2, 0], [4, 3], [5, 4], [3, 5]],
  pos: [[5, 20], [40, 5], [40, 55], [65, 20], [100, 20], [82, 75]],
};

const COURSE_CODE = {
  dfs: listing([
    ['adj', 'const adj = listaDeAdjacencia(n, pre)        // [a, b] vira b → a'],
    ['alloc', 'const estado = Array(n).fill(0)   // 0 novo · 1 visitando · 2 concluído'],
    ['fn', 'function temCiclo(u) {'],
    ['back', '  if (estado[u] === 1) return true     // u ainda está na pilha: ciclo!'],
    ['done', '  if (estado[u] === 2) return false    // já resolvido antes'],
    ['enter', '  estado[u] = 1                        // entra na pilha'],
    ['for', '  for (const v of adj[u])'],
    ['rec', '    if (temCiclo(v)) return true'],
    ['leave', '  estado[u] = 2                        // sai da pilha: concluído'],
    ['no', '  return false'],
    [null, '}'],
    ['init', 'let ok = true'],
    ['fors', 'for (let u = 0; u < n && ok; u++)'],
    ['start', '  if (temCiclo(u)) ok = false'],
    ['ret', 'return ok'],
  ]),
  bfs: listing([
    ['adj', 'const adj = listaDeAdjacencia(n, pre)        // [a, b] vira b → a'],
    ['alloc', 'const grau = Array(n).fill(0)                // pré-requisitos pendentes'],
    ['deg', 'for (const [a] of pre) grau[a]++'],
    ['seed', 'const fila = []; let head = 0'],
    ['fors', 'for (let u = 0; u < n; u++)'],
    ['zero', '  if (grau[u] === 0) fila.push(u)            // sem pré-requisitos'],
    ['while', 'while (head < fila.length) {'],
    ['deq', '  const u = fila[head++]                     // cursa u'],
    ['for', '  for (const v of adj[u])'],
    ['dec', '    if (--grau[v] === 0) fila.push(v)        // liberou v'],
    [null, '}'],
    ['ret', 'return head === n                           // cursou todos?'],
  ]),
};

const adjOf = (n, pre) => {
  const adj = Array.from({ length: n }, () => []);
  for (const [a, b] of pre) adj[b].push(a);
  return adj;
};
const adjText = (adj) => adj.map((l, u) => `${u}→[${l}]`).join(' ');
const EST = ['novo', 'visitando', 'concluído'];

function courseDFS({ n, pre } = COURSE_GRAPH) {
  const L = COURSE_CODE.dfs.at, adj = adjOf(n, pre), estado = new Array(n).fill(null), stack = [], out = [];
  let calls = 0, maxDepth = 0, ok = true, bad;
  const snap = (line, msg, s = {}) => out.push({ dp: estado.slice(), stack: stack.map((f) => ({ ...f })), read: [], write: [], calls, maxDepth, bad, line, msg, ...s });

  const temCiclo = (u, from) => {
    const fr = { call: `temCiclo(${u})`, note: '' };
    stack.push(fr); calls++; maxDepth = Math.max(maxDepth, stack.length);
    snap(L.fn, `Entra em temCiclo(${u}): empilha um frame (profundidade ${stack.length}).`, { cur: u, vars: { u, 'estado[u]': EST[estado[u]] } });
    if (estado[u] === 1) {
      bad = [from, u]; fr.note = 'ciclo!';
      snap(L.back, `estado[${u}] = 1: ${u} ainda está na pilha, então a aresta ${from} → ${u} volta para trás. Ciclo: retorna true.`,
        { cur: u, read: [u], vars: { u, 'estado[u]': EST[1] } });
      stack.pop(); return true;
    }
    snap(L.back, `estado[${u}] = ${estado[u]}: ${u} não está na pilha.`, { cur: u, read: [u], vars: { u, 'estado[u]': EST[estado[u]] } });
    if (estado[u] === 2) {
      fr.note = 'já concluído';
      snap(L.done, `estado[${u}] = 2: ${u} já foi resolvido sem ciclo. Retorna false sem explorar de novo.`, { cur: u, read: [u], vars: { u, 'estado[u]': EST[2] } });
      stack.pop(); return false;
    }
    snap(L.done, `estado[${u}] = 0: ${u} é novo.`, { cur: u, read: [u], vars: { u, 'estado[u]': EST[0] } });
    estado[u] = 1;
    snap(L.enter, `estado[${u}] = 1: ${u} entra no caminho atual.`, { cur: u, write: [u], vars: { u, 'estado[u]': EST[1] } });
    for (const v of adj[u]) {
      snap(L.for, `Próxima matéria liberada por ${u}: ${v}. (adj[${u}] = [${adj[u]}])`, { cur: u, nb: v, vars: { u, v } });
      fr.note = `→ ${v}`;
      snap(L.rec, `Chama temCiclo(${v}).`, { cur: u, nb: v, vars: { u, v } });
      const r = temCiclo(v, u);
      snap(L.rec, `temCiclo(${v}) voltou ${r}.${r ? ' Propaga o ciclo para cima.' : ''}`, { cur: u, nb: v, vars: { u, v } });
      if (r) { stack.pop(); return true; }
    }
    estado[u] = 2;
    snap(L.leave, `Tudo que depende de ${u} foi explorado sem ciclo: estado[${u}] = 2.`, { cur: u, write: [u], vars: { u, 'estado[u]': EST[2] } });
    fr.note = 'sem ciclo';
    snap(L.no, `Retorna false e desempilha.`, { cur: u, vars: { u } });
    stack.pop(); return false;
  };

  snap(L.adj, `Lista de adjacência (b → a): ${adjText(adj)}.`, { vars: { n } });
  estado.fill(0);
  snap(L.alloc, `estado[] com ${n} posições, todas 0 (novo).`, { write: [...estado.keys()], vars: { n } });
  snap(L.init, 'ok = true.', { vars: { ok } });
  for (let u = 0; ; u++) {
    const go = u < n && ok;
    snap(L.fors, go ? `u = ${u}.` : u < n ? 'ok = false: para o laço.' : 'Todas as matérias foram vistas.', { vars: { u, ok } });
    if (!go) break;
    snap(L.start, `Chama temCiclo(${u}).`, { cur: u, vars: { u, ok } });
    if (temCiclo(u)) ok = false;
    snap(L.start, `temCiclo(${u}) voltou ${!ok}.${ok ? '' : ' ok = false.'}`, { cur: u, vars: { u, ok } });
  }
  snap(L.ret, ok ? 'Retorna true: sem ciclos, dá para cursar tudo.' : `Retorna false: ${bad[0]} → ${bad[1]} fecha um ciclo, e nenhuma matéria do ciclo pode ser a primeira.`,
    { vars: { ok }, result: ok });
  return out;
}

function courseBFS({ n, pre } = COURSE_GRAPH) {
  const L = COURSE_CODE.bfs.at, adj = adjOf(n, pre), grau = new Array(n).fill(null), out = [];
  const fila = []; let head = 0, maxQueue = 0;
  const snap = (line, msg, s = {}) => out.push({ dp: grau.slice(), queue: fila.slice(), head, maxQueue, read: [], write: [], line, msg, ...s });
  const push = (u) => { fila.push(u); maxQueue = Math.max(maxQueue, fila.length - head); };

  snap(L.adj, `Lista de adjacência (b → a): ${adjText(adj)}.`, { vars: { n } });
  grau.fill(0);
  snap(L.alloc, `grau[] com ${n} posições, todas 0.`, { write: [...grau.keys()], vars: { n } });
  for (const [a, b] of pre) {
    grau[a]++;
    snap(L.deg, `[${a}, ${b}]: ${a} depende de ${b}. grau[${a}] = ${grau[a]}.`, { cur: a, nb: b, write: [a], vars: { a, b, 'grau[a]': grau[a] } });
  }
  snap(L.seed, 'Fila vazia, head = 0.', { vars: { head } });
  for (let u = 0; u < n; u++) {
    snap(L.fors, `u = ${u}.`, { cur: u, vars: { u } });
    if (grau[u] === 0) {
      push(u);
      snap(L.zero, `grau[${u}] = 0: ${u} não tem pré-requisito, já pode ser cursada. Enfileira.`, { cur: u, read: [u], pushed: true, vars: { u } });
    } else {
      snap(L.zero, `grau[${u}] = ${grau[u]}: ainda falta pré-requisito.`, { cur: u, read: [u], vars: { u } });
    }
  }
  for (;;) {
    const more = head < fila.length;
    snap(L.while, more ? `Fila com ${fila.length - head} matéria(s) liberada(s).` : 'Fila vazia: nada mais foi liberado.', { vars: { head } });
    if (!more) break;
    const u = fila[head++];
    snap(L.deq, `Cursa ${u}. Já cursadas: ${head}.`, { cur: u, popped: true, vars: { u, head } });
    for (const v of adj[u]) {
      snap(L.for, `${v} depende de ${u}. (adj[${u}] = [${adj[u]}])`, { cur: u, nb: v, vars: { u, v, head } });
      grau[v]--;
      if (grau[v] === 0) {
        push(v);
        snap(L.dec, `grau[${v}] = 0: o último pré-requisito de ${v} foi cumprido. Enfileira.`, { cur: u, nb: v, write: [v], pushed: true, vars: { u, v, head } });
      } else {
        snap(L.dec, `grau[${v}] = ${grau[v]}: ${v} ainda espera outro pré-requisito.`, { cur: u, nb: v, write: [v], vars: { u, v, head } });
      }
    }
  }
  const ok = head === n;
  snap(L.ret, ok ? `head = ${n} = n: cursou todas. Retorna true.` :
    `head = ${head} < ${n}: ${n - head} matéria(s) nunca chegaram a grau 0. Elas formam (ou dependem de) um ciclo. Retorna false.`,
    { vars: { head, n }, result: ok });
  return out;
}

if (typeof module !== 'undefined') module.exports = { COURSE_GRAPH, COURSE_CODE, courseDFS, courseBFS };
