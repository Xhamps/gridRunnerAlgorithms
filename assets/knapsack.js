// 0/1 Knapsack: generates one step per executed line, as a snapshot for the player.
// Runs in the browser (globals) and in node (module.exports) for the test.
if (typeof module !== 'undefined') globalThis.listing ??= require('./trace.js').listing;

const ITEMS = [
  { name: 'chip', w: 1, v: 1 },
  { name: 'implante', w: 3, v: 4 },
  { name: 'cyberdeck', w: 3, v: 5 },
  { name: 'katana', w: 3, v: 7 },
];
const CAP = 7;

const KNAPSACK_CODE = {
  matriz: listing([
    ['alloc', 'const dp = Array.from({ length: n + 1 }, () => Array(W + 1))'],
    ['base', 'for (let w = 0; w <= W; w++) dp[0][w] = 0              // caso base'],
    ['fori', 'for (let i = 1; i <= n; i++)'],
    ['forw', '  for (let w = 0; w <= W; w++)'],
    ['if', '    if (peso[i] > w) dp[i][w] = dp[i-1][w]               // não cabe: herda de cima'],
    ['else', '    else dp[i][w] = max(dp[i-1][w], dp[i-1][w - peso[i]] + valor[i])'],
    ['ret', 'return dp[n][W]'],
  ]),
  array: listing([
    ['alloc', 'const dp = Array(W + 1)'],
    ['fill', 'dp.fill(0)'],
    ['fori', 'for (let i = 1; i <= n; i++)'],
    ['forw', '  for (let w = W; w >= peso[i]; w--)   // reverso!'],
    ['upd', '    dp[w] = max(dp[w], dp[w - peso[i]] + valor[i])'],
    ['ret', 'return dp[W]'],
  ]),
  memo: listing([
    ['alloc', 'const memo = Array.from({ length: n + 1 }, () => Array(W + 1))'],
    ['fn', 'function f(i, w) {'],
    ['base', '  if (i === 0) return 0'],
    ['hit', '  if (memo[i][w] !== undefined) return memo[i][w]   // cache hit'],
    ['skip', '  let best = f(i - 1, w)                            // pular'],
    ['fits', '  if (peso[i] <= w)'],
    ['take', '    best = max(best, f(i - 1, w - peso[i]) + valor[i])   // pegar'],
    ['save', '  return memo[i][w] = best'],
    [null, '}'],
    ['call', 'return f(n, W)'],
  ]),
};

const itemLabel = (it) => `${it.name} (peso ${it.w}, valor ${it.v})`;

// Matrix (n+1) x (W+1). Memory modeled as a contiguous row-major block (like C / Int32Array).
function steps2D(items, W) {
  const L = KNAPSACK_CODE.matriz.at, n = items.length, cols = W + 1;
  const dp = new Array((n + 1) * cols).fill(null), out = [];
  const snap = (line, msg, s = {}) => out.push({ dp: dp.slice(), read: [], write: [], line, msg, ...s });

  snap(L.alloc, `malloc: ${(n + 1) * cols} células (${n + 1} linhas × ${cols} colunas). Memória ainda com lixo.`);
  for (let w = 0; w <= W; w++) dp[w] = 0;
  snap(L.base, 'Caso base: sem itens (i=0), o valor máximo é 0 para qualquer capacidade.', { write: [...Array(cols).keys()] });

  for (let i = 1; i <= n; i++) {
    const it = items[i - 1], item = itemLabel(it);
    snap(L.fori, `i = ${i}: a linha ${i} passa a considerar o item ${item}.`, { i, vars: { i, item } });
    for (let w = 0; w <= W; w++) {
      const idx = i * cols + w, up = (i - 1) * cols + w, skip = dp[up], v = { i, w, item };
      snap(L.forw, `w = ${w}: melhor valor com capacidade ${w} usando os itens 1..${i}.`, { i, vars: v });
      if (it.w > w) {
        dp[idx] = skip;
        snap(L.if, `${it.w} > ${w}: ${it.name} não cabe. Herda o valor de cima: dp[${i - 1}][${w}] = ${skip}.`,
          { i, read: [up], write: [idx], vars: { ...v, skip, 'dp[i][w]': skip } });
      } else {
        snap(L.if, `${it.w} > ${w}? Não: ${it.name} cabe, então vai para o else comparar pular × pegar.`, { i, vars: v });
        const diag = (i - 1) * cols + w - it.w, take = dp[diag] + it.v;
        dp[idx] = Math.max(skip, take);
        snap(L.else, `Pular = dp[${i - 1}][${w}] = ${skip} · Pegar = dp[${i - 1}][${w - it.w}] + ${it.v} = ${take} → ${take > skip ? 'PEGAR' : 'PULAR'} (${dp[idx]}).`,
          { i, read: [up, diag], write: [idx], vars: { ...v, skip, take, 'dp[i][w]': dp[idx] } });
      }
    }
  }
  snap(L.ret, `Resposta: dp[${n}][${W}] = ${dp[n * cols + W]}.`, { read: [n * cols + W], result: dp[n * cols + W] });
  return out;
}

