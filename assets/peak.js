// Peak Element: one step per executed line, as a snapshot for the player.
// Neighbors are never equal and a[-1] = a[n] = -∞; return the index of any peak (bigger than both neighbors).
// Heap snapshot dp = a (read only). Runs in the browser (globals) and in node (module.exports) for the test.
if (typeof module !== 'undefined') globalThis.listing ??= require('./trace.js').listing;

const PK_NUMS = [1, 3, 2, 4, 5, 7, 6, 2];

const PK_CODE = {
  linear: listing([
    ['init', 'let ans = n - 1                        // se nunca descer, o pico é o último'],
    ['fori', 'for (let i = 0; i < n - 1; i++) {'],
    ['cmp', '  if (a[i] > a[i + 1]) {               // começou a descer?'],
    ['found', '    ans = i; break                     // subiu até i e desceu: pico'],
    [null, '  }'],
    [null, '}'],
    ['ret', 'return ans'],
  ]),
  binaria: listing([
    ['init', 'let lo = 0, hi = n - 1                 // sempre há um pico em a[lo..hi]'],
    ['loop', 'while (lo < hi) {'],
    ['mid', '  const mid = (lo + hi) >> 1'],
    ['cmp', '  if (a[mid] < a[mid + 1]) {           // subida para a direita'],
    ['up', '    lo = mid + 1                       // pico garantido à direita de mid'],
    [null, '  } else {'],
    ['down', '    hi = mid                           // descida: pico em mid ou à esquerda'],
    [null, '  }'],
    [null, '}'],
    ['ret', 'return lo                              // lo = hi: o pico'],
  ]),
};

// Walk until the first descent: everything before i is uphill, so a[i] beats both neighbors. O(n).
function pkLinear(nums = PK_NUMS) {
  const L = PK_CODE.linear.at, a = nums.slice(), n = a.length, out = [];
  let cmps = 0;
  const snap = (line, msg, s = {}) => out.push({ dp: a.slice(), read: [], write: [], line, msg, cmps, ...s });

  let ans = n - 1;
  snap(L.init, `ans = ${n - 1}: se o array só subir, o último elemento é o pico (depois dele vem -∞).`, { vars: { n, ans } });
  let i = 0;
  for (; i < n - 1; i++) {
    snap(L.fori, `i = ${i}: compara a[${i}] com o vizinho da direita.`, { i, vars: { i, ans } });
    cmps++;
    const down = a[i] > a[i + 1];
    snap(L.cmp, down ? `a[${i}] = ${a[i]} > a[${i + 1}] = ${a[i + 1]}: aqui começa uma descida.`
      : `a[${i}] = ${a[i]} < a[${i + 1}] = ${a[i + 1]}: ainda subindo, segue.`,
    { i, read: [i, i + 1], vars: { i, 'a[i]': a[i], 'a[i+1]': a[i + 1], ans } });
    if (down) {
      ans = i;
      snap(L.found, `ans = ${i}. Viemos subindo até ${i} (ou ${i} é o primeiro, com -∞ à esquerda) e a[${i + 1}] é menor: a[${i}] é pico. break.`,
        { i, write: [i], vars: { i, ans } });
      break;
    }
  }
  if (i === n - 1) snap(L.fori, `i = ${i} = n - 1: o laço acabou sem achar descida.`, { i, vars: { i, ans } });
  snap(L.ret, `Pico no índice ${ans} (a[${ans}] = ${a[ans]}), depois de ${cmps} comparações.`, { pk: ans, vars: { ans }, result: ans });
  return out;
}

// Binary search on the slope: go uphill, a peak is always waiting in that direction. O(log n).
function pkBinary(nums = PK_NUMS) {
  const L = PK_CODE.binaria.at, a = nums.slice(), n = a.length, out = [];
  let cmps = 0;
  const snap = (line, msg, s = {}) => out.push({ dp: a.slice(), read: [], write: [], line, msg, cmps, ...s });

  let lo = 0, hi = n - 1;
  snap(L.init, `lo = 0, hi = ${hi}: com -∞ nas duas pontas, o array inteiro com certeza tem um pico.`, { lo, hi, vars: { lo, hi } });
  while (true) {
    snap(L.loop, lo < hi ? `lo = ${lo} < hi = ${hi}: ainda há ${hi - lo + 1} candidatos.` : `lo = hi = ${lo}: sobrou um candidato só.`,
      { lo, hi, vars: { lo, hi } });
    if (lo >= hi) break;
    const mid = (lo + hi) >> 1;
    snap(L.mid, `mid = (${lo} + ${hi}) >> 1 = ${mid}.`, { lo, hi, mid, vars: { lo, hi, mid } });
    cmps++;
    const R = { lo, hi, mid, read: [mid, mid + 1], vars: { lo, hi, mid, 'a[mid]': a[mid], 'a[mid+1]': a[mid + 1] } };
    if (a[mid] < a[mid + 1]) {
      snap(L.cmp, `a[${mid}] = ${a[mid]} < a[${mid + 1}] = ${a[mid + 1]}: a encosta sobe para a direita.`, R);
      lo = mid + 1;
      snap(L.up, `lo = ${lo}. Subindo a partir de ${mid + 1}: ou a encosta desce em algum ponto (ali há pico) ou sobe até hi, e a[hi] é maior que o vizinho da direita (ou -∞). Descarta a[..${mid}].`,
        { lo, hi, vars: { lo, hi, mid } });
    } else {
      snap(L.cmp, `a[${mid}] = ${a[mid]} > a[${mid + 1}] = ${a[mid + 1]}: a encosta desce para a direita.`, R);
      hi = mid;
      snap(L.down, `hi = ${hi}. Indo de mid + 1 para a esquerda a encosta sobe: ou mid é pico ou existe um antes dele (a[lo - 1] < a[lo], ou -∞). Descarta a[${mid + 1}..].`,
        { lo, hi, vars: { lo, hi, mid } });
    }
  }
  snap(L.ret, `Pico no índice ${lo} (a[${lo}] = ${a[lo]}), depois de ${cmps} comparações.`, { lo, hi, pk: lo, vars: { lo }, result: lo });
  return out;
}

if (typeof module !== 'undefined') module.exports = { PK_NUMS, PK_CODE, pkLinear, pkBinary };
