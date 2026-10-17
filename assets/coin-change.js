// Coin Change: generates one step per executed line, as a snapshot for the player.
// Minimum number of coins (each coin can be reused) to make the amount; -1 when impossible.
// Runs in the browser (globals) and in node (module.exports) for the test.
if (typeof module !== 'undefined') globalThis.listing ??= require('./trace.js').listing;

const COINS = [1, 3, 4];
const AMOUNT = 6;

const COIN_CODE = {
  matriz: listing([
    ['alloc', 'const dp = Array.from({ length: n + 1 }, () => Array(A + 1))'],
    ['base', 'for (let a = 0; a <= A; a++) dp[0][a] = a === 0 ? 0 : Infinity   // sem moedas'],
    ['fori', 'for (let i = 1; i <= n; i++)'],
    ['fora', '  for (let a = 0; a <= A; a++)'],
    ['if', '    if (moeda[i] > a) dp[i][a] = dp[i-1][a]                 // não cabe: herda de cima'],
    ['else', '    else dp[i][a] = min(dp[i-1][a], dp[i][a - moeda[i]] + 1)   // mesma linha!'],
    ['ret', 'return dp[n][A] === Infinity ? -1 : dp[n][A]'],
  ]),
  array: listing([
    ['alloc', 'const dp = Array(A + 1)'],
    ['fill', 'dp.fill(Infinity); dp[0] = 0'],
    ['fori', 'for (let i = 1; i <= n; i++)'],
    ['fora', '  for (let a = moeda[i]; a <= A; a++)   // para frente!'],
    ['upd', '    dp[a] = min(dp[a], dp[a - moeda[i]] + 1)'],
    ['ret', 'return dp[A] === Infinity ? -1 : dp[A]'],
  ]),
  memo: listing([
    ['alloc', 'const memo = Array(A + 1)'],
    ['fn', 'function f(a) {'],
    ['base', '  if (a === 0) return 0'],
    ['hit', '  if (memo[a] !== undefined) return memo[a]   // cache hit'],
    ['init', '  let best = Infinity'],
    ['forc', '  for (const m of moedas)'],
    ['fits', '    if (m <= a)'],
    ['try', '      best = min(best, f(a - m) + 1)'],
    ['save', '  return memo[a] = best'],
    [null, '}'],
    ['call', 'const r = f(A); return r === Infinity ? -1 : r'],
  ]),
};

const inf = (v) => v === Infinity ? '∞' : v;
const answer = (v) => v === Infinity ? -1 : v;

// Matrix (n+1) x (A+1), row-major. Unbounded: "take" reads the SAME row, so a coin can be reused.
function coin2D(coins, A) {
  const L = COIN_CODE.matriz.at, n = coins.length, cols = A + 1;
  const dp = new Array((n + 1) * cols).fill(null), out = [];
  const snap = (line, msg, s = {}) => out.push({ dp: dp.map(inf), read: [], write: [], line, msg, ...s });

  snap(L.alloc, `malloc: ${(n + 1) * cols} células (${n + 1} linhas × ${cols} colunas). Memória ainda com lixo.`);
  for (let a = 0; a <= A; a++) dp[a] = a === 0 ? 0 : Infinity;
  snap(L.base, 'Caso base: sem moedas, só o valor 0 é possível (0 moedas). O resto é ∞ (impossível).', { write: [...Array(cols).keys()] });

  for (let i = 1; i <= n; i++) {
    const c = coins[i - 1];
    snap(L.fori, `i = ${i}: a linha ${i} pode usar as moedas ${coins.slice(0, i)}. Moeda nova: ${c}.`, { i, vars: { i, moeda: c } });
    for (let a = 0; a <= A; a++) {
      const idx = i * cols + a, up = (i - 1) * cols + a, skip = dp[up], v = { i, a, moeda: c };
      snap(L.fora, `a = ${a}: menos moedas para formar ${a} usando as moedas ${coins.slice(0, i)}.`, { i, vars: v });
      if (c > a) {
        dp[idx] = skip;
        snap(L.if, `${c} > ${a}: a moeda ${c} não cabe. Herda de cima: dp[${i - 1}][${a}] = ${inf(skip)}.`,
          { i, read: [up], write: [idx], vars: { ...v, 'sem ela': inf(skip), 'dp[i][a]': inf(skip) } });
      } else {
        snap(L.if, `${c} > ${a}? Não: a moeda ${c} cabe, então vai para o else comparar sem ela × com ela.`, { i, vars: v });
        const left = idx - c, take = dp[left] + 1;
        dp[idx] = Math.min(skip, take);
        snap(L.else, `Sem ela = dp[${i - 1}][${a}] = ${inf(skip)} · Com ela = dp[${i}][${a - c}] + 1 = ${inf(take)}. ` +
          `dp[${i}][${a - c}] é da MESMA linha, então já pode conter a moeda ${c}: é assim que ela é reusada. → ${inf(dp[idx])}.`,
          { i, read: [up, left], write: [idx], vars: { ...v, 'sem ela': inf(skip), 'com ela': inf(take), 'dp[i][a]': inf(dp[idx]) } });
      }
    }
  }
  const last = n * cols + A, ans = answer(dp[last]);
  snap(L.ret, `Resposta: dp[${n}][${A}] = ${inf(dp[last])} → ${ans}.`, { read: [last], result: ans });
  return out;
}