// Single array of W+1. gen[w] = which item (i) last wrote that cell.
function steps1D(items, W) {
  const L = KNAPSACK_CODE.array.at, n = items.length;
  const dp = new Array(W + 1).fill(null), gen = new Array(W + 1).fill(null), out = [];
  const snap = (line, msg, s = {}) => out.push({ dp: dp.slice(), gen: gen.slice(), read: [], write: [], line, msg, ...s });

  snap(L.alloc, `malloc: só ${W + 1} células. A mesma linha é reaproveitada para cada item.`);
  dp.fill(0); gen.fill(0);
  snap(L.fill, 'Caso base: tudo 0 (equivale à linha i=0 da matriz).', { write: [...dp.keys()] });

  for (let i = 1; i <= n; i++) {
    const it = items[i - 1], item = itemLabel(it);
    snap(L.fori, `i = ${i}: ${item}. w vai de ${W} até ${it.w}. As células 0..${it.w - 1} ficam intactas` +
      ` (ali o item não cabe, então o valor da rodada anterior já é o certo).`, { i, vars: { i, item } });
    for (let w = W; w >= it.w; w--) {
      snap(L.forw, `w = ${w} (descendo). dp[${w - it.w}] ainda não foi tocado nesta rodada.`, { i, vars: { i, w, item } });
      const skip = dp[w], take = dp[w - it.w] + it.v;
      dp[w] = Math.max(skip, take); gen[w] = i;
      snap(L.upd, `dp[${w - it.w}] ainda é da rodada i=${gen[w - it.w]}. Pular = ${skip} · Pegar = ${take - it.v} + ${it.v} = ${take} → ${dp[w]}.`,
        { i, read: [w, w - it.w], write: [w], vars: { i, w, item, skip, take, 'dp[w]': dp[w] } });
    }
  }
  snap(L.ret, `Resposta: dp[${W}] = ${dp[W]}.`, { read: [W], result: dp[W] });
  return out;
}

// Top-down: recursion + memo (n+1) x (W+1). A step for each line, plus one when a recursive call returns.
function stepsMemo(items, W) {
  const L = KNAPSACK_CODE.memo.at, n = items.length, cols = W + 1;
  const memo = new Array((n + 1) * cols).fill(null), stack = [], out = [];
  let calls = 0, hits = 0, maxDepth = 0;
  const snap = (line, msg, s = {}) => out.push({ dp: memo.slice(), stack: stack.map((f) => ({ ...f })), read: [], write: [], calls, hits, maxDepth, line, msg, ...s });

  const f = (i, w) => {
    const fr = { call: `f(${i}, ${w})`, note: '' };
    stack.push(fr); calls++; maxDepth = Math.max(maxDepth, stack.length);
    const idx = i * cols + w, it = items[i - 1], item = it && itemLabel(it), v = { i, w, item };
    snap(L.fn, `Entra em ${fr.call}: empilha um frame (profundidade ${stack.length}).`, { i, vars: v });

    if (i === 0) {
      fr.note = 'ret 0';
      snap(L.base, `i = 0: sem itens → retorna 0 (caso base, não usa o memo).`, { i, vars: { ...v, ret: 0 } });
      stack.pop(); return 0;
    }
    snap(L.base, `i = ${i} ≠ 0: não é caso base.`, { i, vars: v });
    if (memo[idx] !== null) {
      hits++; fr.note = `hit → ${memo[idx]}`;
      snap(L.hit, `CACHE HIT: memo[${i}][${w}] = ${memo[idx]} já foi calculado. Retorna sem recursão.`, { i, read: [idx], vars: { ...v, 'memo[i][w]': memo[idx] } });
      stack.pop(); return memo[idx];
    }
    snap(L.hit, `memo[${i}][${w}] vazio: precisa calcular.`, { i, vars: v });

    snap(L.skip, `Pular ${it.name}: chama f(${i - 1}, ${w}).`, { i, vars: v });
    let best = f(i - 1, w);
    fr.note = `pular=${best}`;
    snap(L.skip, `f(${i - 1}, ${w}) voltou ${best} → best = ${best}.`, { i, vars: { ...v, best } });

    const fits = it.w <= w;
    snap(L.fits, `${it.w} <= ${w}? ${fits ? 'Sim: dá para tentar pegar.' : `Não: ${it.name} não cabe.`}`, { i, vars: { ...v, best } });
    if (fits) {
      snap(L.take, `Pegar ${it.name}: chama f(${i - 1}, ${w - it.w}).`, { i, vars: { ...v, best } });
      const sub = f(i - 1, w - it.w), take = sub + it.v;
      fr.note += ` pegar=${take}`;
      snap(L.take, `f(${i - 1}, ${w - it.w}) voltou ${sub}. Pegar = ${sub} + ${it.v} = ${take} → best = max(${best}, ${take}) = ${Math.max(best, take)}.`,
        { i, vars: { ...v, best: Math.max(best, take), take } });
      best = Math.max(best, take);
    }
    memo[idx] = best; fr.note += ` → ${best}`;
    snap(L.save, `Grava memo[${i}][${w}] = ${best}, retorna e desempilha.`, { i, write: [idx], vars: { ...v, 'memo[i][w]': best } });
    stack.pop(); return best;
  };

  snap(L.alloc, `malloc: memo com ${(n + 1) * cols} células vazias. Nada é calculado até alguém pedir.`);
  snap(L.call, `Chama f(${n}, ${W}): a pergunta final é o ponto de partida.`);
  const ans = f(n, W);
  const used = memo.filter((v) => v !== null).length;
  snap(L.call, `Resposta: ${ans}. ${calls} chamadas, ${hits} cache hits, só ${used}/${memo.length} células do memo foram necessárias.`,
    { read: [n * cols + W], result: ans });
  return out;
}

if (typeof module !== 'undefined') module.exports = { ITEMS, CAP, KNAPSACK_CODE, steps2D, steps1D, stepsMemo };
