// Reverse Pairs: one step per executed line, as a snapshot for the player.
// Count pairs i < j with a[i] > 2 * a[j].
// Runs in the browser (globals) and in node (module.exports) for the test.
if (typeof module !== 'undefined') globalThis.listing ??= require('./trace.js').listing;

// 4 > 2 and 2 > 1 are inversions that fail the 2× test; -3 > 2·(-2) passes without being an inversion.
const RP_NUMS = [4, -3, 2, -2, 1];

const RP_CODE = {
  forca: listing([
    ['init', 'let cnt = 0'],
    ['fori', 'for (let i = 0; i < n; i++) {'],
    ['forj', '  for (let j = i + 1; j < n; j++) {'],
    ['cmp', '    if (a[i] > 2 * a[j])           // par invertido?'],
    ['inc', '      cnt++'],
    [null, '  }'],
    [null, '}'],
    ['ret', 'return cnt'],
  ]),
  merge: listing([
    ['fn', 'function sort(lo, hi) {'],
    ['base', '  if (lo >= hi) return 0                 // 0 ou 1 elemento: nada a contar'],
    ['mid', '  const mid = (lo + hi) >> 1'],
    ['left', '  let cnt = sort(lo, mid)                // pares dentro da metade esquerda'],
    ['right', '  cnt += sort(mid + 1, hi)              // pares dentro da metade direita'],
    ['initj', '  let j = mid + 1                        // pares que cruzam as metades:'],
    ['fori', '  for (let i = lo; i <= mid; i++) {'],
    ['whj', '    while (j <= hi && a[i] > 2 * a[j]) j++'],
    ['add', '    cnt += j - (mid + 1)                 // a[mid+1..j-1] servem para a[i]'],
    [null, '  }'],
    ['mrg', '  let p = lo, q = mid + 1, k = 0        // merge normal no tmp'],
    ['both', '  while (p <= mid && q <= hi)'],
    ['pick', '    tmp[k++] = a[p] <= a[q] ? a[p++] : a[q++]'],
    ['restl', '  while (p <= mid) tmp[k++] = a[p++]'],
    ['restr', '  while (q <= hi) tmp[k++] = a[q++]'],
    ['copy', '  for (let t = 0; t < k; t++) a[lo + t] = tmp[t]'],
    ['ret', '  return cnt'],
    [null, '}'],
    ['call', 'return sort(0, n - 1)'],
  ]),
};

// Baseline: test every pair. O(n²).
function rpBrute(nums = RP_NUMS) {
  const L = RP_CODE.forca.at, a = nums.slice(), n = a.length, out = [];
  let cnt = 0, cmps = 0;
  const snap = (line, msg, s = {}) => out.push({ dp: a.slice(), read: [], write: [], line, msg, cnt, cmps, ...s });

  snap(L.init, 'cnt = 0: nenhum par encontrado ainda.', { vars: { cnt } });
  for (let i = 0; i < n; i++) {
    snap(L.fori, `i = ${i}: a[${i}] = ${a[i]} vai ser comparado com todo mundo à direita.`, { i, vars: { i, cnt } });
    for (let j = i + 1; j < n; j++) {
      snap(L.forj, `j = ${j}: candidato a par (${i}, ${j}).`, { i, j, vars: { i, j, cnt } });
      cmps++;
      const hit = a[i] > 2 * a[j];
      const why = hit ? (a[i] <= a[j] ? ' Repare: a[i] nem é maior que a[j], mas o dobro de um negativo é ainda menor.' : '')
        : a[i] > a[j] ? ' a[i] > a[j], mas não chega a passar do dobro.' : '';
      snap(L.cmp, `${a[i]} > 2 · ${a[j]} = ${2 * a[j]}? ${hit ? 'Sim' : 'Não'}.${why}`,
        { i, j, read: [i, j], vars: { i, j, 'a[i]': a[i], '2·a[j]': 2 * a[j], cnt } });
      if (hit) {
        cnt++;
        snap(L.inc, `cnt = ${cnt}: (${i}, ${j}) é um par invertido.`, { i, j, read: [i, j], vars: { i, j, cnt } });
      }
    }
  }
  snap(L.ret, `Resposta: ${cnt} pares, depois de testar todos os ${cmps} pares possíveis.`, { result: cnt, vars: { cnt } });
  return out;
}

