// Stone Game VII: generates one step per executed line, as a snapshot for the player.
// dp[i][j] = best score difference (player to move − rival) on stones[i..j]; removing a stone scores the sum of the rest.
// Runs in the browser (globals) and in node (module.exports) for the test.
if (typeof module !== 'undefined') globalThis.listing ??= require('./trace.js').listing;

const SG7_STONES = [5, 3, 1, 4, 2];

const SG7_PRE = [
  ['pre', 'const pre = [0]   // pre[k] = soma de stones[0..k-1]'],
  ['prefor', 'for (let k = 0; k < n; k++) pre.push(pre[k] + stones[k])'],
];

const SG7_CODE = {
  matriz: listing([
    ...SG7_PRE,
    ['alloc', 'const dp = Array.from({ length: n }, () => Array(n))'],
    ['diag', 'for (let i = 0; i < n; i++) dp[i][i] = 0'],
    ['fori', 'for (let i = n - 2; i >= 0; i--)'],
    ['forj', '  for (let j = i + 1; j < n; j++) {'],
    ['esq', '    const esq = (pre[j+1] - pre[i+1]) - dp[i+1][j]'],
    ['dir', '    const dir = (pre[j] - pre[i]) - dp[i][j-1]'],
    ['upd', '    dp[i][j] = max(esq, dir)'],
    [null, '  }'],
    ['ret', 'return dp[0][n-1]'],
  ]),
  array: listing([
    ...SG7_PRE,
    ['alloc', 'const dp = Array(n)'],
    ['fori', 'for (let i = n - 1; i >= 0; i--) {'],
    ['base', '  dp[i] = 0'],
    ['forj', '  for (let j = i + 1; j < n; j++) {   // para frente!'],
    ['esq', '    const esq = (pre[j+1] - pre[i+1]) - dp[j]   // linha i+1'],
    ['dir', '    const dir = (pre[j] - pre[i]) - dp[j-1]     // linha i'],
    ['upd', '    dp[j] = max(esq, dir)'],
    [null, '  }'],
    [null, '}'],
    ['ret', 'return dp[n-1]'],
  ]),
  memo: listing([
    ...SG7_PRE,
    ['alloc', 'const memo = Array.from({ length: n }, () => Array(n))'],
    ['fn', 'function f(i, j) {'],
    ['base', '  if (i === j) return 0   // a última pedra não pontua'],
    ['hit', '  if (memo[i][j] !== undefined) return memo[i][j]   // cache hit'],
    ['esq', '  const esq = (pre[j+1] - pre[i+1]) - f(i + 1, j)'],
    ['dir', '  const dir = (pre[j] - pre[i]) - f(i, j - 1)'],
    ['save', '  return memo[i][j] = max(esq, dir)'],
    [null, '}'],
    ['call', 'return f(0, n - 1)'],
  ]),
};

const sg7Interval = (a, i, j) => `[${a.slice(i, j + 1)}]`;

// Shared prefix-sum steps (same lines in every tab). `extra` adds the tab's own snapshot fields.
function sg7Prefix(stones, L, snap) {
  const n = stones.length, pre = [0];
  snap(L.pre, 'pre[0] = 0. Com as somas de prefixo, a soma de qualquer intervalo stones[a..b] sai em O(1): pre[b+1] − pre[a].', { pre: pre.slice(), vars: { 'pre[0]': 0 } });
  for (let k = 0; k < n; k++) {
    pre.push(pre[k] + stones[k]);
    snap(L.prefor, `k = ${k}: pre[${k + 1}] = pre[${k}] + stones[${k}] = ${pre[k]} + ${stones[k]} = ${pre[k + 1]}.`,
      { pre: pre.slice(), k, vars: { k, [`pre[${k + 1}]`]: pre[k + 1] } });
  }
  return pre;
}

