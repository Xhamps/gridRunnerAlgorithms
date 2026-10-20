// Sort Colors: one step per executed line, as a snapshot for the player.
// Array of 0/1/2 (red/white/blue) sorted in place with O(1) extra memory.
// Runs in the browser (globals) and in node (module.exports) for the test.
if (typeof module !== 'undefined') globalThis.listing ??= require('./trace.js').listing;

const SC_NUMS = [1, 2, 0, 2, 1, 0, 1];

const SC_CODE = {
  duas: listing([
    ['init', 'let p = 0                          // a[0..p-1] já está pronto'],
    ['for1', 'for (let i = 0; i < n; i++) {     // passada 1: puxa os 0'],
    ['if1', '  if (a[i] === 0) {'],
    ['swap1', '    [a[p], a[i]] = [a[i], a[p]]'],
    ['inc1', '    p++'],
    [null, '  }'],
    [null, '}'],
    ['for2', 'for (let i = p; i < n; i++) {     // passada 2: puxa os 1'],
    ['if2', '  if (a[i] === 1) {'],
    ['swap2', '    [a[p], a[i]] = [a[i], a[p]]'],
    ['inc2', '    p++'],
    [null, '  }'],
    [null, '}'],
    ['ret', 'return a'],
  ]),
  bandeira: listing([
    ['init', 'let lo = 0, mid = 0, hi = n - 1'],
    ['loop', 'while (mid <= hi) {                // [mid..hi] = ainda não visto'],
    ['is0', '  if (a[mid] === 0) {'],
    ['swap0', '    [a[lo], a[mid]] = [a[mid], a[lo]]'],
    ['adv0', '    lo++; mid++                     // o que veio de lo é 1: já visto'],
    ['is1', '  } else if (a[mid] === 1) {'],
    ['adv1', '    mid++'],
    [null, '  } else {                         // a[mid] === 2'],
    ['swap2', '    [a[mid], a[hi]] = [a[hi], a[mid]]'],
    ['dec2', '    hi--                            // mid fica: o valor novo não foi olhado'],
    [null, '  }'],
    [null, '}'],
    ['ret', 'return a'],
  ]),
};

const SC_NAME = ['vermelho', 'branco', 'azul'];

// Two Lomuto-style passes: zeros to the front, then ones right after them. 2 passes, O(1).
function scTwoPass(nums = SC_NUMS) {
  const L = SC_CODE.duas.at, a = nums.slice(), n = a.length, out = [];
  let swaps = 0, p = 0, start = 0, pass = 1;
  // zones: '0'/'1' done, '12' = non-zero in pass 1, '2' = twos in pass 2, '?' = not seen yet
  const zones = (i) => a.map((_, k) => k < start ? '0' : k < p ? String(pass - 1) : k < i ? (pass === 1 ? '12' : '2') : '?');
  const snap = (line, msg, i, s = {}) => out.push({
    dp: a.slice(), read: [], write: [], line, msg, swaps, zone: zones(i ?? n),
    ptr: { p, ...(i === undefined ? {} : { i }) }, ...s,
  });

  snap(L.init, 'p = 0: tudo antes de p já está no lugar. Passada 1 junta os vermelhos (0) na frente.', 0, { vars: { p } });
  for (let i = 0; ; i++) {
    if (i >= n) { snap(L.for1, `i = ${i} = n: fim da passada 1. a[0..${p - 1}] são os ${p} zeros; o resto é 1 ou 2.`, n, { vars: { i, p } }); break; }
    snap(L.for1, `i = ${i}: lê a[${i}].`, i, { vars: { i, p } });
    snap(L.if1, a[i] === 0 ? `a[${i}] = 0 (${SC_NAME[0]}): vai para a casa p = ${p}.` : `a[${i}] = ${a[i]} (${SC_NAME[a[i]]}): fica onde está por enquanto.`,
      i, { read: [i], vars: { i, p, 'a[i]': a[i] } });
    if (a[i] === 0) {
      [a[p], a[i]] = [a[i], a[p]]; swaps++;
      snap(L.swap1, p === i ? `p = i = ${i}: troca a casa com ela mesma.` : `Troca a[${p}] ↔ a[${i}]: o 0 vai para a frente e o ${a[i]} para a casa ${i}.`,
        i, { write: p === i ? [i] : [p, i], vars: { i, p } });
      p++;
      snap(L.inc1, `p = ${p}: a[0..${p - 1}] só tem zeros.`, i + 1, { vars: { i, p } });
    }
  }
  start = p; pass = 2;
  for (let i = start; ; i++) {
    if (i >= n) { snap(L.for2, `i = ${i} = n: fim da passada 2. Os 1 ficaram antes dos 2.`, n, { vars: { i, p } }); break; }
    snap(L.for2, i === start ? `Passada 2 começa em i = p = ${p}: os zeros não precisam ser olhados de novo.` : `i = ${i}: lê a[${i}].`,
      i, { vars: { i, p } });
    snap(L.if2, a[i] === 1 ? `a[${i}] = 1 (${SC_NAME[1]}): vai para a casa p = ${p}, logo depois dos zeros.` : `a[${i}] = 2 (${SC_NAME[2]}): fica para o fim.`,
      i, { read: [i], vars: { i, p, 'a[i]': a[i] } });
    if (a[i] === 1) {
      [a[p], a[i]] = [a[i], a[p]]; swaps++;
      snap(L.swap2, p === i ? `p = i = ${i}: troca a casa com ela mesma.` : `Troca a[${p}] ↔ a[${i}]: o 1 vai para a casa ${p} e o 2 para a ${i}.`,
        i, { write: p === i ? [i] : [p, i], vars: { i, p } });
      p++;
      snap(L.inc2, `p = ${p}: a[${start}..${p - 1}] só tem uns.`, i + 1, { vars: { i, p } });
    }
  }
  snap(L.ret, `Pronto: [${a.join(', ')}]. Duas passadas, ${swaps} trocas.`, n, { ptr: {}, result: a.slice() });
  return out;
}

