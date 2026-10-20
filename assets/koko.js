// Koko (Velocidade Mínima): one step per executed line, as a snapshot for the player.
// Piles of bananas, h hours, at most one pile per hour: smallest integer speed v that finishes in time.
// Heap snapshot dp = piles (read only). hours(v) is a helper with "chama"/"voltou" steps on the call line.
// Runs in the browser (globals) and in node (module.exports) for the test.
if (typeof module !== 'undefined') globalThis.listing ??= require('./trace.js').listing;

const KK_PILES = [3, 6, 7, 11];
const KK_H = 8;

const KK_HOURS = [
  ['fn', 'function hours(v) {                  // horas gastas comendo v por hora'],
  ['init', '  let t = 0'],
  ['forp', '  for (const p of piles)'],
  ['add', '    t += Math.ceil(p / v)            // a sobra da última hora é perdida'],
  ['hret', '  return t'],
  [null, '}'],
];

const KK_CODE = {
  linear: listing([
    ...KK_HOURS,
    ['v0', 'let v = 1'],
    ['loop', 'while (hours(v) > h)                 // ainda não dá tempo?'],
    ['inc', '  v++'],
    ['ret', 'return v'],
  ]),
  binaria: listing([
    ...KK_HOURS,
    ['lohi', 'let lo = 1, hi = Math.max(...piles)   // a resposta está em [lo, hi]'],
    ['loop', 'while (lo < hi) {'],
    ['mid', '  const mid = (lo + hi) >> 1'],
    ['chk', '  if (hours(mid) <= h) {'],
    ['hi', '    hi = mid                           // mid serve: resposta é mid ou menor'],
    ['else', '  } else {'],
    ['lo', '    lo = mid + 1                       // mid não serve: nem nada abaixo dele'],
    [null, '  }'],
    [null, '}'],
    ['ret', 'return lo'],
  ]),
};

// Shared state + the hours(v) helper; `tried` maps each v already measured to its hours.
function kkRun(code, piles, h) {
  const L = code.at, out = [], stack = [], tried = {}, st = { calls: 0, maxDepth: 0 };
  const max = Math.max(...piles);
  const snap = (line, msg, s = {}) => out.push({
    dp: piles.slice(), read: [], write: [], stack: stack.map((f) => ({ ...f })), tried: { ...tried },
    max, h, ...st, line, msg, ...s,
  });
  const hours = (v, at, R) => {
    snap(at, `Chama hours(${v}): quantas horas para comer tudo a ${v} por hora?`, R(v));
    const fr = { call: `hours(${v})`, note: '' };
    stack.push(fr); st.calls++; st.maxDepth = Math.max(st.maxDepth, stack.length);
    const S = (s = {}) => ({ ...R(v), cur: v, ...s, vars: { v, t, ...s.vars } });
    let t = 0;
    snap(L.fn, `Entra em hours(${v}). Empilha um frame.`, S());
    snap(L.init, 't = 0: nenhuma hora gasta ainda.', S());
    const each = piles.map(() => null);
    for (let k = 0; k < piles.length; k++) {
      const p = piles[k];
      snap(L.forp, `Próxima pilha: piles[${k}] = ${p}.`, S({ read: [k], each: each.slice(), vars: { p } }));
      const c = Math.ceil(p / v);
      t += c; each[k] = c; fr.note = `t = ${t}`;
      snap(L.add, `ceil(${p} / ${v}) = ${c} hora${c > 1 ? 's' : ''}${p % v ? ` (a última hora come só ${p % v} e sobra tempo)` : ''}. t = ${t}.`,
        S({ read: [k], each: each.slice(), vars: { p } }));
    }
    snap(L.forp, `Acabaram as pilhas: t = ${t}.`, S({ each: each.slice() }));
    tried[v] = t; fr.note = `→ ${t}`;
    snap(L.hret, `Retorna ${t} horas. Desempilha.`, S({ each: each.slice() }));
    stack.pop();
    return { t, each };
  };
  return { L, out, snap, hours, max };
}

// Try v = 1, 2, 3, ... until it fits. O(answer · n).
function kkLinear(piles = KK_PILES, h = KK_H) {
  const { L, out, snap, hours } = kkRun(KK_CODE.linear, piles, h);
  let v = 1;
  const R = (x) => ({ cur: x, vars: { v: x, h } });
  snap(L.v0, 'v = 1: começa pela velocidade mais lenta possível.', R(v));
  for (;;) {
    const { t, each } = hours(v, L.loop, R);
    if (t > h) {
      snap(L.loop, `hours(${v}) voltou ${t}. ${t} > ${h}: não dá tempo, precisa ir mais rápido.`, { ...R(v), each, vars: { v, h, 'hours(v)': t } });
      v++;
      snap(L.inc, `v = ${v}.`, R(v));
    } else {
      snap(L.loop, `hours(${v}) voltou ${t}. ${t} ≤ ${h}: dá tempo! O laço para.`, { ...R(v), each, vars: { v, h, 'hours(v)': t } });
      break;
    }
  }
  snap(L.ret, `Resposta: v = ${v}. Toda velocidade menor foi testada e estourou as ${h} horas.`, { ...R(v), ans: v, result: v });
  return out;
}

// Binary search on the answer: hours(v) never grows as v grows, so "fits" is false...false true...true.
function kkBinary(piles = KK_PILES, h = KK_H) {
  const { L, out, snap, hours, max } = kkRun(KK_CODE.binaria, piles, h);
  let lo = 1, hi = max;
  const R = (mid) => ({ lo, hi, mid, vars: { lo, hi, mid } });
  snap(L.lohi, `lo = 1, hi = ${hi} (a maior pilha): a ${hi} por hora cada pilha leva 1 hora, e n = ${piles.length} ≤ h = ${h}. A resposta está em [${lo}, ${hi}].`, R());
  for (;;) {
    if (!(lo < hi)) {
      snap(L.loop, `lo = hi = ${lo}: sobrou um candidato só, e ele é a resposta.`, R());
      break;
    }
    snap(L.loop, `lo = ${lo} < hi = ${hi}: ainda há ${hi - lo + 1} candidatos.`, R());
    const mid = (lo + hi) >> 1;
    snap(L.mid, `mid = (${lo} + ${hi}) >> 1 = ${mid}.`, R(mid));
    const { t, each } = hours(mid, L.chk, () => R(mid));
    if (t <= h) {
      snap(L.chk, `hours(${mid}) voltou ${t}. ${t} ≤ ${h}: mid serve.`, { ...R(mid), each, vars: { lo, hi, mid, 'hours(mid)': t } });
      hi = mid;
      snap(L.hi, `hi = ${mid}: descarta tudo acima de ${mid}. Resposta em [${lo}, ${hi}].`, R(mid));
    } else {
      snap(L.chk, `hours(${mid}) voltou ${t}. ${t} > ${h}: mid é lento demais.`, { ...R(mid), each, vars: { lo, hi, mid, 'hours(mid)': t } });
      snap(L.else, `Cai no else: qualquer v ≤ ${mid} também estoura.`, R(mid));
      lo = mid + 1;
      snap(L.lo, `lo = ${lo}: descarta o ${mid} e tudo abaixo dele. Resposta em [${lo}, ${hi}].`, R(mid));
    }
  }
  snap(L.ret, `Resposta: v = ${lo}. ${Object.keys(out.at(-1).tried).length} chamadas de hours em vez de testar um por um.`,
    { lo, hi, ans: lo, result: lo, vars: { lo, hi } });
  return out;
}

if (typeof module !== 'undefined') module.exports = { KK_PILES, KK_H, KK_CODE, kkLinear, kkBinary };
