// Binary Search: one step per executed line, as a snapshot for the player.
// Find target in a sorted array of distinct ints; return its index or -1. Two interval conventions.
// Runs in the browser (globals) and in node (module.exports) for the test.
if (typeof module !== 'undefined') globalThis.listing ??= require('./trace.js').listing;

const BS_NUMS = [-5, 0, 3, 8, 11, 17, 24];
const BS_TARGET = 11;

const BS_CODE = {
  fechado: listing([
    ['init', 'let lo = 0, hi = n - 1             // candidatos: a[lo..hi], os dois inclusos'],
    ['ans', 'let ans = -1'],
    ['loop', 'while (lo <= hi) {                 // lo = hi ainda é 1 candidato'],
    ['mid', '  const mid = lo + ((hi - lo) >> 1)'],
    ['eq', '  if (a[mid] === target) {'],
    ['found', '    ans = mid'],
    ['brk', '    break'],
    [null, '  }'],
    ['lt', '  if (a[mid] < target) {'],
    ['golo', '    lo = mid + 1                    // mid já foi olhado: sai da faixa'],
    [null, '  } else {'],
    ['gohi', '    hi = mid - 1                    // idem, pelo outro lado'],
    [null, '  }'],
    [null, '}'],
    ['ret', 'return ans'],
  ]),
  semiaberto: listing([
    ['init', 'let lo = 0, hi = n                 // candidatos: a[lo..hi), hi fica de fora'],
    ['ans', 'let ans = -1'],
    ['loop', 'while (lo < hi) {                  // lo = hi: faixa vazia'],
    ['mid', '  const mid = lo + ((hi - lo) >> 1)'],
    ['eq', '  if (a[mid] === target) {'],
    ['found', '    ans = mid'],
    ['brk', '    break'],
    [null, '  }'],
    ['lt', '  if (a[mid] < target) {'],
    ['golo', '    lo = mid + 1                    // mid já foi olhado: sai da faixa'],
    [null, '  } else {'],
    ['gohi', '    hi = mid                        // hi é exclusivo: mid já fica de fora'],
    [null, '  }'],
    [null, '}'],
    ['ret', 'return ans'],
  ]),
};

// Shared loop; `half` switches between [lo, hi] and [lo, hi).
function bsRun(code, a, target, half) {
  const L = code.at, n = a.length, out = [];
  let lo = 0, hi = half ? n : n - 1, ans = -1, mid, probes = 0;
  const range = () => half ? `[${lo}, ${hi})` : `[${lo}, ${hi}]`;
  const size = () => Math.max(0, half ? hi - lo : hi - lo + 1);
  const snap = (line, msg, s = {}) => out.push({
    dp: a.slice(), read: [], write: [], line, msg, lo, hi, mid, half, probes, found: ans,
    vars: { target, lo, hi, ...(mid === undefined ? {} : { mid, 'a[mid]': a[mid] }), ans }, ...s,
  });

  snap(L.init, half ? `lo = 0, hi = n = ${n}: hi aponta uma casa depois do último candidato. Faixa ${range()}, ${size()} candidatos.`
    : `lo = 0, hi = n - 1 = ${n - 1}: hi é o último candidato. Faixa ${range()}, ${size()} candidatos.`);
  snap(L.ans, 'ans = -1: se o laço terminar sem achar, essa é a resposta.');
  for (;;) {
    const go = half ? lo < hi : lo <= hi;
    snap(L.loop, go ? `${lo} ${half ? '<' : '≤'} ${hi}: a faixa ${range()} ainda tem ${size()} candidato${size() > 1 ? 's' : ''}.`
      : `${lo} ${half ? '<' : '≤'} ${hi} é falso: a faixa ${range()} está vazia, ${target} não está no array. Sai do laço.`);
    if (!go) break;
    mid = lo + ((hi - lo) >> 1); probes++;
    snap(L.mid, `mid = ${lo} + ⌊(${hi} - ${lo}) / 2⌋ = ${mid}.${probes === 1 ? ' Escrito assim, e não (lo + hi) / 2, a soma não estoura com índices grandes.' : ''}`, { read: [mid] });
    snap(L.eq, a[mid] === target ? `a[${mid}] = ${a[mid]} é o alvo!` : `a[${mid}] = ${a[mid]} ≠ ${target}.`, { read: [mid] });
    if (a[mid] === target) {
      ans = mid;
      snap(L.found, `ans = ${mid}.`, { write: [mid] });
      snap(L.brk, `break: achou em ${probes} ${probes > 1 ? 'sondagens' : 'sondagem'}, sem olhar o resto.`);
      break;
    }
    const less = a[mid] < target;
    snap(L.lt, less ? `${a[mid]} < ${target}: o alvo, se existir, está à direita de mid.`
      : `${a[mid]} > ${target}: o alvo, se existir, está à esquerda de mid.`, { read: [mid] });
    if (less) {
      lo = mid + 1;
      snap(L.golo, `lo = ${lo}: a[..${mid}] é descartado, mid inclusive. Faixa ${range()}, ${size()} candidato${size() === 1 ? '' : 's'}.`);
    } else {
      hi = half ? mid : mid - 1;
      snap(L.gohi, half ? `hi = mid = ${hi}: como hi não entra na faixa, mid já fica de fora. Faixa ${range()}, ${size()} candidato${size() === 1 ? '' : 's'}.`
        : `hi = mid - 1 = ${hi}: mid já foi olhado e sai. Faixa ${range()}, ${size()} candidato${size() === 1 ? '' : 's'}.`);
    }
  }
  snap(L.ret, ans >= 0 ? `Resposta: ${ans} (a[${ans}] = ${target}), em ${probes} de no máximo ⌈log₂(${n} + 1)⌉ sondagens.`
    : `Resposta: -1, ${target} não está no array (${probes} sondagens).`, { result: ans });
  return out;
}

const bsClosed = (a = BS_NUMS, target = BS_TARGET) => bsRun(BS_CODE.fechado, a, target, false);
const bsHalfOpen = (a = BS_NUMS, target = BS_TARGET) => bsRun(BS_CODE.semiaberto, a, target, true);

if (typeof module !== 'undefined') module.exports = { BS_NUMS, BS_TARGET, BS_CODE, bsClosed, bsHalfOpen };
