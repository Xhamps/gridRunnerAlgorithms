// Burst Balloons: generates one step per executed line, as a snapshot for the player.
// a = [1, ...nums, 1]; dp[l][r] = most coins from bursting every balloon strictly between l and r
// (l and r stay standing). k = the LAST balloon burst in (l, r): its neighbors at that moment are a[l] and a[r].
// Runs in the browser (globals) and in node (module.exports) for the test.
if (typeof module !== 'undefined') globalThis.listing ??= require('./trace.js').listing;

const BALLOONS = [3, 1, 5, 8];

const BALLOON_CODE = {
  matriz: listing([
    ['pad', 'const a = [1, ...nums, 1], m = a.length         // bordas valem 1'],
    ['alloc', 'const dp = Array.from({ length: m }, () => Array(m))'],
    ['base', 'for (let l = 0; l + 1 < m; l++) dp[l][l+1] = 0   // nada entre l e r'],
    ['forlen', 'for (let len = 2; len < m; len++)'],
    ['forl', '  for (let l = 0; l + len < m; l++) {'],
    ['init', '    const r = l + len; dp[l][r] = 0'],
    ['fork', '    for (let k = l + 1; k < r; k++)              // k = o ÚLTIMO a estourar'],
    ['upd', '      dp[l][r] = max(dp[l][r], dp[l][k] + a[l]*a[k]*a[r] + dp[k][r])'],
    [null, '  }'],
    ['ret', 'return dp[0][m-1]'],
  ]),
  memo: listing([
    ['pad', 'const a = [1, ...nums, 1], m = a.length         // bordas valem 1'],
    ['alloc', 'const memo = Array.from({ length: m }, () => Array(m))'],
    ['fn', 'function f(l, r) {               // l e r ficam de pé até o fim'],
    ['base', '  if (l + 1 === r) return 0                      // nada entre eles'],
    ['hit', '  if (memo[l][r] !== undefined) return memo[l][r]   // cache hit'],
    ['best', '  let best = 0'],
    ['fork', '  for (let k = l + 1; k < r; k++)               // k = o ÚLTIMO a estourar'],
    ['upd', '    best = max(best, f(l, k) + a[l]*a[k]*a[r] + f(k, r))'],
    ['save', '  return memo[l][r] = best'],
    [null, '}'],
    ['call', 'return f(0, m - 1)'],
  ]),
};

const pad = (nums) => [1, ...nums, 1];
const lastMsg = (a, l, k, r) => `k = ${k} é o ÚLTIMO a estourar em (${l}, ${r}): nessa hora (${l}, ${k}) e (${k}, ${r}) já estão vazios, ` +
  `então os vizinhos dele são a[${l}] e a[${r}] → ${a[l]}·${a[k]}·${a[r]} = ${a[l] * a[k] * a[r]}.`;

// Matrix m x m, row-major. Only r > l is used.
function balloon2D(nums) {
  const L = BALLOON_CODE.matriz.at, a = pad(nums), m = a.length, dp = new Array(m * m).fill(null), out = [];
  const snap = (line, msg, s = {}) => out.push({ dp: dp.slice(), read: [], write: [], line, msg, ...s });

  snap(L.pad, `Bordas fictícias: a = [${a}]. Os 1 nas pontas nunca estouram; servem de vizinho.`);
  snap(L.alloc, `malloc: m×m = ${m * m} células. Só o triângulo r > l será usado.`);
  for (let l = 0; l + 1 < m; l++) dp[l * m + l + 1] = 0;
  snap(L.base, 'Caso base: entre l e l+1 não há balão, então dp[l][l+1] = 0.', { write: [...Array(m - 1).keys()].map((l) => l * m + l + 1) });

  for (let len = 2; len < m; len++) {
    snap(L.forlen, `len = ${len}: intervalos com ${len - 1} balão(ões) dentro. Os menores já estão prontos.`, { vars: { len } });
    for (let l = 0; l + len < m; l++) {
      const r = l + len, idx = l * m + r, inside = `[${a.slice(l + 1, r)}]`;
      snap(L.forl, `l = ${l}: intervalo (${l}, ${r}), estourar ${inside} com a[${l}]=${a[l]} e a[${r}]=${a[r]} de pé.`, { l, r, vars: { len, l, r, dentro: inside } });
      dp[idx] = 0;
      snap(L.init, `r = ${r}. dp[${l}][${r}] começa em 0 e vai guardar o melhor k.`, { l, r, write: [idx], vars: { len, l, r, 'dp[l][r]': 0 } });
      for (let k = l + 1; k < r; k++) {
        snap(L.fork, `k = ${k} (a[${k}]=${a[k]}): e se ele for o último a estourar em (${l}, ${r})?`, { l, r, k, vars: { len, l, r, k } });
        const left = l * m + k, right = k * m + r, coins = a[l] * a[k] * a[r], total = dp[left] + coins + dp[right], old = dp[idx];
        dp[idx] = Math.max(old, total);
        snap(L.upd, `${lastMsg(a, l, k, r)} Total = dp[${l}][${k}]=${dp[left]} + ${coins} + dp[${k}][${r}]=${dp[right]} = ${total}` +
          ` ${total > old ? `> ${old}: novo melhor.` : `≤ ${old}: fica ${old}.`}`,
          { l, r, k, read: [left, right], write: [idx], vars: { len, l, r, k, 'a[l]·a[k]·a[r]': coins, total, 'dp[l][r]': dp[idx] } });
      }
    }
  }
  const ans = dp[m - 1];
  snap(L.ret, `Resposta: dp[0][${m - 1}] = ${ans} moedas.`, { read: [m - 1], result: ans });
  return out;
}

