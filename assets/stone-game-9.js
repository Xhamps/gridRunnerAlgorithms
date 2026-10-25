// Stone Game IX: one step per executed line, as a snapshot for the player.
// Only stone % 3 matters, so the state is (c0, c1, c2, s): how many of each residue are left and the removed sum % 3.
// Runs in the browser (globals) and in node (module.exports) for the test.
if (typeof module !== 'undefined') globalThis.listing ??= require('./trace.js').listing;

const SG9_STONES = [3, 1, 4, 2, 6, 5];

const SG9_COUNT = [
  ['zero', 'const c = [0, 0, 0]                 // quantas pedras ≡ 0, 1, 2 (mod 3)'],
  ['forx', 'for (const x of stones)'],
  ['cnt', '  c[x % 3]++'],
];

const SG9_CODE = {
  memo: listing([
    ...SG9_COUNT,
    ['alloc', 'const memo = 4D (c[0]+1)×(c[1]+1)×(c[2]+1)×3'],
    ['fn', 'function f(c0, c1, c2, s) {          // s = soma retirada % 3'],
    ['base', '  if (c0 + c1 + c2 === 0) return n % 2 === 1   // acabou: Bob vence'],
    ['hit', '  if (memo[c0][c1][c2][s] !== undefined) return memo[c0][c1][c2][s]'],
    ['forr', '  for (const r of [0, 1, 2]) {'],
    ['skip', '    if ([c0, c1, c2][r] === 0 || (s + r) % 3 === 0) continue'],
    ['call', '    const rival = f(c0 - (r === 0), c1 - (r === 1), c2 - (r === 2), (s + r) % 3)'],
    ['win', '    if (!rival) return memo[c0][c1][c2][s] = true'],
    [null, '  }'],
    ['lose', '  return memo[c0][c1][c2][s] = false   // toda jogada perde'],
    [null, '}'],
    ['ret', 'return f(c[0], c[1], c[2], 0)'],
  ]),
  contagem: listing([
    ...SG9_COUNT,
    ['par', 'const par = c[0] % 2 === 0           // zeros só trocam a vez'],
    ['casoPar', 'const casoPar = c[1] >= 1 && c[2] >= 1'],
    ['casoImpar', 'const casoImpar = Math.abs(c[1] - c[2]) > 2'],
    ['ret', 'return par ? casoPar : casoImpar'],
  ]),
};

// Shared prologue: counts residues into cells 0..2 of the heap.
function sg9Count(stones, L, snap, c) {
  c[0] = c[1] = c[2] = 0;
  snap(L.zero, 'Só o resto por 3 de cada pedra importa. c = [0, 0, 0].', { write: [0, 1, 2], vars: { c: '[0, 0, 0]' } });
  stones.forEach((x, k) => {
    snap(L.forx, `x = stones[${k}] = ${x}.`, { k, vars: { x, 'x % 3': x % 3 } });
    c[x % 3]++;
    snap(L.cnt, `${x} % 3 = ${x % 3} → c[${x % 3}] = ${c[x % 3]}.`, { k, write: [x % 3], vars: { x, c: `[${c.slice(0, 3)}]` } });
  });
}

