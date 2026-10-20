// k-ésimo Maior: one step per executed line, as a snapshot for the player.
// quickselect: Lomuto partition (pivot = a[hi]) narrowing [lo, hi] until the pivot lands on n - k. s.dp = a.
// heap: min-heap of size k (push, pop when it grows past k); the root is the answer. s.dp = heap slots (k + 1).
// Runs in the browser (globals) and in node (module.exports) for the test.
if (typeof module !== 'undefined') globalThis.listing ??= require('./trace.js').listing;

const KL_NUMS = [3, 7, 1, 8, 2, 9, 5];
const KL_K = 3;

const KL_CODE = {
  quickselect: listing([
    ['alloc', 'let lo = 0, hi = n - 1, alvo = n - k        // casa do k-ésimo maior na ordem crescente'],
    ['loop', 'while (lo < hi) {'],
    ['pivot', '  const piv = a[hi]; let st = lo           // pivô: o último do trecho'],
    ['forj', '  for (let j = lo; j < hi; j++)'],
    ['cmp', '    if (a[j] < piv) {                       // menor que o pivô: vai para a esquerda'],
    ['swap', '      [a[st], a[j]] = [a[j], a[st]]; st++'],
    [null, '    }'],
    ['place', '  [a[st], a[hi]] = [a[hi], a[st]]          // pivô na posição final st'],
    ['found', '  if (st === alvo) break                   // caiu na casa do alvo'],
    ['left', '  else if (st > alvo) hi = st - 1          // alvo à esquerda do pivô'],
    ['right', '  else lo = st + 1                         // alvo à direita do pivô'],
    [null, '}'],
    ['ret', 'return a[alvo]'],
  ]),
  heap: listing([
    ['alloc', 'const h = []                               // min-heap: h[0] é o menor'],
    ['for', 'for (const x of a) {'],
    ['push', '  h.push(x)                                // entra no fim'],
    ['up', '  let i = h.length - 1'],
    ['uloop', '  while (i > 0 && h[i] < h[(i - 1) >> 1]) {   // menor que o pai?'],
    ['uswap', '    troca(i, (i - 1) >> 1); i = (i - 1) >> 1   // sobe'],
    [null, '  }'],
    ['size', '  if (h.length > k) {                      // passou de k: sai o menor'],
    ['popm', '    h[0] = h.pop(); i = 0                  // o último vai para a raiz'],
    ['dloop', '    while (true) {'],
    ['dl', '      const l = 2 * i + 1, r = l + 1; let m = i'],
    ['dcl', '      if (l < h.length && h[l] < h[m]) m = l'],
    ['dcr', '      if (r < h.length && h[r] < h[m]) m = r'],
    ['dstop', '      if (m === i) break                   // nenhum filho menor: parou'],
    ['dswap', '      troca(i, m); i = m                   // desce'],
    [null, '    }'],
    [null, '  }'],
    [null, '}'],
    ['ret', 'return h[0]                                // o menor dos k maiores'],
  ]),
};

const klShow = (arr, lo, hi) => `[${arr.slice(lo, hi + 1).join(', ')}]`;

