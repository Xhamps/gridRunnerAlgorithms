// Ordenável por Bits: one step per executed line, as a snapshot for the player.
// Adjacent elements may swap only when they have the same popcount. Can the array end up ascending?
// Runs in the browser (globals) and in node (module.exports) for the test.
if (typeof module !== 'undefined') globalThis.listing ??= require('./trace.js').listing;

// popcounts 1 1 1 2 2 1: groups [1, 8, 4] · [12, 3] · [16]. 3 is stuck behind 8, so the answer is false.
const BITS_NUMS = [1, 8, 4, 12, 3, 16];

const bitsOf = (x) => x.toString(2).replace(/0/g, '').length;

const BITS_CODE = {
  bolha: listing([
    ['bits', 'const bits = (x) => x.toString(2).replace(/0/g, "").length'],
    ['fori', 'for (let i = 0; i < n; i++) {'],
    ['forj', '  for (let j = 0; j < n - 1 - i; j++) {'],
    ['cmp', '    if (a[j] > a[j + 1])                 // fora de ordem?'],
    ['same', '      if (bits(a[j]) === bits(a[j + 1])) // troca permitida?'],
    ['swap', '        [a[j], a[j + 1]] = [a[j + 1], a[j]]'],
    [null, '  }'],
    [null, '}'],
    ['okinit', 'let ok = true'],
    ['fork', 'for (let k = 1; k < n; k++)'],
    ['chk', '  if (a[k - 1] > a[k]) ok = false      // sobrou inversão'],
    ['ret', 'return ok'],
  ]),
  grupos: listing([
    ['bits', 'const bits = (x) => x.toString(2).replace(/0/g, "").length'],
    ['init', 'let prevMax = 0, curMin = a[0], curMax = a[0], ok = true'],
    ['fori', 'for (let i = 1; i <= n; i++) {'],
    ['same', '  if (i < n && bits(a[i]) === bits(a[i - 1])) {   // mesmo grupo'],
    ['grow', '    curMin = min(curMin, a[i]); curMax = max(curMax, a[i])'],
    [null, '  } else {                                       // grupo fechou'],
    ['cmp', '    if (curMin < prevMax) ok = false'],
    ['close', '    prevMax = curMax'],
    ['start', '    if (i < n) curMin = curMax = a[i]           // abre o próximo'],
    [null, '  }'],
    [null, '}'],
    ['ret', 'return ok'],
  ]),
};

// Bubble sort that refuses swaps across different popcounts, then checks whether the result is sorted.
function bitsBubble(nums = BITS_NUMS) {
  const L = BITS_CODE.bolha.at, a = nums.slice(), n = a.length, out = [];
  const snap = (line, msg, s = {}) => out.push({ dp: a.slice(), read: [], write: [], line, msg, ...s });

  snap(L.bits, `bits(x) conta os 1s na escrita binária de x. Popcounts: ${a.map(bitsOf).join(', ')}.`);
  for (let i = 0; i < n; i++) {
    snap(L.fori, `Passada ${i}: empurra o maior valor alcançável para a direita. As últimas ${i} posições já foram varridas.`, { vars: { i } });
    for (let j = 0; j < n - 1 - i; j++) {
      snap(L.forj, `j = ${j}: olha o par a[${j}], a[${j + 1}].`, { i: j, j: j + 1, vars: { i, j } });
      const x = a[j], y = a[j + 1];
      if (x <= y) {
        snap(L.cmp, `${x} ≤ ${y}: o par já está em ordem, nada a fazer.`, { i: j, j: j + 1, read: [j, j + 1], vars: { i, j } });
        continue;
      }
      snap(L.cmp, `${x} > ${y}: fora de ordem. Dá para trocar?`, { i: j, j: j + 1, read: [j, j + 1], vars: { i, j } });
      const bx = bitsOf(x), by = bitsOf(y);
      if (bx !== by) {
        snap(L.same, `bits(${x}) = ${bx}, bits(${y}) = ${by}: popcounts diferentes, a troca é proibida. O par fica invertido.`,
          { i: j, j: j + 1, read: [j, j + 1], vars: { i, j, 'bits(a[j])': bx, 'bits(a[j+1])': by } });
        continue;
      }
      snap(L.same, `bits(${x}) = bits(${y}) = ${bx}: mesmo popcount, a troca é permitida.`,
        { i: j, j: j + 1, read: [j, j + 1], vars: { i, j, 'bits(a[j])': bx, 'bits(a[j+1])': by } });
      a[j] = y; a[j + 1] = x;
      snap(L.swap, `Troca: a[${j}] = ${y}, a[${j + 1}] = ${x}.`, { i: j, j: j + 1, write: [j, j + 1], vars: { i, j } });
    }
  }
  let ok = true;
  snap(L.okinit, 'Fim das passadas: tudo que podia andar já andou. Agora confere se o array ficou crescente.', { vars: { ok } });
  for (let k = 1; k < n; k++) {
    snap(L.fork, `k = ${k}: compara a[${k - 1}] e a[${k}].`, { i: k - 1, j: k, vars: { k, ok } });
    if (a[k - 1] > a[k]) {
      ok = false;
      snap(L.chk, `${a[k - 1]} > ${a[k]}: inversão que nenhuma troca permitida desfaz. ok = false.`, { i: k - 1, j: k, read: [k - 1, k], vars: { k, ok } });
    } else snap(L.chk, `${a[k - 1]} ≤ ${a[k]}: em ordem.`, { i: k - 1, j: k, read: [k - 1, k], vars: { k, ok } });
  }
  snap(L.ret, ok ? 'Resposta: true. O array ficou ordenado.' : 'Resposta: false. Sobrou pelo menos uma inversão entre popcounts diferentes.', { vars: { ok }, result: ok });
  return out;
}

