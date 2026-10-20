// Merge Sorted Arrays: one step per executed line, as a snapshot for the player.
// a has m valid values followed by n free slots; b has n values. Merge b into a, sorted, in place.
// Heap snapshot (dp): a[0..m+n-1], then aux[0..m-1] (frente only), then b[0..n-1]. Free slots are null.
// Runs in the browser (globals) and in node (module.exports) for the test.
if (typeof module !== 'undefined') globalThis.listing ??= require('./trace.js').listing;

const MSA_A = [2, 5, 7, 0, 0, 0], MSA_M = 3, MSA_B = [1, 4, 6];

const MSA_CODE = {
  frente: listing([
    ['alloc', 'const aux = a.slice(0, m)                  // cópia dos m válidos: O(m) extra'],
    ['init', 'let i = 0, j = 0                           // leitura em aux e em b'],
    ['fork', 'for (let k = 0; k < m + n; k++) {          // escrita em a[k]'],
    ['cmp', '  if (j >= n || (i < m && aux[i] <= b[j])) {'],
    ['takeA', '    a[k] = aux[i++]'],
    [null, '  } else {'],
    ['takeB', '    a[k] = b[j++]'],
    [null, '  }'],
    [null, '}'],
    ['ret', 'return a'],
  ]),
  tras: listing([
    ['init', 'let i = m - 1, j = n - 1, k = m + n - 1   // dois de leitura, um de escrita'],
    ['whl', 'while (j >= 0) {                          // b acabou? o resto de a já está no lugar'],
    ['cmp', '  if (i >= 0 && a[i] > b[j]) {'],
    ['takeA', '    a[k--] = a[i--]'],
    [null, '  } else {'],
    ['takeB', '    a[k--] = b[j--]'],
    [null, '  }'],
    [null, '}'],
    ['ret', 'return a'],
  ]),
};

// Copy the valid prefix to aux, then fill a front-to-back with the smaller head. O(m + n) time, O(m) extra.
function msFront(a0 = MSA_A, m = MSA_M, b = MSA_B) {
  const L = MSA_CODE.frente.at, n = b.length, a = a0.slice(), out = [];
  const A = 0, X = m + n, B = X + m;                       // offsets in dp
  const dp = [...a.map((v, k) => k < m ? v : null), ...Array(m).fill(null), ...b];
  const snap = (line, msg, s = {}) => out.push({ dp: dp.slice(), read: [], write: [], line, msg, m, n, ...s });

  for (let k = 0; k < m; k++) dp[X + k] = a[k];
  snap(L.alloc, `aux = [${a.slice(0, m).join(', ')}]: cópia dos ${m} válidos. Escrevendo pela frente, a[0] seria apagado antes de ser lido; com a cópia, a[0..${m + n - 1}] inteiro pode ser sobrescrito.`,
    { write: Array.from({ length: m }, (_, k) => X + k), vars: { m, n } });
  let i = 0, j = 0;
  snap(L.init, 'i lê aux, j lê b. Os dois começam no menor valor de cada lado.', { i, j, vars: { i, j } });
  for (let k = 0; k < m + n; k++) {
    snap(L.fork, `k = ${k}: a[${k}] recebe o menor valor que ainda não foi usado.`, { i, j, k, vars: { k, i, j } });
    const takeA = j >= n || (i < m && dp[X + i] <= b[j]);
    const read = [i < m && X + i, j < n && B + j].filter((x) => x !== false);
    snap(L.cmp, j >= n ? `j = ${j} = n: b acabou, só sobra aux.`
      : i >= m ? `i = ${i} = m: aux acabou, pega de b.`
      : takeA ? `aux[${i}] = ${dp[X + i]} ≤ b[${j}] = ${b[j]}: o menor está em aux.` : `aux[${i}] = ${dp[X + i]} > b[${j}] = ${b[j]}: o menor está em b.`,
    { i, j, k, read, vars: { k, i, j, 'aux[i]': i < m ? dp[X + i] : '—', 'b[j]': j < n ? b[j] : '—' } });
    if (takeA) {
      dp[A + k] = a[k] = dp[X + i]; i++;
      snap(L.takeA, `a[${k}] = ${a[k]}, i = ${i}. a[0..${k}] já está ordenado e pronto.`, { i, j, k, write: [A + k], read: [X + i - 1], vars: { k, i, j } });
    } else {
      dp[A + k] = a[k] = b[j]; j++;
      snap(L.takeB, `a[${k}] = ${a[k]}, j = ${j}. a[0..${k}] já está ordenado e pronto.`, { i, j, k, write: [A + k], read: [B + j - 1], vars: { k, i, j } });
    }
  }
  snap(L.ret, `Pronto: a = [${a.join(', ')}]. ${m + n} escritas, cada valor lido uma vez.`, { k: m + n, done: true, result: a.slice() });
  return out;
}

