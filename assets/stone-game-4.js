// Stone Game IV: generates one step per executed line, as a snapshot for the player.
// One pile of n stones; a move removes a non-zero perfect square. win[i] = the player to move with i stones wins.
// Runs in the browser (globals) and in node (module.exports) for the test.
if (typeof module !== 'undefined') globalThis.listing ??= require('./trace.js').listing;

const SG4_N = 10;

const SG4_CODE = {
  array: listing([
    ['alloc', 'const win = Array(n + 1)'],
    ['base', 'win[0] = false                       // sem pedras: quem joga perde'],
    ['fori', 'for (let i = 1; i <= n; i++) {'],
    ['init', '  win[i] = false                     // até achar uma jogada vencedora'],
    ['fork', '  for (let k = 1; k * k <= i; k++)'],
    ['test', '    if (!win[i - k*k]) {             // deixa o rival numa posição perdedora?'],
    ['found', '      win[i] = true; break'],
    [null, '    }'],
    [null, '}'],
    ['ret', 'return win[n]'],
  ]),
  memo: listing([
    ['alloc', 'const memo = Array(n + 1)'],
    ['fn', 'function f(i) {'],
    ['base', '  if (i === 0) return false          // sem jogada: perde'],
    ['hit', '  if (memo[i] !== undefined) return memo[i]   // cache hit'],
    ['fork', '  for (let k = 1; k * k <= i; k++)'],
    ['rec', '    if (!f(i - k*k))                  // o rival perde a partir daí?'],
    ['win', '      return memo[i] = true'],
    ['lose', '  return memo[i] = false             // toda jogada deixa o rival vencendo'],
    [null, '}'],
    ['call', 'return f(n)'],
  ]),
};

const sg4Who = (b) => b ? 'Alice vence (true)' : 'Bob vence (false)';

// Bottom-up: win[i] for i = 0..n, trying squares in increasing order and stopping at the first winning move.
function sg4Array(n = SG4_N) {
  const L = SG4_CODE.array.at, win = new Array(n + 1).fill(null), out = [];
  const snap = (line, msg, s = {}) => out.push({ dp: win.slice(), read: [], write: [], line, msg, ...s });

  snap(L.alloc, `malloc: ${n + 1} células, uma para cada quantidade de pedras de 0 a ${n}. Memória ainda com lixo.`);
  win[0] = false;
  snap(L.base, 'Caso base: com 0 pedras o jogador da vez não tem jogada, então perde. win[0] = F.', { write: [0], vars: { 'win[0]': 'F' } });
  for (let i = 1; i <= n; i++) {
    snap(L.fori, `i = ${i}: o jogador da vez, diante de ${i} pedra${i > 1 ? 's' : ''}, vence?`, { i, vars: { i } });
    win[i] = false;
    snap(L.init, `Começa supondo que perde: win[${i}] = F. Basta uma jogada boa para virar T.`, { i, write: [i], vars: { i } });
    let k = 1;
    for (; k * k <= i; k++) {
      const q = k * k, r = i - q;
      snap(L.fork, `k = ${k}: tenta tirar ${k}² = ${q} pedra${q > 1 ? 's' : ''} (${q} ≤ ${i}).`, { i, k, vars: { i, k, 'k*k': q } });
      if (!win[r]) {
        snap(L.test, `Sobram ${r}: win[${r}] = F, o rival fica numa posição perdedora. Achei a jogada!`, { i, k, read: [r], vars: { i, k, 'k*k': q, resto: r } });
        win[i] = true;
        snap(L.found, `win[${i}] = T, e o break encerra o laço de k: uma jogada vencedora já basta, testar quadrados maiores não muda a resposta.`,
          { i, k, write: [i], vars: { i, k, 'win[i]': 'T' } });
        break;
      }
      snap(L.test, `Sobram ${r}: win[${r}] = T, o rival venceria a partir dali. Jogada ruim, tenta o próximo quadrado.`, { i, k, read: [r], vars: { i, k, 'k*k': q, resto: r } });
    }
    if (!win[i]) snap(L.fork, `k = ${k}: ${k}² = ${k * k} > ${i}, não há mais quadrados. Toda jogada deixava o rival vencendo: win[${i}] fica F.`,
      { i, k, vars: { i, k, 'win[i]': 'F' } });
  }
  snap(L.ret, `win[${n}] = ${win[n] ? 'T' : 'F'} → ${sg4Who(win[n])}.`, { read: [n], result: win[n] });
  return out;
}

