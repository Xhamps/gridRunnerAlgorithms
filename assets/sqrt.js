// Integer Square Root: one step per executed line, as a snapshot for the player.
// floor(√x) without Math.sqrt: the answer is the largest m in [0, x] with m·m ≤ x.
// Heap snapshot dp = the candidates 0..x (cell k holds k). sq[k] = k·k once k was probed.
// Runs in the browser (globals) and in node (module.exports) for the test.
if (typeof module !== 'undefined') globalThis.listing ??= require('./trace.js').listing;

const SQ_X = 40;

const SQ_CODE = {
  linear: listing([
    ['init', 'let m = 0'],
    ['loop', 'while ((m + 1) * (m + 1) <= x) {     // o próximo ainda cabe?'],
    ['inc', '  m++'],
    [null, '}'],
    ['ret', 'return m                           // m² ≤ x < (m+1)²'],
  ]),
  binaria: listing([
    ['init', 'let lo = 0, hi = x, ans = 0'],
    ['loop', 'while (lo <= hi) {                 // a resposta está em [lo, hi] ou já é ans'],
    ['mid', '  const mid = (lo + hi) >> 1'],
    ['cmp', '  if (mid * mid <= x) {             // na prática: mid <= x / mid'],
    ['ans', '    ans = mid                        // mid serve; talvez haja um maior'],
    ['lo', '    lo = mid + 1                     // descarta [lo, mid]'],
    [null, '  } else {'],
    ['hi', '    hi = mid - 1                     // mid² > x: descarta [mid, hi]'],
    [null, '  }'],
    [null, '}'],
    ['ret', 'return ans'],
  ]),
};

function sqSetup(x) {
  const dp = Array.from({ length: x + 1 }, (_, k) => k), sq = {}, out = [];
  const snap = (line, msg, s = {}) => out.push({ dp, sq: { ...sq }, read: [], write: [], line, msg, ...s });
  return { sq, out, snap };
}

// Walk up from 0 until the next square overshoots. O(√x).
function sqLinear(x = SQ_X) {
  const L = SQ_CODE.linear.at, { sq, out, snap } = sqSetup(x);
  let m = 0, probes = 0;
  snap(L.init, 'm = 0: 0² = 0 ≤ x sempre, então 0 é um candidato seguro.', { m, probes, vars: { m, x } });
  for (;;) {
    const n = m + 1, ok = n * n <= x;
    if (n <= x) sq[n] = n * n;
    probes++;
    snap(L.loop, ok ? `(${n})² = ${n * n} ≤ ${x}: ${n} também serve. Avança.`
      : `(${n})² = ${n * n} > ${x}: ${n} passou do ponto. Para com m = ${m}.`,
    { m, probes, read: n <= x ? [n] : [], vars: { m, 'm+1': n, '(m+1)²': n * n, x } });
    if (!ok) break;
    m++;
    snap(L.inc, `m = ${m}: ${m}² = ${m * m} ≤ ${x}.`, { m, probes, write: [m], vars: { m, x } });
  }
  snap(L.ret, `⌊√${x}⌋ = ${m}: ${m}² = ${m * m} ≤ ${x} < ${(m + 1) * (m + 1)} = ${m + 1}². ${probes} testes.`,
    { m, probes, done: true, result: m, vars: { m, x } });
  return out;
}

// Binary search on the answer: m·m ≤ x is true for a prefix of [0, x], find its last element. O(log x).
function sqBinary(x = SQ_X) {
  const L = SQ_CODE.binaria.at, { sq, out, snap } = sqSetup(x);
  let lo = 0, hi = x, ans = 0, probes = 0;
  const R = (s = {}) => ({ lo, hi, ans, probes, ...s, vars: { lo, hi, ...(s.mid === undefined ? {} : { mid: s.mid }), ans, ...s.vars } });
  snap(L.init, `lo = 0, hi = ${x}: a resposta está em algum lugar de [0, ${x}]. ans = 0 vale porque 0² ≤ x.`, R());
  for (;;) {
    if (!(lo <= hi)) {
      snap(L.loop, `lo = ${lo} > hi = ${hi}: o intervalo esvaziou. Todo k ≤ ${ans} tem k² ≤ x e todo k > ${ans} tem k² > x.`, R());
      break;
    }
    snap(L.loop, `[${lo}, ${hi}] tem ${hi - lo + 1} candidatos ainda não decididos.`, R());
    const mid = (lo + hi) >> 1;
    snap(L.mid, `mid = (${lo} + ${hi}) >> 1 = ${mid}: o meio do intervalo.`, R({ mid }));
    sq[mid] = mid * mid; probes++;
    const ok = mid * mid <= x;
    snap(L.cmp, ok ? `${mid}² = ${mid * mid} ≤ ${x}: ${mid} serve, e todo número menor também.`
      : `${mid}² = ${mid * mid} > ${x}: ${mid} é grande demais, e todo número maior também.`,
    R({ mid, probes, read: [mid], vars: { 'mid²': mid * mid, x } }));
    if (ok) {
      ans = mid;
      snap(L.ans, `ans = ${mid}: o melhor candidato visto até agora.`, R({ mid, write: [mid] }));
      lo = mid + 1;
      snap(L.lo, `lo = ${lo}: só vale a pena procurar acima de ${mid}.`, R({ mid }));
    } else {
      hi = mid - 1;
      snap(L.hi, `hi = ${hi}: a resposta está abaixo de ${mid}.`, R({ mid }));
    }
  }
  snap(L.ret, `⌊√${x}⌋ = ${ans}, com ${probes} testes em vez de ${ans + 1}.`, R({ done: true, result: ans }));
  return out;
}

if (typeof module !== 'undefined') module.exports = { SQ_X, SQ_CODE, sqLinear, sqBinary };
