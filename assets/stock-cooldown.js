// Stock with Cooldown: generates one step per executed line, as a snapshot for the player.
// State machine per day: hold (holding the share), sold (sold today → cooldown tomorrow), rest (free to buy).
// Runs in the browser (globals) and in node (module.exports) for the test.
if (typeof module !== 'undefined') globalThis.listing ??= require('./trace.js').listing;

const PRICES = [1, 2, 3, 0, 2];

const STOCK_CODE = {
  matriz: listing([
    ['alloc', 'const dp = Array.from({ length: n }, () => Array(3))   // [hold, sold, rest]'],
    ['init', 'dp[0] = [-prices[0], 0, 0]'],
    ['fori', 'for (let i = 1; i < n; i++) {'],
    ['hold', '  hold[i] = max(hold[i-1], rest[i-1] - prices[i])   // segurar | comprar'],
    ['sold', '  sold[i] = hold[i-1] + prices[i]                   // vender'],
    ['rest', '  rest[i] = max(rest[i-1], sold[i-1])               // descansar | fim do cooldown'],
    [null, '}'],
    ['ret', 'return max(sold[n-1], rest[n-1])'],
  ]),
  array: listing([
    ['init', 'let hold = -prices[0], sold = 0, rest = 0'],
    ['fori', 'for (let i = 1; i < n; i++) {'],
    ['tmp', '  const tmp = sold                     // salva sold antigo: quebra o ciclo'],
    ['sold', '  sold = hold + prices[i]              // hold ainda é de ontem'],
    ['hold', '  hold = max(hold, rest - prices[i])   // rest ainda é de ontem'],
    ['rest', '  rest = max(rest, tmp)                // sold já é de hoje → usa tmp'],
    [null, '}'],
    ['ret', 'return max(sold, rest)'],
  ]),
  memo: listing([
    ['alloc', 'const memo = Array.from({ length: n }, () => Array(2))   // [livre, segurando]'],
    ['fn', 'function f(i, h) {'],
    ['base', '  if (i >= n) return 0'],
    ['hit', '  if (memo[i][h] !== undefined) return memo[i][h]   // cache hit'],
    ['wait', '  const esperar = f(i + 1, h)'],
    ['sell', '  const agir = h ? prices[i] + f(i + 2, 0)          // vender + cooldown'],
    ['buy', '                 : f(i + 1, 1) - prices[i]          // comprar'],
    ['save', '  return memo[i][h] = max(esperar, agir)'],
    [null, '}'],
    ['call', 'return f(0, 0)'],
  ]),
};

// Matrix n x 3, row-major: dp[i] = [hold, sold, rest].
function stock2D(p) {
  const L = STOCK_CODE.matriz.at, n = p.length, dp = new Array(n * 3).fill(null), out = [];
  const at = (i, s) => i * 3 + s; // s: 0 hold, 1 sold, 2 rest
  const snap = (line, msg, s = {}) => out.push({ dp: dp.slice(), read: [], write: [], line, msg, ...s });

  snap(L.alloc, `malloc: n×3 = ${n * 3} células, uma linha por dia: [hold, sold, rest].`);
  dp[0] = -p[0]; dp[1] = 0; dp[2] = 0;
  snap(L.init, `Dia 0: quem segura a ação comprou hoje → hold = −${p[0]}. Nada vendido ainda: sold = rest = 0.`,
    { i: 0, write: [0, 1, 2], vars: { dia: 0, preço: p[0] } });

  for (let i = 1; i < n; i++) {
    const day = { dia: i, preço: p[i] };
    snap(L.fori, `i = ${i}: dia ${i}, preço ${p[i]}. Cada estado de hoje depende só de ontem (linha ${i - 1}).`, { i, vars: day });

    const keep = dp[at(i - 1, 0)], buy = dp[at(i - 1, 2)] - p[i];
    dp[at(i, 0)] = Math.max(keep, buy);
    snap(L.hold, `hold[${i}]: continuar segurando = ${keep} · comprar hoje = rest[${i - 1}] − ${p[i]} = ${buy} → ${dp[at(i, 0)]}.`,
      { i, read: [at(i - 1, 0), at(i - 1, 2)], write: [at(i, 0)], vars: { ...day, segurar: keep, comprar: buy, 'hold[i]': dp[at(i, 0)] } });

    dp[at(i, 1)] = dp[at(i - 1, 0)] + p[i];
    snap(L.sold, `sold[${i}]: vender hoje = hold[${i - 1}] + ${p[i]} = ${dp[at(i, 1)]}. Amanhã é cooldown, não dá para comprar.`,
      { i, read: [at(i - 1, 0)], write: [at(i, 1)], vars: { ...day, 'sold[i]': dp[at(i, 1)] } });

    const stay = dp[at(i - 1, 2)], cool = dp[at(i - 1, 1)];
    dp[at(i, 2)] = Math.max(stay, cool);
    snap(L.rest, `rest[${i}]: continuar livre = ${stay} · sair do cooldown (sold[${i - 1}]) = ${cool} → ${dp[at(i, 2)]}.`,
      { i, read: [at(i - 1, 2), at(i - 1, 1)], write: [at(i, 2)], vars: { ...day, descansar: stay, 'fim cooldown': cool, 'rest[i]': dp[at(i, 2)] } });
  }
  const ans = Math.max(dp[at(n - 1, 1)], dp[at(n - 1, 2)]);
  snap(L.ret, `Resposta: max(sold[${n - 1}], rest[${n - 1}]) = ${ans}. Terminar segurando a ação nunca é melhor.`,
    { read: [at(n - 1, 1), at(n - 1, 2)], result: ans });
  return out;
}

