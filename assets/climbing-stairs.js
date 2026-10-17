// Climbing Stairs: generates one step per executed line, as a snapshot for the player.
// Ways to reach step n taking 1 or 2 steps at a time: ways(i) = ways(i-1) + ways(i-2), Fibonacci in disguise.
// Runs in the browser (globals) and in node (module.exports) for the test.
if (typeof module !== 'undefined') globalThis.listing ??= require('./trace.js').listing;

const STAIRS_N = 5;

const STAIRS_CODE = {
  array: listing([
    ['alloc', 'const dp = Array(n + 1)'],
    ['base', 'dp[0] = 1; dp[1] = 1               // chão: 1 jeito · degrau 1: 1 jeito'],
    ['fori', 'for (let i = 2; i <= n; i++)'],
    ['upd', '  dp[i] = dp[i-1] + dp[i-2]          // último passo: 1 ou 2 degraus'],
    ['ret', 'return dp[n]'],
  ]),
  vars: listing([
    ['init', 'let a = 1, b = 1                   // a = dp[i-2], b = dp[i-1]'],
    ['fori', 'for (let i = 2; i <= n; i++) {'],
    ['next', '  const c = a + b                    // dp[i]'],
    ['shift', '  a = b; b = c                       // desliza a janela'],
    [null, '}'],
    ['ret', 'return b'],
  ]),
  memo: listing([
    ['alloc', 'const memo = Array(n + 1)'],
    ['fn', 'function f(i) {'],
    ['base', '  if (i <= 1) return 1                // chão ou degrau 1'],
    ['hit', '  if (memo[i] !== undefined) return memo[i]   // cache hit'],
    ['um', '  const um = f(i - 1)                 // último passo de 1 degrau'],
    ['dois', '  const dois = f(i - 2)               // último passo de 2 degraus'],
    ['save', '  return memo[i] = um + dois'],
    [null, '}'],
    ['call', 'return f(n)'],
  ]),
};

// Single array of n+1: dp[i] = ways to reach step i.
function stairsArray(n = STAIRS_N) {
  const L = STAIRS_CODE.array.at, dp = new Array(n + 1).fill(null), out = [];
  const snap = (line, msg, s = {}) => out.push({ dp: dp.slice(), read: [], write: [], line, msg, ...s });

  snap(L.alloc, `malloc: ${n + 1} células, uma por degrau (0 = chão). Memória ainda com lixo.`);
  dp[0] = 1; dp[1] = 1;
  snap(L.base, 'Casos base: há 1 jeito de "chegar" ao chão (não subir nada) e 1 jeito de chegar ao degrau 1 (um passo).', { write: [0, 1] });
  for (let i = 2; i <= n; i++) {
    snap(L.fori, `i = ${i}: quantos jeitos de chegar ao degrau ${i}?`, { i, vars: { i } });
    dp[i] = dp[i - 1] + dp[i - 2];
    snap(L.upd, `O último passo veio do degrau ${i - 1} (passo de 1) ou do ${i - 2} (passo de 2): ${dp[i - 1]} + ${dp[i - 2]} = ${dp[i]}.`,
      { i, read: [i - 1, i - 2], write: [i], vars: { i, 'dp[i-1]': dp[i - 1], 'dp[i-2]': dp[i - 2], 'dp[i]': dp[i] } });
  }
  snap(L.ret, `Resposta: dp[${n}] = ${dp[n]}.`, { read: [n], result: dp[n] });
  return out;
}

