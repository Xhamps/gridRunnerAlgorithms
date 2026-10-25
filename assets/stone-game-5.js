// Stone Game V: generates one step per executed line, as a snapshot for the player.
// pre[k] = sum of the first k stones; dp[i][j] = most points Alice can still score on the row stones[i..j].
// Cutting after k: left = i..k, right = k+1..j. The larger part is thrown away, Alice scores the smaller one
// and keeps playing on it; on a tie she picks the better of the two.
// Runs in the browser (globals) and in node (module.exports) for the test.
if (typeof module !== 'undefined') globalThis.listing ??= require('./trace.js').listing;

const SG5_STONES = [1, 1, 2, 4, 8];

const SG5_CODE = {
  matriz: listing([
    ['pre', 'const pre = [0]; for (const v of stones) pre.push(pre.at(-1) + v)'],
    ['alloc', 'const dp = Array.from({ length: n }, () => Array(n))'],
    ['diag', 'for (let i = 0; i < n; i++) dp[i][i] = 0          // uma pedra: fim'],
    ['forlen', 'for (let len = 2; len <= n; len++)'],
    ['fori', '  for (let i = 0; i + len <= n; i++) {'],
    ['init', '    const j = i + len - 1; dp[i][j] = 0'],
    ['fork', '    for (let k = i; k < j; k++) {                // corta depois de k'],
    ['sums', '      const esq = pre[k+1] - pre[i], dir = pre[j+1] - pre[k+1]'],
    ['ifl', '      if (esq < dir) dp[i][j] = max(dp[i][j], esq + dp[i][k])'],
    ['ifr', '      else if (esq > dir) dp[i][j] = max(dp[i][j], dir + dp[k+1][j])'],
    ['tie', '      else dp[i][j] = max(dp[i][j], esq + max(dp[i][k], dp[k+1][j]))'],
    [null, '    }'],
    [null, '  }'],
    ['ret', 'return dp[0][n-1]'],
  ]),
  memo: listing([
    ['pre', 'const pre = [0]; for (const v of stones) pre.push(pre.at(-1) + v)'],
    ['alloc', 'const memo = Array.from({ length: n }, () => Array(n))'],
    ['fn', 'function f(i, j) {'],
    ['base', '  if (i === j) return 0                            // uma pedra: fim'],
    ['hit', '  if (memo[i][j] !== undefined) return memo[i][j]   // cache hit'],
    ['best', '  let best = 0'],
    ['fork', '  for (let k = i; k < j; k++) {                    // corta depois de k'],
    ['sums', '    const esq = pre[k+1] - pre[i], dir = pre[j+1] - pre[k+1]'],
    ['ifl', '    if (esq < dir) best = max(best, esq + f(i, k))'],
    ['ifr', '    else if (esq > dir) best = max(best, dir + f(k+1, j))'],
    ['tie', '    else best = max(best, esq + max(f(i, k), f(k+1, j)))'],
    [null, '  }'],
    ['save', '  return memo[i][j] = best'],
    [null, '}'],
    ['call', 'return f(0, n - 1)'],
  ]),
};

const sg5Prefix = (stones) => stones.reduce((p, v) => (p.push(p.at(-1) + v), p), [0]);
const sg5Row = (stones, i, j) => `[${stones.slice(i, j + 1)}]`;
const sg5PreMsg = (pre) => `Somas de prefixo: pre = [${pre}]. A soma de stones[a..b] sai em O(1): pre[b+1] − pre[a].`;
const sg5Cut = (stones, i, k, j) => `${sg5Row(stones, i, k)} | ${sg5Row(stones, k + 1, j)}`;

