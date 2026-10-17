// Pascal's Triangle: one step per executed line, as a snapshot for the player.
// t[i][j] = C(i, j) = number of ways to choose j items out of i. Each inner value = the two above it.
// Runs in the browser (globals) and in node (module.exports) for the test.
if (typeof module !== 'undefined') globalThis.listing ??= require('./trace.js').listing;

const PASCAL_N = 5;
const PASCAL_Q = { i: 4, j: 2 }; // the memo tab asks for C(4, 2)

const PASCAL_CODE = {
  matriz: listing([
    ['alloc', 'const t = Array.from({ length: n }, () => Array(n))'],
    ['fori', 'for (let i = 0; i < n; i++) {'],
    ['edge', '  t[i][0] = t[i][i] = 1                  // as bordas valem 1'],
    ['forj', '  for (let j = 1; j < i; j++)'],
    ['upd', '    t[i][j] = t[i-1][j-1] + t[i-1][j]    // soma os dois de cima'],
    [null, '}'],
    ['ret', 'return t'],
  ]),
  array: listing([
    ['alloc', 'const row = Array(n)'],
    ['fori', 'for (let i = 0; i < n; i++) {'],
    ['last', '  row[i] = 1                             // nova ponta direita'],
    ['forj', '  for (let j = i - 1; j >= 1; j--)       // de trás para frente!'],
    ['upd', '    row[j] = row[j] + row[j-1]'],
    [null, '}'],
    ['ret', 'return row                               // a última linha'],
  ]),
  memo: listing([
    ['alloc', 'const memo = Array.from({ length: i + 1 }, () => Array(i + 1))'],
    ['fn', 'function C(i, j) {'],
    ['base', '  if (j === 0 || j === i) return 1          // borda'],
    ['hit', '  if (memo[i][j] !== undefined) return memo[i][j]   // cache hit'],
    ['esq', '  const a = C(i - 1, j - 1)                 // em cima à esquerda'],
    ['dir', '  const b = C(i - 1, j)                     // em cima'],
    ['save', '  return memo[i][j] = a + b'],
    [null, '}'],
    ['call', 'return C(i, j)'],
  ]),
};

// n x n block, row-major; only the triangle j <= i is used.
function pascal2D(n = PASCAL_N) {
  const L = PASCAL_CODE.matriz.at, t = new Array(n * n).fill(null), out = [];
  const snap = (line, msg, s = {}) => out.push({ dp: t.slice(), read: [], write: [], line, msg, ...s });

  snap(L.alloc, `malloc: n×n = ${n * n} células. Só o triângulo j ≤ i (${n * (n + 1) / 2} células) será usado.`);
  for (let i = 0; i < n; i++) {
    snap(L.fori, `i = ${i}: monta a linha ${i}, que tem ${i + 1} número(s).`, { i, vars: { i } });
    t[i * n] = t[i * n + i] = 1;
    snap(L.edge, i === 0 ? 't[0][0] = 1: o topo do triângulo.' : `Bordas da linha ${i}: t[${i}][0] = t[${i}][${i}] = 1 (só existe 1 jeito de escolher 0 ou todos).`,
      { i, write: i === 0 ? [0] : [i * n, i * n + i], vars: { i } });
    for (let j = 1; j < i; j++) {
      snap(L.forj, `j = ${j}: posição interna da linha ${i}.`, { i, j, vars: { i, j } });
      const ul = (i - 1) * n + j - 1, up = (i - 1) * n + j;
      t[i * n + j] = t[ul] + t[up];
      snap(L.upd, `t[${i - 1}][${j - 1}] + t[${i - 1}][${j}] = ${t[ul]} + ${t[up]} = ${t[i * n + j]}.`,
        { i, j, read: [ul, up], write: [i * n + j], vars: { i, j, 'cima-esq.': t[ul], cima: t[up], 't[i][j]': t[i * n + j] } });
    }
  }
  const rows = Array.from({ length: n }, (_, i) => t.slice(i * n, i * n + i + 1));
  snap(L.ret, `Pronto: ${n} linhas. A última é [${rows.at(-1)}].`, { result: rows });
  return out;
}

