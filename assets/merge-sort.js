// Merge Sort: one step per executed line, as a snapshot for the player.
// Sort ascending in O(n log n): split in halves, sort each, merge them through a tmp buffer.
// Heap snapshot dp = [...a, ...tmp]: cells 0..n-1 are the array, n..2n-1 the buffer.
// Runs in the browser (globals) and in node (module.exports) for the test.
if (typeof module !== 'undefined') globalThis.listing ??= require('./trace.js').listing;

const MS_NUMS = [5, 2, 4, 6, 1, 3];

// Same merge in both tabs: the line names are shared, the indices come from each listing.
const MS_MERGE = [
  ['mfn', 'function merge(lo, mid, hi) {'],
  ['minit', '  let i = lo, j = mid + 1, k = lo         // i: esquerda · j: direita · k: tmp'],
  ['mwhile', '  while (i <= mid && j <= hi) {'],
  ['mcmp', '    if (a[i] <= a[j]) tmp[k++] = a[i++]   // empate: esquerda primeiro (estável)'],
  ['melse', '    else tmp[k++] = a[j++]'],
  [null, '  }'],
  ['mleft', '  while (i <= mid) tmp[k++] = a[i++]      // sobras da esquerda'],
  ['mright', '  while (j <= hi) tmp[k++] = a[j++]       // sobras da direita'],
  ['mcopy', '  for (let t = lo; t <= hi; t++) a[t] = tmp[t]   // devolve ao array'],
  [null, '}'],
];

const MS_CODE = {
  recursivo: listing([
    ['alloc', 'const tmp = Array(n)                      // buffer do merge, alocado uma vez'],
    ['fn', 'function sort(lo, hi) {'],
    ['base', '  if (lo >= hi) return                     // 0 ou 1 elemento: já ordenado'],
    ['mid', '  const mid = (lo + hi) >> 1'],
    ['left', '  sort(lo, mid)                            // ordena a metade esquerda'],
    ['right', '  sort(mid + 1, hi)                        // ordena a metade direita'],
    ['merge', '  merge(lo, mid, hi)                       // junta as duas metades'],
    [null, '}'],
    ...MS_MERGE,
    ['call', 'sort(0, n - 1)'],
    ['ret', 'return a'],
  ]),
  iterativo: listing([
    ['alloc', 'const tmp = Array(n)                      // buffer do merge, alocado uma vez'],
    ['forw', 'for (let w = 1; w < n; w *= 2) {            // blocos de w já ordenados'],
    ['forlo', '  for (let lo = 0; lo < n; lo += 2 * w) {   // um par de blocos por vez'],
    ['mid', '    const mid = lo + w - 1                   // fim do bloco esquerdo'],
    ['lone', '    if (mid >= n - 1) break                  // sem bloco direito: sobra fica'],
    ['hi', '    const hi = Math.min(lo + 2 * w - 1, n - 1)   // direito pode ser menor'],
    ['merge', '    merge(lo, mid, hi)'],
    [null, '  }'],
    [null, '}'],
    ['ret', 'return a'],
    [null, ''],
    ...MS_MERGE,
  ]),
};

const msShow = (arr, lo, hi) => `[${arr.slice(lo, hi + 1).join(', ')}]`;