// O(n): runs of equal popcount can be sorted freely but never cross each other, so every group's
// minimum must be ≥ the previous group's maximum. from..to = the open group.
function bitsGroups(nums = BITS_NUMS) {
  const L = BITS_CODE.grupos.at, a = nums.slice(), n = a.length, out = [];
  let prevMax = 0, curMin = a[0], curMax = a[0], ok = true, from = 0, to = 0;
  const vars = (extra = {}) => ({ prevMax, curMin, curMax, ok, ...extra });
  const snap = (line, msg, s = {}) => out.push({ dp: a.slice(), read: [], write: [], from, to, line, msg, ...s });

  snap(L.bits, `bits(x) conta os 1s na escrita binária de x. Popcounts: ${a.map(bitsOf).join(', ')}.`);
  snap(L.init, `O primeiro grupo começa em a[0] = ${a[0]}: curMin = curMax = ${a[0]}. Ainda não há grupo anterior, prevMax = 0.`,
    { read: [0], vars: vars() });
  for (let i = 1; i <= n; i++) {
    snap(L.fori, i < n ? `i = ${i}: a[${i}] = ${a[i]} entra no grupo atual?` : `i = ${n}: passou do fim, o último grupo precisa ser fechado.`,
      { i, vars: vars({ i }) });
    if (i < n && bitsOf(a[i]) === bitsOf(a[i - 1])) {
      snap(L.same, `bits(${a[i]}) = bits(${a[i - 1]}) = ${bitsOf(a[i])}: mesmo grupo.`, { i, j: i - 1, read: [i, i - 1], vars: vars({ i }) });
      curMin = Math.min(curMin, a[i]); curMax = Math.max(curMax, a[i]); to = i;
      snap(L.grow, `O grupo cresce: curMin = ${curMin}, curMax = ${curMax}.`, { i, read: [i], vars: vars({ i }) });
      continue;
    }
    snap(L.same, i < n ? `bits(${a[i]}) = ${bitsOf(a[i])} ≠ bits(${a[i - 1]}) = ${bitsOf(a[i - 1])}: o grupo a[${from}..${i - 1}] fechou.`
      : `i = n: o grupo a[${from}..${n - 1}] fechou.`, { i, j: i - 1, read: i < n ? [i, i - 1] : [i - 1], vars: vars({ i }) });
    if (curMin < prevMax) {
      ok = false;
      snap(L.cmp, `curMin = ${curMin} < prevMax = ${prevMax}: o ${curMin} teria que passar para a esquerda do ${prevMax}, mas eles nunca trocam. ok = false.`,
        { i, vars: vars({ i }) });
    } else snap(L.cmp, `curMin = ${curMin} ≥ prevMax = ${prevMax}: depois de ordenado, este grupo encaixa depois do anterior.`, { i, vars: vars({ i }) });
    prevMax = curMax;
    snap(L.close, `prevMax = ${prevMax}: é o teto que o próximo grupo precisa respeitar.`, { i, vars: vars({ i }) });
    if (i < n) {
      from = to = i; curMin = curMax = a[i];
      snap(L.start, `Novo grupo começa em a[${i}] = ${a[i]}: curMin = curMax = ${a[i]}.`, { i, read: [i], vars: vars({ i }) });
    } else { from = n; snap(L.start, 'i = n: não há próximo grupo.', { i, vars: vars({ i }) }); }
  }
  snap(L.ret, ok ? 'Resposta: true. Cada grupo cabe inteiro depois do anterior.' : 'Resposta: false. Algum grupo tem um valor menor que o máximo do grupo anterior.',
    { vars: vars(), result: ok });
  return out;
}

if (typeof module !== 'undefined') module.exports = { BITS_NUMS, BITS_CODE, bitsOf, bitsBubble, bitsGroups };
