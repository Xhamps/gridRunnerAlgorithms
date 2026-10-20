// Merge Two Sorted Lists: one step per executed line, as a snapshot for the player.
// Two sorted singly linked lists become one by relinking their nodes (the merge step of merge sort).
// Heap model: node k is two int cells, dp[2k] = val and dp[2k+1] = next (shown as an address or null).
// Runs in the browser (globals) and in node (module.exports) for the test.
if (typeof module !== 'undefined') globalThis.listing ??= require('./trace.js').listing;

const MLL_A = [1, 3, 6];
const MLL_B = [2, 3, 7, 9];
const MLL_BASE = 0x7f00a000; // same base as the player's memory strip; 8 B per node

const MLL_CODE = {
  iterativo: listing([
    ['dummy', 'const dummy = { next: null }          // nó-âncora, sem valor'],
    ['tail', 'let tail = dummy                      // último nó já engatado'],
    ['loop', 'while (a !== null && b !== null) {'],
    ['cmp', '  if (a.val <= b.val) {                // empate: a primeiro (estável)'],
    ['linkA', '    tail.next = a; a = a.next          // engata a, a anda'],
    [null, '  } else {'],
    ['linkB', '    tail.next = b; b = b.next          // engata b, b anda'],
    [null, '  }'],
    ['adv', '  tail = tail.next                     // tail vai para o nó engatado'],
    [null, '}'],
    ['rest', 'tail.next = a !== null ? a : b         // uma lista acabou: cola o resto'],
    ['ret', 'return dummy.next'],
  ]),
  recursivo: listing([
    ['fn', 'function merge(a, b) {'],
    ['nullA', '  if (a === null) return b              // a acabou: o resto é b'],
    ['nullB', '  if (b === null) return a              // b acabou: o resto é a'],
    ['cmp', '  if (a.val <= b.val) {'],
    ['recA', '    a.next = merge(a.next, b)           // a fica na frente, o resto vem atrás'],
    ['retA', '    return a'],
    [null, '  }'],
    ['recB', '  b.next = merge(a, b.next)'],
    ['retB', '  return b'],
    [null, '}'],
    ['call', 'return merge(a, b)'],
  ]),
};

// Nodes of both lists (plus an optional dummy at index 0). next: node index, -1 = null, undefined = never written.
function mllHeap(A, B, dummy) {
  const nodes = dummy ? [{ name: 'dummy', val: null, next: undefined }] : [];
  const chain = (vals, p) => {
    const first = nodes.length;
    vals.forEach((val, i) => nodes.push({ name: p + i, val, next: i < vals.length - 1 ? first + i + 1 : -1 }));
    return vals.length ? first : -1;
  };
  const a0 = chain(A, 'A'), b0 = chain(B, 'B');
  return { nodes, a0, b0 };
}
const mllAddr = (k) => '→' + (MLL_BASE + k * 8).toString(16).toUpperCase().slice(-4);
const mllFlat = (nodes) => nodes.flatMap((n) => [n.val, n.next === undefined ? null : n.next < 0 ? 'null' : mllAddr(n.next)]);
const mllWalk = (nodes, k) => { const order = []; for (; k >= 0; k = nodes[k].next) order.push(k); return order; };

// Dummy head + tail pointer: each loop round hooks the smaller head after tail. O(1) extra.
function mllIter(A = MLL_A, B = MLL_B) {
  const L = MLL_CODE.iterativo.at, { nodes, a0, b0 } = mllHeap(A, B, true), out = [];
  let a = a0, b = b0, tail = -1, links = 0;
  const nm = (k) => k < 0 ? 'null' : nodes[k].name;
  const vars = (x = {}) => ({ a: nm(a), b: nm(b), ...(tail >= 0 && { tail: nm(tail) }), ...x });
  const snap = (line, msg, s = {}) => out.push({ dp: mllFlat(nodes), nodes: nodes.map((n) => ({ ...n })), read: [], write: [], a, b, tail, links, line, msg, vars: vars(), ...s });

  nodes[0].next = -1;
  snap(L.dummy, 'Cria o nó dummy: só serve de âncora, para o primeiro nó engatado não precisar de caso especial. Valor nenhum (lixo).', { write: [1] });
  tail = 0;
  snap(L.tail, 'tail = dummy. A lista pronta, por enquanto, é só o dummy.');
  while (true) {
    const go = a >= 0 && b >= 0;
    snap(L.loop, go ? `a = ${nm(a)} (${nodes[a].val}) e b = ${nm(b)} (${nodes[b].val}): as duas listas ainda têm nós. Mais uma rodada.`
      : `${a < 0 ? 'a' : 'b'} é null: a lista ${a < 0 ? 'A' : 'B'} acabou. Sai do laço.`);
    if (!go) break;
    const takeA = nodes[a].val <= nodes[b].val;
    snap(L.cmp, takeA ? `${nodes[a].val} ≤ ${nodes[b].val}: o menor está em a${nodes[a].val === nodes[b].val ? ' (empate: a vai primeiro e a ordem original se mantém)' : ''}.`
      : `${nodes[a].val} > ${nodes[b].val}: o menor está em b. Vai para o else.`,
    { read: [2 * a, 2 * b], vars: vars({ 'a.val': nodes[a].val, 'b.val': nodes[b].val }) });
    const k = takeA ? a : b;
    nodes[tail].next = k; links++;
    if (takeA) a = nodes[a].next; else b = nodes[b].next;
    snap(takeA ? L.linkA : L.linkB, `${nm(tail)}.next = ${nm(k)}: só um ponteiro muda, nenhum nó é copiado. ${takeA ? 'a' : 'b'} anda para ${nm(takeA ? a : b)}.`,
      { write: [2 * tail + 1] });
    tail = k;
    snap(L.adv, `tail = ${nm(k)} (${nodes[k].val}): o fim da lista pronta.`);
  }
  const rest = a >= 0 ? a : b;
  nodes[tail].next = rest; links++;
  const glued = mllWalk(nodes, rest).map((k) => nodes[k].val);
  snap(L.rest, rest < 0 ? `As duas acabaram juntas: ${nm(tail)}.next = null.`
    : `${nm(tail)}.next = ${nm(rest)}: o resto (${glued.join(' → ')}) já está ordenado e entra inteiro com uma única troca de ponteiro.`,
  { write: [2 * tail + 1] });
  const order = mllWalk(nodes, nodes[0].next), result = order.map((k) => nodes[k].val);
  snap(L.ret, `Retorna dummy.next = ${nm(nodes[0].next)}: ${result.join(' → ') || 'lista vazia'}. ${links} ponteiros reescritos, zero nós novos além do dummy.`,
    { result, order, a: -1, b: -1, vars: { head: nm(nodes[0].next) } });
  return out;
}

