// Search in Rotated Sorted Array: one step per executed line, as a snapshot for the player.
// A sorted array of distinct numbers was rotated at an unknown point; find target's index (or -1) in O(log n).
// Runs in the browser (globals) and in node (module.exports) for the test.
if (typeof module !== 'undefined') globalThis.listing ??= require('./trace.js').listing;

const RS_NUMS = [18, 21, 2, 4, 5, 7, 9, 10, 12, 13, 15];   // n = 11: the smallest n where one found target walks all 4 branches of "direta"
const RS_TARGET = 5;

const RS_CODE = {
  pivo: listing([
    ['init', 'let lo = 0, hi = n - 1'],
    ['loop', 'while (lo < hi) {                     // 1ª busca: onde está o menor?'],
    ['mid', '  const mid = (lo + hi) >> 1'],
    ['cmp', '  if (a[mid] > a[hi])                  // o degrau está depois de mid'],
    ['goR', '    lo = mid + 1'],
    ['goL', '  else hi = mid                        // mid pode ser o próprio menor'],
    [null, '}'],
    ['k', 'const k = lo                          // a[k] é o menor: o pivô'],
    ['side', '[lo, hi] = target >= a[k] && target <= a[n - 1] ? [k, n - 1] : [0, k - 1]'],
    ['ans', 'let ans = -1'],
    ['loop2', 'while (lo <= hi) {                    // 2ª busca: binária comum'],
    ['mid2', '  const mid = (lo + hi) >> 1'],
    ['eq', '  if (a[mid] === target) {'],
    ['hit', '    ans = mid; break'],
    [null, '  }'],
    ['lt', '  if (a[mid] < target)'],
    ['goR2', '    lo = mid + 1'],
    ['goL2', '  else hi = mid - 1'],
    [null, '}'],
    ['ret', 'return ans'],
  ]),
  direta: listing([
    ['init', 'let lo = 0, hi = n - 1'],
    ['loop', 'while (lo < hi) {                     // para quando sobra 1 candidato'],
    ['mid', '  const mid = (lo + hi) >> 1'],
    ['sorted', '  if (a[lo] <= a[mid]) {                // a[lo..mid] está ordenado'],
    ['inL', '    if (a[lo] <= target && target <= a[mid])'],
    ['goL', '      hi = mid                          // target só pode estar nessa metade'],
    ['goR', '    else lo = mid + 1'],
    [null, '  } else {                             // a[mid..hi] está ordenado'],
    ['inR', '    if (a[mid] < target && target <= a[hi])'],
    ['goR2', '      lo = mid + 1'],
    ['goL2', '    else hi = mid'],
    [null, '  }'],
    [null, '}'],
    ['ret', 'return a[lo] === target ? lo : -1   // confere o último candidato'],
  ]),
};

const rsShow = (a, lo, hi) => lo > hi ? '[]' : `[${a.slice(lo, hi + 1).join(', ')}]`;

