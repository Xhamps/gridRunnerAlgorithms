// Stone Game VI: one step per executed line, as a snapshot for the player.
// Each stone has a value for Alice (a[i]) and for Bob (b[i]); whoever picks it scores their own value.
// Runs in the browser (globals) and in node (module.exports) for the test.
if (typeof module !== 'undefined') globalThis.listing ??= require('./trace.js').listing;

const SG6_A = [2, 4, 3];
const SG6_B = [1, 6, 7];

const SG6_CODE = {
  forca: listing([
    ['alloc', 'const memo = Array(1 << n)              // uma célula por máscara'],
    ['fn', 'function f(mask) {                      // diferença do jogador da vez'],
    ['base', '  if (mask === (1 << n) - 1) return 0    // acabaram as pedras'],
    ['hit', '  if (memo[mask] !== undefined) return memo[mask]   // cache hit'],
    ['best', '  let best = -Infinity'],
    ['fori', '  for (let i = 0; i < n; i++) {'],
    ['taken', '    if (mask & (1 << i)) continue          // pedra já foi pega'],
    ['val', '    const v = pop(mask) % 2 === 0 ? a[i] : b[i]   // Alice ou Bob?'],
    ['rec', '    const d = v - f(mask | (1 << i))'],
    ['upd', '    best = max(best, d)'],
    [null, '  }'],
    ['save', '  return memo[mask] = best'],
    [null, '}'],
    ['call', 'const d = f(0)                          // Alice começa'],
    ['ret', 'return d > 0 ? 1 : d < 0 ? -1 : 0'],
  ]),
  guloso: listing([
    ['idx', 'const idx = [...a.keys()]               // 0, 1, ..., n-1'],
    ['sort', 'idx.sort((x, y) => (a[y] + b[y]) - (a[x] + b[x]))   // maior a+b primeiro'],
    ['init', 'let alice = 0, bob = 0'],
    ['fork', 'for (let k = 0; k < n; k++) {'],
    ['turn', '  if (k % 2 === 0) alice += a[idx[k]]   // vez da Alice'],
    ['bob', '  else bob += b[idx[k]]                  // vez do Bob'],
    [null, '}'],
    ['ret', 'const d = alice - bob'],
    ['sign', 'return d > 0 ? 1 : d < 0 ? -1 : 0'],
  ]),
};

const sg6Sign = (d) => d > 0 ? 1 : d < 0 ? -1 : 0;
const sg6Word = (r) => r === 1 ? 'Alice vence (1)' : r === -1 ? 'Bob vence (−1)' : 'empate (0)';
const sg6Bits = (mask, n) => mask.toString(2).padStart(n, '0');
const sg6Pop = (mask) => mask.toString(2).replace(/0/g, '').length;

// Minimax over the set of taken stones (bitmask) with memo. f(mask) = best (me − rival) from here on.
function sg6Brute(a = SG6_A, b = SG6_B) {
  const L = SG6_CODE.forca.at, n = a.length, full = (1 << n) - 1;
  const memo = new Array(1 << n).fill(null), stack = [], out = [];
  let calls = 0, hits = 0, maxDepth = 0;
  const snap = (line, msg, s = {}) => out.push({ dp: memo.slice(), stack: stack.map((f) => ({ ...f })), read: [], write: [], calls, hits, maxDepth, line, msg, ...s });

  const f = (mask) => {
    const bits = sg6Bits(mask, n), who = sg6Pop(mask) % 2 === 0 ? 'Alice' : 'Bob';
    const fr = { call: `f(${bits})`, note: '' };
    stack.push(fr); calls++; maxDepth = Math.max(maxDepth, stack.length);
    const base = { mask: bits, vez: who };
    snap(L.fn, `Entra em f(${bits}): ${sg6Pop(mask)} pedra(s) já pegas, vez de ${who}. Empilha um frame (profundidade ${stack.length}).`, { mask, vars: base });

    if (mask === full) {
      fr.note = 'ret 0';
      snap(L.base, `mask = ${bits}: todas as pedras foram pegas, não há mais pontos em jogo. Retorna 0.`, { mask, vars: { ...base, ret: 0 } });
      stack.pop(); return 0;
    }
    snap(L.base, `mask = ${bits}: ainda há pedras na mesa.`, { mask, vars: base });
    if (memo[mask] !== null) {
      hits++; fr.note = `hit → ${memo[mask]}`;
      snap(L.hit, `CACHE HIT: memo[${bits}] = ${memo[mask]}. As mesmas pedras foram pegas em outra ordem, e o que resta do jogo só depende de QUAIS sobraram.`,
        { mask, read: [mask], vars: { ...base, 'memo[mask]': memo[mask] } });
      stack.pop(); return memo[mask];
    }
    snap(L.hit, `memo[${bits}] vazio: precisa calcular.`, { mask, vars: base });

    let best = -Infinity;
    snap(L.best, `best = −∞: ${who} vai testar cada pedra livre e ficar com a melhor diferença.`, { mask, vars: { ...base, best: '−∞' } });
    const show = () => best === -Infinity ? '−∞' : best;
    for (let i = 0; i < n; i++) {
      snap(L.fori, `i = ${i}: pedra ${i} (Alice ${a[i]}, Bob ${b[i]}).`, { mask, i, vars: { ...base, i, best: show() } });
      if (mask & (1 << i)) {
        snap(L.taken, `Bit ${i} ligado em ${bits}: a pedra ${i} já foi pega. Pula.`, { mask, i, vars: { ...base, i, best: show() } });
        continue;
      }
      snap(L.taken, `Bit ${i} desligado: a pedra ${i} está livre.`, { mask, i, vars: { ...base, i, best: show() } });
      const v = who === 'Alice' ? a[i] : b[i];
      snap(L.val, `${who} pega a pedra ${i} e marca ${v} (o valor DELA para ${who}).`, { mask, i, vars: { ...base, i, v, best: show() } });
      const next = mask | (1 << i), nb = sg6Bits(next, n);
      snap(L.rec, `Chama f(${nb}): o rival joga no que sobra.`, { mask, i, vars: { ...base, i, v, best: show() } });
      const r = f(next), d = v - r;
      fr.note = `i=${i} d=${d}`;
      snap(L.rec, `f(${nb}) voltou ${r} → d = ${v} − ${r} = ${d}.`, { mask, i, vars: { ...base, i, v, d, best: show() } });
      const old = show();
      best = Math.max(best, d);
      snap(L.upd, `best = max(${old}, ${d}) = ${best}.`, { mask, i, vars: { ...base, i, d, best } });
    }
    snap(L.fori, `i = ${n}: fim do laço. Melhor diferença para ${who}: ${best}.`, { mask, vars: { ...base, best } });
    memo[mask] = best; fr.note = `→ ${best}`;
    snap(L.save, `Grava memo[${bits}] = ${best}, retorna e desempilha.`, { mask, write: [mask], vars: { ...base, 'memo[mask]': best } });
    stack.pop(); return best;
  };

  snap(L.alloc, `malloc: memo com 2^${n} = ${1 << n} células, uma por subconjunto de pedras já pegas. É isso que cresce exponencialmente.`);
  snap(L.call, `Chama f(${sg6Bits(0, n)}): nenhuma pedra pega, Alice na vez.`);
  const d = f(0);
  snap(L.call, `f(${sg6Bits(0, n)}) voltou ${d}: com jogo ótimo, Alice termina ${d} ponto(s) à frente de Bob (negativo = atrás). ${calls} chamadas, ${hits} cache hits.`,
    { read: [0], vars: { d } });
  const r = sg6Sign(d);
  snap(L.ret, `d = ${d} → ${sg6Word(r)}.`, { read: [0], vars: { d, ret: r }, result: r });
  return out;
}