// Iterative quickselect. Deterministic pivot a[hi] so the steps (and the test) are reproducible.
function klQuick(nums = KL_NUMS, k = KL_K) {
  const L = KL_CODE.quickselect.at, a = nums.slice(), n = a.length, alvo = n - k, out = [];
  let lo = 0, hi = n - 1, parts = 0, cmps = 0;
  const snap = (line, msg, s = {}) => out.push({ dp: a.slice(), read: [], write: [], line, msg, lo, hi, alvo, parts, cmps, ...s,
    vars: { lo, hi, alvo, ...s.vars } });

  snap(L.alloc, `lo = 0, hi = ${n - 1}, alvo = n - k = ${n} - ${k} = ${alvo}: na ordem crescente, o ${k}º maior ocupa a casa ${alvo}. ` +
    'Não precisa ordenar tudo, só descobrir quem cai nessa casa.');
  for (;;) {
    if (!(lo < hi)) {
      snap(L.loop, `lo = hi = ${lo}: o trecho tem um elemento só, e o alvo está nele. Sai do laço.`);
      break;
    }
    snap(L.loop, `lo = ${lo} < hi = ${hi}: o alvo está em a[${lo}..${hi}] = ${klShow(a, lo, hi)}, ainda sem posição definida.`);
    const piv = a[hi];
    let st = lo;
    parts++;
    snap(L.pivot, `piv = a[${hi}] = ${piv}, st = ${lo}. st marca a próxima casa da parte dos menores que o pivô.`,
      { piv, st, read: [hi], vars: { piv, st } });
    for (let j = lo; ; j++) {
      const v = { piv, st, j };
      if (j >= hi) {
        snap(L.forj, `j = ${j} = hi: varredura completa. ` + (st === lo ? `Nenhum elemento é menor que ${piv}.`
          : `a[${lo}..${st - 1}] = ${klShow(a, lo, st - 1)} são os menores que ${piv}.`), { piv, st, vars: v });
        break;
      }
      snap(L.forj, `j = ${j}.`, { piv, st, j, vars: v });
      cmps++;
      if (a[j] < piv) {
        snap(L.cmp, `a[${j}] = ${a[j]} < ${piv}: pertence à parte dos menores.`, { piv, st, j, read: [j, hi], vars: v });
        const same = st === j;
        [a[st], a[j]] = [a[j], a[st]];
        snap(L.swap, same ? `st = j = ${j}: troca a casa com ela mesma (o ${a[j]} já está no lugar). st = ${st + 1}.`
          : `Troca a[${st}] e a[${j}]: o ${a[st]} vai para a casa ${st}, o ${a[j]} para a ${j}. st = ${st + 1}.`,
          { piv, st: st + 1, j, write: same ? [st] : [st, j], vars: { ...v, st: st + 1 } });
        st++;
      } else {
        snap(L.cmp, `a[${j}] = ${a[j]} ≥ ${piv}: falso, não mexe: por enquanto fica na parte dos maiores ou iguais.`, { piv, st, j, read: [j, hi], vars: v });
      }
    }
    [a[st], a[hi]] = [a[hi], a[st]];
    snap(L.place, (st === hi ? `st = hi: o pivô ${piv} já está na casa ${st}` : `Troca a[${st}] e a[${hi}]: o pivô ${piv} vai para a casa ${st}`) +
      ', que é a posição dele na ordem crescente. À esquerda só há menores, à direita só maiores ou iguais.',
      { piv, st, write: st === hi ? [st] : [st, hi], vars: { piv, st } });
    if (st === alvo) {
      snap(L.found, `st = alvo = ${alvo}: o pivô caiu exatamente na casa procurada. break.`, { piv, st, read: [st], vars: { piv, st } });
      break;
    }
    snap(L.found, `st = ${st} ≠ alvo = ${alvo}: ainda não.`, { piv, st, vars: { piv, st } });
    if (st > alvo) {
      hi = st - 1;
      snap(L.left, `st = ${st} > alvo: o alvo está entre os menores. hi = ${hi}; a direita e o pivô saem da busca.`, { piv, st, vars: { piv, st } });
    } else {
      snap(L.left, `st = ${st} > alvo? Falso.`, { piv, st, vars: { piv, st } });
      lo = st + 1;
      snap(L.right, `st = ${st} < alvo: o alvo está entre os maiores. lo = ${lo}; a esquerda e o pivô saem da busca.`, { piv, st, vars: { piv, st } });
    }
  }
  snap(L.ret, `Resposta: a[${alvo}] = ${a[alvo]}, o ${k}º maior. ${parts} partição(ões) e ${cmps} comparações, sem ordenar o array inteiro.`,
    { read: [alvo], result: a[alvo], done: true });
  return out;
}