// n x n matrix, row-major. Only the triangle i <= j is used.
function sg7Matrix(stones = SG7_STONES) {
  const L = SG7_CODE.matriz.at, n = stones.length, dp = new Array(n * n).fill(null), out = [];
  let pre = [];
  const snap = (line, msg, s = {}) => out.push({ dp: dp.slice(), pre: pre.slice(), read: [], write: [], line, msg, ...s });

  pre = sg7Prefix(stones, L, snap);
  snap(L.alloc, `malloc: n×n = ${n * n} células. Só o triângulo i ≤ j será usado.`);
  for (let i = 0; i < n; i++) dp[i * n + i] = 0;
  snap(L.diag, 'Caso base: com uma só pedra (i = j), quem tira fica com a soma do resto, que é vazio: 0 pontos. dp[i][i] = 0.',
    { write: [...Array(n).keys()].map((i) => i * n + i) });

  for (let i = n - 2; i >= 0; i--) {
    snap(L.fori, `i = ${i}: linha ${i}, de baixo para cima, porque dp[i] depende de dp[i+1].`, { i, vars: { i } });
    for (let j = i + 1; j < n; j++) {
      const iv = { i, j, intervalo: sg7Interval(stones, i, j) };
      snap(L.forj, `j = ${j}: intervalo ${iv.intervalo}.`, { i, j, vars: iv });
      const down = (i + 1) * n + j, left = i * n + j - 1;
      const sumL = pre[j + 1] - pre[i + 1], esq = sumL - dp[down];
      snap(L.esq, `Tirar stones[${i}]=${stones[i]} pontua a soma de stones[${i + 1}..${j}] = ${sumL}. ` +
        `O rival fica com dp[${i + 1}][${j}]=${dp[down]} → esq = ${sumL} − ${dp[down]} = ${esq}.`,
        { i, j, read: [down], pick: 'l', vars: { ...iv, 'soma resto': sumL, esq } });
      const sumR = pre[j] - pre[i], dir = sumR - dp[left];
      snap(L.dir, `Tirar stones[${j}]=${stones[j]} pontua a soma de stones[${i}..${j - 1}] = ${sumR}. ` +
        `O rival fica com dp[${i}][${j - 1}]=${dp[left]} → dir = ${sumR} − ${dp[left]} = ${dir}.`,
        { i, j, read: [-1, left], pick: 'r', vars: { ...iv, 'soma resto': sumR, esq, dir } });
      dp[i * n + j] = Math.max(esq, dir);
      snap(L.upd, `dp[${i}][${j}] = max(${esq}, ${dir}) = ${dp[i * n + j]}.`,
        { i, j, write: [i * n + j], vars: { ...iv, esq, dir, 'dp[i][j]': dp[i * n + j] } });
    }
  }
  const ans = dp[n - 1];
  snap(L.ret, `dp[0][${n - 1}] = ${ans}: com jogo ótimo, Alice termina ${ans} pontos à frente de Bob.`, { read: [n - 1], result: ans });
  return out;
}

// Single array: dp[j] holds row i (when already updated) or row i+1 (not yet). gen[j] = which row.
function sg7Array(stones = SG7_STONES) {
  const L = SG7_CODE.array.at, n = stones.length;
  const dp = new Array(n).fill(null), gen = new Array(n).fill(null), out = [];
  let pre = [];
  const snap = (line, msg, s = {}) => out.push({ dp: dp.slice(), gen: gen.slice(), pre: pre.slice(), read: [], write: [], line, msg, ...s });

  pre = sg7Prefix(stones, L, snap);
  snap(L.alloc, `malloc: só n = ${n} células. Cada linha da matriz sobrescreve a anterior.`);
  for (let i = n - 1; i >= 0; i--) {
    snap(L.fori, `i = ${i}: o array passa a representar a linha ${i} da matriz.`, { i, vars: { i } });
    dp[i] = 0; gen[i] = i;
    snap(L.base, `Caso base da linha: dp[${i}] = 0 (uma pedra só não pontua nada).`, { i, j: i, write: [i], vars: { i, 'dp[i]': 0 } });
    for (let j = i + 1; j < n; j++) {
      const iv = { i, j, intervalo: sg7Interval(stones, i, j) };
      snap(L.forj, `j = ${j}: intervalo ${iv.intervalo}. dp[${j}] ainda é da linha ${i + 1}.`, { i, j, vars: iv });
      const old = dp[j], sumL = pre[j + 1] - pre[i + 1], esq = sumL - old;
      snap(L.esq, `dp[${j}]=${old} ainda é da linha i=${i + 1} (= dp[${i + 1}][${j}]). esq = ${sumL} − ${old} = ${esq}.`,
        { i, j, read: [j], pick: 'l', vars: { ...iv, 'soma resto': sumL, esq } });
      const sumR = pre[j] - pre[i], dir = sumR - dp[j - 1];
      snap(L.dir, `dp[${j - 1}]=${dp[j - 1]} já é da linha i=${i} (= dp[${i}][${j - 1}]), por isso j vai para frente. ` +
        `dir = ${sumR} − ${dp[j - 1]} = ${dir}.`,
        { i, j, read: [-1, j - 1], pick: 'r', vars: { ...iv, 'soma resto': sumR, esq, dir } });
      dp[j] = Math.max(esq, dir); gen[j] = i;
      snap(L.upd, `dp[${j}] = max(${esq}, ${dir}) = ${dp[j]} (agora é dp[${i}][${j}]).`,
        { i, j, write: [j], vars: { ...iv, esq, dir, 'dp[j]': dp[j] } });
    }
  }
  const ans = dp[n - 1];
  snap(L.ret, `dp[${n - 1}] = ${ans}: Alice termina ${ans} pontos à frente de Bob.`, { read: [n - 1], result: ans });
  return out;
}

