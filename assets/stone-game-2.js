// Stone Game II: one step per executed line, as a snapshot for the player.
// dp[i][M] = most stones the player to move collects from piles[i..] when they may take 1..2M piles.
// Every stone of the suffix goes to one of the two players, so: dp[i][M] = suf[i] − (best the rival does next).
// Runs in the browser (globals) and in node (module.exports) for the test.
if (typeof module !== 'undefined') globalThis.listing ??= require('./trace.js').listing;

// ponytail: n = 7 is the smallest size where the memo gets real cache hits (with n ≤ 6 every state is visited once).
const SG2_PILES = [3, 1, 4, 1, 5, 9, 2];

const SG2_CODE = {
  matriz: listing([
    ['alloc', 'const dp = Array.from({ length: n }, () => Array(n + 1))'],
    ['suf', 'for (let i = n - 1; i >= 0; i--) suf[i] = suf[i+1] + piles[i]'],
    ['fori', 'for (let i = n - 1; i >= 0; i--)'],
    ['forM', '  for (let M = 1; M <= n; M++) {'],
    ['base', '    if (i + 2*M >= n) { dp[i][M] = suf[i]; continue }   // pega tudo'],
    ['init', '    let menor = Infinity            // o que sobra de melhor para o rival'],
    ['forX', '    for (let X = 1; X <= 2*M; X++)'],
    ['min', '      menor = min(menor, dp[i+X][max(M, X)])'],
    ['upd', '    dp[i][M] = suf[i] - menor'],
    [null, '  }'],
    ['ret', 'return dp[0][1]'],
  ]),
  memo: listing([
    ['suf', 'for (let i = n - 1; i >= 0; i--) suf[i] = suf[i+1] + piles[i]'],
    ['alloc', 'const memo = Array.from({ length: n }, () => Array(n + 1))'],
    ['fn', 'function f(i, M) {'],
    ['hit', '  if (memo[i][M] !== undefined) return memo[i][M]   // cache hit'],
    ['base', '  if (i + 2*M >= n) return memo[i][M] = suf[i]     // pega tudo'],
    ['init', '  let menor = Infinity'],
    ['forX', '  for (let X = 1; X <= 2*M; X++)'],
    ['rec', '    menor = min(menor, f(i + X, max(M, X)))'],
    ['save', '  return memo[i][M] = suf[i] - menor'],
    [null, '}'],
    ['call', 'return f(0, 1)'],
  ]),
};

function sg2Suffix(piles) {
  const suf = new Array(piles.length + 1).fill(0);
  for (let i = piles.length - 1; i >= 0; i--) suf[i] = suf[i + 1] + piles[i];
  return suf;
}

// n rows (i) × n+1 columns (M), row-major. Column M = 0 is never used.
function sg2Matrix(piles = SG2_PILES) {
  const L = SG2_CODE.matriz.at, n = piles.length, W = n + 1, dp = new Array(n * W).fill(null), out = [];
  let suf = null;
  const snap = (line, msg, s = {}) => out.push({ dp: dp.slice(), suf, read: [], write: [], line, msg, ...s });

  snap(L.alloc, `malloc: ${n} linhas (i) × ${W} colunas (M) = ${n * W} células. A coluna M = 0 nunca é usada.`);
  suf = sg2Suffix(piles);
  snap(L.suf, `Somas de sufixo: suf[i] = pedras de piles[i..] (total ${suf[0]}). Toda pedra do sufixo vai para um dos dois jogadores.`);

  for (let i = n - 1; i >= 0; i--) {
    snap(L.fori, `i = ${i}: sobram as pilhas ${i}..${n - 1} (${suf[i]} pedras). De baixo para cima, porque dp[i] lê linhas maiores.`, { i, vars: { i, 'suf[i]': suf[i] } });
    for (let M = 1; M <= n; M++) {
      const k = i * W + M, v = { i, M, 'suf[i]': suf[i] };
      snap(L.forM, `M = ${M}: o jogador da vez pode pegar de 1 a ${2 * M} pilhas.`, { i, M, vars: v });
      if (i + 2 * M >= n) {
        dp[k] = suf[i];
        snap(L.base, `${i} + ${2 * M} ≥ ${n}: dá para pegar todas as pilhas que sobram de uma vez. dp[${i}][${M}] = suf[${i}] = ${suf[i]}.`,
          { i, M, write: [k], vars: { ...v, 'dp[i][M]': suf[i] } });
        continue;
      }
      snap(L.base, `${i} + ${2 * M} < ${n}: não dá para pegar tudo. Testa cada X.`, { i, M, vars: v });
      let menor = Infinity;
      snap(L.init, 'menor = ∞: vamos procurar o X que deixa o rival com o mínimo possível.', { i, M, vars: { ...v, menor: '∞' } });
      for (let X = 1; X <= 2 * M; X++) {
        const nm = Math.max(M, X), r = (i + X) * W + nm;
        snap(L.forX, `X = ${X}: pega as pilhas ${i}..${i + X - 1}. O rival recebe i = ${i + X} com M = max(${M}, ${X}) = ${nm}.`,
          { i, M, X, vars: { ...v, menor: menor === Infinity ? '∞' : menor, X } });
        const was = menor;
        menor = Math.min(menor, dp[r]);
        snap(L.min, `O rival consegue dp[${i + X}][${nm}] = ${dp[r]}. menor = min(${was === Infinity ? '∞' : was}, ${dp[r]}) = ${menor}.`,
          { i, M, X, read: [r], vars: { ...v, menor, X } });
      }
      dp[k] = suf[i] - menor;
      snap(L.upd, `O rival fica com ${menor} das ${suf[i]} pedras; o jogador da vez fica com o resto: dp[${i}][${M}] = ${suf[i]} − ${menor} = ${dp[k]}.`,
        { i, M, write: [k], vars: { ...v, menor, 'dp[i][M]': dp[k] } });
    }
  }
  const ans = dp[1];
  snap(L.ret, `Resposta: dp[0][1] = ${ans}. Alice começa na pilha 0 com M = 1 e garante ${ans} pedras (Bob fica com ${suf[0] - ans}).`,
    { read: [1], result: ans });
  return out;
}

