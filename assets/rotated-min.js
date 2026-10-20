// Rotated Minimum with duplicates: one step per executed line, as a snapshot for the player.
// A sorted array (repeats allowed) was rotated; find its smallest value. Binary search on a[mid] vs a[hi].
// Both tabs run the same generator on different inputs: the common case stays logarithmic, the worst case
// keeps hitting the tie branch (hi--) and degrades to O(n).
// Runs in the browser (globals) and in node (module.exports) for the test.
if (typeof module !== 'undefined') globalThis.listing ??= require('./trace.js').listing;

const RM_NUMS = [6, 7, 8, 1, 1, 2, 3, 4, 5, 6];
const RM_WORST = [1, 0, 1, 1, 1, 1, 1, 1, 1, 1];

const RM_LISTING = listing([
  ['init', 'let lo = 0, hi = n - 1                // o mínimo está sempre em a[lo..hi]'],
  ['while', 'while (lo < hi) {'],
  ['mid', '  const mid = (lo + hi) >> 1             // mid < hi sempre'],
  ['cmpgt', '  if (a[mid] > a[hi]) {                 // a queda está depois de mid'],
  ['right', '    lo = mid + 1'],
  ['cmplt', '  } else if (a[mid] < a[hi]) {          // de mid até hi está em ordem'],
  ['left', '    hi = mid                              // mid ainda pode ser o mínimo'],
  [null, '  } else {                                // empate: não dá para saber o lado'],
  ['dec', '    hi--                                  // a[mid] guarda uma cópia de a[hi]'],
  [null, '  }'],
  [null, '}'],
  ['ret', 'return a[lo]'],
]);

// Same listing object on both tabs: only the input changes.
const RM_CODE = { binaria: RM_LISTING, pior: RM_LISTING };

function rmSteps(nums = RM_NUMS) {
  const L = RM_LISTING.at, a = nums.slice(), n = a.length, out = [];
  let lo = 0, hi = n - 1, iters = 0, decs = 0;
  const vars = (x = {}) => ({ lo, hi, ...x, 'passos de hi--': decs });
  const snap = (line, msg, s = {}) => out.push({ dp: a.slice(), read: [], write: [], line, msg, lo, hi, iters, decs, ...s });

  snap(L.init, `lo = 0, hi = ${hi}: o array todo é candidato. Invariante: o mínimo sempre fica dentro de a[lo..hi].`, { vars: vars() });
  while (true) {
    const go = lo < hi;
    snap(L.while, go ? `lo = ${lo} < hi = ${hi}: ainda há ${hi - lo + 1} candidatos.` : `lo = hi = ${lo}: sobrou um só candidato, ele é o mínimo.`,
      { vars: vars() });
    if (!go) break;
    iters++;
    const mid = (lo + hi) >> 1;
    snap(L.mid, `mid = (${lo} + ${hi}) >> 1 = ${mid}. Compara a[mid] = ${a[mid]} com a[hi] = ${a[hi]}.`,
      { mid, read: [mid, hi], vars: vars({ mid, 'a[mid]': a[mid], 'a[hi]': a[hi] }) });
    const v = vars({ mid, 'a[mid]': a[mid], 'a[hi]': a[hi] });
    if (a[mid] > a[hi]) {
      snap(L.cmpgt, `${a[mid]} > ${a[hi]}: isso só acontece se a queda está entre mid e hi. O mínimo vem logo depois da queda, então a[${lo}..${mid}] sai.`,
        { mid, read: [mid, hi], vars: v });
      lo = mid + 1;
      snap(L.right, `lo = ${lo}: descarta a[..${mid}]. Restam ${hi - lo + 1} candidatos.`, { mid, vars: vars({ mid }) });
      continue;
    }
    snap(L.cmpgt, `${a[mid]} ≤ ${a[hi]}: a queda não está garantidamente à direita. Testa o próximo caso.`, { mid, read: [mid, hi], vars: v });
    if (a[mid] < a[hi]) {
      snap(L.cmplt, `${a[mid]} < ${a[hi]}: de mid até hi o trecho sobe sem queda, então nada depois de mid é menor que a[mid].`,
        { mid, read: [mid, hi], vars: v });
      hi = mid;
      snap(L.left, `hi = ${hi}: descarta a[${mid + 1}..]. mid continua, pois pode ser o mínimo. Restam ${hi - lo + 1} candidatos.`,
        { mid, vars: vars({ mid }) });
      continue;
    }
    snap(L.cmplt, `${a[mid]} = ${a[hi]}: empate. A queda pode estar antes ou depois de mid, a comparação não diz o lado.`,
      { mid, read: [mid, hi], vars: v });
    hi--; decs++;
    snap(L.dec, `hi-- → ${hi}: só a casa ${hi + 1} sai. Seguro, porque a[mid] tem o mesmo valor e continua no intervalo. Anda uma casa só (passo ${decs} de hi--).`,
      { mid, vars: vars({ mid }) });
  }
  snap(L.ret, `Mínimo = a[${lo}] = ${a[lo]}. ${iters} iterações, ${decs} delas no empate (hi--).`, { mid: undefined, result: a[lo], vars: vars() });
  return out;
}

if (typeof module !== 'undefined') module.exports = { RM_NUMS, RM_WORST, RM_CODE, rmSteps };