// Top-down: recursion + memo n x n. A step for each line, plus one when a recursive call returns.
function sg7Memo(stones = SG7_STONES) {
  const L = SG7_CODE.memo.at, n = stones.length, memo = new Array(n * n).fill(null), stack = [], out = [];
  let calls = 0, hits = 0, maxDepth = 0, pre = [];
  const snap = (line, msg, s = {}) => out.push({ dp: memo.slice(), pre: pre.slice(), stack: stack.map((f) => ({ ...f })), read: [], write: [], calls, hits, maxDepth, line, msg, ...s });

  const f = (i, j) => {
    const fr = { call: `f(${i}, ${j})`, note: '' };
    stack.push(fr); calls++; maxDepth = Math.max(maxDepth, stack.length);
    const idx = i * n + j, iv = { i, j, intervalo: sg7Interval(stones, i, j) };
    snap(L.fn, `Entra em ${fr.call} sobre ${iv.intervalo}: empilha um frame (profundidade ${stack.length}).`, { i, j, vars: iv });

    if (i === j) {
      fr.note = 'ret 0';
      snap(L.base, 'i = j: só sobrou uma pedra. Quem tira pontua a soma do resto, que é 0. Retorna sem usar o memo.', { i, j, vars: { ...iv, ret: 0 } });
      stack.pop(); return 0;
    }
    snap(L.base, 'i ≠ j: mais de uma pedra, não é caso base.', { i, j, vars: iv });
    if (memo[idx] !== null) {
      hits++; fr.note = `hit → ${memo[idx]}`;
      snap(L.hit, `CACHE HIT: memo[${i}][${j}] = ${memo[idx]} já foi calculado. Retorna sem recursão.`, { i, j, read: [idx], vars: { ...iv, 'memo[i][j]': memo[idx] } });
      stack.pop(); return memo[idx];
    }
    snap(L.hit, `memo[${i}][${j}] vazio: precisa calcular.`, { i, j, vars: iv });

    const sumL = pre[j + 1] - pre[i + 1];
    snap(L.esq, `Tirar stones[${i}]=${stones[i]} pontua ${sumL}: chama f(${i + 1}, ${j}) para saber a vantagem do rival no que sobra.`, { i, j, pick: 'l', vars: { ...iv, 'soma resto': sumL } });
    const r1 = f(i + 1, j), esq = sumL - r1;
    fr.note = `esq=${esq}`;
    snap(L.esq, `f(${i + 1}, ${j}) voltou ${r1} → esq = ${sumL} − ${r1} = ${esq}.`, { i, j, pick: 'l', vars: { ...iv, esq } });

    const sumR = pre[j] - pre[i];
    snap(L.dir, `Tirar stones[${j}]=${stones[j]} pontua ${sumR}: chama f(${i}, ${j - 1}).`, { i, j, pick: 'r', vars: { ...iv, esq, 'soma resto': sumR } });
    const r2 = f(i, j - 1), dir = sumR - r2;
    fr.note += ` dir=${dir}`;
    snap(L.dir, `f(${i}, ${j - 1}) voltou ${r2} → dir = ${sumR} − ${r2} = ${dir}.`, { i, j, pick: 'r', vars: { ...iv, esq, dir } });

    memo[idx] = Math.max(esq, dir); fr.note += ` → ${memo[idx]}`;
    snap(L.save, `Grava memo[${i}][${j}] = max(${esq}, ${dir}) = ${memo[idx]}, retorna e desempilha.`,
      { i, j, write: [idx], vars: { ...iv, esq, dir, 'memo[i][j]': memo[idx] } });
    stack.pop(); return memo[idx];
  };

  pre = sg7Prefix(stones, L, snap);
  snap(L.alloc, `malloc: memo com n×n = ${n * n} células vazias. Nada é calculado até alguém pedir.`);
  snap(L.call, `Chama f(0, ${n - 1}): a fila inteira, com Alice na vez.`);
  const ans = f(0, n - 1);
  snap(L.call, `f(0, ${n - 1}) = ${ans}: Alice termina ${ans} pontos à frente de Bob. ${calls} chamadas, ${hits} cache hits.`,
    { read: n > 1 ? [n - 1] : [], result: ans });
  return out;
}

if (typeof module !== 'undefined') module.exports = { SG7_STONES, SG7_CODE, sg7Matrix, sg7Array, sg7Memo };