// Top-down: f(i) = the player to move with i stones wins. A "chama" and a "voltou" step on each recursive call.
function sg4Memo(n = SG4_N) {
  const L = SG4_CODE.memo.at, memo = new Array(n + 1).fill(null), stack = [], out = [];
  let calls = 0, hits = 0, maxDepth = 0;
  const snap = (line, msg, s = {}) => out.push({ dp: memo.slice(), stack: stack.map((f) => ({ ...f })), read: [], write: [], calls, hits, maxDepth, line, msg, ...s });

  const f = (i) => {
    const fr = { call: `f(${i})`, note: '' };
    stack.push(fr); calls++; maxDepth = Math.max(maxDepth, stack.length);
    snap(L.fn, `Entra em f(${i}): o jogador da vez tem ${i} pedra${i === 1 ? '' : 's'}. Empilha um frame (profundidade ${stack.length}).`, { i, vars: { i } });
    if (i === 0) {
      fr.note = 'ret F';
      snap(L.base, 'i = 0: sem pedras, não há jogada. Retorna false sem usar o memo.', { i, vars: { i, ret: 'F' } });
      stack.pop(); return false;
    }
    snap(L.base, `i = ${i} > 0: ainda há jogadas.`, { i, vars: { i } });
    if (memo[i] !== null) {
      hits++; fr.note = `hit → ${memo[i] ? 'T' : 'F'}`;
      snap(L.hit, `CACHE HIT: memo[${i}] = ${memo[i] ? 'T' : 'F'} já foi calculado. Sem memo, toda essa subárvore seria refeita.`, { i, read: [i], vars: { i, 'memo[i]': memo[i] ? 'T' : 'F' } });
      stack.pop(); return memo[i];
    }
    snap(L.hit, `memo[${i}] vazio: precisa calcular.`, { i, vars: { i } });

    let k = 1;
    for (; k * k <= i; k++) {
      const q = k * k, r = i - q;
      snap(L.fork, `k = ${k}: tenta tirar ${q} pedra${q > 1 ? 's' : ''}.`, { i, k, vars: { i, k, 'k*k': q } });
      snap(L.rec, `Chama f(${r}): o rival vence com ${r} pedra${r === 1 ? '' : 's'}?`, { i, k, vars: { i, k, 'k*k': q } });
      const sub = f(r);
      fr.note += `${fr.note ? ' ' : ''}f(${r})=${sub ? 'T' : 'F'}`;
      snap(L.rec, `f(${r}) voltou ${sub ? 'T' : 'F'}: ${sub ? 'o rival venceria, jogada ruim.' : 'o rival perde, jogada vencedora!'}`, { i, k, vars: { i, k, 'f(i-k*k)': sub ? 'T' : 'F' } });
      if (!sub) {
        memo[i] = true; fr.note += ' → T';
        snap(L.win, `Grava memo[${i}] = T e retorna na hora: não precisa testar os outros quadrados.`, { i, write: [i], vars: { i, k, 'memo[i]': 'T' } });
        stack.pop(); return true;
      }
    }
    snap(L.fork, `k = ${k}: ${k * k} > ${i}, acabaram os quadrados.`, { i, k, vars: { i, k } });
    memo[i] = false; fr.note += ' → F';
    snap(L.lose, `Nenhuma jogada deixou o rival perdendo: grava memo[${i}] = F e retorna.`, { i, write: [i], vars: { i, 'memo[i]': 'F' } });
    stack.pop(); return false;
  };

  snap(L.alloc, `malloc: memo com ${n + 1} células vazias. Nada é calculado até alguém pedir.`);
  snap(L.call, `Chama f(${n}): Alice começa com ${n} pedras.`);
  const ans = f(n);
  snap(L.call, `f(${n}) = ${ans ? 'T' : 'F'} → ${sg4Who(ans)}. ${calls} chamadas, ${hits} cache hits.`, { read: n > 0 ? [n] : [], result: ans });
  return out;
}

if (typeof module !== 'undefined') module.exports = { SG4_N, SG4_CODE, sg4Array, sg4Memo };
