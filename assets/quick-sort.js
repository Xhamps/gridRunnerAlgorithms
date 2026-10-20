// Quick Sort: one step per executed line, as a snapshot for the player.
// Sort ascending in place: partition around a pivot, then recurse on each side. No extra buffer.
// Heap snapshot dp = a (n cells). Deterministic pivots so the steps (and the tests) are reproducible.
// Runs in the browser (globals) and in node (module.exports) for the test.
if (typeof module !== 'undefined') globalThis.listing ??= require('./trace.js').listing;

const QS_NUMS = [4, 1, 5, 3, 2, 3];

const QS_CODE = {
  lomuto: listing([
    ['fn', 'function quickSort(lo, hi) {'],
    ['base', '  if (lo >= hi) return                     // 0 ou 1 elemento: já ordenado'],
    ['part', '  const p = partition(lo, hi)              // pivô vai para a casa final p'],
    ['left', '  quickSort(lo, p - 1)                     // ordena quem ficou antes do pivô'],
    ['right', '  quickSort(p + 1, hi)                     // ordena quem ficou depois'],
    [null, '}'],
    ['pfn', 'function partition(lo, hi) {'],
    ['pivot', '  const pivot = a[hi]                      // pivô: o último do trecho'],
    ['init', '  let i = lo                               // a[lo..i-1] ≤ pivô'],
    ['forj', '  for (let j = lo; j < hi; j++) {'],
    ['cmp', '    if (a[j] <= pivot) {'],
    ['swap', '      [a[i], a[j]] = [a[j], a[i]]; i++     // entra na zona ≤ pivô'],
    [null, '    }'],
    [null, '  }'],
    ['place', '  [a[i], a[hi]] = [a[hi], a[i]]            // pivô logo depois da zona'],
    ['pret', '  return i'],
    [null, '}'],
    ['call', 'quickSort(0, n - 1)'],
    ['ret', 'return a'],
  ]),
  hoare: listing([
    ['fn', 'function quickSort(lo, hi) {'],
    ['base', '  if (lo >= hi) return                     // 0 ou 1 elemento: já ordenado'],
    ['part', '  const p = partition(lo, hi)              // a[lo..p] ≤ a[p+1..hi]'],
    ['left', '  quickSort(lo, p)                         // p entra na esquerda'],
    ['right', '  quickSort(p + 1, hi)'],
    [null, '}'],
    ['pfn', 'function partition(lo, hi) {'],
    ['pivot', '  const pivot = a[(lo + hi) >> 1]          // valor do meio'],
    ['init', '  let i = lo - 1, j = hi + 1'],
    ['loop', '  while (true) {'],
    ['movi', '    do i++; while (a[i] < pivot)           // para em quem é ≥ pivô'],
    ['movj', '    do j--; while (a[j] > pivot)           // para em quem é ≤ pivô'],
    ['cross', '    if (i >= j) return j                   // cruzaram: j é a fronteira'],
    ['swap', '    [a[i], a[j]] = [a[j], a[i]]            // cada um vai para o lado certo'],
    [null, '  }'],
    [null, '}'],
    ['call', 'quickSort(0, n - 1)'],
    ['ret', 'return a'],
  ]),
};

const qsShow = (arr, lo, hi) => `[${arr.slice(lo, hi + 1).join(', ')}]`;

