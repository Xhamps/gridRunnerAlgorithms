// Insert Position: one step per executed line, as a snapshot for the player.
// Sorted distinct array + target: index of target, or where it would go to keep the order.
// Runs in the browser (globals) and in node (module.exports) for the test.
if (typeof module !== 'undefined') globalThis.listing ??= require('./trace.js').listing;

const IP_NUMS = [1, 3, 5, 6, 8, 10, 12];
const IP_TARGET = 7;

const IP_CODE = {
  linear: listing([
    ['init', 'let ans = n                       // ninguém ≥ target: entra no fim'],
    ['fori', 'for (let i = 0; i < n; i++) {'],
    ['cmp', '  if (a[i] >= target) {           // primeiro que não é menor'],
    ['set', '    ans = i'],
    ['brk', '    break'],
    [null, '  }'],
    [null, '}'],
    ['ret', 'return ans'],
  ]),
  binaria: listing([
    ['init', 'let lo = 0, hi = n                // a resposta está em [lo, hi]'],
    ['loop', 'while (lo < hi) {                 // a[0..lo-1] < target ≤ a[hi..n-1]'],
    ['mid', '  const mid = (lo + hi) >> 1'],
    ['cmp', '  if (a[mid] < target) {'],
    ['lo', '    lo = mid + 1                    // mid e tudo antes dele são < target'],
    [null, '  } else {'],
    ['hi', '    hi = mid                        // a[mid] ≥ target: mid ainda pode ser a resposta'],
    [null, '  }'],
    [null, '}'],
    ['ret', 'return lo                         // lo = hi: primeira casa com a[k] ≥ target'],
  ]),
};

// Linear scan: the first a[i] >= target is the answer. O(n).
function ipLinear(nums = IP_NUMS, target = IP_TARGET) {
  const L = IP_CODE.linear.at, a = nums.slice(), n = a.length, out = [];
  let cmps = 0;
  const snap = (line, msg, s = {}) => out.push({ dp: a.slice(), read: [], write: [], line, msg, cmps, target, ...s });

  let ans = n;
  snap(L.init, `ans = n = ${n}: se todo mundo for menor que ${target}, o target entra depois do último.`, { vars: { target, ans } });
  let i = 0;
  for (; i < n; i++) {
    snap(L.fori, `i = ${i}: olha a[${i}] = ${a[i]}.`, { i, vars: { target, i, ans } });
    cmps++;
    const hit = a[i] >= target;
    snap(L.cmp, hit ? `a[${i}] = ${a[i]} ≥ ${target}: ${a[i] === target ? 'achou o target' : `é o primeiro maior, então ${target} entra aqui`}.`
      : `a[${i}] = ${a[i]} < ${target}: o target vai depois dele. Segue.`, { i, read: [i], vars: { target, i, 'a[i]': a[i], ans } });
    if (hit) {
      ans = i;
      snap(L.set, `ans = ${i}.`, { i, vars: { target, i, ans } });
      snap(L.brk, 'break: o resto do array só tem números maiores, não precisa olhar.', { i, vars: { target, i, ans } });
      break;
    }
  }
  if (i === n) snap(L.fori, `i = ${n} = n: acabou o array sem achar ninguém ≥ ${target}.`, { i, vars: { target, i, ans } });
  snap(L.ret, `Resposta: ${ans}${a[ans] === target ? ` (a[${ans}] = ${target})` : `, onde ${target} seria inserido`}. ${cmps} comparações.`,
    { i: ans, result: ans, vars: { target, ans } });
  return out;
}

// Lower bound on the half-open range [lo, hi): first index with a[k] >= target. O(log n).
function ipBinary(nums = IP_NUMS, target = IP_TARGET) {
  const L = IP_CODE.binaria.at, a = nums.slice(), n = a.length, out = [];
  let cmps = 0, lo = 0, hi = n;
  const snap = (line, msg, s = {}) => out.push({ dp: a.slice(), read: [], write: [], line, msg, cmps, target, lo, hi, ...s });

  snap(L.init, `lo = 0, hi = n = ${n}. hi pode ser n: a resposta pode ser "depois do último". Antes de lo só há números < ${target}; de hi em diante, só ≥ ${target}.`,
    { vars: { target, lo, hi } });
  for (;;) {
    snap(L.loop, lo < hi ? `lo = ${lo} < hi = ${hi}: ainda há ${hi - lo} candidatas em [${lo}, ${hi}).`
      : `lo = hi = ${lo}: sobrou uma casa só, sem precisar ter achado o ${target}. Sai do laço.`, { vars: { target, lo, hi } });
    if (lo >= hi) break;
    const mid = (lo + hi) >> 1;
    snap(L.mid, `mid = (${lo} + ${hi}) >> 1 = ${mid}.`, { mid, vars: { target, lo, hi, mid } });
    cmps++;
    const less = a[mid] < target;
    snap(L.cmp, less ? `a[${mid}] = ${a[mid]} < ${target}: a resposta está depois de mid.`
      : `a[${mid}] = ${a[mid]} ≥ ${target}: a resposta é mid ou alguma casa antes.`,
    { mid, read: [mid], vars: { target, lo, hi, mid, 'a[mid]': a[mid] } });
    if (less) {
      lo = mid + 1;
      snap(L.lo, `lo = ${lo}: descarta a[..${mid}], todos menores que ${target}.`, { mid, vars: { target, lo, hi, mid } });
    } else {
      hi = mid;
      snap(L.hi, `hi = ${hi}: descarta a[${mid + 1}..], mas mantém mid como fronteira (o intervalo é aberto em hi).`, { mid, vars: { target, lo, hi, mid } });
    }
  }
  snap(L.ret, `Resposta: ${lo}${a[lo] === target ? ` (a[${lo}] = ${target}, achou)` : `: ${target} não está no array e entraria na casa ${lo}`}. ${cmps} comparações.`,
    { result: lo, vars: { target, lo, hi } });
  return out;
}

if (typeof module !== 'undefined') module.exports = { IP_NUMS, IP_TARGET, IP_CODE, ipLinear, ipBinary };
