// Semi-Ordered Permutation: one step per executed line, as a snapshot for the player.
// Minimum adjacent swaps so the permutation of 1..n starts with 1 and ends with n.
// Runs in the browser (globals) and in node (module.exports) for the test.
if (typeof module !== 'undefined') globalThis.listing ??= require('./trace.js').listing;

const SEMI_NUMS = [3, 6, 2, 5, 1, 4];   // 1 sits to the right of n: the two trips cross once

const SEMI_CODE = {
  bolha: listing([
    ['find1', 'let p = nums.indexOf(1), swaps = 0'],
    ['w1', 'while (p > 0) {                        // 1 ainda não chegou ao início'],
    ['sw1', '  [nums[p-1], nums[p]] = [nums[p], nums[p-1]]'],
    ['mv1', '  p--; swaps++'],
    [null, '}'],
    ['findn', 'let q = nums.indexOf(n)'],
    ['wn', 'while (q < n - 1) {                    // n ainda não chegou ao fim'],
    ['swn', '  [nums[q], nums[q+1]] = [nums[q+1], nums[q]]'],
    ['mvn', '  q++; swaps++'],
    [null, '}'],
    ['ret', 'return swaps'],
  ]),
  formula: listing([
    ['init', 'let i1 = 0, iN = 0'],
    ['fork', 'for (let k = 0; k < n; k++) {'],
    ['if1', '  if (nums[k] === 1) i1 = k'],
    ['ifn', '  if (nums[k] === n) iN = k'],
    [null, '}'],
    ['sum', 'let ans = i1 + (n - 1 - iN)            // 1 anda i1 casas, n anda o resto'],
    ['cross', 'if (i1 > iN) ans--                      // eles se cruzam: uma troca serve aos dois'],
    ['ret', 'return ans'],
  ]),
};

// Simulation: bubble 1 to the front, then n to the back, one adjacent swap per step.
function semiBubble(input = SEMI_NUMS) {
  const L = SEMI_CODE.bolha.at, dp = input.slice(), n = dp.length, out = [];
  const snap = (line, msg, s = {}) => out.push({ dp: dp.slice(), read: [], write: [], line, msg, ...s });
  let p = dp.indexOf(1), swaps = 0;
  snap(L.find1, `O 1 está no índice ${p}. Ele precisa andar até o índice 0.`, { read: [p], i: p, vars: { p, swaps } });
  while (true) {
    if (!(p > 0)) {
      snap(L.w1, 'p = 0: o 1 já é o primeiro. Fim da primeira viagem.', { i: p, vars: { p, swaps } });
      break;
    }
    snap(L.w1, `p = ${p} > 0: o 1 ainda tem ${p} casa(s) pela frente.`, { i: p, vars: { p, swaps } });
    const other = dp[p - 1];
    [dp[p - 1], dp[p]] = [dp[p], dp[p - 1]];
    snap(L.sw1, `Troca o 1 com o vizinho da esquerda (${other}).` +
      (other === n ? ` Esse vizinho é o ${n}: de carona, ele andou uma casa para a direita, rumo ao fim.` : ''),
      { write: [p - 1, p], i: p - 1, vars: { p, swaps } });
    p--; swaps++;
    snap(L.mv1, `p = ${p}, swaps = ${swaps}.`, { i: p, vars: { p, swaps } });
  }
  let q = dp.indexOf(n);
  snap(L.findn, `O ${n} está no índice ${q}. Ele precisa andar até o índice ${n - 1}.`, { read: [q], j: q, vars: { q, swaps } });
  while (true) {
    if (!(q < n - 1)) {
      snap(L.wn, `q = ${q} = n - 1: o ${n} já é o último.`, { j: q, vars: { q, swaps } });
      break;
    }
    snap(L.wn, `q = ${q} < ${n - 1}: faltam ${n - 1 - q} casa(s).`, { j: q, vars: { q, swaps } });
    const other = dp[q + 1];
    [dp[q], dp[q + 1]] = [dp[q + 1], dp[q]];
    snap(L.swn, `Troca o ${n} com o vizinho da direita (${other}).`, { write: [q, q + 1], j: q + 1, vars: { q, swaps } });
    q++; swaps++;
    snap(L.mvn, `q = ${q}, swaps = ${swaps}.`, { j: q, vars: { q, swaps } });
  }
  snap(L.ret, `Resposta: ${swaps} trocas. O array terminou ${dp.join(', ')}.`, { i: 0, j: n - 1, vars: { swaps }, result: swaps });
  return out;
}

// Formula: only the positions of 1 and n matter; one shared swap if 1 starts to the right of n.
function semiFormula(input = SEMI_NUMS) {
  const L = SEMI_CODE.formula.at, dp = input.slice(), n = dp.length, out = [];
  const snap = (line, msg, s = {}) => out.push({ dp: dp.slice(), read: [], write: [], line, msg, ...s });
  let i1 = 0, iN = 0;
  snap(L.init, 'Ninguém troca nada de lugar: basta descobrir onde estão o 1 e o n.', { vars: { i1, iN } });
  for (let k = 0; k < n; k++) {
    snap(L.fork, `k = ${k}: olha nums[${k}] = ${dp[k]}.`, { read: [k], vars: { k, i1, iN } });
    if (dp[k] === 1) i1 = k;
    snap(L.if1, dp[k] === 1 ? `É o 1: i1 = ${k}.` : `${dp[k]} ≠ 1.`, { read: [k], i: i1, vars: { k, i1, iN } });
    if (dp[k] === n) iN = k;
    snap(L.ifn, dp[k] === n ? `É o ${n}: iN = ${k}.` : `${dp[k]} ≠ ${n}.`, { read: [k], i: i1, j: iN, vars: { k, i1, iN } });
  }
  let ans = i1 + (n - 1 - iN);
  snap(L.sum, `O 1 anda ${i1} casa(s) até o início, o ${n} anda ${n - 1 - iN} até o fim: ${i1} + ${n - 1 - iN} = ${ans}.`,
    { read: [i1, iN], i: i1, j: iN, vars: { i1, iN, ans } });
  if (i1 > iN) {
    ans--;
    snap(L.cross, `i1 = ${i1} > iN = ${iN}: o 1 está à direita do ${n}, então em algum momento eles trocam entre si. ` +
      `Essa troca adianta os dois de uma vez e foi contada duas vezes: ans = ${ans}.`, { read: [i1, iN], i: i1, j: iN, vars: { i1, iN, ans } });
  } else {
    snap(L.cross, `i1 = ${i1} < iN = ${iN}: os caminhos não se cruzam, nada a descontar.`, { read: [i1, iN], i: i1, j: iN, vars: { i1, iN, ans } });
  }
  snap(L.ret, `Resposta: ${ans} trocas.`, { i: i1, j: iN, vars: { i1, iN, ans }, result: ans });
  return out;
}

if (typeof module !== 'undefined') module.exports = { SEMI_NUMS, SEMI_CODE, semiBubble, semiFormula };