// Top-down minimax over (c0, c1, c2, s). Heap: c[0..2], then memo flattened as ((c0·(C1+1) + c1)·(C2+1) + c2)·3 + s.
function sg9Memo(stones = SG9_STONES) {
  const L = SG9_CODE.memo.at, n = stones.length, out = [], stack = [];
  const cells = [null, null, null];
  let calls = 0, hits = 0, maxDepth = 0;
  const snap = (line, msg, s = {}) => out.push({ dp: cells.slice(), stack: stack.map((f) => ({ ...f })), read: [], write: [], calls, hits, maxDepth, line, msg, ...s });

  sg9Count(stones, L, snap, cells);
  const [C0, C1, C2] = cells;
  const idx = (c0, c1, c2, s) => 3 + ((c0 * (C1 + 1) + c1) * (C2 + 1) + c2) * 3 + s;
  cells.push(...new Array((C0 + 1) * (C1 + 1) * (C2 + 1) * 3).fill(null));
  snap(L.alloc, `malloc: ${C0 + 1}×${C1 + 1}×${C2 + 1}×3 = ${cells.length - 3} estados vazios. Um estado = quantas pedras de cada resto sobram + a soma retirada % 3.`,
    { vars: { c: `[${C0}, ${C1}, ${C2}]` } });

  const f = (c0, c1, c2, s) => {
    const fr = { call: `f(${c0},${c1},${c2},${s})`, note: '' }, st = { c0, c1, c2, s };
    const who = (n - c0 - c1 - c2) % 2 === 0 ? 'Alice' : 'Bob';
    stack.push(fr); calls++; maxDepth = Math.max(maxDepth, stack.length);
    snap(L.fn, `Entra em ${fr.call}: vez de ${who}, soma retirada ≡ ${s}. Empilha um frame (profundidade ${stack.length}).`, { st, vars: { ...st, vez: who } });

    if (c0 + c1 + c2 === 0) {
      const v = n % 2 === 1;
      fr.note = `ret ${v}`;
      snap(L.base, `Não sobrou pedra e ninguém perdeu: Bob vence. Quem está na vez é ${who} → ${v}.`, { st, vars: { ...st, vez: who, ret: v } });
      stack.pop(); return v;
    }
    snap(L.base, `Ainda há ${c0 + c1 + c2} pedra(s): o jogo continua.`, { st, vars: { ...st, vez: who } });
    const k = idx(c0, c1, c2, s);
    if (cells[k] !== null) {
      hits++; fr.note = `hit → ${cells[k]}`;
      snap(L.hit, `CACHE HIT: memo[${c0}][${c1}][${c2}][${s}] = ${cells[k]}. Outra ordem de jogadas já chegou neste mesmo estado.`, { st, read: [k], vars: { ...st, memo: cells[k] } });
      stack.pop(); return cells[k];
    }
    snap(L.hit, `memo[${c0}][${c1}][${c2}][${s}] vazio: precisa calcular.`, { st, vars: { ...st, vez: who } });

    const cnt = [c0, c1, c2];
    for (const r of [0, 1, 2]) {
      snap(L.forr, `${who} tenta tirar uma pedra de resto ${r}.`, { st, r, vars: { ...st, r } });
      const ns = (s + r) % 3;
      if (cnt[r] === 0 || ns === 0) {
        snap(L.skip, cnt[r] === 0 ? `Não sobrou pedra de resto ${r}: pula.` : `Tirar resto ${r} deixa a soma ≡ 0: ${who} perderia na hora. Pula.`, { st, r, vars: { ...st, r } });
        continue;
      }
      snap(L.skip, `Há pedra de resto ${r} e a soma vira ≡ ${ns} ≠ 0: jogada válida.`, { st, r, vars: { ...st, r } });
      const nc = cnt.map((v, q) => v - (q === r));
      snap(L.call, `Chama f(${nc},${ns}): o rival joga a partir daí.`, { st, r, vars: { ...st, r } });
      const rival = f(nc[0], nc[1], nc[2], ns);
      fr.note += `r${r}:${rival ? 'rival vence' : 'rival perde'} `;
      snap(L.call, `f(${nc},${ns}) voltou ${rival}.`, { st, r, vars: { ...st, r, rival } });
      if (!rival) {
        cells[k] = true; fr.note += '→ true';
        snap(L.win, `O rival perde depois dessa jogada: ${who} vence. Grava memo = true, retorna e desempilha.`, { st, r, write: [k], vars: { ...st, r, memo: true } });
        stack.pop(); return true;
      }
      snap(L.win, `O rival vence depois dessa jogada: não serve, tenta o próximo resto.`, { st, r, vars: { ...st, r, rival } });
    }
    cells[k] = false; fr.note += '→ false';
    snap(L.lose, `Nenhuma jogada deixa o rival perdendo: ${who} perde. Grava memo = false.`, { st, write: [k], vars: { ...st, memo: false } });
    stack.pop(); return false;
  };

  snap(L.ret, `Chama f(${C0}, ${C1}, ${C2}, 0): nada retirado, Alice na vez.`);
  const ans = f(C0, C1, C2, 0);
  snap(L.ret, `f(${C0}, ${C1}, ${C2}, 0) = ${ans} → ${ans ? 'Alice' : 'Bob'} vence. ${calls} chamadas, ${hits} cache hits.`,
    { read: [idx(C0, C1, C2, 0)], result: ans });
  return out;
}

// O(n): count residues and apply the rule. Heap: c[0..2], par, casoPar, casoImpar.
function sg9Counting(stones = SG9_STONES) {
  const L = SG9_CODE.contagem.at, out = [], cells = new Array(6).fill(null);
  const snap = (line, msg, s = {}) => out.push({ dp: cells.slice(), read: [], write: [], line, msg, ...s });

  sg9Count(stones, L, snap, cells);
  const [c0, c1, c2] = cells, cs = { c: `[${c0}, ${c1}, ${c2}]` };
  cells[3] = c0 % 2 === 0;
  snap(L.par, `c[0] = ${c0} é ${cells[3] ? 'par: os zeros se anulam em pares' : 'ímpar: sobra um zero que troca a vez uma vez'}.`, { read: [0], write: [3], vars: { ...cs, par: cells[3] } });
  cells[4] = c1 >= 1 && c2 >= 1;
  snap(L.casoPar, `Se par: Alice precisa de pelo menos um 1 e um 2 (c[1] = ${c1}, c[2] = ${c2}) → ${cells[4]}.`, { read: [1, 2], write: [4], vars: { ...cs, casoPar: cells[4] } });
  cells[5] = Math.abs(c1 - c2) > 2;
  snap(L.casoImpar, `Se ímpar: |${c1} − ${c2}| = ${Math.abs(c1 - c2)} > 2? → ${cells[5]}.`, { read: [1, 2], write: [5], vars: { ...cs, casoImpar: cells[5] } });
  const ans = cells[3] ? cells[4] : cells[5];
  snap(L.ret, `par = ${cells[3]} → usa ${cells[3] ? 'casoPar' : 'casoImpar'} = ${ans} → ${ans ? 'Alice' : 'Bob'} vence.`,
    { read: [3, cells[3] ? 4 : 5], result: ans, vars: { ...cs, resposta: ans } });
  return out;
}

if (typeof module !== 'undefined') module.exports = { SG9_STONES, SG9_CODE, sg9Memo, sg9Counting };
