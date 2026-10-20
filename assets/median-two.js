// Median of Two Sorted Arrays: one step per executed line, as a snapshot for the player.
// A (m) and B (n) are sorted, not both empty; return the median of their union.
// Heap snapshot dp = A[0..m-1] then B[0..n-1]. The ±∞ borders are constants, not memory.
// Runs in the browser (globals) and in node (module.exports) for the test.
if (typeof module !== 'undefined') globalThis.listing ??= require('./trace.js').listing;

const MD_A = [2, 9, 11, 15], MD_B = [1, 3, 4, 6, 13];

const MD_CODE = {
  merge: listing([
    ['init', 'let i = 0, j = 0, prev = 0, cur = 0       // ponteiros + os dois últimos tirados'],
    ['fork', 'for (let k = 0; k <= (m + n) >> 1; k++) {  // só até o meio da união'],
    ['save', '  prev = cur'],
    ['cmp', '  if (j >= n || (i < m && A[i] <= B[j])) {'],
    ['takeA', '    cur = A[i++]'],
    [null, '  } else {'],
    ['takeB', '    cur = B[j++]'],
    [null, '  }'],
    [null, '}'],
    ['ret', 'return (m + n) % 2 ? cur : (prev + cur) / 2'],
  ]),
  corte: listing([
    ['swap', 'if (m > n) [A, B, m, n] = [B, A, n, m]    // a busca roda no menor'],
    ['half', 'const half = (m + n + 1) >> 1               // tamanho da metade esquerda'],
    ['init', 'let lo = 0, hi = m                          // i = quantos de A vão para a esquerda'],
    ['whl', 'while (lo <= hi) {'],
    ['cut', '  const i = (lo + hi) >> 1, j = half - i'],
    ['bordA', '  const aL = i > 0 ? A[i - 1] : -Inf, aR = i < m ? A[i] : Inf'],
    ['bordB', '  const bL = j > 0 ? B[j - 1] : -Inf, bR = j < n ? B[j] : Inf'],
    ['ifA', '  if (aL > bR) {                            // A deu demais à esquerda'],
    ['left', '    hi = i - 1'],
    ['ifB', '  } else if (bL > aR) {                     // A deu de menos à esquerda'],
    ['right', '    lo = i + 1'],
    [null, '  } else {'],
    ['found', '    return (m + n) % 2 ? max(aL, bL) : (max(aL, bL) + min(aR, bR)) / 2'],
    [null, '  }'],
    [null, '}'],
  ]),
};

const mdFmt = (v) => v === -Infinity ? '-∞' : v === Infinity ? '+∞' : String(v);