// Single array of A+1. a goes FORWARD: dp[a - coin] is already from this round, so the coin can repeat.
function coin1D(coins, A) {
  const L = COIN_CODE.array.at, n = coins.length;
  const dp = new Array(A + 1).fill(null), gen = new Array(A + 1).fill(null), out = [];
  const snap = (line, msg, s = {}) => out.push({ dp: dp.map(inf), gen: gen.slice(), read: [], write: [], line, msg, ...s });

  snap(L.alloc, `malloc: só ${A + 1} células. A mesma linha é reaproveitada para cada moeda.`);
  dp.fill(Infinity); dp[0] = 0; gen.fill(0);
  snap(L.fill, 'Caso base: dp[0] = 0, o resto ∞ (equivale à linha i=0 da matriz).', { write: [...dp.keys()] });

  for (let i = 1; i <= n; i++) {
    const c = coins[i - 1];
    snap(L.fori, `i = ${i}: moeda ${c}. a vai de ${c} até ${A}, PARA FRENTE. As células 0..${c - 1} ficam intactas` +
      ` (ali a moeda não cabe).`, { i, vars: { i, moeda: c } });
    for (let a = c; a <= A; a++) {
      snap(L.fora, `a = ${a} (subindo). dp[${a - c}] já foi atualizado nesta rodada, se ${a - c} ≥ ${c}.`, { i, vars: { i, a, moeda: c } });
      const skip = dp[a], take = dp[a - c] + 1, fresh = gen[a - c] === i;
      dp[a] = Math.min(skip, take); gen[a] = i;
      snap(L.upd, `dp[${a - c}] é da rodada i=${gen[a - c]}${fresh ? ` (esta!): já pode conter a moeda ${c}, que assim é usada de novo` : ''}. ` +
        `Sem ela = ${inf(skip)} · Com ela = ${inf(dp[a - c])} + 1 = ${inf(take)} → ${inf(dp[a])}.`,
        { i, read: [a, a - c], write: [a], vars: { i, a, moeda: c, 'sem ela': inf(skip), 'com ela': inf(take), 'dp[a]': inf(dp[a]) } });
    }
  }
  const ans = answer(dp[A]);
  snap(L.ret, `Resposta: dp[${A}] = ${inf(dp[A])} → ${ans}.`, { read: [A], result: ans });
  return out;
}

// Top-down f(a): only the amount matters (any coin can be used at any time), so the memo is 1D.
function coinMemo(coins, A) {
  const L = COIN_CODE.memo.at, memo = new Array(A + 1).fill(null), stack = [], out = [];
  let calls = 0, hits = 0, maxDepth = 0;
  const snap = (line, msg, s = {}) => out.push({ dp: memo.map(inf), stack: stack.map((f) => ({ ...f })), read: [], write: [], calls, hits, maxDepth, line, msg, ...s });

  const f = (a) => {
    const fr = { call: `f(${a})`, note: '' };
    stack.push(fr); calls++; maxDepth = Math.max(maxDepth, stack.length);
    snap(L.fn, `Entra em ${fr.call}: empilha um frame (profundidade ${stack.length}).`, { a, vars: { a } });

    if (a === 0) {
      fr.note = 'ret 0';
      snap(L.base, 'a = 0: valor já formado, 0 moedas (caso base, não usa o memo).', { a, vars: { a, ret: 0 } });
      stack.pop(); return 0;
    }
    snap(L.base, `a = ${a} ≠ 0: não é caso base.`, { a, vars: { a } });
    if (memo[a] !== null) {
      hits++; fr.note = `hit → ${inf(memo[a])}`;
      snap(L.hit, `CACHE HIT: memo[${a}] = ${inf(memo[a])} já foi calculado. Retorna sem recursão.`, { a, read: [a], vars: { a, 'memo[a]': inf(memo[a]) } });
      stack.pop(); return memo[a];
    }
    snap(L.hit, `memo[${a}] vazio: precisa calcular.`, { a, vars: { a } });

    let best = Infinity;
    snap(L.init, 'best = ∞: ainda nenhuma forma conhecida.', { a, vars: { a, best: '∞' } });
    for (let k = 0; k < coins.length; k++) {
      const m = coins[k], v = { a, m, best: inf(best) };
      snap(L.forc, `m = ${m}: tenta usar a moeda ${m} como a primeira.`, { a, m: k, vars: v });
      const fits = m <= a;
      snap(L.fits, `${m} <= ${a}? ${fits ? 'Sim: dá para usar.' : `Não: passaria do valor.`}`, { a, m: k, vars: v });
      if (!fits) continue;
      snap(L.try, `Usa a moeda ${m}: chama f(${a - m}) para o resto.`, { a, m: k, vars: v });
      const sub = f(a - m), cand = sub + 1;
      fr.note = `best=${inf(Math.min(best, cand))}`;
      snap(L.try, `f(${a - m}) voltou ${inf(sub)} → ${inf(sub)} + 1 = ${inf(cand)}. best = min(${inf(best)}, ${inf(cand)}) = ${inf(Math.min(best, cand))}.`,
        { a, m: k, vars: { ...v, 'f(a-m)+1': inf(cand), best: inf(Math.min(best, cand)) } });
      best = Math.min(best, cand);
    }
    memo[a] = best; fr.note = `→ ${inf(best)}`;
    snap(L.save, `Grava memo[${a}] = ${inf(best)}, retorna e desempilha.`, { a, write: [a], vars: { a, 'memo[a]': inf(best) } });
    stack.pop(); return best;
  };

  snap(L.alloc, `malloc: memo com ${A + 1} células vazias. Nada é calculado até alguém pedir.`);
  snap(L.call, `Chama f(${A}): a pergunta final é o ponto de partida.`);
  const r = f(A), ans = answer(r);
  snap(L.call, `f(${A}) = ${inf(r)} → resposta ${ans}. ${calls} chamadas, ${hits} cache hits.`, { read: A > 0 ? [A] : [], result: ans });
  return out;
}

if (typeof module !== 'undefined') module.exports = { COINS, AMOUNT, COIN_CODE, coin2D, coin1D, coinMemo };