// Top-down: recursion + memo m x m. A step for each line, plus one when each recursive call returns.
function balloonMemo(nums) {
  const L = BALLOON_CODE.memo.at, a = pad(nums), m = a.length, memo = new Array(m * m).fill(null), stack = [], out = [];
  let calls = 0, hits = 0, maxDepth = 0;
  const snap = (line, msg, s = {}) => out.push({ dp: memo.slice(), stack: stack.map((f) => ({ ...f })), read: [], write: [], calls, hits, maxDepth, line, msg, ...s });

  const f = (l, r) => {
    const fr = { call: `f(${l}, ${r})`, note: '' };
    stack.push(fr); calls++; maxDepth = Math.max(maxDepth, stack.length);
    const idx = l * m + r, v = { l, r, dentro: `[${a.slice(l + 1, r)}]` };
    snap(L.fn, `Entra em ${fr.call}: estourar ${v.dentro} com a[${l}] e a[${r}] de pé (profundidade ${stack.length}).`, { l, r, vars: v });

    if (l + 1 === r) {
      fr.note = 'ret 0';
      snap(L.base, `l + 1 = r: não há balão entre eles. Retorna 0 sem usar o memo.`, { l, r, vars: { ...v, ret: 0 } });
      stack.pop(); return 0;
    }
    snap(L.base, `l + 1 ≠ r: há balões no meio, não é caso base.`, { l, r, vars: v });
    if (memo[idx] !== null) {
      hits++; fr.note = `hit → ${memo[idx]}`;
      snap(L.hit, `CACHE HIT: memo[${l}][${r}] = ${memo[idx]} já foi calculado. Retorna sem recursão.`, { l, r, read: [idx], vars: { ...v, 'memo[l][r]': memo[idx] } });
      stack.pop(); return memo[idx];
    }
    snap(L.hit, `memo[${l}][${r}] vazio: precisa calcular.`, { l, r, vars: v });

    let best = 0;
    snap(L.best, 'best = 0. Vamos testar cada balão do intervalo como o último a estourar.', { l, r, vars: { ...v, best } });
    for (let k = l + 1; k < r; k++) {
      const kv = { ...v, k, best };
      snap(L.fork, `k = ${k} (a[${k}]=${a[k]}): e se ele for o último a estourar?`, { l, r, k, vars: kv });
      snap(L.upd, `Antes do k, (${l}, ${k}) se resolve sozinho: chama f(${l}, ${k}).`, { l, r, k, vars: kv });
      const x = f(l, k);
      snap(L.upd, `f(${l}, ${k}) voltou ${x}. Agora o lado direito: chama f(${k}, ${r}).`, { l, r, k, vars: { ...kv, esq: x } });
      const y = f(k, r), coins = a[l] * a[k] * a[r], total = x + coins + y;
      const old = best; best = Math.max(best, total);
      fr.note = `best=${best}`;
      snap(L.upd, `f(${k}, ${r}) voltou ${y}. ${lastMsg(a, l, k, r)} Total = ${x} + ${coins} + ${y} = ${total}` +
        ` ${total > old ? `> ${old}: novo melhor.` : `≤ ${old}: best fica ${old}.`}`,
        { l, r, k, vars: { ...kv, esq: x, dir: y, 'a[l]·a[k]·a[r]': coins, total, best } });
    }
    memo[idx] = best; fr.note = `→ ${best}`;
    snap(L.save, `Grava memo[${l}][${r}] = ${best}, retorna e desempilha.`, { l, r, write: [idx], vars: { ...v, 'memo[l][r]': best } });
    stack.pop(); return best;
  };

  snap(L.pad, `Bordas fictícias: a = [${a}]. Os 1 nas pontas nunca estouram; servem de vizinho.`);
  snap(L.alloc, `malloc: memo com m×m = ${m * m} células vazias. Nada é calculado até alguém pedir.`);
  snap(L.call, `Chama f(0, ${m - 1}): estourar todos os balões reais, com as bordas de pé.`);
  const ans = f(0, m - 1);
  snap(L.call, `Resposta: ${ans} moedas. ${calls} chamadas, ${hits} cache hits.`, { read: [m - 1], result: ans });
  return out;
}

if (typeof module !== 'undefined') module.exports = { BALLOONS, BALLOON_CODE, balloon2D, balloonMemo };