// Merge sort: count the crossing pairs with two pointers on the sorted halves, then merge. O(n log n).
// Heap cells: a[0..n-1] followed by tmp[0..n-1].
function rpMerge(nums = RP_NUMS) {
  const L = RP_CODE.merge.at, a = nums.slice(), n = a.length, tmp = new Array(n).fill(null), stack = [], out = [];
  let calls = 0, maxDepth = 0, total = 0;
  const T = (k) => n + k;
  const snap = (line, msg, s = {}) => out.push({ dp: [...a, ...tmp], stack: stack.map((f) => ({ ...f })), read: [], write: [],
    calls, maxDepth, total, line, msg, ...s });

  const sort = (lo, hi) => {
    const fr = { call: `sort(${lo}, ${hi})`, note: '' };
    stack.push(fr); calls++; maxDepth = Math.max(maxDepth, stack.length);
    const at = { lo, hi };
    snap(L.fn, `Entra em ${fr.call}: trecho a[${lo}..${hi}] (profundidade ${stack.length}).`, { ...at, vars: { lo, hi } });
    if (lo >= hi) {
      fr.note = 'ret 0';
      snap(L.base, `lo = ${lo} ≥ hi = ${hi}: ${lo === hi ? 'um elemento só' : 'trecho vazio'} já está ordenado e não forma par. Retorna 0.`,
        { ...at, vars: { lo, hi, ret: 0 } });
      stack.pop(); return 0;
    }
    snap(L.base, `lo = ${lo} < hi = ${hi}: tem mais de um elemento, divide.`, { ...at, vars: { lo, hi } });
    const mid = (lo + hi) >> 1;
    Object.assign(at, { mid });
    snap(L.mid, `mid = ${mid}: esquerda a[${lo}..${mid}], direita a[${mid + 1}..${hi}].`, { ...at, vars: { lo, hi, mid } });

    snap(L.left, `Chama sort(${lo}, ${mid}): conta e ordena a metade esquerda.`, { ...at, vars: { lo, hi, mid } });
    let cnt = sort(lo, mid);
    fr.note = `cnt=${cnt}`;
    snap(L.left, `sort(${lo}, ${mid}) voltou ${cnt}. a[${lo}..${mid}] agora está ordenado.`, { ...at, vars: { lo, hi, mid, cnt } });
    snap(L.right, `Chama sort(${mid + 1}, ${hi}): conta e ordena a metade direita.`, { ...at, vars: { lo, hi, mid, cnt } });
    const r = sort(mid + 1, hi);
    cnt += r; fr.note = `cnt=${cnt}`;
    snap(L.right, `sort(${mid + 1}, ${hi}) voltou ${r}: cnt = ${cnt}. As duas metades estão ordenadas.`, { ...at, vars: { lo, hi, mid, cnt } });

    let j = mid + 1;
    snap(L.initj, `j = ${j}: com as metades ordenadas, j só anda para a frente. Cada a[i] maior aproveita o j do anterior.`,
      { ...at, j, vars: { lo, hi, mid, j, cnt } });
    for (let i = lo; i <= mid; i++) {
      snap(L.fori, `i = ${i}: quantos da direita ficam abaixo da metade de a[${i}] = ${a[i]}?`, { ...at, i, j, read: [i], vars: { i, j, 'a[i]': a[i], cnt } });
      for (;;) {
        if (j > hi) {
          snap(L.whj, `j = ${j} passou de hi = ${hi}: todos da direita já servem.`, { ...at, i, j, read: [i], vars: { i, j, cnt } });
          break;
        }
        const ok = a[i] > 2 * a[j];
        snap(L.whj, `${a[i]} > 2 · ${a[j]} = ${2 * a[j]}? ${ok ? `Sim: j++ (j = ${j + 1}).` : 'Não: j para aqui.'}`,
          { ...at, i, j, read: [i, j], vars: { i, j, 'a[i]': a[i], '2·a[j]': 2 * a[j], cnt } });
        if (!ok) break;
        j++;
      }
      const got = j - (mid + 1);
      cnt += got; total += got; fr.note = `cnt=${cnt}`;
      snap(L.add, got ? `cnt += ${j} - ${mid + 1} = ${got}: a[${i}] forma par com a[${mid + 1}..${j - 1}]. cnt = ${cnt}.`
        : `cnt += 0: nenhum da direita fica abaixo da metade de ${a[i]}.`,
      { ...at, i, j, read: [i], vars: { i, j, '+': got, cnt } });
    }

    let p = lo, q = mid + 1, k = 0;
    snap(L.mrg, `Contagem pronta. Agora o merge: p = ${p}, q = ${q}, k = 0.`, { ...at, p, q, k, vars: { p, q, k, cnt } });
    for (;;) {
      const ok = p <= mid && q <= hi;
      snap(L.both, ok ? `p = ${p} ≤ ${mid} e q = ${q} ≤ ${hi}: as duas metades ainda têm elementos.`
        : `${p > mid ? 'A esquerda' : 'A direita'} acabou: sai do laço.`, { ...at, p, q, k, vars: { p, q, k } });
      if (!ok) break;
      const fromL = a[p] <= a[q], src = fromL ? p : q;
      tmp[k] = a[src];
      snap(L.pick, `${a[p]} ${fromL ? '≤' : '>'} ${a[q]}: tmp[${k}] = ${a[src]} (da ${fromL ? 'esquerda' : 'direita'}).`,
        { ...at, p, q, k, read: [src], write: [T(k)], vars: { p, q, k, 'a[p]': a[p], 'a[q]': a[q] } });
      if (fromL) p++; else q++;
      k++;
    }
    const rest = (line, side) => {
      for (;;) {
        const ptr = side ? q : p, end = side ? hi : mid;
        if (ptr > end) {
          snap(line, `${side ? 'q' : 'p'} = ${ptr} > ${end}: nada sobrou na ${side ? 'direita' : 'esquerda'}.`, { ...at, p, q, k, vars: { p, q, k } });
          return;
        }
        tmp[k] = a[ptr];
        snap(line, `Sobra da ${side ? 'direita' : 'esquerda'}: tmp[${k}] = a[${ptr}] = ${a[ptr]}.`,
          { ...at, p, q, k, read: [ptr], write: [T(k)], vars: { p, q, k } });
        if (side) q++; else p++;
        k++;
      }
    };
    rest(L.restl, 0);
    rest(L.restr, 1);
    for (let t = 0; t < k; t++) {
      a[lo + t] = tmp[t];
      snap(L.copy, `a[${lo + t}] = tmp[${t}] = ${tmp[t]}.`, { ...at, read: [T(t)], write: [lo + t], vars: { t, k } });
    }
    fr.note = `ret ${cnt}`;
    snap(L.ret, `a[${lo}..${hi}] = [${a.slice(lo, hi + 1).join(', ')}] ordenado. Retorna cnt = ${cnt}.`, { ...at, vars: { lo, hi, cnt } });
    stack.pop(); return cnt;
  };

  snap(L.call, `Chama sort(0, ${n - 1}): tmp tem ${n} células de rascunho para os merges.`);
  const ans = sort(0, n - 1);
  snap(L.call, `sort(0, ${n - 1}) voltou ${ans}. ${calls} chamadas, pico de ${maxDepth} frames.`, { result: ans, vars: { cnt: ans } });
  return out;
}

if (typeof module !== 'undefined') module.exports = { RP_NUMS, RP_CODE, rpBrute, rpMerge };
