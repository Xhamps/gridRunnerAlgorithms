// Sort List: one step per executed line, as a snapshot for the player.
// Sort a singly linked list by relinking its nodes (values never move), in O(n log n).
// Heap model: node k lives in dp[2k] (val) and dp[2k+1] (next = node index, '∅' = null).
// The last node slot is the dummy; while it is not allocated both cells are null (junk).
// Runs in the browser (globals) and in node (module.exports) for the test.
if (typeof module !== 'undefined') globalThis.listing ??= require('./trace.js').listing;

const SL_VALS = [4, 2, 5, 1, 3];

const SL_CODE = {
  recursivo: listing([
    ['fn', 'function sort(head) {'],
    ['base', '  if (!head || !head.next) return head     // 0 ou 1 nó: já ordenada'],
    ['init', '  let slow = head, fast = head.next'],
    ['wh', '  while (fast && fast.next) {              // fast anda 2, slow anda 1'],
    ['step', '    slow = slow.next; fast = fast.next.next'],
    [null, '  }'],
    ['cut', '  const mid = slow.next; slow.next = null  // corta no meio'],
    ['left', '  const a = sort(head)'],
    ['right', '  const b = sort(mid)'],
    ['ret', '  return merge(a, b)'],
    [null, '}'],
    ['mfn', 'function merge(a, b) {'],
    ['mdum', '  const dummy = new Node(); let t = dummy'],
    ['mwh', '  while (a && b) {'],
    ['mif', '    if (a.val <= b.val) {'],
    ['ma', '      t.next = a; a = a.next'],
    [null, '    } else {'],
    ['mb', '      t.next = b; b = b.next'],
    [null, '    }'],
    ['madv', '    t = t.next'],
    [null, '  }'],
    ['mrest', '  t.next = a || b                          // pendura o que sobrou'],
    ['mret', '  return dummy.next'],
    [null, '}'],
    ['call', 'return sort(head)'],
  ]),
  iterativo: listing([
    ['len', 'let n = 0'],
    ['forp', 'for (let p = head; p; p = p.next) n++'],
    ['dum', 'const dummy = new Node(0, head)'],
    ['fors', 'for (let size = 1; size < n; size *= 2) {'],
    ['pass', '  let prev = dummy, cur = dummy.next'],
    ['wcur', '  while (cur) {'],
    ['spa', '    const a = cur, b = split(a, size)      // a = size nós'],
    ['spb', '    cur = split(b, size)                   // b = size nós, cur = resto'],
    ['mrg', '    prev = merge(a, b, prev)               // anexa e devolve a nova cauda'],
    [null, '  }'],
    [null, '}'],
    ['ret', 'return dummy.next'],
    [null, ''],
    ['sfn', 'function split(p, size) {                 // corta após size nós'],
    ['sfor', '  for (let i = 1; p && i < size; i++) p = p.next'],
    ['snull', '  if (!p) return null'],
    ['scut', '  const rest = p.next; p.next = null'],
    ['sret', '  return rest'],
    [null, '}'],
    ['mfn', 'function merge(a, b, tail) {'],
    ['mwh', '  while (a && b) {'],
    ['mif', '    if (a.val <= b.val) {'],
    ['ma', '      tail.next = a; a = a.next'],
    [null, '    } else {'],
    ['mb', '      tail.next = b; b = b.next'],
    [null, '    }'],
    ['madv', '    tail = tail.next'],
    [null, '  }'],
    ['mrest', '  tail.next = a || b'],
    ['mend', '  while (tail.next) tail = tail.next      // anda até a cauda'],
    ['mret', '  return tail'],
    [null, '}'],
  ]),
};

// Shared heap: vals never change, only nx (next pointers) is rewritten.
function slHeap(vals) {
  const n = vals.length, D = n;
  const h = { n, D, val: [...vals, null], nx: vals.map((_, k) => (k + 1 < n ? k + 1 : null)).concat([null]), dummy: false };
  h.cells = () => h.val.flatMap((v, k) => (k === D && !h.dummy ? [null, null] : [k === D ? 'D' : v, h.nx[k] === null ? '∅' : h.nx[k]]));
  h.lbl = (k) => (k === null ? 'null' : k === D ? 'dummy' : `[${h.val[k]}]`);
  h.walk = (k) => { const o = []; for (; k !== null; k = h.nx[k]) o.push(k); return o; };
  h.done = (head) => { const order = h.walk(head); return { order, result: order.map((k) => h.val[k]) }; };
  return h;
}