// Top-down: f(i, M) with memo n × (n+1). The cache is checked first, so base results are cached too.
function sg2Memo(piles = SG2_PILES) {
  const L = SG2_CODE.memo.at, n = piles.length, W = n + 1, memo = new Array(n * W).fill(null), stack = [], out = [];
  let calls = 0, hits = 0, maxDepth = 0, suf = null;
  const snap = (line, msg, s = {}) => out.push({ dp: memo.slice(), suf, stack: stack.map((f) => ({ ...f })), read: [], write: [], calls, hits, maxDepth, line, msg, ...s });

  const f = (i, M) => {
    const fr = { call: `f(${i}, ${M})`, note: '' }, k = i * W + M, v = { i, M, 'suf[i]': suf[i] };
    stack.push(fr); calls++; maxDepth = Math.max(maxDepth, stack.length);
    snap(L.fn, `Entra em ${fr.call}: sobram as pilhas ${i}..${n - 1}, pode pegar de 1 a ${2 * M}. Empilha um frame (profundidade ${stack.length}).`, { i, M, vars: v });

    if (memo[k] !== null) {
      hits++; fr.note = `hit → ${memo[k]}`;
      snap(L.hit, `CACHE HIT: memo[${i}][${M}] = ${memo[k]} já foi calculado por outro caminho. Retorna sem recursão.`, { i, M, read: [k], vars: { ...v, 'memo[i][M]': memo[k] } });
      stack.pop(); return memo[k];
    }
    snap(L.hit, `memo[${i}][${M}] vazio: precisa calcular.`, { i, M, vars: v });

    if (i + 2 * M >= n) {
      memo[k] = suf[i]; fr.note = `tudo → ${suf[i]}`;
      snap(L.base, `${i} + ${2 * M} ≥ ${n}: pega todas as pilhas que sobram. Grava memo[${i}][${M}] = suf[${i}] = ${suf[i]} e retorna.`,
        { i, M, write: [k], vars: { ...v, 'memo[i][M]': suf[i] } });
      stack.pop(); return memo[k];
    }
    snap(L.base, `${i} + ${2 * M} < ${n}: não dá para pegar tudo.`, { i, M, vars: v });

    let menor = Infinity;
    snap(L.init, 'menor = ∞: o menor total que o rival consegue depois da nossa jogada.', { i, M, vars: { ...v, menor: '∞' } });
    for (let X = 1; X <= 2 * M; X++) {
      const nm = Math.max(M, X), show = () => (menor === Infinity ? '∞' : menor);
      snap(L.forX, `X = ${X}: pega as pilhas ${i}..${i + X - 1}.`, { i, M, X, vars: { ...v, menor: show(), X } });
      snap(L.rec, `Chama f(${i + X}, ${nm}): quanto o rival consegue a partir da pilha ${i + X} com M = ${nm}.`, { i, M, X, vars: { ...v, menor: show(), X } });
      const r = f(i + X, nm), was = show();
      menor = Math.min(menor, r);
      fr.note = `X=${X} menor=${menor}`;
      snap(L.rec, `f(${i + X}, ${nm}) voltou ${r} → menor = min(${was}, ${r}) = ${menor}.`, { i, M, X, vars: { ...v, menor, X } });
    }
    memo[k] = suf[i] - menor; fr.note = `→ ${memo[k]}`;
    snap(L.save, `Grava memo[${i}][${M}] = ${suf[i]} − ${menor} = ${memo[k]}, retorna e desempilha.`,
      { i, M, write: [k], vars: { ...v, menor, 'memo[i][M]': memo[k] } });
    stack.pop(); return memo[k];
  };

  suf = sg2Suffix(piles);
  snap(L.suf, `Somas de sufixo: suf[i] = pedras de piles[i..] (total ${suf[0]}).`);
  snap(L.alloc, `malloc: memo com ${n} × ${W} = ${n * W} células vazias. Nada é calculado até alguém pedir.`);
  snap(L.call, 'Chama f(0, 1): Alice na vez, todas as pilhas, M = 1.');
  const ans = f(0, 1);
  snap(L.call, `f(0, 1) = ${ans}: Alice garante ${ans} pedras (Bob fica com ${suf[0] - ans}). ${calls} chamadas, ${hits} cache hits.`,
    { read: [1], result: ans });
  return out;
}

if (typeof module !== 'undefined') module.exports = { SG2_PILES, SG2_CODE, sg2Matrix, sg2Memo };