// n x n matrix, row-major. Only the triangle i <= j is used; filled by increasing length.
function sg5Matrix(stones = SG5_STONES) {
  const L = SG5_CODE.matriz.at, n = stones.length, pre = sg5Prefix(stones), dp = new Array(n * n).fill(null), out = [];
  const snap = (line, msg, s = {}) => out.push({ dp: dp.slice(), read: [], write: [], preRead: [], line, msg, ...s });

  snap(L.pre, sg5PreMsg(pre), { preRead: [...pre.keys()] });
  snap(L.alloc, `malloc: n×n = ${n * n} células. Só o triângulo i ≤ j será usado.`);
  for (let i = 0; i < n; i++) dp[i * n + i] = 0;
  snap(L.diag, 'Caso base: com uma pedra só o jogo acaba, e Alice não ganha mais nada. dp[i][i] = 0.',
    { write: [...Array(n).keys()].map((i) => i * n + i) });

  for (let len = 2; len <= n; len++) {
    snap(L.forlen, `len = ${len}: fileiras com ${len} pedras. As menores já estão prontas.`, { vars: { len } });
    for (let i = 0; i + len <= n; i++) {
      const j = i + len - 1, idx = i * n + j, row = sg5Row(stones, i, j);
      snap(L.fori, `i = ${i}: fileira ${row}.`, { i, j, vars: { len, i, fileira: row } });
      dp[idx] = 0;
      snap(L.init, `j = ${j}. dp[${i}][${j}] começa em 0 e vai guardar o melhor corte.`, { i, j, write: [idx], vars: { len, i, j, 'dp[i][j]': 0 } });
      for (let k = i; k < j; k++) {
        const v = { len, i, j, k, corte: sg5Cut(stones, i, k, j) };
        snap(L.fork, `k = ${k}: corta entre a posição ${k} e a ${k + 1} → ${v.corte}.`, { i, j, k, vars: v });
        const esq = pre[k + 1] - pre[i], dir = pre[j + 1] - pre[k + 1];
        const sv = { ...v, esq, dir };
        snap(L.sums, `esq = pre[${k + 1}] − pre[${i}] = ${pre[k + 1]} − ${pre[i]} = ${esq}; dir = pre[${j + 1}] − pre[${k + 1}] = ${pre[j + 1]} − ${pre[k + 1]} = ${dir}.`,
          { i, j, k, preRead: [i, k + 1, j + 1], vars: sv });
        const old = dp[idx], L1 = i * n + k, R1 = (k + 1) * n + j;
        const verdict = (got) => got > old ? `> ${old}: novo melhor.` : `≤ ${old}: fica ${old}.`;
        if (esq < dir) {
          const got = esq + dp[L1]; dp[idx] = Math.max(old, got);
          snap(L.ifl, `${esq} < ${dir}: Bob joga fora a direita. Alice marca ${esq} e segue na esquerda, que vale dp[${i}][${k}] = ${dp[L1]}. ` +
            `Total ${esq} + ${dp[L1]} = ${got} ${verdict(got)}`, { i, j, k, read: [L1], write: [idx], vars: { ...sv, total: got, 'dp[i][j]': dp[idx] } });
          continue;
        }
        snap(L.ifl, `${esq} < ${dir} é falso.`, { i, j, k, vars: sv });
        if (esq > dir) {
          const got = dir + dp[R1]; dp[idx] = Math.max(old, got);
          snap(L.ifr, `${esq} > ${dir}: Bob joga fora a esquerda. Alice marca ${dir} e segue na direita, que vale dp[${k + 1}][${j}] = ${dp[R1]}. ` +
            `Total ${dir} + ${dp[R1]} = ${got} ${verdict(got)}`, { i, j, k, read: [-1, R1], write: [idx], vars: { ...sv, total: got, 'dp[i][j]': dp[idx] } });
          continue;
        }
        snap(L.ifr, `${esq} > ${dir} é falso: empate.`, { i, j, k, vars: sv });
        const got = esq + Math.max(dp[L1], dp[R1]); dp[idx] = Math.max(old, got);
        snap(L.tie, `Empate ${esq} = ${dir}: Alice escolhe o lado. Esquerda vale dp[${i}][${k}] = ${dp[L1]}, direita dp[${k + 1}][${j}] = ${dp[R1]}. ` +
          `Total ${esq} + ${Math.max(dp[L1], dp[R1])} = ${got} ${verdict(got)}`, { i, j, k, read: [L1, R1], write: [idx], vars: { ...sv, total: got, 'dp[i][j]': dp[idx] } });
      }
    }
  }
  const ans = dp[n - 1];
  snap(L.ret, `Resposta: dp[0][${n - 1}] = ${ans} pontos para Alice.`, { read: [n - 1], result: ans });
  return out;
}