// Single row reused for every line of the triangle. gen[j] = which line (i) last wrote that cell.
function pascal1D(n = PASCAL_N) {
  const L = PASCAL_CODE.array.at, row = new Array(n).fill(null), gen = new Array(n).fill(null), out = [];
  const snap = (line, msg, s = {}) => out.push({ dp: row.slice(), gen: gen.slice(), read: [], write: [], line, msg, ...s });

  snap(L.alloc, `malloc: só n = ${n} células. A mesma linha vira a linha 0, 1, 2... do triângulo.`);
  for (let i = 0; i < n; i++) {
    snap(L.fori, `i = ${i}: o array passa a representar a linha ${i}.`, { i, vars: { i } });
    row[i] = 1; gen[i] = i;
    snap(L.last, `row[${i}] = 1: a linha ${i} ganha uma posição nova, a ponta da direita. row[0] = 1 nunca muda.`, { i, j: i, write: [i], vars: { i } });
    for (let j = i - 1; j >= 1; j--) {
      snap(L.forj, `j = ${j} (descendo). row[${j - 1}] ainda é da linha ${i - 1}.`, { i, j, vars: { i, j } });
      const old = row[j];
      row[j] = old + row[j - 1]; gen[j] = i;
      snap(L.upd, `row[${j}] = ${old} + ${row[j - 1]} = ${row[j]}. Indo para frente, row[${j - 1}] já seria da linha ${i} e a soma sairia errada.`,
        { i, j, read: [j, j - 1], write: [j], vars: { i, j, 'row[j] antigo': old, 'row[j-1]': row[j - 1], 'row[j]': row[j] } });
    }
  }
  snap(L.ret, `A última linha é [${row}].`, { read: [...row.keys()], result: row.slice() });
  return out;
}

// Top-down: C(i, j) with recursion + memo (i+1) x (i+1). A step for each line, plus one when a call returns.
function pascalMemo(qi = PASCAL_Q.i, qj = PASCAL_Q.j) {
  const L = PASCAL_CODE.memo.at, n = qi + 1, memo = new Array(n * n).fill(null), stack = [], out = [];
  let calls = 0, hits = 0, maxDepth = 0;
  const snap = (line, msg, s = {}) => out.push({ dp: memo.slice(), stack: stack.map((f) => ({ ...f })), read: [], write: [], calls, hits, maxDepth, line, msg, ...s });

  const C = (i, j) => {
    const fr = { call: `C(${i}, ${j})`, note: '' };
    stack.push(fr); calls++; maxDepth = Math.max(maxDepth, stack.length);
    const idx = i * n + j, v = { i, j };
    snap(L.fn, `Entra em ${fr.call}: empilha um frame (profundidade ${stack.length}).`, { i, j, vars: v });
    if (j === 0 || j === i) {
      fr.note = 'ret 1';
      snap(L.base, `j = ${j} ${j === 0 ? '= 0' : '= i'}: borda do triângulo, retorna 1 sem usar o memo.`, { i, j, vars: { ...v, ret: 1 } });
      stack.pop(); return 1;
    }
    snap(L.base, `0 < ${j} < ${i}: posição interna, não é borda.`, { i, j, vars: v });
    if (memo[idx] !== null) {
      hits++; fr.note = `hit → ${memo[idx]}`;
      snap(L.hit, `CACHE HIT: memo[${i}][${j}] = ${memo[idx]} já foi calculado. Retorna sem recursão.`, { i, j, read: [idx], vars: { ...v, 'memo[i][j]': memo[idx] } });
      stack.pop(); return memo[idx];
    }
    snap(L.hit, `memo[${i}][${j}] vazio: precisa calcular.`, { i, j, vars: v });

    snap(L.esq, `Chama C(${i - 1}, ${j - 1}): o número em cima à esquerda.`, { i, j, vars: v });
    const a = C(i - 1, j - 1);
    fr.note = `a=${a}`;
    snap(L.esq, `C(${i - 1}, ${j - 1}) voltou ${a}.`, { i, j, vars: { ...v, a } });

    snap(L.dir, `Chama C(${i - 1}, ${j}): o número logo acima.`, { i, j, vars: { ...v, a } });
    const b = C(i - 1, j);
    fr.note += ` b=${b}`;
    snap(L.dir, `C(${i - 1}, ${j}) voltou ${b}.`, { i, j, vars: { ...v, a, b } });

    memo[idx] = a + b; fr.note += ` → ${memo[idx]}`;
    snap(L.save, `Grava memo[${i}][${j}] = ${a} + ${b} = ${memo[idx]}, retorna e desempilha.`, { i, j, write: [idx], vars: { ...v, a, b, 'memo[i][j]': memo[idx] } });
    stack.pop(); return memo[idx];
  };

  snap(L.alloc, `malloc: memo com ${n}×${n} = ${n * n} células vazias. Nada é calculado até alguém pedir.`);
  snap(L.call, `Chama C(${qi}, ${qj}): só esse número, sem montar o triângulo inteiro.`);
  const ans = C(qi, qj);
  const used = memo.filter((x) => x !== null).length;
  snap(L.call, `C(${qi}, ${qj}) = ${ans}. ${calls} chamadas, ${hits} cache hit(s), só ${used}/${memo.length} células do memo usadas.`,
    { read: qj > 0 && qj < qi ? [qi * n + qj] : [], result: ans });
  return out;
}

if (typeof module !== 'undefined') module.exports = { PASCAL_N, PASCAL_Q, PASCAL_CODE, pascal2D, pascal1D, pascalMemo };
