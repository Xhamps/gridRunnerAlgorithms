// Keys and Rooms: one step per executed line, as a snapshot for the player.
// Room u holding key k is a DIRECTED edge u → k. visto[] lives in the heap (s.dp).
// DFS keeps the path in the call stack; BFS keeps the frontier in a queue.
// Runs in the browser (globals) and in node (module.exports) for the test.
if (typeof module !== 'undefined') globalThis.listing ??= require('./trace.js').listing;

// pos = room coordinates in the 0..100 drawing box (only used by the page).
const ROOMS = {
  rooms: [[1, 2], [3], [1, 4], [], [2], [0]],
  pos: [[5, 45], [35, 10], [35, 80], [70, 10], [70, 80], [5, 100]],
};

const ROOMS_CODE = {
  dfs: listing([
    ['vis', 'const visto = Array(n).fill(false)'],
    ['fn', 'function dfs(u) {'],
    ['mark', '  visto[u] = true                      // entrou na sala u'],
    ['for', '  for (const k of rooms[u])            // cada chave achada aqui'],
    ['if', '    if (!visto[k]) dfs(k)'],
    [null, '}'],
    ['call', 'dfs(0)                                 // a sala 0 já está aberta'],
    ['all', 'return visto.every(Boolean)'],
  ]),
  bfs: listing([
    ['vis', 'const visto = Array(n).fill(false)'],
    ['seed', 'visto[0] = true; const fila = [0]; let head = 0'],
    ['while', 'while (head < fila.length) {'],
    ['deq', '  const u = fila[head++]               // entra na sala u'],
    ['for', '  for (const k of rooms[u])            // cada chave achada aqui'],
    ['if', '    if (!visto[k]) {'],
    ['enq', '      visto[k] = true; fila.push(k)    // marca AO ENFILEIRAR'],
    [null, '    }'],
    [null, '}'],
    ['all', 'return visto.every(Boolean)'],
  ]),
};

const roomsVerdict = (visto) => {
  const fechadas = visto.flatMap((v, k) => v ? [] : [k]);
  return fechadas.length ? `false: sala(s) ${fechadas} nunca abertas, ninguém tem a chave delas.` : 'true: todas as salas foram abertas.';
};

function roomsDFS({ rooms } = ROOMS) {
  const L = ROOMS_CODE.dfs.at, n = rooms.length, visto = new Array(n).fill(null), stack = [], out = [];
  let calls = 0, maxDepth = 0;
  const snap = (line, msg, s = {}) => out.push({ dp: visto.slice(), stack: stack.map((f) => ({ ...f })), read: [], write: [], calls, maxDepth, line, msg, ...s });

  const dfs = (u) => {
    const fr = { call: `dfs(${u})`, note: '' };
    stack.push(fr); calls++; maxDepth = Math.max(maxDepth, stack.length);
    snap(L.fn, `Entra em dfs(${u}): empilha um frame (profundidade ${stack.length}).`, { cur: u, vars: { u } });
    visto[u] = true;
    snap(L.mark, `Abre a sala ${u}: visto[${u}] = true.`, { cur: u, write: [u], vars: { u } });
    for (const k of rooms[u]) {
      snap(L.for, `Na sala ${u} há a chave ${k}. (rooms[${u}] = [${rooms[u]}])`, { cur: u, nb: k, vars: { u, chave: k } });
      if (visto[k]) {
        snap(L.if, `visto[${k}] = true: a sala ${k} já foi aberta. Pula.`, { cur: u, nb: k, read: [k], vars: { u, chave: k } });
        continue;
      }
      fr.note = `→ ${k}`;
      snap(L.if, `visto[${k}] = false: chama dfs(${k}) e entra na sala ${k}.`, { cur: u, nb: k, read: [k], vars: { u, chave: k } });
      dfs(k);
      snap(L.if, `dfs(${k}) voltou para a sala ${u}.`, { cur: u, nb: k, vars: { u, chave: k } });
    }
    fr.note = 'fim';
    stack.pop();
  };

  visto.fill(false);
  snap(L.vis, `visto[] com ${n} posições, tudo false. Chave na sala u para a sala k = aresta u → k.`, { write: [...visto.keys()] });
  snap(L.call, 'Chama dfs(0): a única sala aberta no início.', { cur: 0 });
  dfs(0);
  snap(L.call, `dfs(0) voltou. ${calls} salas visitadas.`, {});
  const ans = visto.every(Boolean);
  snap(L.all, `Confere visto[]: ${roomsVerdict(visto)}`, { read: [...visto.keys()], result: ans });
  return out;
}

function roomsBFS({ rooms } = ROOMS) {
  const L = ROOMS_CODE.bfs.at, n = rooms.length, visto = new Array(n).fill(null), out = [];
  const fila = []; let head = 0, maxQueue = 0;
  const snap = (line, msg, s = {}) => out.push({ dp: visto.slice(), queue: fila.slice(), head, maxQueue, read: [], write: [], line, msg, ...s });

  visto.fill(false);
  snap(L.vis, `visto[] com ${n} posições, tudo false. Chave na sala u para a sala k = aresta u → k.`, { write: [...visto.keys()] });
  visto[0] = true; fila.push(0); maxQueue = 1;
  snap(L.seed, 'A sala 0 já está aberta: marca e coloca na fila.', { cur: 0, write: [0], pushed: true });
  for (;;) {
    const more = head < fila.length;
    snap(L.while, more ? `Fila com ${fila.length - head} sala(s): continua.` : 'Fila vazia: não há mais chaves novas.', {});
    if (!more) break;
    const u = fila[head++];
    snap(L.deq, `Desenfileira e entra na sala ${u}.`, { cur: u, popped: true, vars: { u } });
    for (const k of rooms[u]) {
      snap(L.for, `Na sala ${u} há a chave ${k}. (rooms[${u}] = [${rooms[u]}])`, { cur: u, nb: k, vars: { u, chave: k } });
      if (visto[k]) {
        snap(L.if, `visto[${k}] = true: a sala ${k} já está aberta ou na fila. Pula.`, { cur: u, nb: k, read: [k], vars: { u, chave: k } });
        continue;
      }
      snap(L.if, `visto[${k}] = false: sala nova.`, { cur: u, nb: k, read: [k], vars: { u, chave: k } });
      visto[k] = true; fila.push(k); maxQueue = Math.max(maxQueue, fila.length - head);
      snap(L.enq, `Marca visto[${k}] e enfileira a sala ${k}.`, { cur: u, nb: k, write: [k], pushed: true, vars: { u, chave: k } });
    }
  }
  const ans = visto.every(Boolean);
  snap(L.all, `Confere visto[]: ${roomsVerdict(visto)}`, { read: [...visto.keys()], result: ans });
  return out;
}

if (typeof module !== 'undefined') module.exports = { ROOMS, ROOMS_CODE, roomsDFS, roomsBFS };
