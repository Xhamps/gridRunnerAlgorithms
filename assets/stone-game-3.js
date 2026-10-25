// Stone Game III: generates one step per executed line, as a snapshot for the player.
// dp[i] = best score difference (current player − rival) on the suffix vals[i..n-1], taking 1, 2 or 3 stones from the front.
// Runs in the browser (globals) and in node (module.exports) for the test.
if (typeof module !== 'undefined') globalThis.listing ??= require('./trace.js').listing;

const SG3_VALS = [1, 2, 3, 7];

const SG3_CODE = {
  array: listing([
    ['alloc', 'const dp = Array(n + 1)'],
    ['base', 'dp[n] = 0                              // sem pedras: diferença 0'],
    ['fori', 'for (let i = n - 1; i >= 0; i--) {'],
    ['init', '  dp[i] = -Infinity; let soma = 0'],
    ['fork', '  for (let k = 1; k <= 3 && i + k <= n; k++) {'],
    ['add', '    soma += vals[i + k - 1]              // pega k pedras'],
    ['upd', '    dp[i] = max(dp[i], soma - dp[i + k])  // rival joga do resto'],
    [null, '  }'],
    [null, '}'],
    ['ret', "return dp[0] > 0 ? 'Alice' : dp[0] < 0 ? 'Bob' : 'Tie'"],
  ]),
  vars: listing([
    ['init', 'let a = 0, b = 0, c = 0     // dp[i+1], dp[i+2], dp[i+3]'],
    ['fori', 'for (let i = n - 1; i >= 0; i--) {'],
    ['cur', '  let best = -Infinity, soma = 0'],
    ['fork', '  for (let k = 1; k <= 3 && i + k <= n; k++) {'],
    ['add', '    soma += vals[i + k - 1]'],
    ['upd', '    best = max(best, soma - [a, b, c][k - 1])'],
    [null, '  }'],
    ['shift', '  c = b; b = a; a = best       // desliza a janela'],
    [null, '}'],
    ['ret', "return a > 0 ? 'Alice' : a < 0 ? 'Bob' : 'Tie'"],
  ]),
  memo: listing([
    ['alloc', 'const memo = Array(n)'],
    ['fn', 'function f(i) {'],
    ['base', '  if (i === n) return 0                 // sem pedras'],
    ['hit', '  if (memo[i] !== undefined) return memo[i]   // cache hit'],
    ['init', '  let best = -Infinity, soma = 0'],
    ['fork', '  for (let k = 1; k <= 3 && i + k <= n; k++) {'],
    ['add', '    soma += vals[i + k - 1]'],
    ['upd', '    best = max(best, soma - f(i + k))'],
    [null, '  }'],
    ['save', '  return memo[i] = best'],
    [null, '}'],
    ['call', 'const d = f(0)'],
    ['ret', "return d > 0 ? 'Alice' : d < 0 ? 'Bob' : 'Tie'"],
  ]),
};

const sg3Verdict = (d) => d > 0 ? `${d} > 0 → Alice vence` : d < 0 ? `${d} < 0 → Bob vence` : '0 → empate (Tie)';
const sg3Winner = (d) => d > 0 ? 'Alice' : d < 0 ? 'Bob' : 'Tie';
const sg3Fmt = (v) => v === -Infinity ? '−∞' : v;