// Min-heap of the k largest seen so far. dp = heap slots, capacity k + 1 (it overflows by one before the pop).
function klHeap(nums = KL_NUMS, k = KL_K) {
  const L = KL_CODE.heap.at, h = [], out = [];
  let x, idx, i, maxQueue = 0, swaps = 0;
  const swap = (p, q) => { [h[p], h[q]] = [h[q], h[p]]; swaps++; };
  const snap = (line, msg, s = {}) => out.push({ dp: Array.from({ length: k + 1 }, (_, t) => t < h.length ? h[t] : null),
    size: h.length, idx, maxQueue, swaps, read: [], write: [], line, msg, ...s, vars: { k, x, 'h.length': h.length, ...s.vars } });

  snap(L.alloc, `h = []: um min-heap que vai guardar os ${k} maiores vistos até agora. Reserva ${k + 1} casas: ele passa de k por um instante antes do pop.`);
  for (idx = 0; ; idx++) {
    if (idx >= nums.length) {
      snap(L.for, `Acabaram os ${nums.length} números. O heap guarda os ${k} maiores, e a raiz é o menor deles.`);
      break;
    }
    x = nums[idx];
    snap(L.for, `x = a[${idx}] = ${x}.`);
    h.push(x); maxQueue = Math.max(maxQueue, h.length);
    snap(L.push, `push ${x}: entra na casa ${h.length - 1}, a primeira livre.`, { write: [h.length - 1] });
    i = h.length - 1;
    snap(L.up, `i = ${i}: o novo elemento pode ser menor que o pai e precisar subir.`, { read: [i], vars: { i } });
    for (;;) {
      if (i === 0) {
        snap(L.uloop, 'i = 0: chegou na raiz, não tem pai. Para de subir.', { read: [0], vars: { i } });
        break;
      }
      const p = (i - 1) >> 1;
      if (!(h[i] < h[p])) {
        snap(L.uloop, `h[${i}] = ${h[i]} ≥ pai h[${p}] = ${h[p]}: a ordem do heap vale. Para de subir.`, { read: [i, p], vars: { i } });
        break;
      }
      snap(L.uloop, `h[${i}] = ${h[i]} < pai h[${p}] = ${h[p]}: o filho é menor, precisa subir.`, { read: [i, p], vars: { i } });
      swap(i, p);
      snap(L.uswap, `Troca h[${i}] e h[${p}]: o ${h[p]} sobe para a casa ${p}. i = ${p}.`, { write: [i, p], vars: { i: p } });
      i = p;
    }
    if (h.length <= k) {
      snap(L.size, `h.length = ${h.length} ≤ k = ${k}: ainda cabe, ninguém sai.`, { vars: { i } });
      continue;
    }
    snap(L.size, `h.length = ${h.length} > k = ${k}: sobrou um. Sai a raiz ${h[0]}, o menor de todos, que não pode ser um dos ${k} maiores.`,
      { read: [0], vars: { i } });
    const out0 = h[0];
    h[0] = h.pop(); i = 0;
    snap(L.popm, `pop: o ${out0} sai. O último (${h[0]}) vai para a raiz e talvez precise descer. i = 0.`,
      { write: [0], popped: out0, vars: { i } });
    for (;;) {
      snap(L.dloop, `Desce a partir da casa ${i}.`, { read: [i], vars: { i } });
      const l = 2 * i + 1, r = l + 1;
      let m = i;
      const v = () => ({ i, l, r, m });
      snap(L.dl, `Filhos de ${i}: l = ${l}, r = ${r}. m = ${i} (por enquanto o menor é o próprio).`, { read: [i], vars: v() });
      if (l < h.length && h[l] < h[m]) {
        m = l;
        snap(L.dcl, `h[${l}] = ${h[l]} < h[${i}] = ${h[i]}: o filho esquerdo é menor. m = ${l}.`, { read: [l, i], vars: v() });
      } else {
        snap(L.dcl, l < h.length ? `h[${l}] = ${h[l]} ≥ h[${i}] = ${h[i]}: o esquerdo não é menor.` : `l = ${l} ≥ h.length: não existe filho esquerdo.`,
          { read: l < h.length ? [l, i] : [], vars: v() });
      }
      if (r < h.length && h[r] < h[m]) {
        const pm = m;
        m = r;
        snap(L.dcr, `h[${r}] = ${h[r]} < h[${pm}] = ${h[pm]}: o direito é o menor. m = ${r}.`, { read: [r, pm], vars: v() });
      } else {
        snap(L.dcr, r < h.length ? `h[${r}] = ${h[r]} ≥ h[${m}] = ${h[m]}: o direito não ganha.` : `r = ${r} ≥ h.length: não existe filho direito.`,
          { read: r < h.length ? [r, m] : [], vars: v() });
      }
      if (m === i) {
        snap(L.dstop, `m = i = ${i}: nenhum filho é menor que h[${i}] = ${h[i]}. O heap está em ordem. break.`, { read: [i], vars: v() });
        break;
      }
      snap(L.dstop, `m = ${m} ≠ i: o filho h[${m}] = ${h[m]} é menor, então troca.`, { read: [m, i], vars: v() });
      swap(i, m);
      snap(L.dswap, `Troca h[${i}] e h[${m}]: o ${h[m]} desce para a casa ${m}. i = ${m}.`, { write: [i, m], vars: { ...v(), i: m } });
      i = m;
    }
  }
  snap(L.ret, `Resposta: h[0] = ${h[0]}, o ${k}º maior. O heap nunca passou de ${maxQueue} elementos; ${swaps} trocas no total.`,
    { read: [0], result: h[0] });
  return out;
}

if (typeof module !== 'undefined') module.exports = { KL_NUMS, KL_K, KL_CODE, klQuick, klHeap };