// Greedy: sort by a[i] + b[i] descending and alternate. dp = idx array (stone order after the sort).
function sg6Greedy(a = SG6_A, b = SG6_B) {
  const L = SG6_CODE.guloso.at, n = a.length, out = [];
  let idx = new Array(n).fill(null), alice = 0, bob = 0;
  const snap = (line, msg, s = {}) => out.push({ dp: idx.slice(), read: [], write: [], owner: [], line, msg, ...s });
  const owner = [];

  idx = [...a.keys()];
  snap(L.idx, `idx = [${idx}]: os índices das pedras, ainda na ordem original.`, { write: [...idx.keys()] });
  idx.sort((x, y) => (a[y] + b[y]) - (a[x] + b[x]));
  snap(L.sort, `Ordena por a+b decrescente: [${idx.map((i) => `${i}(${a[i] + b[i]})`).join(', ')}]. A pedra que vale mais "somando os dois lados" vem primeiro.`,
    { write: [...idx.keys()] });
  snap(L.init, 'alice = 0, bob = 0.', { vars: { alice, bob } });
  for (let k = 0; k < n; k++) {
    const i = idx[k];
    snap(L.fork, `k = ${k}: a próxima pedra da fila é a ${i} (a+b = ${a[i] + b[i]}).`, { k, owner: owner.slice(), vars: { k, 'idx[k]': i, alice, bob } });
    if (k % 2 === 0) {
      alice += a[i]; owner[k] = 'A';
      snap(L.turn, `k par: vez da Alice. Ela pega a pedra ${i}: ganha ${a[i]} e tira ${b[i]} do Bob. alice = ${alice}.`,
        { k, read: [k], owner: owner.slice(), vars: { k, 'idx[k]': i, alice, bob } });
    } else {
      snap(L.turn, `k ímpar: não é a vez da Alice.`, { k, owner: owner.slice(), vars: { k, 'idx[k]': i, alice, bob } });
      bob += b[i]; owner[k] = 'B';
      snap(L.bob, `Vez do Bob. Ele pega a pedra ${i}: ganha ${b[i]} e tira ${a[i]} da Alice. bob = ${bob}.`,
        { k, read: [k], owner: owner.slice(), vars: { k, 'idx[k]': i, alice, bob } });
    }
  }
  snap(L.fork, `k = ${n}: acabaram as pedras.`, { owner: owner.slice(), vars: { alice, bob } });
  const d = alice - bob, r = sg6Sign(d);
  snap(L.ret, `d = ${alice} − ${bob} = ${d}.`, { owner: owner.slice(), vars: { alice, bob, d } });
  snap(L.sign, `d = ${d} → ${sg6Word(r)}.`, { owner: owner.slice(), vars: { alice, bob, d, ret: r }, result: r });
  return out;
}

if (typeof module !== 'undefined') module.exports = { SG6_A, SG6_B, SG6_CODE, sg6Brute, sg6Greedy };