// Shared state, call stack and quickSort recursion; each tab plugs in its partition and right-side bounds.
function qsRun(code, nums, partition, leftHi) {
  const L = code.at, n = nums.length, a = nums.slice(), stack = [], out = [], done = new Set();
  const st = { calls: 0, maxDepth: 0, cmps: 0, swaps: 0 };
  const snap = (line, msg, s = {}) => out.push({
    dp: a.slice(), stack: stack.map((f) => ({ ...f })), read: [], write: [], done: [...done], ...st, line, msg, ...s,
  });
  const enter = (call) => {
    const fr = { call, note: '' };
    stack.push(fr); st.calls++; st.maxDepth = Math.max(st.maxDepth, stack.length);
    return fr;
  };
  const ctx = { L, n, a, st, snap, enter, stack, done };

  const quickSort = (lo, hi) => {
    const fr = enter(`quickSort(${lo}, ${hi})`), R = { lo, hi, vars: { lo, hi } };
    snap(L.fn, `Entra em quickSort(${lo}, ${hi}): ordenar a[${lo}..${hi}]${lo <= hi ? ' = ' + qsShow(a, lo, hi) : ''}. Empilha um frame (profundidade ${stack.length}).`, R);
    if (lo >= hi) {
      fr.note = 'base';
      if (lo === hi) done.add(lo);
      snap(L.base, lo === hi ? `lo = hi = ${lo}: um elemento sozinho já está no lugar. Retorna e desempilha.`
        : `lo = ${lo} > hi = ${hi}: trecho vazio. Retorna e desempilha.`, R);
      stack.pop(); return;
    }
    snap(L.base, `lo < hi: ${hi - lo + 1} elementos, precisa particionar.`, R);
    snap(L.part, `Chama partition(${lo}, ${hi}).`, R);
    const p = partition(ctx, lo, hi);
    fr.note = `p = ${p}`;
    const P = { lo, hi, p, vars: { lo, hi, p } };
    snap(L.part, `partition(${lo}, ${hi}) voltou p = ${p}: a[${lo}..${hi}] = ${qsShow(a, lo, hi)}.`, P);
    const lh = leftHi(p);
    snap(L.left, `Chama quickSort(${lo}, ${lh}) para o lado esquerdo.`, P);
    quickSort(lo, lh);
    fr.note = `p = ${p} · esq ✓`;
    snap(L.left, `quickSort(${lo}, ${lh}) voltou: ${lo <= lh ? `a[${lo}..${lh}] = ${qsShow(a, lo, lh)}` : 'o lado esquerdo era vazio'}.`, P);
    snap(L.right, `Chama quickSort(${p + 1}, ${hi}) para o lado direito.`, P);
    quickSort(p + 1, hi);
    fr.note = `p = ${p} · esq ✓ dir ✓`;
    snap(L.right, `quickSort(${p + 1}, ${hi}) voltou: a[${lo}..${hi}] = ${qsShow(a, lo, hi)} está ordenado. Retorna e desempilha.`, P);
    stack.pop();
  };

  snap(L.call, `Chama quickSort(0, ${n - 1}): ordenar o array inteiro, no lugar, sem buffer extra.`, { lo: 0, hi: n - 1 });
  quickSort(0, n - 1);
  snap(L.call, `quickSort(0, ${n - 1}) voltou.`);
  snap(L.ret, `Pronto: [${a.join(', ')}]. ${st.cmps} comparações, ${st.swaps} trocas, ${st.calls} chamadas, pico de ${st.maxDepth} frames na stack.`,
    { result: a.slice(), done: [...a.keys()] });
  return out;
}

// Lomuto: pivot = a[hi]; i marks the end of the "≤ pivot" zone, j scans; a final swap drops the pivot at i.
function qsLomutoPartition({ L, a, st, snap, enter, stack, done }, lo, hi) {
  const fr = enter(`partition(${lo}, ${hi})`), pivot = a[hi];
  let i = lo;
  const S = (j, s = {}) => ({ lo, hi, pv: hi, i, j, le: [lo, i - 1], gt: [i, (j ?? lo) - 1], ...s, vars: { lo, hi, pivot, i, j, ...s.vars } });
  snap(L.pfn, `Entra em partition(${lo}, ${hi}) com a[${lo}..${hi}] = ${qsShow(a, lo, hi)}.`, { lo, hi, vars: { lo, hi } });
  snap(L.pivot, `pivot = a[${hi}] = ${pivot}: o último do trecho. Ele fica parado até o fim.`, { lo, hi, pv: hi, read: [hi], vars: { lo, hi, pivot } });
  snap(L.init, `i = ${lo}: a zona "≤ ${pivot}" começa vazia. Tudo antes de i será ≤ pivô.`, S(undefined));
  for (let j = lo; ; j++) {
    if (j >= hi) {
      snap(L.forj, `j = ${j} chegou em hi: todos foram comparados com o pivô.`, S(j));
      break;
    }
    snap(L.forj, `j = ${j} < hi = ${hi}: olha a[${j}].`, S(j));
    st.cmps++;
    if (a[j] <= pivot) {
      snap(L.cmp, `a[${j}] = ${a[j]} ≤ ${pivot}${a[j] === pivot ? ' (igual ao pivô também vai para a esquerda)' : ''}: verdadeiro, ele pertence à zona da esquerda.`, S(j, { read: [j, hi] }));
      const self = i === j;
      [a[i], a[j]] = [a[j], a[i]]; st.swaps++;
      snap(L.swap, self ? `i = j = ${j}: a troca é consigo mesmo (nada muda). i vai para ${i + 1}.`
        : `Troca a[${i}] ↔ a[${j}]: o ${a[i]} entra na zona, o ${a[j]} (que era > pivô) vai para j. i vai para ${i + 1}.`,
        S(j, { write: self ? [i] : [i, j], le: [lo, i], gt: [i + 1, j] }));
      i++;
    } else {
      snap(L.cmp, `a[${j}] = ${a[j]} > ${pivot}: falso, fica onde está e a zona "> pivô" cresce.`, S(j, { read: [j, hi] }));
    }
  }
  [a[i], a[hi]] = [a[hi], a[i]]; st.swaps++; done.add(i);
  snap(L.place, i === hi ? `i = hi = ${hi}: o pivô ${pivot} já está logo depois da zona. Fica onde está, na casa final.`
    : `Troca a[${i}] ↔ a[${hi}]: o pivô ${pivot} vai para a casa ${i}, logo depois da zona ≤. Essa é a posição final dele.`,
    { lo, hi, pv: i, i, le: [lo, i - 1], gt: [i + 1, hi], write: i === hi ? [i] : [i, hi], vars: { lo, hi, pivot, i } });
  fr.note = `→ ${i}`;
  snap(L.pret, `Retorna p = ${i}: à esquerda ${qsShow(a, lo, i - 1)}, todos ≤ ${pivot}; à direita ${qsShow(a, i + 1, hi)}, todos > ${pivot}. Desempilha o partition.`,
    { lo, hi, pv: i, le: [lo, i - 1], gt: [i + 1, hi], vars: { lo, hi, pivot, p: i } });
  stack.pop();
  return i;
}