// Three pointers from the end: the largest remaining value goes to a[k]. O(m + n) time, O(1) extra.
function msBack(a0 = MSA_A, m = MSA_M, b = MSA_B) {
  const L = MSA_CODE.tras.at, n = b.length, a = a0.slice(), out = [];
  const B = m + n;
  const dp = [...a.map((v, k) => k < m ? v : null), ...b];
  const snap = (line, msg, s = {}) => out.push({ dp: dp.slice(), read: [], write: [], line, msg, m, n, ...s });

  let i = m - 1, j = n - 1, k = m + n - 1;
  snap(L.init, `i = ${i} (último válido de a), j = ${j} (último de b), k = ${k} (última casa de a). Os maiores vão para o fim.`,
    { i, j, k, vars: { i, j, k } });
  while (true) {
    snap(L.whl, j >= 0 ? `j = ${j} ≥ 0: ainda há valores de b. De a[i+1] até a[k] há ${k - i} casa(s) (sempre j + 1 = o que falta de b), então a[k] nunca guarda um valor de a ainda não lido.`
      : `j = -1: b acabou. ${i >= 0 ? `a[0..${i}] já estava no lugar certo, nem precisa mexer.` : 'Todos os valores já foram colocados.'}`,
    { i, j, k, vars: { i, j, k } });
    if (j < 0) break;
    const takeA = i >= 0 && a[i] > b[j];
    snap(L.cmp, i < 0 ? `i = -1: a não tem mais válidos, o resto de b vai direto.`
      : takeA ? `a[${i}] = ${a[i]} > b[${j}] = ${b[j]}: o maior está em a.` : `a[${i}] = ${a[i]} ≤ b[${j}] = ${b[j]}: o maior está em b.`,
    { i, j, k, read: [i >= 0 && i, B + j].filter((x) => x !== false), vars: { i, j, k, 'a[i]': i >= 0 ? a[i] : '—', 'b[j]': b[j] } });
    if (takeA) {
      dp[k] = a[k] = a[i];
      const r = i; k--; i--;
      snap(L.takeA, `a[${k + 1}] = ${a[k + 1]} (veio de a[${r}]). k = ${k}, i = ${i}.${r !== k + 1 ? ` a[${r}] pode ser sobrescrito depois: já foi lido.` : ''}`,
        { i, j, k, read: [r], write: [k + 1], vars: { i, j, k } });
    } else {
      dp[k] = a[k] = b[j];
      k--; j--;
      snap(L.takeB, `a[${k + 1}] = ${a[k + 1]} (veio de b[${j + 1}]). k = ${k}, j = ${j}.`, { i, j, k, read: [B + j + 1], write: [k + 1], vars: { i, j, k } });
    }
  }
  snap(L.ret, `Pronto: a = [${a.join(', ')}], sem memória extra.`, { done: true, result: a.slice() });
  return out;
}

if (typeof module !== 'undefined') module.exports = { MSA_A, MSA_M, MSA_B, MSA_CODE, msFront, msBack };