// Shared state + merge tracer for both tabs.
function msTracer(code, nums) {
  const L = code.at, n = nums.length, a = nums.slice(), tmp = new Array(n).fill(null), stack = [], out = [];
  const st = { calls: 0, maxDepth: 0, cmps: 0 };
  const snap = (line, msg, s = {}) => out.push({ dp: [...a, ...tmp], stack: stack.map((f) => ({ ...f })), read: [], write: [], ...st, line, msg, ...s });
  const enter = (call) => {
    const fr = { call, note: '' };
    stack.push(fr); st.calls++; st.maxDepth = Math.max(st.maxDepth, stack.length);
    return fr;
  };

  function merge(lo, mid, hi, extra = {}) {
    const fr = enter(`merge(${lo}, ${mid}, ${hi})`);
    let i = lo, j = mid + 1, k = lo;
    const S = (s = {}) => ({ ...extra, lo, mid, hi, i, j, k, ...s, vars: { lo, mid, hi, i, j, k, ...s.vars } });
    snap(L.mfn, `Entra em merge(${lo}, ${mid}, ${hi}): junta a esquerda ${msShow(a, lo, mid)} com a direita ${msShow(a, mid + 1, hi)}. As duas já estão ordenadas.`,
      { ...extra, lo, mid, hi, vars: { lo, mid, hi } });
    snap(L.minit, `i = ${lo} aponta o início da esquerda, j = ${mid + 1} o da direita, k = ${lo} a próxima casa livre de tmp.`, S());
    for (;;) {
      const go = i <= mid && j <= hi;
      snap(L.mwhile, go ? `As duas metades ainda têm elementos: compara a[${i}] com a[${j}].`
        : i > mid ? `i = ${i} passou de mid = ${mid}: a esquerda acabou. O laço para.` : `j = ${j} passou de hi = ${hi}: a direita acabou. O laço para.`, S());
      if (!go) break;
      st.cmps++;
      const ai = a[i], aj = a[j];
      if (ai <= aj) {
        tmp[k] = ai;
        snap(L.mcmp, `a[${i}] = ${ai} ≤ a[${j}] = ${aj}: o menor está na esquerda. tmp[${k}] = ${ai}, e i e k andam uma casa.`,
          S({ read: [i, j], write: [n + k], vars: { 'a[i]': ai, 'a[j]': aj } }));
        k++; i++;
      } else {
        snap(L.mcmp, `a[${i}] = ${ai} > a[${j}] = ${aj}: falso, o menor está na direita.`, S({ read: [i, j], vars: { 'a[i]': ai, 'a[j]': aj } }));
        tmp[k] = aj;
        snap(L.melse, `tmp[${k}] = a[${j}] = ${aj}, e j e k andam uma casa.`, S({ read: [j], write: [n + k], vars: { 'a[j]': aj } }));
        k++; j++;
      }
    }
    for (;;) {
      if (i > mid) {
        snap(L.mleft, `i = ${i} > mid: nada sobrou na esquerda.`, S());
        break;
      }
      tmp[k] = a[i];
      snap(L.mleft, `Sobrou a[${i}] = ${a[i]} na esquerda, e ele é maior que tudo já copiado: tmp[${k}] = ${a[i]}.`, S({ read: [i], write: [n + k] }));
      k++; i++;
    }
    for (;;) {
      if (j > hi) {
        snap(L.mright, `j = ${j} > hi: nada sobrou na direita.`, S());
        break;
      }
      tmp[k] = a[j];
      snap(L.mright, `Sobrou a[${j}] = ${a[j]} na direita, e ele é maior que tudo já copiado: tmp[${k}] = ${a[j]}.`, S({ read: [j], write: [n + k] }));
      k++; j++;
    }
    for (let t = lo; ; t++) {
      if (t > hi) {
        snap(L.mcopy, `t = ${t} > hi: a[${lo}..${hi}] = ${msShow(a, lo, hi)} agora está ordenado. Retorna e desempilha o merge.`, S({ vars: { t } }));
        break;
      }
      a[t] = tmp[t];
      snap(L.mcopy, `t = ${t}: a[${t}] = tmp[${t}] = ${a[t]}.`, S({ read: [n + t], write: [t], vars: { t } }));
    }
    fr.note = msShow(a, lo, hi);
    stack.pop();
  }

  return { L, n, a, out, st, stack, snap, enter, merge };
}

// Top-down: sort(lo, hi) splits at mid, recurses on both halves, then merges. Depth O(log n).
function msRecursive(nums = MS_NUMS) {
  const { L, n, a, out, st, stack, snap, enter, merge } = msTracer(MS_CODE.recursivo, nums);

  const sort = (lo, hi) => {
    const fr = enter(`sort(${lo}, ${hi})`);
    snap(L.fn, `Entra em sort(${lo}, ${hi}): ordenar a[${lo}..${hi}]. Empilha um frame (profundidade ${stack.length}).`, { lo, hi, vars: { lo, hi } });
    if (lo >= hi) {
      fr.note = 'base';
      snap(L.base, lo === hi ? `lo = hi = ${lo}: um elemento sozinho já está ordenado. Retorna e desempilha.`
        : `lo = ${lo} > hi = ${hi}: trecho vazio. Retorna e desempilha.`, { lo, hi, vars: { lo, hi } });
      stack.pop(); return;
    }
    snap(L.base, `lo < hi: ${hi - lo + 1} elementos, precisa dividir.`, { lo, hi, vars: { lo, hi } });
    const mid = (lo + hi) >> 1, R = { lo, mid, hi };
    snap(L.mid, `mid = (${lo} + ${hi}) >> 1 = ${mid}: esquerda a[${lo}..${mid}], direita a[${mid + 1}..${hi}].`, { ...R, vars: R });
    snap(L.left, `Chama sort(${lo}, ${mid}) para a metade esquerda.`, { ...R, vars: R });
    sort(lo, mid);
    fr.note = 'esq ✓';
    snap(L.left, `sort(${lo}, ${mid}) voltou: a esquerda virou ${msShow(a, lo, mid)}.`, { ...R, vars: R });
    snap(L.right, `Chama sort(${mid + 1}, ${hi}) para a metade direita.`, { ...R, vars: R });
    sort(mid + 1, hi);
    fr.note = 'esq ✓ dir ✓';
    snap(L.right, `sort(${mid + 1}, ${hi}) voltou: a direita virou ${msShow(a, mid + 1, hi)}.`, { ...R, vars: R });
    snap(L.merge, `Chama merge(${lo}, ${mid}, ${hi}) para juntar ${msShow(a, lo, mid)} e ${msShow(a, mid + 1, hi)}.`, { ...R, vars: R });
    merge(lo, mid, hi);
    fr.note = 'pronto';
    snap(L.merge, `merge(${lo}, ${mid}, ${hi}) voltou: a[${lo}..${hi}] = ${msShow(a, lo, hi)}. Retorna e desempilha sort(${lo}, ${hi}).`, { ...R, vars: R });
    stack.pop();
  };

  snap(L.alloc, `malloc: tmp com ${n} células, ainda com lixo. Todo merge escreve nele e depois copia de volta para a.`);
  snap(L.call, `Chama sort(0, ${n - 1}): ordenar o array inteiro.`, { lo: 0, hi: n - 1 });
  sort(0, n - 1);
  snap(L.call, `sort(0, ${n - 1}) voltou.`);
  snap(L.ret, `Pronto: [${a.join(', ')}]. ${st.cmps} comparações, ${st.calls} chamadas, pico de ${st.maxDepth} frames na stack.`, { result: a.slice() });
  return out;
}