// Array of n+1: dp[i] = best difference for whoever plays from stone i on. Filled from the end.
function sg3Array(vals = SG3_VALS) {
  const L = SG3_CODE.array.at, n = vals.length, dp = new Array(n + 1).fill(null), out = [];
  const snap = (line, msg, s = {}) => out.push({ dp: dp.map(sg3Fmt), read: [], write: [], line, msg, ...s });

  snap(L.alloc, `malloc: ${n + 1} células, uma por ponto de partida (0..${n}). Memória ainda com lixo.`);
  dp[n] = 0;
  snap(L.base, `Caso base: a partir da posição ${n} não sobra pedra, ninguém ganha nada. dp[${n}] = 0.`, { write: [n] });
  for (let i = n - 1; i >= 0; i--) {
    snap(L.fori, `i = ${i}: o jogador da vez começa na pedra ${i} (valor ${vals[i]}). dp[${i + 1}..] já está pronto.`, { i, vars: { i } });
    dp[i] = -Infinity; let soma = 0;
    snap(L.init, `dp[${i}] começa em −∞ (qualquer jogada é melhor) e soma = 0.`, { i, write: [i], vars: { i, soma } });
    for (let k = 1; k <= 3 && i + k <= n; k++) {
      snap(L.fork, `k = ${k}: e se pegar ${k} pedra${k > 1 ? 's' : ''}?`, { i, k, vars: { i, k, soma } });
      soma += vals[i + k - 1];
      snap(L.add, `Soma a pedra ${i + k - 1} (${vals[i + k - 1]}): pegar ${k} dá ${soma} pontos.`, { i, k, vars: { i, k, soma } });
      const old = dp[i], cand = soma - dp[i + k];
      dp[i] = Math.max(old, cand);
      snap(L.upd, `O rival joga a partir de ${i + k} e consegue dp[${i + k}] = ${dp[i + k]} de vantagem. ` +
        `${soma} − ${dp[i + k]} = ${cand}${cand > old ? `, melhor que ${sg3Fmt(old)}` : `, não supera ${old}`}. dp[${i}] = ${dp[i]}.`,
        { i, k, read: [i + k, i], write: [i], vars: { i, k, soma, 'dp[i+k]': dp[i + k], candidato: cand, 'dp[i]': dp[i] } });
    }
  }
  snap(L.ret, `dp[0] = ${sg3Verdict(dp[0])}.`, { read: [0], result: sg3Winner(dp[0]) });
  return out;
}

// O(1): dp[i] only reads dp[i+1..i+3]. Heap cells: [a, b, c, best] (best is the temporary).
function sg3Vars(vals = SG3_VALS) {
  const L = SG3_CODE.vars.at, n = vals.length, cells = [null, null, null, null], out = [];
  const snap = (line, msg, s = {}) => out.push({ dp: cells.map(sg3Fmt), read: [], write: [], line, msg, ...s });
  const regs = () => ({ a: cells[0], b: cells[1], c: cells[2] });

  cells[0] = cells[1] = cells[2] = 0;
  snap(L.init, `a = dp[${n}] = 0 (sem pedras). b e c ficariam além do fim: o laço nunca os lê enquanto i + k > n.`,
    { write: [0, 1, 2], vars: regs() });
  for (let i = n - 1; i >= 0; i--) {
    snap(L.fori, `i = ${i}: a = dp[${i + 1}], b = dp[${i + 2}], c = dp[${i + 3}].`, { i, vars: { i, ...regs() } });
    cells[3] = -Infinity; let soma = 0;
    snap(L.cur, 'best = −∞, soma = 0.', { i, write: [3], vars: { i, ...regs(), best: '−∞', soma } });
    for (let k = 1; k <= 3 && i + k <= n; k++) {
      snap(L.fork, `k = ${k}: pegar ${k} pedra${k > 1 ? 's' : ''}.`, { i, k, vars: { i, k, ...regs(), soma } });
      soma += vals[i + k - 1];
      snap(L.add, `soma += ${vals[i + k - 1]} → ${soma}.`, { i, k, vars: { i, k, ...regs(), soma } });
      const old = cells[3], rival = cells[k - 1], cand = soma - rival;
      cells[3] = Math.max(old, cand);
      snap(L.upd, `${'abc'[k - 1]} = dp[${i + k}] = ${rival}: ${soma} − ${rival} = ${cand}. best = ${cells[3]}.`,
        { i, k, read: [k - 1, 3], write: [3], vars: { i, k, ...regs(), soma, candidato: cand, best: cells[3] } });
    }
    const dropped = cells[2];
    cells[2] = cells[1]; cells[1] = cells[0]; cells[0] = cells[3];
    snap(L.shift, `A janela anda uma pedra: a = dp[${i}] = ${cells[0]}, b = dp[${i + 1}], c = dp[${i + 2}]. O c antigo (${dropped}) some: ninguém vai lê-lo de novo.`,
      { i, read: [3], write: [0, 1, 2], vars: { i, ...regs() } });
  }
  snap(L.ret, `a = dp[0] = ${sg3Verdict(cells[0])}.`, { read: [0], result: sg3Winner(cells[0]) });
  return out;
}