// Only 3 variables + tmp. The dependencies form a cycle (sold ← hold ← rest ← sold), so one old value must be saved.
// Cells: 0 hold, 1 sold, 2 rest, 3 tmp. gen[k] = which day the value belongs to.
function stock1D(p) {
  const L = STOCK_CODE.array.at, n = p.length, dp = [-p[0], 0, 0, null], gen = [0, 0, 0, null], out = [];
  const snap = (line, msg, s = {}) => out.push({ dp: dp.slice(), gen: gen.slice(), read: [], write: [], line, msg, ...s });

  snap(L.init, `4 células fixas (16 B), independente de n. Dia 0: hold = −${p[0]}, sold = rest = 0.`,
    { i: 0, write: [0, 1, 2], vars: { dia: 0, preço: p[0] } });
  for (let i = 1; i < n; i++) {
    const day = { dia: i, preço: p[i] };
    snap(L.fori, `i = ${i}: dia ${i}, preço ${p[i]}. hold, sold e rest ainda guardam os valores do dia ${i - 1}.`, { i, vars: day });
    dp[3] = dp[1]; gen[3] = gen[1];
    snap(L.tmp, `tmp = sold = ${dp[3]} (do dia ${i - 1}). Ele vai ser sobrescrito na próxima linha, mas rest ainda precisa dele.`,
      { i, read: [1], write: [3], vars: { ...day, tmp: dp[3] } });
    const oldHold = dp[0];
    dp[1] = dp[0] + p[i]; gen[1] = i;
    snap(L.sold, `sold = hold + ${p[i]} = ${oldHold} + ${p[i]} = ${dp[1]}. hold ainda é do dia ${i - 1}, porque só é atualizado depois.`,
      { i, read: [0], write: [1], vars: { ...day, sold: dp[1] } });
    const buy = dp[2] - p[i];
    dp[0] = Math.max(dp[0], buy); gen[0] = i;
    snap(L.hold, `hold = max(${oldHold}, rest − ${p[i]} = ${buy}) = ${dp[0]}. rest ainda é do dia ${i - 1}.`,
      { i, read: [0, 2], write: [0], vars: { ...day, segurar: oldHold, comprar: buy, hold: dp[0] } });
    const stay = dp[2];
    dp[2] = Math.max(dp[2], dp[3]); gen[2] = i;
    snap(L.rest, `rest = max(${stay}, tmp = ${dp[3]}) = ${dp[2]}. sold já é do dia ${i}, por isso usamos o tmp (sold do dia ${i - 1}).`,
      { i, read: [2, 3], write: [2], vars: { ...day, descansar: stay, tmp: dp[3], rest: dp[2] } });
  }
  const ans = Math.max(dp[1], dp[2]);
  snap(L.ret, `Resposta: max(sold, rest) = ${ans}.`, { read: [1, 2], result: ans });
  return out;
}