// Bottom-up: blocks of width 1, 2, 4... merged in adjacent pairs. No recursion, same tmp buffer.
function msIterative(nums = MS_NUMS) {
  const { L, n, a, out, st, snap, merge } = msTracer(MS_CODE.iterativo, nums);

  snap(L.alloc, `malloc: tmp com ${n} células, ainda com lixo. Cada um dos ${n} elementos sozinho já é um bloco ordenado.`);
  for (let w = 1; ; w *= 2) {
    if (w >= n) {
      snap(L.forw, `w = ${w} ≥ n = ${n}: um único bloco cobre o array inteiro. Fim.`, { vars: { w, n } });
      break;
    }
    snap(L.forw, `w = ${w}: os blocos de ${w} já estão ordenados. Agora junta cada par deles num bloco de ${2 * w}.`, { w, vars: { w } });
    for (let lo = 0; ; lo += 2 * w) {
      if (lo >= n) {
        snap(L.forlo, `lo = ${lo} ≥ n: todos os pares de largura ${w} foram juntados.`, { w, vars: { w, lo } });
        break;
      }
      snap(L.forlo, `lo = ${lo}: o par de blocos começa na casa ${lo}.`, { w, lo, vars: { w, lo } });
      const mid = lo + w - 1;
      snap(L.mid, `mid = ${lo} + ${w} - 1 = ${mid}: o bloco esquerdo é a[${lo}..${Math.min(mid, n - 1)}].`, { w, lo, mid: Math.min(mid, n - 1), vars: { w, lo, mid } });
      if (mid >= n - 1) {
        snap(L.lone, `mid = ${mid} ≥ n - 1 = ${n - 1}: não existe bloco direito. a[${lo}..${n - 1}] = ${msShow(a, lo, n - 1)} já está ordenado e fica onde está. break.`,
          { w, lo, mid: n - 1, vars: { w, lo, mid } });
        break;
      }
      snap(L.lone, `mid = ${mid} < n - 1: existe bloco direito a partir da casa ${mid + 1}.`, { w, lo, mid, vars: { w, lo, mid } });
      const hi = Math.min(lo + 2 * w - 1, n - 1), R = { w, lo, mid, hi };
      snap(L.hi, lo + 2 * w - 1 > n - 1
        ? `lo + 2w - 1 = ${lo + 2 * w - 1} passa do fim: hi = n - 1 = ${hi}. O bloco direito fica menor, com ${hi - mid} elemento(s).`
        : `hi = ${hi}: o bloco direito a[${mid + 1}..${hi}] tem ${w} elemento(s).`, { ...R, vars: R });
      snap(L.merge, `Chama merge(${lo}, ${mid}, ${hi}) para juntar ${msShow(a, lo, mid)} e ${msShow(a, mid + 1, hi)}.`, { ...R, vars: R });
      merge(lo, mid, hi, { w });
      snap(L.merge, `merge(${lo}, ${mid}, ${hi}) voltou: a[${lo}..${hi}] = ${msShow(a, lo, hi)}.`, { ...R, vars: R });
    }
  }
  snap(L.ret, `Pronto: [${a.join(', ')}]. ${st.cmps} comparações, ${st.calls} chamadas de merge, nunca mais de 1 frame na stack.`, { result: a.slice() });
  return out;
}

if (typeof module !== 'undefined') module.exports = { MS_NUMS, MS_CODE, msRecursive, msIterative };