// merge(a, b) returns the smaller head, whose next is the merge of what is left. O(n + m) frames.
function mllRec(A = MLL_A, B = MLL_B) {
  const L = MLL_CODE.recursivo.at, { nodes, a0, b0 } = mllHeap(A, B, false), stack = [], out = [];
  let calls = 0, maxDepth = 0, cur = { a: -1, b: -1 };
  const nm = (k) => k < 0 ? 'null' : nodes[k].name;
  const snap = (line, msg, s = {}) => out.push({ dp: mllFlat(nodes), nodes: nodes.map((n) => ({ ...n })), stack: stack.map((f) => ({ ...f })),
    read: [], write: [], a: cur.a, b: cur.b, tail: -1, calls, maxDepth, heads: [a0, b0], line, msg, vars: { a: nm(cur.a), b: nm(cur.b) }, ...s });

  const merge = (a, b) => {
    const fr = { call: `merge(${nm(a)}, ${nm(b)})`, note: '' };
    stack.push(fr); calls++; maxDepth = Math.max(maxDepth, stack.length); cur = { a, b };
    snap(L.fn, `Entra em ${fr.call}: empilha um frame (profundidade ${stack.length}).`);
    if (a < 0) {
      fr.note = `ret ${nm(b)}`;
      snap(L.nullA, `a é null: a lista A acabou. O que sobrou de b${b < 0 ? '' : ` (${mllWalk(nodes, b).map((k) => nodes[k].val).join(' → ')})`} já está ordenado: retorna ${nm(b)} inteiro.`);
      stack.pop(); return b;
    }
    snap(L.nullA, `a = ${nm(a)} não é null.`);
    if (b < 0) {
      fr.note = `ret ${nm(a)}`;
      snap(L.nullB, `b é null: a lista B acabou. Retorna o resto de a (${mllWalk(nodes, a).map((k) => nodes[k].val).join(' → ')}) inteiro.`);
      stack.pop(); return a;
    }
    snap(L.nullB, `b = ${nm(b)} não é null.`);
    const takeA = nodes[a].val <= nodes[b].val;
    const rv = { 'a.val': nodes[a].val, 'b.val': nodes[b].val };
    snap(L.cmp, takeA ? `${nodes[a].val} ≤ ${nodes[b].val}: ${nm(a)} é a cabeça desta junção${nodes[a].val === nodes[b].val ? ' (empate: a vai primeiro)' : ''}.`
      : `${nodes[a].val} > ${nodes[b].val}: falso. ${nm(b)} é a cabeça desta junção.`,
    { read: [2 * a, 2 * b], vars: { a: nm(a), b: nm(b), ...rv } });
    const head = takeA ? a : b, line = takeA ? L.recA : L.recB;
    const na = takeA ? nodes[a].next : a, nb = takeA ? b : nodes[b].next;
    snap(line, `${nm(head)} fica na frente. O resto é juntar ${nm(na)} com ${nm(nb)}: chama merge(${nm(na)}, ${nm(nb)}).`);
    const sub = merge(na, nb);
    cur = { a, b };
    nodes[head].next = sub;
    fr.note = `${nm(head)}.next = ${nm(sub)}`;
    snap(line, `merge(${nm(na)}, ${nm(nb)}) voltou ${nm(sub)}. Grava ${nm(head)}.next = ${nm(sub)}.`, { write: [2 * head + 1] });
    fr.note += ` → ${nm(head)}`;
    snap(takeA ? L.retA : L.retB, `Retorna ${nm(head)}: a lista ${mllWalk(nodes, head).map((k) => nodes[k].val).join(' → ')} está pronta. Desempilha.`, { read: [2 * head] });
    stack.pop(); return head;
  };

  snap(L.call, `Chama merge(${nm(a0)}, ${nm(b0)}) com as duas cabeças.`);
  const h = merge(a0, b0);
  cur = { a: -1, b: -1 };
  const order = mllWalk(nodes, h), result = order.map((k) => nodes[k].val);
  snap(L.call, `merge(${nm(a0)}, ${nm(b0)}) voltou ${nm(h)}: ${result.join(' → ') || 'lista vazia'}. ${calls} chamadas, pico de ${maxDepth} frames.`,
    { result, order, vars: { head: nm(h) } });
  return out;
}

if (typeof module !== 'undefined') module.exports = { MLL_A, MLL_B, MLL_CODE, mllHeap, mllIter, mllRec };