// Top-down: recursion + memo of n. A step for each line, plus "chama"/"voltou" steps on the call line.
function sg3Memo(vals = SG3_VALS) {
  const L = SG3_CODE.memo.at, n = vals.length, memo = new Array(n).fill(null), stack = [], out = [];
  let calls = 0, hits = 0, maxDepth = 0;
  const snap = (line, msg, s = {}) => out.push({ dp: memo.slice(), stack: stack.map((f) => ({ ...f })), read: [], write: [], calls, hits, maxDepth, line, msg, ...s });

  const f = (i) => {
    const fr = { call: `f(${i})`, note: '' };
    stack.push(fr); calls++; maxDepth = Math.max(maxDepth, stack.length);
    snap(L.fn, `Entra em ${fr.call}: empilha um frame (profundidade ${stack.length}).`, { i, vars: { i } });
    if (i === n) {
      fr.note = 'ret 0';
      snap(L.base, `i = ${n}: acabaram as pedras, diferença 0. Retorna sem usar o memo.`, { i, vars: { i, ret: 0 } });
      stack.pop(); return 0;
    }
    snap(L.base, `i = ${i} < ${n}: ainda há pedras.`, { i, vars: { i } });
    if (memo[i] !== null) {
      hits++; fr.note = `hit → ${memo[i]}`;
      snap(L.hit, `CACHE HIT: memo[${i}] = ${memo[i]} já foi calculado. Retorna sem recursão.`, { i, read: [i], vars: { i, 'memo[i]': memo[i] } });
      stack.pop(); return memo[i];
    }
    snap(L.hit, `memo[${i}] vazio: precisa calcular.`, { i, vars: { i } });
    let best = -Infinity, soma = 0;
    snap(L.init, 'best = −∞, soma = 0.', { i, vars: { i, best: '−∞', soma } });
    for (let k = 1; k <= 3 && i + k <= n; k++) {
      snap(L.fork, `k = ${k}: pegar ${k} pedra${k > 1 ? 's' : ''}.`, { i, k, vars: { i, k, best: sg3Fmt(best), soma } });
      soma += vals[i + k - 1];
      snap(L.add, `soma += ${vals[i + k - 1]} → ${soma}.`, { i, k, vars: { i, k, best: sg3Fmt(best), soma } });
      snap(L.upd, `Chama f(${i + k}): quanto o rival consegue com o resto?`, { i, k, vars: { i, k, best: sg3Fmt(best), soma } });
      const r = f(i + k), cand = soma - r;
      best = Math.max(best, cand);
      fr.note = `best=${best}`;
      snap(L.upd, `f(${i + k}) voltou ${r} → ${soma} − ${r} = ${cand}. best = ${best}.`,
        { i, k, vars: { i, k, soma, [`f(${i + k})`]: r, candidato: cand, best } });
    }
    memo[i] = best; fr.note = `→ ${best}`;
    snap(L.save, `Grava memo[${i}] = ${best}, retorna e desempilha.`, { i, write: [i], vars: { i, 'memo[i]': best } });
    stack.pop(); return best;
  };

  snap(L.alloc, `malloc: memo com ${n} células vazias. Nada é calculado até alguém pedir.`);
  snap(L.call, 'Chama f(0): Alice joga a fila inteira.');
  const d = f(0);
  snap(L.call, `f(0) voltou ${d}. ${calls} chamadas, ${hits} cache hits.`, { read: n ? [0] : [], vars: { d } });
  snap(L.ret, `d = ${sg3Verdict(d)}.`, { read: n ? [0] : [], vars: { d }, result: sg3Winner(d) });
  return out;
}

if (typeof module !== 'undefined') module.exports = { SG3_VALS, SG3_CODE, sg3Array, sg3Vars, sg3Memo };
