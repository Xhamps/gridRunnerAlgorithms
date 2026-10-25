// Stone Game VIII: one step per executed line, as a snapshot for the player.
// The stone put back on the left always holds a prefix sum, so a move = picking an index i >= 1 and scoring pre[i].
// dp[i] = best difference (me - rival) when the next move must end at index >= i:
// dp[n-1] = pre[n-1]; dp[i] = max(dp[i+1], pre[i] - dp[i+1]); answer dp[1].
if (typeof module !== 'undefined') globalThis.listing ??= require('./trace.js').listing;

const SG8_STONES = [-1, 2, -3, 4, -5];

const SG8_CODE = {
  array: listing([
    ['palloc', 'const pre = Array(n)'],
    ['p0', 'pre[0] = stones[0]'],
    ['fori', 'for (let i = 1; i < n; i++)'],
    ['pre', '  pre[i] = pre[i-1] + stones[i]       // pedra da esquerda após juntar 0..i'],
    ['alloc', 'const dp = Array(n)'],
    ['base', 'dp[n-1] = pre[n-1]                   // última jogada possível: junta tudo'],
    ['ford', 'for (let i = n - 2; i >= 1; i--)'],
    ['upd', '  dp[i] = max(dp[i+1], pre[i] - dp[i+1])   // adia · ou para em i'],
    ['ret', 'return dp[1]                         // 1ª jogada junta pelo menos 2 pedras'],
  ]),
  vars: listing([
    ['fori', 'for (let i = 1; i < n; i++)'],
    ['pre', '  stones[i] += stones[i-1]           // vira pre[i], no próprio array'],
    ['init', 'let best = stones[n-1]               // dp[n-1]'],
    ['ford', 'for (let i = n - 2; i >= 1; i--)'],
    ['upd', '  best = max(best, stones[i] - best) // dp[i] a partir de dp[i+1]'],
    ['ret', 'return best'],
  ]),
};

const SG8_p = (v) => (v < 0 ? `(${v})` : v); // negative operands in parentheses: "2 − (−3)"
const SG8_pick = (i, keep, take) => take > keep
  ? `Parar em ${i} vale mais (${take} > ${keep})`
  : `Adiar vale mais ou igual (${keep} ≥ ${take})`;

// Prefix array + dp array, both in the heap: cells 0..n-1 are pre, n..2n-1 are dp. dp[0] is never written.
function SG8_array(stones = SG8_STONES) {
  const L = SG8_CODE.array.at, n = stones.length, mem = new Array(2 * n).fill(null), out = [];
  const D = (i) => n + i;
  const snap = (line, msg, s = {}) => out.push({ dp: mem.slice(), read: [], write: [], line, msg, ...s });

  snap(L.palloc, `malloc: ${n} células para as somas de prefixo. Lixo por enquanto.`);
  mem[0] = stones[0];
  snap(L.p0, `pre[0] = ${stones[0]}: só a primeira pedra.`, { i: 0, write: [0], vars: { 'pre[0]': mem[0] } });
  for (let i = 1; i < n; i++) {
    snap(L.fori, `i = ${i}.`, { i, vars: { i } });
    mem[i] = mem[i - 1] + stones[i];
    snap(L.pre, `pre[${i}] = ${mem[i - 1]} + ${SG8_p(stones[i])} = ${mem[i]}. Quem juntar as pedras 0..${i} marca ${mem[i]} pontos, e a pedra devolvida vale isso.`,
      { i, read: [i - 1], write: [i], vars: { i, 'pre[i]': mem[i] } });
  }
  if (n > 1) snap(L.fori, `i = ${n} = n: prefixos prontos.`, { vars: { i: n } });

  snap(L.alloc, `malloc: dp com ${n} células. dp[i] = maior diferença (eu − rival) do jogador da vez quando a próxima jogada tem que parar no índice ≥ i.`);
  mem[D(n - 1)] = mem[n - 1];
  snap(L.base, `dp[${n - 1}] = pre[${n - 1}] = ${mem[n - 1]}: só sobra juntar tudo, e aí o jogo acaba.`,
    { i: n - 1, read: [n - 1], write: [D(n - 1)], vars: { 'dp[n-1]': mem[D(n - 1)] } });
  for (let i = n - 2; i >= 1; i--) {
    snap(L.ford, `i = ${i}: a jogada pode parar em ${i} ou mais à direita.`, { i, vars: { i } });
    const keep = mem[D(i + 1)], take = mem[i] - keep;
    mem[D(i)] = Math.max(keep, take);
    snap(L.upd, `Adiar (parar depois de ${i}) vale dp[${i + 1}] = ${keep}. Parar em ${i} rende pre[${i}] = ${mem[i]} e o rival fica com dp[${i + 1}]: ${mem[i]} − ${SG8_p(keep)} = ${take}. ${SG8_pick(i, keep, take)}: dp[${i}] = ${mem[D(i)]}.`,
      { i, read: [D(i + 1), i], write: [D(i)], vars: { i, 'dp[i+1]': keep, 'pre[i]': mem[i], adia: keep, para: take, 'dp[i]': mem[D(i)] } });
  }
  snap(L.ford, `i = 0 < 1: fim do laço. dp[0] nunca é usado: ninguém pode juntar uma pedra só.`, { vars: { i: 0 } });
  snap(L.ret, `Resposta: dp[1] = ${mem[D(1)]}, a diferença Alice − Bob.`, { read: [D(1)], result: mem[D(1)] });
  return out;
}