// Hoare: pivot = value at the middle; i and j walk inward, stop at misplaced elements and swap them.
function qsHoarePartition({ L, a, st, snap, enter, stack }, lo, hi) {
  const fr = enter(`partition(${lo}, ${hi})`), m = (lo + hi) >> 1, pivot = a[m];
  let i = lo - 1, j = hi + 1, pv = m;
  const S = (s = {}) => ({ lo, hi, pv, i, j, le: [lo, i - 1], gt: [j + 1, hi], ...s, vars: { lo, hi, pivot, i, j, ...s.vars } });
  snap(L.pfn, `Entra em partition(${lo}, ${hi}) com a[${lo}..${hi}] = ${qsShow(a, lo, hi)}.`, { lo, hi, vars: { lo, hi } });
  snap(L.pivot, `pivot = a[(${lo} + ${hi}) >> 1] = a[${m}] = ${pivot}. Guardamos o valor, não a casa: o ${pivot} pode ser trocado de lugar.`,
    { lo, hi, pv, read: [m], vars: { lo, hi, pivot } });
  snap(L.init, `i = ${i} e j = ${j}: um passo fora de cada ponta, porque os do-while andam antes de olhar.`, S());
  for (;;) {
    snap(L.loop, `while (true): mais uma rodada de i pela esquerda e j pela direita.`, S());
    do {
      i++; st.cmps++;
      const go = a[i] < pivot;
      snap(L.movi, go ? `i = ${i}: a[${i}] = ${a[i]} < ${pivot}, já está do lado certo. i continua.`
        : `i = ${i}: a[${i}] = ${a[i]} ≥ ${pivot}${a[i] === pivot ? ' (igual ao pivô: para também, o que divide os repetidos)' : ''}. i para aqui.`,
        S({ read: [i], le: [lo, i - 1 + (go ? 1 : 0)] }));
      if (!go) break;
    } while (true);
    do {
      j--; st.cmps++;
      const go = a[j] > pivot;
      snap(L.movj, go ? `j = ${j}: a[${j}] = ${a[j]} > ${pivot}, já está do lado certo. j continua.`
        : `j = ${j}: a[${j}] = ${a[j]} ≤ ${pivot}${a[j] === pivot ? ' (igual ao pivô)' : ''}. j para aqui.`,
        S({ read: [i, j], gt: [j + (go ? 0 : 1), hi] }));
      if (!go) break;
    } while (true);
    if (i >= j) {
      fr.note = `→ ${j}`;
      snap(L.cross, `i = ${i} ≥ j = ${j}: os ponteiros se cruzaram. Retorna p = ${j}: ${qsShow(a, lo, j)} fica com quem é ≤ ${pivot} e ${qsShow(a, j + 1, hi)} com quem é ≥ ${pivot}. Desempilha.`,
        S({ le: [lo, j], gt: [j + 1, hi], vars: { p: j } }));
      stack.pop();
      return j;
    }
    snap(L.cross, `i = ${i} < j = ${j}: ainda não cruzaram, a[${i}] e a[${j}] estão do lado errado.`, S({ read: [i, j] }));
    [a[i], a[j]] = [a[j], a[i]]; st.swaps++;
    if (pv === i) pv = j; else if (pv === j) pv = i;
    snap(L.swap, `Troca a[${i}] ↔ a[${j}]: agora a[${i}] = ${a[i]} ≤ ${pivot} e a[${j}] = ${a[j]} ≥ ${pivot}.`,
      S({ write: [i, j], le: [lo, i], gt: [j, hi] }));
  }
}

const qsLomuto = (nums = QS_NUMS) => qsRun(QS_CODE.lomuto, nums, qsLomutoPartition, (p) => p - 1);
const qsHoare = (nums = QS_NUMS) => qsRun(QS_CODE.hoare, nums, qsHoarePartition, (p) => p);

if (typeof module !== 'undefined') module.exports = { QS_NUMS, QS_CODE, qsLomuto, qsHoare };