// Two binary searches: first the index k of the minimum (the rotation step), then a plain search on one sorted side.
function rsPivot(nums = RS_NUMS, target = RS_TARGET) {
  const L = RS_CODE.pivo.at, a = nums.slice(), n = a.length, out = [];
  let lo = 0, hi = n - 1, mid, k, ans, probes = 0;
  const snap = (line, msg, s = {}) => out.push({ dp: a, read: [], write: [], line, msg, lo, hi, mid, k, probes, ...s,
    vars: { target, lo, hi, mid, k, ans, ...s.vars } });

  snap(L.init, `lo = 0, hi = ${n - 1}. Invariante da 1ª busca: o menor elemento está sempre em a[lo..hi].`);
  for (;;) {
    if (!(lo < hi)) { snap(L.loop, `lo = hi = ${lo}: sobrou uma casa, e ela é o menor.`); break; }
    snap(L.loop, `lo = ${lo} < hi = ${hi}: ainda há ${hi - lo + 1} candidatos a menor.`);
    mid = (lo + hi) >> 1; probes++;
    snap(L.mid, `mid = (${lo} + ${hi}) >> 1 = ${mid}.`, { read: [mid] });
    if (a[mid] > a[hi]) {
      snap(L.cmp, `a[${mid}] = ${a[mid]} > a[${hi}] = ${a[hi]}: de mid até hi o valor cai em algum ponto, então o degrau (e o menor) está depois de mid.`, { read: [mid, hi] });
      lo = mid + 1;
      snap(L.goR, `lo = ${lo}: descarta a[..${mid}], que fica toda antes do degrau.`);
    } else {
      snap(L.cmp, `a[${mid}] = ${a[mid]} ≤ a[${hi}] = ${a[hi]}: de mid até hi está tudo subindo, sem degrau. O menor está em mid ou antes.`, { read: [mid, hi] });
      hi = mid;
      snap(L.goL, `hi = ${hi} (não mid - 1: mid ainda pode ser o menor).`);
    }
  }
  k = lo; mid = undefined;
  snap(L.k, `k = ${k}: a[${k}] = ${a[k]} é o menor. O array é ${rsShow(a, 0, k - 1)} + ${rsShow(a, k, n - 1)}, duas partes ordenadas.`, { read: [k] });
  const right = target >= a[k] && target <= a[n - 1];
  [lo, hi] = right ? [k, n - 1] : [0, k - 1];
  snap(L.side, right ? `${target} está entre a[${k}] = ${a[k]} e a[${n - 1}] = ${a[n - 1]}: só pode estar na parte da direita, a[${k}..${n - 1}].`
    : `${target} não está entre a[${k}] = ${a[k]} e a[${n - 1}] = ${a[n - 1]}: se existir, está na parte da esquerda, a[0..${k - 1}].`, { read: [k, n - 1] });
  ans = -1;
  snap(L.ans, `ans = -1 até achar. Invariante da 2ª busca: se ${target} existe, está em a[${lo}..${hi}], que é ordenado.`, { vars: { ans } });
  for (;;) {
    if (!(lo <= hi)) { snap(L.loop2, `lo = ${lo} > hi = ${hi}: intervalo vazio, ${target} não está no array.`, { vars: { ans } }); break; }
    snap(L.loop2, `lo = ${lo} ≤ hi = ${hi}: a[${lo}..${hi}] = ${rsShow(a, lo, hi)}.`, { vars: { ans } });
    mid = (lo + hi) >> 1; probes++;
    snap(L.mid2, `mid = (${lo} + ${hi}) >> 1 = ${mid}.`, { read: [mid], vars: { ans } });
    if (a[mid] === target) {
      snap(L.eq, `a[${mid}] = ${a[mid]} === ${target}: achou!`, { read: [mid], vars: { ans } });
      ans = mid;
      snap(L.hit, `ans = ${mid}; break.`, { read: [mid], found: mid, vars: { ans } });
      break;
    }
    snap(L.eq, `a[${mid}] = ${a[mid]} ≠ ${target}.`, { read: [mid], vars: { ans } });
    if (a[mid] < target) {
      snap(L.lt, `a[${mid}] = ${a[mid]} < ${target}: o alvo está à direita de mid.`, { read: [mid], vars: { ans } });
      lo = mid + 1;
      snap(L.goR2, `lo = ${lo}: descarta a[..${mid}].`, { vars: { ans } });
    } else {
      snap(L.lt, `a[${mid}] = ${a[mid]} > ${target}: o alvo está à esquerda de mid.`, { read: [mid], vars: { ans } });
      hi = mid - 1;
      snap(L.goL2, `hi = ${hi}: descarta a[${mid}..].`, { vars: { ans } });
    }
  }
  snap(L.ret, ans < 0 ? `Retorna -1: ${target} não está no array. ${probes} sondagens.`
    : `Retorna ${ans}: a[${ans}] = ${target}. ${probes} sondagens no total, somando as duas buscas.`,
    { result: ans, found: ans, mid: ans < 0 ? undefined : ans, vars: { ans } });
  return out;
}