// Top-down: slow/fast find the middle, cut, sort each half, merge. O(log n) stack.
function slRecursive(vals = SL_VALS) {
  const L = SL_CODE.recursivo.at, H = slHeap(vals), { nx, val, D, lbl } = H, stack = [], out = [];
  let calls = 0, maxDepth = 0;
  const snap = (line, msg, s = {}) => out.push({ dp: H.cells(), read: [], write: [], stack: stack.map((f) => ({ ...f })), calls, maxDepth, line, msg, ptr: {}, ...s });
  const enter = (call) => { const fr = { call, note: '' }; stack.push(fr); calls++; maxDepth = Math.max(maxDepth, stack.length); return fr; };

  const merge = (a, b) => {
    const fr = enter(`merge(${lbl(a)}, ${lbl(b)})`);
    const P = () => ({ a, b, t });
    let t = null;
    snap(L.mfn, `Entra em merge: intercala duas listas já ordenadas, começando em ${lbl(a)} e ${lbl(b)}.`, { ptr: { a, b }, vars: { a: lbl(a), b: lbl(b) } });
    H.dummy = true; nx[D] = null; t = D;
    snap(L.mdum, 'Cria um nó dummy: a lista resultado começa em dummy.next, sem caso especial para o primeiro nó. t marca a cauda.',
      { ptr: P(), write: [2 * D, 2 * D + 1], vars: { a: lbl(a), b: lbl(b), t: 'dummy' } });
    while (true) {
      const go = a !== null && b !== null;
      snap(L.mwh, go ? `As duas listas ainda têm nós: compara as cabeças.` : `${a === null ? 'a' : 'b'} acabou: sai do laço.`,
        { ptr: P(), vars: { a: lbl(a), b: lbl(b), t: lbl(t) } });
      if (!go) break;
      const le = val[a] <= val[b];
      snap(L.mif, le ? `a.val = ${val[a]} ≤ b.val = ${val[b]}: o menor é de a.` : `a.val = ${val[a]} > b.val = ${val[b]}: o menor é de b.`,
        { ptr: P(), read: [2 * a, 2 * b], vars: { 'a.val': val[a], 'b.val': val[b] } });
      if (le) {
        nx[t] = a; a = nx[a];
        snap(L.ma, `${lbl(t)}.next = ${lbl(nx[t])}: religa o nó de a na cauda (nenhum valor é copiado). a avança para ${lbl(a)}.`,
          { ptr: P(), write: [2 * t + 1], vars: { a: lbl(a), b: lbl(b), t: lbl(t) } });
      } else {
        nx[t] = b; b = nx[b];
        snap(L.mb, `${lbl(t)}.next = ${lbl(nx[t])}: religa o nó de b na cauda. b avança para ${lbl(b)}.`,
          { ptr: P(), write: [2 * t + 1], vars: { a: lbl(a), b: lbl(b), t: lbl(t) } });
      }
      t = nx[t];
      snap(L.madv, `t = ${lbl(t)}: a cauda anda para o nó recém-anexado.`, { ptr: P(), vars: { a: lbl(a), b: lbl(b), t: lbl(t) } });
    }
    nx[t] = a !== null ? a : b;
    snap(L.mrest, nx[t] === null ? `As duas acabaram: ${lbl(t)}.next = null.` : `Sobrou ${lbl(nx[t])} e o que vem depois, já em ordem: pendura tudo de uma vez em ${lbl(t)}.next.`,
      { ptr: P(), write: [2 * t + 1], vars: { t: lbl(t), 't.next': lbl(nx[t]) } });
    const r = nx[D];
    fr.note = `→ ${lbl(r)}`;
    snap(L.mret, `Devolve dummy.next = ${lbl(r)}: ${H.walk(r).map((k) => val[k]).join(' → ')}. O dummy é descartado.`,
      { ptr: { r }, read: [2 * D + 1], vars: { ret: lbl(r) } });
    H.dummy = false; nx[D] = null; stack.pop();
    return r;
  };

  const sort = (h) => {
    const fr = enter(`sort(${lbl(h)})`);
    snap(L.fn, `Entra em sort(${lbl(h)}): empilha um frame (profundidade ${stack.length}).`, { ptr: { head: h }, vars: { head: lbl(h) } });
    if (h === null || nx[h] === null) {
      fr.note = `ret ${lbl(h)}`;
      snap(L.base, h === null ? 'Lista vazia: nada a ordenar.' : `Só ${lbl(h)}: uma lista de 1 nó já está ordenada. Retorna.`, { ptr: { head: h }, read: h === null ? [] : [2 * h + 1], vars: { head: lbl(h) } });
      stack.pop(); return h;
    }
    snap(L.base, `${lbl(h)}.next = ${lbl(nx[h])}: há 2 nós ou mais, precisa dividir.`, { ptr: { head: h }, read: [2 * h + 1], vars: { head: lbl(h) } });
    let slow = h, fast = nx[h];
    snap(L.init, `slow = ${lbl(slow)}, fast = ${lbl(fast)}. Começar fast um nó à frente faz slow parar no fim da primeira metade.`,
      { ptr: { slow, fast }, vars: { slow: lbl(slow), fast: lbl(fast) } });
    while (true) {
      const go = fast !== null && nx[fast] !== null;
      snap(L.wh, go ? `fast tem pelo menos mais um nó depois: os dois andam.` : `fast ${fast === null ? 'saiu da lista' : 'está no último nó'}: slow = ${lbl(slow)} é o fim da primeira metade.`,
        { ptr: { slow, fast }, vars: { slow: lbl(slow), fast: lbl(fast) } });
      if (!go) break;
      slow = nx[slow]; fast = nx[nx[fast]];
      snap(L.step, `slow anda 1 (${lbl(slow)}), fast anda 2 (${lbl(fast)}).`, { ptr: { slow, fast }, vars: { slow: lbl(slow), fast: lbl(fast) } });
    }
    const mid = nx[slow]; nx[slow] = null;
    snap(L.cut, `mid = ${lbl(mid)} e ${lbl(slow)}.next = null: a lista vira duas, ${H.walk(h).map((k) => val[k]).join(' → ')} e ${H.walk(mid).map((k) => val[k]).join(' → ')}.`,
      { ptr: { head: h, slow, mid }, write: [2 * slow + 1], vars: { head: lbl(h), mid: lbl(mid) } });
    snap(L.left, `Chama sort(${lbl(h)}) para a primeira metade.`, { ptr: { head: h, mid }, vars: { head: lbl(h), mid: lbl(mid) } });
    const a = sort(h);
    fr.note = `a=${lbl(a)}`;
    snap(L.left, `sort(${lbl(h)}) voltou ${lbl(a)}: ${H.walk(a).map((k) => val[k]).join(' → ')}.`, { ptr: { a, mid }, vars: { a: lbl(a), mid: lbl(mid) } });
    snap(L.right, `Chama sort(${lbl(mid)}) para a segunda metade.`, { ptr: { a, mid }, vars: { a: lbl(a), mid: lbl(mid) } });
    const b = sort(mid);
    fr.note += ` b=${lbl(b)}`;
    snap(L.right, `sort(${lbl(mid)}) voltou ${lbl(b)}: ${H.walk(b).map((k) => val[k]).join(' → ')}.`, { ptr: { a, b }, vars: { a: lbl(a), b: lbl(b) } });
    snap(L.ret, `Chama merge(${lbl(a)}, ${lbl(b)}) para juntar as duas metades ordenadas.`, { ptr: { a, b }, vars: { a: lbl(a), b: lbl(b) } });
    const r = merge(a, b);
    fr.note += ` → ${lbl(r)}`;
    snap(L.ret, `merge voltou ${lbl(r)}. sort(${lbl(h)}) devolve ${H.walk(r).map((k) => val[k]).join(' → ')} e desempilha.`, { ptr: { head: r }, vars: { ret: lbl(r) } });
    stack.pop(); return r;
  };

  const head = vals.length ? 0 : null;
  snap(L.call, `Chama sort(${lbl(head)}) com a lista ${vals.join(' → ') || 'vazia'}.`, { ptr: { head } });
  const r = sort(head);
  const { order, result } = H.done(r);
  snap(L.call, `sort voltou ${lbl(r)}: ${result.join(' → ') || 'vazia'}. ${calls} chamadas, pilha máxima de ${maxDepth} frames.`, { ptr: { head: r }, order, result });
  return out;
}