// Two pointers, as in a merge, but stop at position (m+n)/2: only the middle one or two values matter.
function mdMerge(A = MD_A, B = MD_B) {
  const L = MD_CODE.merge.at, m = A.length, n = B.length, out = [], dp = [...A, ...B];
  const stop = (m + n) >> 1;
  let i = 0, j = 0, prev = 0, cur = 0;
  const snap = (line, msg, s = {}) => out.push({ dp, read: [], write: [], line, msg, m, n, offA: 0, offB: m, i, j, ...s });

  snap(L.init, `i = 0 em A, j = 0 em B. A união tem ${m + n} valores; a mediana está na posição ${stop}${(m + n) % 2 ? '' : ` (e ${stop - 1})`}, então o laço tira só ${stop + 1} valores, em ordem.`,
    { vars: { m, n, i, j, prev, cur } });
  for (let k = 0; ; k++) {
    snap(L.fork, k <= stop ? `k = ${k} ≤ ${stop}: tira o ${k + 1}º menor da união.` : `k = ${k} > ${stop}: chegou ao meio, o resto da união nem é olhado.`,
      { k, vars: { k, i, j, prev, cur } });
    if (k > stop) break;
    prev = cur;
    snap(L.save, `prev = ${prev}: guarda o valor anterior, que é a outra metade da mediana quando m + n é par.`, { k, vars: { k, i, j, prev, cur } });
    const takeA = j >= n || (i < m && A[i] <= B[j]);
    snap(L.cmp, j >= n ? `j = ${j} = n: B acabou, só sobra A.` : i >= m ? `i = ${i} = m: A acabou, tira de B.`
      : takeA ? `A[${i}] = ${A[i]} ≤ B[${j}] = ${B[j]}: o menor está em A.` : `A[${i}] = ${A[i]} > B[${j}] = ${B[j]}: o menor está em B.`,
    { k, read: [i < m && i, j < n && m + j].filter((x) => x !== false), vars: { k, i, j, prev, cur, 'A[i]': i < m ? A[i] : '—', 'B[j]': j < n ? B[j] : '—' } });
    if (takeA) {
      cur = A[i++];
      snap(L.takeA, `cur = A[${i - 1}] = ${cur}, i = ${i}. É o ${k + 1}º menor.`, { k, read: [i - 1], vars: { k, i, j, prev, cur } });
    } else {
      cur = B[j++];
      snap(L.takeB, `cur = B[${j - 1}] = ${cur}, j = ${j}. É o ${k + 1}º menor.`, { k, read: [m + j - 1], vars: { k, i, j, prev, cur } });
    }
  }
  const res = (m + n) % 2 ? cur : (prev + cur) / 2;
  snap(L.ret, (m + n) % 2 ? `m + n = ${m + n} é ímpar: a mediana é o último tirado, cur = ${cur}.`
    : `m + n = ${m + n} é par: a mediana é a média dos dois do meio, (${prev} + ${cur}) / 2 = ${res}.`,
  { done: true, result: res, vars: { prev, cur, mediana: res } });
  return out;
}