// Top-down: f(i, h) = best profit from day i on, h = 0 free / 1 holding. memo n x 2.
function stockMemo(p) {
  const L = STOCK_CODE.memo.at, n = p.length, memo = new Array(n * 2).fill(null), stack = [], out = [];
  let calls = 0, hits = 0, maxDepth = 0;
  const snap = (line, msg, s = {}) => out.push({ dp: memo.slice(), stack: stack.map((f) => ({ ...f })), read: [], write: [], calls, hits, maxDepth, line, msg, ...s });
  const st = (h) => h ? 'segurando' : 'livre';

  const f = (i, h) => {
    const fr = { call: `f(${i}, ${h})`, note: '' };
    stack.push(fr); calls++; maxDepth = Math.max(maxDepth, stack.length);
    const idx = i * 2 + h, iv = { dia: i, estado: st(h), ...(i < n ? { preço: p[i] } : {}) };
    snap(L.fn, `Entra em ${fr.call}: melhor lucro do dia ${i} em diante, ${st(h)} (profundidade ${stack.length}).`, { i, vars: iv });

    if (i >= n) {
      fr.note = 'ret 0';
      snap(L.base, `dia ${i} ≥ ${n}: acabaram os dias → 0.`, { vars: { ...iv, ret: 0 } });
      stack.pop(); return 0;
    }
    snap(L.base, `dia ${i} < ${n}: ainda há dias, não é caso base.`, { i, vars: iv });
    if (memo[idx] !== null) {
      hits++; fr.note = `hit → ${memo[idx]}`;
      snap(L.hit, `CACHE HIT: memo[${i}][${h}] = ${memo[idx]} já foi calculado. Retorna sem recursão.`, { i, read: [idx], vars: { ...iv, memo: memo[idx] } });
      stack.pop(); return memo[idx];
    }
    snap(L.hit, `memo[${i}][${h}] vazio: precisa calcular.`, { i, vars: iv });

    snap(L.wait, `Esperar (não fazer nada hoje): chama f(${i + 1}, ${h}).`, { i, vars: iv });
    const wait = f(i + 1, h);
    fr.note = `esperar=${wait}`;
    snap(L.wait, `f(${i + 1}, ${h}) voltou ${wait} → esperar = ${wait}.`, { i, vars: { ...iv, esperar: wait } });

    let act;
    if (h) {
      snap(L.sell, `Segurando (h = 1): agir é vender por ${p[i]} e pular o dia ${i + 1} (cooldown). Chama f(${i + 2}, 0).`, { i, vars: { ...iv, esperar: wait } });
      const r = f(i + 2, 0); act = p[i] + r;
      snap(L.sell, `f(${i + 2}, 0) voltou ${r} → vender = ${p[i]} + ${r} = ${act}.`, { i, vars: { ...iv, esperar: wait, vender: act } });
    } else {
      snap(L.sell, `h = 0: está livre, então não vende. Vai para o outro lado do ternário.`, { i, vars: { ...iv, esperar: wait } });
      snap(L.buy, `Livre: agir é comprar por ${p[i]}. Chama f(${i + 1}, 1).`, { i, vars: { ...iv, esperar: wait } });
      const r = f(i + 1, 1); act = r - p[i];
      snap(L.buy, `f(${i + 1}, 1) voltou ${r} → comprar = ${r} − ${p[i]} = ${act}.`, { i, vars: { ...iv, esperar: wait, comprar: act } });
    }
    fr.note += ` ${h ? 'vender' : 'comprar'}=${act}`;
    memo[idx] = Math.max(wait, act); fr.note += ` → ${memo[idx]}`;
    snap(L.save, `Grava memo[${i}][${h}] = max(${wait}, ${act}) = ${memo[idx]}, retorna e desempilha.`,
      { i, write: [idx], vars: { ...iv, esperar: wait, [h ? 'vender' : 'comprar']: act, memo: memo[idx] } });
    stack.pop(); return memo[idx];
  };

  snap(L.alloc, `malloc: memo n×2 = ${n * 2} células: [livre, segurando] para cada dia.`);
  snap(L.call, 'Chama f(0, 0): dia 0, sem ação na mão.');
  const ans = f(0, 0);
  snap(L.call, `Resposta: f(0, 0) = ${ans}. ${calls} chamadas, ${hits} cache hits.`, { read: [0], result: ans });
  return out;
}

if (typeof module !== 'undefined') module.exports = { PRICES, STOCK_CODE, stock2D, stock1D, stockMemo };
