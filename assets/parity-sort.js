// Parity Sort: one step per executed line, as a snapshot for the player.
// Reorder in place so every even number comes before every odd one: the quick sort partition with "is even" as pivot.
// Runs in the browser (globals) and in node (module.exports) for the test.
if (typeof module !== 'undefined') globalThis.listing ??= require('./trace.js').listing;

const PAR_NUMS = [2, 3, 1, 4, 7, 6, 5];

const PAR_CODE = {
  hoare: listing([
    ['init', 'let i = 0, j = n - 1'],
    ['loop', 'while (i < j) {'],
    ['skipi', '  while (i < j && a[i] % 2 === 0) i++    // par na esquerda: já está certo'],
    ['skipj', '  while (i < j && a[j] % 2 !== 0) j--    // ímpar na direita: já está certo'],
    ['cmp', '  if (i < j) {                           // a[i] ímpar e a[j] par: os dois fora do lugar'],
    ['swap', '    [a[i], a[j]] = [a[j], a[i]]'],
    ['move', '    i++; j--'],
    [null, '  }'],
    [null, '}'],
    ['ret', 'return a'],
  ]),
  lomuto: listing([
    ['init', 'let w = 0                           // a[0..w-1] só tem pares'],
    ['forr', 'for (let r = 0; r < n; r++) {'],
    ['cmp', '  if (a[r] % 2 === 0) {'],
    ['swap', '    [a[w], a[r]] = [a[r], a[w]]       // o par vai para w'],
    ['inc', '    w++'],
    [null, '  }'],
    [null, '}'],
    ['ret', 'return a'],
  ]),
};

const parEven = (x) => x % 2 === 0;

// Hoare: two fingers walk toward each other and only swap a pair that is wrong on both sides. O(n).
function parHoare(nums = PAR_NUMS) {
  const L = PAR_CODE.hoare.at, a = nums.slice(), n = a.length, out = [];
  let swaps = 0, i = 0, j = n - 1;
  const snap = (line, msg, s = {}) => out.push({ dp: a.slice(), read: [], write: [], line, msg, swaps, i, j, ...s });

  snap(L.init, `i = 0 na ponta esquerda, j = ${j} na direita. Antes de i só pode haver pares; depois de j, só ímpares.`, { vars: { i, j } });
  for (;;) {
    snap(L.loop, i < j ? `i = ${i} < j = ${j}: ainda há casas no meio para resolver.` : `i = ${i} ≥ j = ${j}: os ponteiros se cruzaram, a partição terminou.`, { vars: { i, j } });
    if (i >= j) break;
    for (;;) {
      const go = i < j && parEven(a[i]);
      snap(L.skipi, i >= j ? `i = ${i} alcançou j: para.` : go ? `a[${i}] = ${a[i]} é par e já está do lado certo: i++.` : `a[${i}] = ${a[i]} é ímpar: i para aqui, ele precisa sair da esquerda.`,
        { read: i < j ? [i] : [], vars: { i, j, 'a[i]': a[i] } });
      if (!go) break;
      i++;
    }
    for (;;) {
      const go = i < j && !parEven(a[j]);
      snap(L.skipj, i >= j ? `j = ${j} alcançou i: para.` : go ? `a[${j}] = ${a[j]} é ímpar e já está do lado certo: j--.` : `a[${j}] = ${a[j]} é par: j para aqui, ele precisa sair da direita.`,
        { read: i < j ? [i, j] : [], vars: { i, j, 'a[i]': a[i], 'a[j]': a[j] } });
      if (!go) break;
      j--;
    }
    snap(L.cmp, i < j ? `i = ${i} < j = ${j}: um ímpar à esquerda e um par à direita. Uma troca resolve os dois.` : `i = ${i}, j = ${j}: não sobrou par fora do lugar, nada a trocar.`,
      { read: i < j ? [i, j] : [], vars: { i, j } });
    if (i < j) {
      [a[i], a[j]] = [a[j], a[i]]; swaps++;
      snap(L.swap, `Troca a[${i}] ↔ a[${j}]: o ${a[i]} vai para a esquerda e o ${a[j]} para a direita.`, { write: [i, j], vars: { i, j, 'a[i]': a[i], 'a[j]': a[j] } });
      i++; j--;
      snap(L.move, `i = ${i}, j = ${j}: as duas casas trocadas já estão resolvidas, os ponteiros andam.`, { vars: { i, j } });
    }
  }
  snap(L.ret, `Pronto: [${a.join(', ')}]. Pares antes dos ímpares com ${swaps} trocas.`, { i: undefined, j: undefined, result: a.slice() });
  return out;
}

// Lomuto: one scan with r; every even found is swapped into the write slot w. O(n), but more swaps.
function parLomuto(nums = PAR_NUMS) {
  const L = PAR_CODE.lomuto.at, a = nums.slice(), n = a.length, out = [];
  let swaps = 0, w = 0;
  const snap = (line, msg, s = {}) => out.push({ dp: a.slice(), read: [], write: [], line, msg, swaps, w, ...s });

  snap(L.init, 'w = 0: a região de pares a[0..w-1] começa vazia.', { vars: { w } });
  for (let r = 0; r < n; r++) {
    snap(L.forr, `r = ${r}: lê a[${r}] = ${a[r]}.`, { r, vars: { r, w } });
    snap(L.cmp, parEven(a[r]) ? `a[${r}] = ${a[r]} é par: ele entra na região de pares, na casa w = ${w}.` : `a[${r}] = ${a[r]} é ímpar: fica onde está, w não anda.`,
      { r, read: [r], vars: { r, w, 'a[r]': a[r] } });
    if (parEven(a[r])) {
      [a[w], a[r]] = [a[r], a[w]]; swaps++;
      snap(L.swap, w === r ? `w = r = ${r}: troca a casa com ela mesma. Conta como troca, mas nada muda.`
        : `Troca a[${w}] ↔ a[${r}]: o ${a[w]} vai para a casa ${w} e o ímpar ${a[r]} vai para a ${r}.`,
      { r, write: w === r ? [r] : [w, r], vars: { r, w, 'a[w]': a[w], 'a[r]': a[r] } });
      w++;
      snap(L.inc, `w = ${w}: a[0..${w - 1}] só tem pares.`, { r, vars: { r, w } });
    }
  }
  snap(L.ret, `Pronto: [${a.join(', ')}]. Uma varredura, ${swaps} trocas (uma por par encontrado).`, { result: a.slice() });
  return out;
}

if (typeof module !== 'undefined') module.exports = { PAR_NUMS, PAR_CODE, parHoare, parLomuto };