// One search: any mid splits a[lo..hi] into two halves and at least one of them is sorted; test target against that one.
// No equality test inside the loop: it narrows to one candidate and checks it once, so a single return covers found and not found.
function rsDirect(nums = RS_NUMS, target = RS_TARGET) {
  const L = RS_CODE.direta.at, a = nums.slice(), n = a.length, out = [];
  let lo = 0, hi = n - 1, mid, probes = 0;
  const snap = (line, msg, s = {}) => out.push({ dp: a, read: [], write: [], line, msg, lo, hi, mid, probes, ...s,
    vars: { target, lo, hi, mid, ...s.vars } });

  snap(L.init, `lo = 0, hi = ${n - 1}. Invariante: se ${target} existe, está em a[lo..hi].`);
  for (;;) {
    if (!(lo < hi)) { snap(L.loop, `lo = hi = ${lo}: sobrou um único candidato.`); break; }
    snap(L.loop, `lo = ${lo} < hi = ${hi}: a[${lo}..${hi}] = ${rsShow(a, lo, hi)}, ${hi - lo + 1} candidatos.`);
    mid = (lo + hi) >> 1; probes++;
    snap(L.mid, `mid = (${lo} + ${hi}) >> 1 = ${mid}, a[${mid}] = ${a[mid]}.`, { read: [mid] });
    if (a[lo] <= a[mid]) {
      const half = [lo, mid];
      snap(L.sorted, `a[${lo}] = ${a[lo]} ≤ a[${mid}] = ${a[mid]}: o degrau não está em a[${lo}..${mid}], essa metade está ordenada.`, { read: [lo, mid], half });
      if (a[lo] <= target && target <= a[mid]) {
        snap(L.inL, `${a[lo]} ≤ ${target} ≤ ${a[mid]}: o alvo cabe na metade ordenada.`, { read: [lo, mid], half });
        hi = mid;
        snap(L.goL, `hi = ${hi}: fica com a[${lo}..${mid}] (mid pode ser o alvo).`);
      } else {
        snap(L.inL, `${target} fora de [${a[lo]}, ${a[mid]}]: não está na metade ordenada, só pode estar na outra.`, { read: [lo, mid], half });
        lo = mid + 1;
        snap(L.goR, `lo = ${lo}: fica com a outra metade, a da direita.`);
      }
    } else {
      const half = [mid, hi];
      snap(L.sorted, `a[${lo}] = ${a[lo]} > a[${mid}] = ${a[mid]}: o degrau está em a[${lo}..${mid}], então a[${mid}..${hi}] é que está ordenado.`, { read: [lo, mid], half });
      if (a[mid] < target && target <= a[hi]) {
        snap(L.inR, `${a[mid]} < ${target} ≤ ${a[hi]}: o alvo cabe na metade ordenada da direita.`, { read: [mid, hi], half });
        lo = mid + 1;
        snap(L.goR2, `lo = ${lo}: fica com a direita.`);
      } else {
        snap(L.inR, `${target} fora de (${a[mid]}, ${a[hi]}]: só pode estar em a[${lo}..${mid}], a parte com o degrau.`, { read: [mid, hi], half });
        hi = mid;
        snap(L.goL2, `hi = ${hi}: fica com a esquerda.`);
      }
    }
  }
  const ans = a[lo] === target ? lo : -1;
  snap(L.ret, ans < 0 ? `a[${lo}] = ${a[lo]} ≠ ${target}: retorna -1, o alvo não está no array. ${probes} sondagens.`
    : `a[${lo}] = ${target}: retorna ${lo}. ${probes} sondagens numa busca só.`,
  { read: [lo], result: ans, found: ans, vars: { ans } });
  return out;
}

if (typeof module !== 'undefined') module.exports = { RS_NUMS, RS_TARGET, RS_CODE, rsPivot, rsDirect };