// O(1) extra: the prefix sums overwrite stones in place, and dp[i] only reads dp[i+1], so one variable is enough.
// Cells 0..n-1 are stones (becoming pre), cell n is best.
function SG8_vars(stones = SG8_STONES) {
  const L = SG8_CODE.vars.at, n = stones.length, mem = [...stones, null], out = [];
  const B = n;
  const snap = (line, msg, s = {}) => out.push({ dp: mem.slice(), read: [], write: [], line, msg, ...s });

  for (let i = 1; i < n; i++) {
    snap(L.fori, `i = ${i}.`, { i, vars: { i } });
    const old = mem[i];
    mem[i] += mem[i - 1];
    snap(L.pre, `stones[${i}] = ${old} + ${SG8_p(mem[i - 1])} = ${mem[i]}. O valor original não é mais preciso: agora a célula guarda pre[${i}].`,
      { i, read: [i - 1], write: [i], vars: { i, 'pre[i]': mem[i] } });
  }
  snap(L.fori, `i = ${n} = n: o array de entrada agora é o array de prefixos. Zero memória extra.`, { vars: { i: n } });

  mem[B] = mem[n - 1];
  snap(L.init, `best = pre[${n - 1}] = ${mem[B]}: é dp[${n - 1}], juntar tudo de uma vez.`, { i: n - 1, read: [n - 1], write: [B], vars: { best: mem[B] } });
  for (let i = n - 2; i >= 1; i--) {
    snap(L.ford, `i = ${i}: best ainda vale dp[${i + 1}] = ${mem[B]}.`, { i, vars: { i, best: mem[B] } });
    const keep = mem[B], take = mem[i] - keep;
    mem[B] = Math.max(keep, take);
    snap(L.upd, `Adiar vale ${keep}; parar em ${i} vale ${mem[i]} − ${SG8_p(keep)} = ${take}. ${SG8_pick(i, keep, take)}: best = ${mem[B]} (agora é dp[${i}]). O dp[${i + 1}] antigo é sobrescrito: ninguém mais o lê.`,
      { i, read: [B, i], write: [B], vars: { i, adia: keep, para: take, best: mem[B] } });
  }
  snap(L.ford, `i = 0 < 1: fim do laço.`, { vars: { i: 0, best: mem[B] } });
  snap(L.ret, `Resposta: best = ${mem[B]}, a diferença Alice − Bob.`, { read: [B], result: mem[B] });
  return out;
}

if (typeof module !== 'undefined') module.exports = { SG8_STONES, SG8_CODE, SG8_array, SG8_vars };