// Bottom-up: merge runs of size 1, 2, 4... appending to a tail. No recursion, O(1) extra.
function slIterative(vals = SL_VALS) {
  const L = SL_CODE.iterativo.at, H = slHeap(vals), { nx, val, D, lbl } = H, out = [];
  let reg = {};
  const snap = (line, msg, s = {}) => out.push({ dp: H.cells(), read: [], write: [], line, msg, ptr: {}, ...s, vars: { ...reg, ...s.vars } });
  const head = vals.length ? 0 : null;

  const split = (p, size) => {
    snap(L.sfn, `split(${lbl(p)}, ${size}): anda ${size - 1} nó(s) a partir de ${lbl(p)} e corta ali.`, { ptr: { p }, vars: { p: lbl(p) } });
    for (let i = 1; ; i++) {
      const go = p !== null && i < size;
      snap(L.sfor, go ? `i = ${i} < ${size}: p anda.` : p === null ? 'p é null: a lista acabou antes.' : `i = ${i}: p = ${lbl(p)} é o ${size}º nó do bloco.`,
        { ptr: { p }, vars: { p: lbl(p), i } });
      if (!go) break;
      p = nx[p];
    }
    if (p === null) {
      snap(L.snull, 'p é null: não há nada para cortar, devolve null.', { vars: { p: 'null' } });
      return null;
    }
    snap(L.snull, `p = ${lbl(p)} existe.`, { ptr: { p }, vars: { p: lbl(p) } });
    const rest = nx[p]; nx[p] = null;
    snap(L.scut, `rest = ${lbl(rest)} e ${lbl(p)}.next = null: o bloco fica isolado.`, { ptr: { p, rest }, write: [2 * p + 1], vars: { p: lbl(p), rest: lbl(rest) } });
    snap(L.sret, `Devolve ${lbl(rest)}.`, { ptr: { rest }, vars: { rest: lbl(rest) } });
    return rest;
  };

  const merge = (a, b, t) => {
    const P = () => ({ a, b, tail: t });
    const V = () => ({ a: lbl(a), b: lbl(b), tail: lbl(t) });
    snap(L.mfn, `merge(${lbl(a)}, ${lbl(b)}, ${lbl(t)}): intercala os dois blocos e anexa depois de ${lbl(t)}.`, { ptr: P(), vars: V() });
    while (true) {
      const go = a !== null && b !== null;
      snap(L.mwh, go ? 'Os dois blocos têm nós: compara as cabeças.' : `${a === null ? 'a' : 'b'} acabou: sai do laço.`, { ptr: P(), vars: V() });
      if (!go) break;
      const le = val[a] <= val[b];
      snap(L.mif, le ? `a.val = ${val[a]} ≤ b.val = ${val[b]}: o menor é de a.` : `a.val = ${val[a]} > b.val = ${val[b]}: o menor é de b.`,
        { ptr: P(), read: [2 * a, 2 * b], vars: { ...V(), 'a.val': val[a], 'b.val': val[b] } });
      if (le) {
        nx[t] = a; a = nx[a];
        snap(L.ma, `${lbl(t)}.next = ${lbl(nx[t])}: religa o nó de a. a avança para ${lbl(a)}.`, { ptr: P(), write: [2 * t + 1], vars: V() });
      } else {
        nx[t] = b; b = nx[b];
        snap(L.mb, `${lbl(t)}.next = ${lbl(nx[t])}: religa o nó de b. b avança para ${lbl(b)}.`, { ptr: P(), write: [2 * t + 1], vars: V() });
      }
      t = nx[t];
      snap(L.madv, `tail = ${lbl(t)}.`, { ptr: P(), vars: V() });
    }
    nx[t] = a !== null ? a : b;
    snap(L.mrest, nx[t] === null ? `Nada sobrou: ${lbl(t)}.next = null.` : `Pendura o resto, a partir de ${lbl(nx[t])}, em ${lbl(t)}.next.`,
      { ptr: P(), write: [2 * t + 1], vars: V() });
    while (true) {
      const go = nx[t] !== null;
      snap(L.mend, go ? `${lbl(t)}.next = ${lbl(nx[t])}: ainda não é a cauda, anda.` : `${lbl(t)}.next = null: ${lbl(t)} é a nova cauda.`,
        { ptr: { tail: t }, read: [2 * t + 1], vars: { tail: lbl(t) } });
      if (!go) break;
      t = nx[t];
    }
    snap(L.mret, `Devolve tail = ${lbl(t)}: o próximo par será anexado depois dele.`, { ptr: { tail: t }, vars: { tail: lbl(t) } });
    return t;
  };

  let n = 0;
  snap(L.len, 'n = 0: primeiro conta os nós, para saber quando parar de dobrar size.', { vars: { n } });
  for (let p = head; ; p = nx[p]) {
    snap(L.forp, p === null ? `p = null: a lista tem n = ${n} nós.` : `p = ${lbl(p)}: n = ${n + 1}.`, { ptr: { p }, vars: { p: lbl(p), n: p === null ? n : n + 1 } });
    if (p === null) break;
    n++;
  }
  reg = { n };
  H.dummy = true; nx[D] = head;
  snap(L.dum, `dummy.next = ${lbl(head)}: um nó âncora antes da cabeça, porque a cabeça muda a cada passada.`, { ptr: { dummy: D }, write: [2 * D, 2 * D + 1] });
  for (let size = 1; ; size *= 2) {
    reg = { n, size };
    snap(L.fors, size < n ? `size = ${size}: junta blocos ordenados de ${size} em blocos de ${2 * size}.` : `size = ${size} ≥ n = ${n}: um único bloco cobre a lista toda. Fim.`, {});
    if (size >= n) break;
    let prev = D, cur = nx[D];
    snap(L.pass, `prev = dummy, cur = ${lbl(cur)}: a passada recomeça do início.`, { ptr: { prev, cur }, vars: { prev: lbl(prev), cur: lbl(cur) } });
    while (true) {
      snap(L.wcur, cur === null ? 'cur = null: a passada acabou.' : `cur = ${lbl(cur)}: ainda há nós para juntar.`, { ptr: { prev, cur }, vars: { prev: lbl(prev), cur: lbl(cur) } });
      if (cur === null) break;
      const a = cur;
      snap(L.spa, `a = ${lbl(a)}. Chama split(${lbl(a)}, ${size}).`, { ptr: { prev, a }, vars: { prev: lbl(prev), a: lbl(a) } });
      const b = split(a, size);
      snap(L.spa, `split voltou ${lbl(b)}: b começa ali.`, { ptr: { prev, a, b }, vars: { prev: lbl(prev), a: lbl(a), b: lbl(b) } });
      snap(L.spb, `Chama split(${lbl(b)}, ${size}) para isolar b.`, { ptr: { prev, a, b }, vars: { prev: lbl(prev), a: lbl(a), b: lbl(b) } });
      cur = split(b, size);
      snap(L.spb, `split voltou ${lbl(cur)}: cur = ${lbl(cur)} é onde o próximo par começa.`, { ptr: { prev, a, b, cur }, vars: { prev: lbl(prev), a: lbl(a), b: lbl(b), cur: lbl(cur) } });
      snap(L.mrg, `Chama merge(${lbl(a)}, ${lbl(b)}, ${lbl(prev)}).`, { ptr: { prev, a, b, cur }, vars: { prev: lbl(prev), a: lbl(a), b: lbl(b), cur: lbl(cur) } });
      prev = merge(a, b, prev);
      snap(L.mrg, `merge voltou ${lbl(prev)}: prev = ${lbl(prev)}, a nova cauda da parte já juntada.`, { ptr: { prev, cur }, vars: { prev: lbl(prev), cur: lbl(cur) } });
    }
  }
  const { order, result } = H.done(nx[D]);
  snap(L.ret, `Devolve dummy.next = ${lbl(nx[D])}: ${result.join(' → ') || 'vazia'}. Só ponteiros foram trocados.`, { ptr: { head: nx[D] }, read: [2 * D + 1], order, result });
  return out;
}

if (typeof module !== 'undefined') module.exports = { SL_VALS, SL_CODE, slRecursive, slIterative };