// Dutch flag: [0,lo) = 0, [lo,mid) = 1, [mid,hi] = unseen, (hi,n) = 2. One pass, O(1).
function scDutch(nums = SC_NUMS) {
  const L = SC_CODE.bandeira.at, a = nums.slice(), n = a.length, out = [];
  let swaps = 0, lo = 0, mid = 0, hi = n - 1;
  const snap = (line, msg, s = {}) => out.push({
    dp: a.slice(), read: [], write: [], line, msg, swaps, ptr: { lo, mid, hi },
    zone: a.map((_, k) => k < lo ? '0' : k < mid ? '1' : k <= hi ? '?' : '2'), vars: { lo, mid, hi }, ...s,
  });

  snap(L.init, `lo = mid = 0, hi = ${hi}: tudo ainda é zona desconhecida [mid..hi].`);
  while (true) {
    if (mid > hi) { snap(L.loop, `mid = ${mid} > hi = ${hi}: a zona desconhecida acabou. Fim.`); break; }
    snap(L.loop, `mid = ${mid} ≤ hi = ${hi}: ainda há ${hi - mid + 1} casa(s) por olhar.`);
    const v = a[mid], vars = { lo, mid, hi, 'a[mid]': v };
    snap(L.is0, v === 0 ? `a[${mid}] = 0 (${SC_NAME[0]}): vai para a zona dos vermelhos.` : `a[${mid}] = ${v}: não é 0.`, { read: [mid], vars });
    if (v === 0) {
      [a[lo], a[mid]] = [a[mid], a[lo]]; swaps++;
      snap(L.swap0, lo === mid ? `lo = mid = ${mid}: troca a casa com ela mesma.` : `Troca a[${lo}] ↔ a[${mid}]: o 0 entra na zona vermelha e um 1 sai dela para a casa ${mid}.`,
        { write: lo === mid ? [mid] : [lo, mid] });
      lo++; mid++;
      snap(L.adv0, `lo = ${lo}, mid = ${mid}: os dois andam, porque o que veio de lo já tinha sido visto (era 1, ou a própria casa).`);
      continue;
    }
    snap(L.is1, v === 1 ? `a[${mid}] = 1 (${SC_NAME[1]}): já está na zona certa.` : `a[${mid}] = 2 (${SC_NAME[2]}): vai para o fim.`, { read: [mid], vars });
    if (v === 1) {
      mid++;
      snap(L.adv1, `mid = ${mid}: a zona branca cresce uma casa.`);
      continue;
    }
    [a[mid], a[hi]] = [a[hi], a[mid]]; swaps++;
    snap(L.swap2, mid === hi ? `mid = hi = ${mid}: troca a casa com ela mesma.` : `Troca a[${mid}] ↔ a[${hi}]: o 2 vai para o fim e o ${a[mid]} chega em mid sem ter sido olhado.`,
      { write: mid === hi ? [mid] : [mid, hi] });
    hi--;
    snap(L.dec2, `hi = ${hi}. mid NÃO anda: a[${mid}] = ${a[mid]} veio da zona desconhecida e precisa ser testado.`);
  }
  snap(L.ret, `Pronto: [${a.join(', ')}]. Uma passada, ${swaps} trocas.`, { ptr: {}, zone: a.map((v) => String(v)), result: a.slice() });
  return out;
}

if (typeof module !== 'undefined') module.exports = { SC_NUMS, SC_CODE, scTwoPass, scDutch };