// Binary search on the cut i of the smaller array; j = half - i completes the left half.
// Correct cut: aL ≤ bR and bL ≤ aR (everything on the left ≤ everything on the right).
function mdCut(A0 = MD_A, B0 = MD_B) {
  const L = MD_CODE.corte.at, out = [], dp = [...A0, ...B0];
  let A = A0, B = B0, m = A.length, n = B.length, offA = 0, offB = m;
  const snap = (line, msg, s = {}) => out.push({ dp, read: [], write: [], line, msg, m, n, offA, offB, ...s });

  const sw = m > n;
  if (sw) { [A, B, m, n, offA, offB] = [B, A, n, m, offB, offA]; }
  snap(L.swap, sw ? `m > n: troca os papéis. A busca roda no array menor (agora A, com ${m}), e assim j = half - i nunca sai de [0, n].`
    : `m = ${m} ≤ n = ${n}: A já é o menor. Buscar no menor dá O(log min(m, n)) e garante j entre 0 e n.`, { vars: { m, n } });
  const half = (m + n + 1) >> 1;
  snap(L.half, `half = ${half}: a metade esquerda tem ${half} valores${(m + n) % 2 ? ' (com m + n ímpar, ela leva o do meio)' : ''}.`, { vars: { m, n, half } });
  let lo = 0, hi = m;
  const R = () => ({ lo, hi, half });
  snap(L.init, `O corte i (quantos de A vão para a esquerda) pode ser de 0 a ${m}. Invariante: o corte certo está sempre em [lo, hi].`,
    { ...R(), vars: { half, lo, hi } });
  for (;;) {
    snap(L.whl, `lo = ${lo} ≤ hi = ${hi}: ainda há ${hi - lo + 1} corte(s) candidato(s).`, { ...R(), vars: { half, lo, hi } });
    const i = (lo + hi) >> 1, j = half - i;
    const base = { ...R(), ci: i, cj: j };
    snap(L.cut, `i = ${i} (meio de [${lo}, ${hi}]), j = ${half} - ${i} = ${j}. Esquerda: ${i} de A + ${j} de B.`, { ...base, vars: { half, lo, hi, i, j } });
    const aL = i > 0 ? A[i - 1] : -Infinity, aR = i < m ? A[i] : Infinity;
    snap(L.bordA, `Bordas de A: aL = ${i > 0 ? `A[${i - 1}] = ${aL}` : '-∞ (nada de A à esquerda)'}, aR = ${i < m ? `A[${i}] = ${aR}` : '+∞ (nada de A à direita)'}.`,
      { ...base, b: 1, hl: { aL: 'r0', aR: 'r1' }, read: [i > 0 && offA + i - 1, i < m && offA + i].filter((x) => x !== false), vars: { half, lo, hi, i, j, aL: mdFmt(aL), aR: mdFmt(aR) } });
    const bL = j > 0 ? B[j - 1] : -Infinity, bR = j < n ? B[j] : Infinity;
    const V = { half, lo, hi, i, j, aL: mdFmt(aL), aR: mdFmt(aR), bL: mdFmt(bL), bR: mdFmt(bR) };
    snap(L.bordB, `Bordas de B: bL = ${j > 0 ? `B[${j - 1}] = ${bL}` : '-∞ (nada de B à esquerda)'}, bR = ${j < n ? `B[${j}] = ${bR}` : '+∞ (nada de B à direita)'}.`,
      { ...base, b: 2, hl: { bL: 'r0', bR: 'r1' }, read: [j > 0 && offB + j - 1, j < n && offB + j].filter((x) => x !== false), vars: V });
    const rd = (a, b) => [a, b].filter((x) => x !== false);
    const iA = (k) => k >= 0 && k < m && offA + k, iB = (k) => k >= 0 && k < n && offB + k;
    snap(L.ifA, aL > bR ? `aL = ${mdFmt(aL)} > bR = ${mdFmt(bR)}: um valor de A à esquerda é maior que um de B à direita. Corte grande demais.`
      : `aL = ${mdFmt(aL)} ≤ bR = ${mdFmt(bR)}: por esse lado, ok.`, { ...base, b: 2, hl: { aL: 'r0', bR: 'r1' }, read: rd(iA(i - 1), iB(j)), vars: V });
    if (aL > bR) {
      hi = i - 1;
      snap(L.left, `hi = ${hi}: o corte vai para a esquerda. Cortes ≥ ${i} só pioram (aL só cresce), então ficam descartados.`, { ...R(), ci: i, cj: j, b: 2, vars: { ...V, hi } });
      continue;
    }
    snap(L.ifB, bL > aR ? `bL = ${mdFmt(bL)} > aR = ${mdFmt(aR)}: A deu poucos valores à esquerda. Corte pequeno demais.`
      : `bL = ${mdFmt(bL)} ≤ aR = ${mdFmt(aR)}: também ok.`, { ...base, b: 2, hl: { bL: 'r0', aR: 'r1' }, read: rd(iB(j - 1), iA(i)), vars: V });
    if (bL > aR) {
      lo = i + 1;
      snap(L.right, `lo = ${lo}: o corte vai para a direita. Cortes ≤ ${i} só pioram (bL só cresce), então ficam descartados.`, { ...R(), ci: i, cj: j, b: 2, vars: { ...V, lo } });
      continue;
    }
    const mx = Math.max(aL, bL), res = (m + n) % 2 ? mx : (mx + Math.min(aR, bR)) / 2;
    snap(L.found, `Corte certo: tudo à esquerda ≤ tudo à direita. ${(m + n) % 2 ? `m + n ímpar: mediana = max(aL, bL) = ${res}.`
      : `m + n par: mediana = (max(aL, bL) + min(aR, bR)) / 2 = (${mx} + ${Math.min(aR, bR)}) / 2 = ${res}.`}`,
    { ...base, b: 2, hl: { aL: 'r0', bL: 'r0', aR: 'r1', bR: 'r1' }, done: true, result: res, vars: { ...V, mediana: res } });
    return out;
  }
}

if (typeof module !== 'undefined') module.exports = { MD_A, MD_B, MD_CODE, mdMerge, mdCut };