// O(1): only the last two values are ever read. Heap cells: [a, b, c] (c is the temporary).
function stairsVars(n = STAIRS_N) {
  const L = STAIRS_CODE.vars.at, cells = [null, null, null], out = [];
  const snap = (line, msg, s = {}) => out.push({ dp: cells.slice(), read: [], write: [], line, msg, ...s });

  cells[0] = 1; cells[1] = 1;
  snap(L.init, 'a = dp[0] = 1 e b = dp[1] = 1. Só estas duas células existem: a janela dos dois últimos degraus.', { write: [0, 1], vars: { a: 1, b: 1 } });
  for (let i = 2; i <= n; i++) {
    const [a, b] = cells;
    snap(L.fori, `i = ${i}: a = jeitos até o degrau ${i - 2}, b = jeitos até o degrau ${i - 1}.`, { i, vars: { i, a, b } });
    cells[2] = a + b;
    snap(L.next, `c = ${a} + ${b} = ${cells[2]} jeitos de chegar ao degrau ${i}.`, { i, read: [0, 1], write: [2], vars: { i, a, b, c: cells[2] } });
    cells[0] = b; cells[1] = cells[2];
    snap(L.shift, `A janela anda um degrau: a = ${b} (degrau ${i - 1}), b = ${cells[1]} (degrau ${i}). O valor antigo de a (${a}) é sobrescrito: ninguém vai lê-lo de novo.`,
      { i, read: [1, 2], write: [0, 1], vars: { i, a: cells[0], b: cells[1] } });
  }
  snap(L.ret, `Resposta: b = ${cells[1]}.`, { read: [1], result: cells[1] });
  return out;
}

// Top-down: recursion + memo of n+1. A step for each line, plus one when a recursive call returns.
function stairsMemo(n = STAIRS_N) {
  const L = STAIRS_CODE.memo.at, memo = new Array(n + 1).fill(null), stack = [], out = [];
  let calls = 0, hits = 0, maxDepth = 0;
  const snap = (line, msg, s = {}) => out.push({ dp: memo.slice(), stack: stack.map((f) => ({ ...f })), read: [], write: [], calls, hits, maxDepth, line, msg, ...s });

  const f = (i) => {
    const fr = { call: `f(${i})`, note: '' };
    stack.push(fr); calls++; maxDepth = Math.max(maxDepth, stack.length);
    snap(L.fn, `Entra em ${fr.call}: empilha um frame (profundidade ${stack.length}).`, { i, vars: { i } });
    if (i <= 1) {
      fr.note = 'ret 1';
      snap(L.base, `i = ${i} ≤ 1: ${i ? 'um único passo' : 'já está no chão'}, 1 jeito. Retorna sem usar o memo.`, { i, vars: { i, ret: 1 } });
      stack.pop(); return 1;
    }
    snap(L.base, `i = ${i} > 1: não é caso base.`, { i, vars: { i } });
    if (memo[i] !== null) {
      hits++; fr.note = `hit → ${memo[i]}`;
      snap(L.hit, `CACHE HIT: memo[${i}] = ${memo[i]} já foi calculado. Sem memo, essa subárvore inteira seria refeita.`, { i, read: [i], vars: { i, 'memo[i]': memo[i] } });
      stack.pop(); return memo[i];
    }
    snap(L.hit, `memo[${i}] vazio: precisa calcular.`, { i, vars: { i } });

    snap(L.um, `Último passo de 1 degrau: chama f(${i - 1}).`, { i, vars: { i } });
    const um = f(i - 1);
    fr.note = `um=${um}`;
    snap(L.um, `f(${i - 1}) voltou ${um}.`, { i, vars: { i, um } });
    snap(L.dois, `Último passo de 2 degraus: chama f(${i - 2}).`, { i, vars: { i, um } });
    const dois = f(i - 2);
    fr.note += ` dois=${dois}`;
    snap(L.dois, `f(${i - 2}) voltou ${dois}.`, { i, vars: { i, um, dois } });

    memo[i] = um + dois; fr.note += ` → ${memo[i]}`;
    snap(L.save, `Grava memo[${i}] = ${um} + ${dois} = ${memo[i]}, retorna e desempilha.`, { i, write: [i], vars: { i, um, dois, 'memo[i]': memo[i] } });
    stack.pop(); return memo[i];
  };

  snap(L.alloc, `malloc: memo com ${n + 1} células vazias. Nada é calculado até alguém pedir.`);
  snap(L.call, `Chama f(${n}): a pergunta final é o ponto de partida.`);
  const ans = f(n);
  snap(L.call, `f(${n}) = ${ans}. ${calls} chamadas, ${hits} cache hits.`, { read: n > 1 ? [n] : [], result: ans });
  return out;
}

if (typeof module !== 'undefined') module.exports = { STAIRS_N, STAIRS_CODE, stairsArray, stairsVars, stairsMemo };