// Top-down: recursion + memo n x n. A step for each line, plus "chama" / "voltou" steps on the call line.
function sg5Memo(stones = SG5_STONES) {
  const L = SG5_CODE.memo.at, n = stones.length, pre = sg5Prefix(stones), memo = new Array(n * n).fill(null), stack = [], out = [];
  let calls = 0, hits = 0, maxDepth = 0;
  const snap = (line, msg, s = {}) => out.push({ dp: memo.slice(), stack: stack.map((f) => ({ ...f })), read: [], write: [], preRead: [], calls, hits, maxDepth, line, msg, ...s });

  const f = (i, j) => {
    const fr = { call: `f(${i}, ${j})`, note: '' };
    stack.push(fr); calls++; maxDepth = Math.max(maxDepth, stack.length);
    const idx = i * n + j, v = { i, j, fileira: sg5Row(stones, i, j) };
    snap(L.fn, `Entra em ${fr.call} sobre ${v.fileira}: empilha um frame (profundidade ${stack.length}).`, { i, j, vars: v });

    if (i === j) {
      fr.note = 'ret 0';
      snap(L.base, 'i = j: sobrou uma pedra, o jogo acaba. Retorna 0 sem usar o memo.', { i, j, vars: { ...v, ret: 0 } });
      stack.pop(); return 0;
    }
    snap(L.base, 'i ≠ j: ainda dá para cortar, não é caso base.', { i, j, vars: v });
    if (memo[idx] !== null) {
      hits++; fr.note = `hit → ${memo[idx]}`;
      snap(L.hit, `CACHE HIT: memo[${i}][${j}] = ${memo[idx]} já foi calculado. Retorna sem recursão.`, { i, j, read: [idx], vars: { ...v, 'memo[i][j]': memo[idx] } });
      stack.pop(); return memo[idx];
    }
    snap(L.hit, `memo[${i}][${j}] vazio: precisa calcular.`, { i, j, vars: v });

    let best = 0;
    snap(L.best, 'best = 0. Vamos testar cada corte possível.', { i, j, vars: { ...v, best } });
    for (let k = i; k < j; k++) {
      const kv = { ...v, k, corte: sg5Cut(stones, i, k, j), best };
      snap(L.fork, `k = ${k}: corta em ${kv.corte}.`, { i, j, k, vars: kv });
      const esq = pre[k + 1] - pre[i], dir = pre[j + 1] - pre[k + 1], sv = { ...kv, esq, dir };
      snap(L.sums, `esq = ${pre[k + 1]} − ${pre[i]} = ${esq}; dir = ${pre[j + 1]} − ${pre[k + 1]} = ${dir}.`, { i, j, k, preRead: [i, k + 1, j + 1], vars: sv });
      const old = best, verdict = (got) => got > old ? `> ${old}: novo melhor.` : `≤ ${old}: best fica ${old}.`;
      const done = (line, msg, got) => {
        best = Math.max(best, got); fr.note = `best=${best}`;
        snap(line, `${msg} Total ${got} ${verdict(got)}`, { i, j, k, vars: { ...sv, total: got, best } });
      };
      if (esq < dir) {
        snap(L.ifl, `${esq} < ${dir}: Bob joga fora a direita, Alice marca ${esq}. Chama f(${i}, ${k}) para a esquerda.`, { i, j, k, vars: sv });
        const x = f(i, k);
        done(L.ifl, `f(${i}, ${k}) voltou ${x}: ${esq} + ${x}.`, esq + x);
        continue;
      }
      snap(L.ifl, `${esq} < ${dir} é falso.`, { i, j, k, vars: sv });
      if (esq > dir) {
        snap(L.ifr, `${esq} > ${dir}: Bob joga fora a esquerda, Alice marca ${dir}. Chama f(${k + 1}, ${j}) para a direita.`, { i, j, k, vars: sv });
        const y = f(k + 1, j);
        done(L.ifr, `f(${k + 1}, ${j}) voltou ${y}: ${dir} + ${y}.`, dir + y);
        continue;
      }
      snap(L.ifr, `${esq} > ${dir} é falso: empate.`, { i, j, k, vars: sv });
      snap(L.tie, `Empate ${esq} = ${dir}: Alice pode ficar com qualquer lado. Chama f(${i}, ${k}) para a esquerda.`, { i, j, k, vars: sv });
      const x = f(i, k);
      snap(L.tie, `f(${i}, ${k}) voltou ${x}. Agora a direita: chama f(${k + 1}, ${j}).`, { i, j, k, vars: { ...sv, 'f esq': x } });
      const y = f(k + 1, j);
      done(L.tie, `f(${k + 1}, ${j}) voltou ${y}: ${esq} + max(${x}, ${y}).`, esq + Math.max(x, y));
    }
    memo[idx] = best; fr.note = `→ ${best}`;
    snap(L.save, `Grava memo[${i}][${j}] = ${best}, retorna e desempilha.`, { i, j, write: [idx], vars: { ...v, 'memo[i][j]': best } });
    stack.pop(); return best;
  };

  snap(L.pre, sg5PreMsg(pre), { preRead: [...pre.keys()] });
  snap(L.alloc, `malloc: memo com n×n = ${n * n} células vazias. Nada é calculado até alguém pedir.`);
  snap(L.call, `Chama f(0, ${n - 1}): a fileira inteira.`);
  const ans = f(0, n - 1);
  snap(L.call, `Resposta: ${ans} pontos para Alice. ${calls} chamadas, ${hits} cache hits.`, { read: n > 1 ? [n - 1] : [], result: ans });
  return out;
}

if (typeof module !== 'undefined') module.exports = { SG5_STONES, SG5_CODE, sg5Matrix, sg5Memo };
