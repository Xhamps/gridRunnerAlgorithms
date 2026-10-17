// Longest Common Subsequence: generates one step per executed line, as a snapshot for the player.
// dp[i][j] = length of the LCS of the prefixes a[0..i) and b[0..j).
// Runs in the browser (globals) and in node (module.exports) for the test.
if (typeof module !== 'undefined') globalThis.listing ??= require('./trace.js').listing;

const A = 'ABDCB', B = 'ACBC';

const LCS_CODE = {
  matriz: listing([
    ['alloc', 'const dp = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0))'],
    ['fori', 'for (let i = 1; i <= m; i++)'],
    ['forj', '  for (let j = 1; j <= n; j++)'],
    ['if', '    if (a[i-1] === b[j-1]) dp[i][j] = dp[i-1][j-1] + 1   // casou: diagonal + 1'],
    ['else', '    else dp[i][j] = max(dp[i-1][j], dp[i][j-1])        // cima × esquerda'],
    ['back', "let i = m, j = n, lcs = ''                            // caminho de volta"],
    ['while', 'while (i > 0 && j > 0)'],
    ['bmatch', '  if (a[i-1] === b[j-1]) { lcs = a[i-1] + lcs; i--; j-- }'],
    ['bup', '  else if (dp[i-1][j] >= dp[i][j-1]) i--'],
    ['bleft', '  else j--'],
    ['ret', 'return dp[m][n]'],
  ]),
  array: listing([
    ['alloc', 'const dp = Array(n + 1).fill(0)'],
    ['fori', 'for (let i = 1; i <= m; i++) {'],
    ['prev', '  let prev = 0                                  // dp[i-1][0], a diagonal da coluna 1'],
    ['forj', '  for (let j = 1; j <= n; j++) {'],
    ['tmp', '    const tmp = dp[j]                            // dp[i-1][j], antes de sobrescrever'],
    ['if', '    if (a[i-1] === b[j-1]) dp[j] = prev + 1       // diagonal + 1'],
    ['else', '    else dp[j] = max(dp[j], dp[j-1])              // cima × esquerda'],
    ['shift', '    prev = tmp                                   // vira a diagonal da coluna j+1'],
    [null, '  }'],
    [null, '}'],
    ['ret', 'return dp[n]'],
  ]),
  memo: listing([
    ['alloc', 'const memo = Array.from({ length: m }, () => Array(n))'],
    ['fn', 'function f(i, j) {                              // LCS de a[i..] e b[j..]'],
    ['base', '  if (i === m || j === n) return 0'],
    ['hit', '  if (memo[i][j] !== undefined) return memo[i][j]   // cache hit'],
    ['if', '  if (a[i] === b[j])'],
    ['match', '    return memo[i][j] = 1 + f(i + 1, j + 1)'],
    ['skip', '  return memo[i][j] = max(f(i + 1, j), f(i, j + 1))'],
    [null, '}'],
    ['call', 'return f(0, 0)'],
  ]),
};

// Matrix (m+1) x (n+1), row-major. After filling, walks back from dp[m][n] to rebuild the subsequence.
function lcs2D(a, b) {
  const L = LCS_CODE.matriz.at, m = a.length, n = b.length, cols = n + 1;
  const dp = new Array((m + 1) * cols).fill(0), out = [], path = [], pickA = [], pickB = [];
  const at = (i, j) => i * cols + j;
  const snap = (line, msg, x = {}) => out.push({ dp: dp.slice(), read: [], write: [], path: path.slice(), pickA: pickA.slice(), pickB: pickB.slice(), line, msg, ...x });

  snap(L.alloc, `malloc: (m+1)×(n+1) = ${(m + 1) * cols} células, todas 0. A linha 0 e a coluna 0 já são o caso base: LCS com string vazia = 0.`,
    { write: dp.map((_, k) => k).filter((k) => k < cols || k % cols === 0) });

  for (let i = 1; i <= m; i++) {
    snap(L.fori, `i = ${i}: linha do prefixo "${a.slice(0, i)}" (último caractere "${a[i - 1]}").`, { i, j: 0, vars: { i, 'a[i-1]': a[i - 1] } });
    for (let j = 1; j <= n; j++) {
      const v = { i, j, 'a[i-1]': a[i - 1], 'b[j-1]': b[j - 1] }, eq = a[i - 1] === b[j - 1];
      snap(L.forj, `j = ${j}: LCS de "${a.slice(0, i)}" e "${b.slice(0, j)}"?`, { i, j, vars: v });
      if (eq) {
        dp[at(i, j)] = dp[at(i - 1, j - 1)] + 1;
        snap(L.if, `"${a[i - 1]}" = "${b[j - 1]}": os dois prefixos terminam igual, esse caractere entra na LCS. Diagonal dp[${i - 1}][${j - 1}] + 1 = ${dp[at(i, j)]}.`,
          { i, j, read: [at(i - 1, j - 1)], write: [at(i, j)], vars: { ...v, 'dp[i][j]': dp[at(i, j)] } });
      } else {
        snap(L.if, `"${a[i - 1]}" ≠ "${b[j - 1]}": não casou, vai para o else.`, { i, j, vars: v });
        const up = dp[at(i - 1, j)], left = dp[at(i, j - 1)];
        dp[at(i, j)] = Math.max(up, left);
        snap(L.else, `Descarta "${a[i - 1]}" (cima: dp[${i - 1}][${j}] = ${up}) ou descarta "${b[j - 1]}" (esquerda: dp[${i}][${j - 1}] = ${left}) → ${dp[at(i, j)]}.`,
          { i, j, read: [at(i - 1, j), at(i, j - 1)], write: [at(i, j)], vars: { ...v, cima: up, esquerda: left, 'dp[i][j]': dp[at(i, j)] } });
      }
    }
  }

  let i = m, j = n, lcs = '';
  path.push(at(i, j));
  snap(L.back, `Tabela pronta: o tamanho é dp[${m}][${n}] = ${dp[at(m, n)]}. Agora refaz o caminho de trás para frente para descobrir QUAL é a subsequência.`,
    { i, j, read: [at(i, j)], back: true, vars: { i, j, lcs: '""' } });
  while (i > 0 && j > 0) {
    const v = { i, j, 'a[i-1]': a[i - 1], 'b[j-1]': b[j - 1], lcs: `"${lcs}"` };
    snap(L.while, `i = ${i}, j = ${j}: os dois ainda têm caracteres, continua.`, { i, j, back: true, vars: v });
    if (a[i - 1] === b[j - 1]) {
      lcs = a[i - 1] + lcs; pickA.push(i - 1); pickB.push(j - 1); i--; j--; path.push(at(i, j));
      snap(L.bmatch, `"${v['a[i-1]']}" = "${v['b[j-1]']}": foi daqui que veio o +1. Entra na LCS e anda na diagonal → lcs = "${lcs}".`,
        { i, j, back: true, read: [at(i, j)], vars: { ...v, i, j, lcs: `"${lcs}"` } });
      continue;
    }
    snap(L.bmatch, `"${a[i - 1]}" ≠ "${b[j - 1]}": esse valor veio de cima ou da esquerda.`, { i, j, back: true, vars: v });
    const up = dp[at(i - 1, j)], left = dp[at(i, j - 1)];
    if (up >= left) {
      i--; path.push(at(i, j));
      snap(L.bup, `cima (${up}) ≥ esquerda (${left}): o valor veio de cima. Descarta "${a[i]}" → i = ${i}.`,
        { i, j, back: true, read: [at(i, j), at(i + 1, j - 1)], vars: { ...v, i, cima: up, esquerda: left } });
    } else {
      snap(L.bup, `cima (${up}) < esquerda (${left}): não veio de cima.`, { i, j, back: true, read: [at(i - 1, j), at(i, j - 1)], vars: { ...v, cima: up, esquerda: left } });
      j--; path.push(at(i, j));
      snap(L.bleft, `Veio da esquerda. Descarta "${b[j]}" → j = ${j}.`, { i, j, back: true, read: [at(i, j)], vars: { ...v, j, cima: up, esquerda: left } });
    }
  }
  snap(L.while, `${i === 0 ? 'i' : 'j'} = 0: um dos prefixos acabou, fim do caminho. lcs = "${lcs}".`, { i, j, back: true, vars: { i, j, lcs: `"${lcs}"` } });
  const ans = dp[at(m, n)];
  snap(L.ret, `dp[${m}][${n}] = ${ans}: a LCS de "${a}" e "${b}" tem tamanho ${ans} (uma delas: "${lcs}").`,
    { read: [at(m, n)], back: true, result: ans, lcs, vars: { tamanho: ans, lcs: `"${lcs}"` } });
  return out;
}

// One row of n+1 + two variables: prev (cell n+1) holds the old diagonal, tmp (cell n+2) saves dp[j] before it is overwritten.
function lcs1D(a, b) {
  const L = LCS_CODE.array.at, m = a.length, n = b.length, PV = n + 1, TM = n + 2;
  const dp = new Array(n + 3).fill(0), gen = new Array(n + 3).fill(0), out = [];
  dp[PV] = dp[TM] = gen[PV] = gen[TM] = null;
  const snap = (line, msg, x = {}) => out.push({ dp: dp.slice(), gen: gen.slice(), read: [], write: [], line, msg, ...x });
  const regs = () => ({ prev: dp[PV], tmp: dp[TM] ?? '—' });

  snap(L.alloc, `Só uma linha de n+1 = ${n + 1} células (+ prev e tmp). A matriz teria ${(m + 1) * (n + 1)}. Tudo 0 = linha i=0.`,
    { write: [...Array(n + 1).keys()] });
  for (let i = 1; i <= m; i++) {
    snap(L.fori, `i = ${i}: o array vai virar a linha "${a.slice(0, i)}". Por enquanto ainda guarda a linha i=${i - 1}.`, { i, j: 0, vars: { i, 'a[i-1]': a[i - 1] } });
    dp[PV] = 0; gen[PV] = i - 1;
    snap(L.prev, `prev = 0: a diagonal da coluna 1 é dp[${i - 1}][0], que é sempre 0 (coluna do vazio).`, { i, j: 0, write: [PV], vars: { i, ...regs() } });
    for (let j = 1; j <= n; j++) {
      const v = { i, j, 'a[i-1]': a[i - 1], 'b[j-1]': b[j - 1] };
      snap(L.forj, `j = ${j}: LCS de "${a.slice(0, i)}" e "${b.slice(0, j)}"? dp[${j}] ainda é da linha i=${i - 1}.`, { i, j, vars: { ...v, ...regs() } });
      dp[TM] = dp[j]; gen[TM] = i - 1;
      snap(L.tmp, `tmp = dp[${j}] = ${dp[TM]}: guarda o valor de cima (linha ${i - 1}) ANTES de sobrescrever. Ele vai ser a diagonal da próxima coluna.`,
        { i, j, read: [j], write: [TM], vars: { ...v, ...regs() } });
      if (a[i - 1] === b[j - 1]) {
        dp[j] = dp[PV] + 1; gen[j] = i;
        snap(L.if, `"${a[i - 1]}" = "${b[j - 1]}": precisa da diagonal dp[${i - 1}][${j - 1}]. Mas dp[${j - 1}] já foi sobrescrito com a linha ${i}! ` +
          `Ela sobreviveu em prev = ${dp[PV]} → dp[${j}] = ${dp[j]}.`, { i, j, read: [PV], write: [j], vars: { ...v, ...regs(), 'dp[j]': dp[j] } });
      } else {
        snap(L.if, `"${a[i - 1]}" ≠ "${b[j - 1]}": não casou, vai para o else.`, { i, j, vars: { ...v, ...regs() } });
        const up = dp[j], left = dp[j - 1];
        dp[j] = Math.max(up, left); gen[j] = i;
        snap(L.else, `dp[${j}] = ${up} ainda é de cima (linha ${i - 1}); dp[${j - 1}] = ${left} já é da esquerda (linha ${i}). max = ${dp[j]}.`,
          { i, j, read: [j, j - 1], write: [j], vars: { ...v, ...regs(), cima: up, esquerda: left, 'dp[j]': dp[j] } });
      }
      dp[PV] = dp[TM]; gen[PV] = i - 1;
      snap(L.shift, `prev = tmp = ${dp[PV]}: o dp[${i - 1}][${j}] antigo vira a diagonal da coluna ${j + 1}.`, { i, j, read: [TM], write: [PV], vars: { i, j, ...regs() } });
    }
  }
  snap(L.ret, `dp[${n}] = ${dp[n]}: tamanho da LCS de "${a}" e "${b}".`, { read: [n], result: dp[n] });
  return out;
}

// Top-down: f(i, j) = LCS of the suffixes a[i..] and b[j..]. memo m x n. A step for each line, plus one when a call returns.
function lcsMemo(a, b) {
  const L = LCS_CODE.memo.at, m = a.length, n = b.length;
  const memo = new Array(m * n).fill(null), stack = [], out = [];
  let calls = 0, hits = 0, maxDepth = 0;
  const snap = (line, msg, x = {}) => out.push({ dp: memo.slice(), stack: stack.map((f) => ({ ...f })), read: [], write: [], calls, hits, maxDepth, line, msg, ...x });

  const f = (i, j) => {
    const fr = { call: `f(${i}, ${j})`, note: '' };
    stack.push(fr); calls++; maxDepth = Math.max(maxDepth, stack.length);
    const idx = i * n + j, v = { i, j, 'a[i..]': `"${a.slice(i)}"`, 'b[j..]': `"${b.slice(j)}"` };
    snap(L.fn, `Entra em ${fr.call}: LCS de "${a.slice(i)}" e "${b.slice(j)}"? (profundidade ${stack.length})`, { i, j, vars: v });

    if (i === m || j === n) {
      fr.note = 'ret 0';
      snap(L.base, `${i === m ? 'a' : 'b'} acabou: LCS com string vazia = 0. Retorna sem usar o memo.`, { i, j, vars: { ...v, ret: 0 } });
      stack.pop(); return 0;
    }
    snap(L.base, `Os dois sufixos têm caracteres, não é caso base.`, { i, j, vars: v });
    if (memo[idx] !== null) {
      hits++; fr.note = `hit → ${memo[idx]}`;
      snap(L.hit, `CACHE HIT: memo[${i}][${j}] = ${memo[idx]} já foi calculado. Retorna sem recursão.`, { i, j, read: [idx], vars: { ...v, 'memo[i][j]': memo[idx] } });
      stack.pop(); return memo[idx];
    }
    snap(L.hit, `memo[${i}][${j}] vazio: precisa calcular.`, { i, j, vars: v });

    const eq = a[i] === b[j];
    snap(L.if, `a[${i}] = "${a[i]}" e b[${j}] = "${b[j]}": ${eq ? 'iguais, esse caractere entra na LCS.' : 'diferentes, vai para a última linha.'}`, { i, j, vars: v });
    let ans;
    if (eq) {
      snap(L.match, `Casou "${a[i]}": avança os dois → chama f(${i + 1}, ${j + 1}).`, { i, j, vars: v });
      const r = f(i + 1, j + 1); ans = 1 + r;
      fr.note = `1 + ${r}`;
      snap(L.match, `f(${i + 1}, ${j + 1}) voltou ${r} → 1 + ${r} = ${ans}.`, { i, j, vars: { ...v, ans } });
    } else {
      snap(L.skip, `Descarta "${a[i]}": chama f(${i + 1}, ${j}).`, { i, j, vars: v });
      const r1 = f(i + 1, j);
      fr.note = `pula a=${r1}`;
      snap(L.skip, `f(${i + 1}, ${j}) voltou ${r1}. Agora descarta "${b[j]}": chama f(${i}, ${j + 1}).`, { i, j, vars: { ...v, 'pula a[i]': r1 } });
      const r2 = f(i, j + 1); ans = Math.max(r1, r2);
      fr.note += ` pula b=${r2}`;
      snap(L.skip, `f(${i}, ${j + 1}) voltou ${r2} → max(${r1}, ${r2}) = ${ans}.`, { i, j, vars: { ...v, 'pula a[i]': r1, 'pula b[j]': r2, ans } });
    }
    memo[idx] = ans; fr.note += ` → ${ans}`;
    snap(eq ? L.match : L.skip, `Grava memo[${i}][${j}] = ${ans}, retorna e desempilha.`, { i, j, write: [idx], vars: { ...v, 'memo[i][j]': ans } });
    stack.pop(); return ans;
  };

  snap(L.alloc, `malloc: memo m×n = ${m * n} células vazias. Os casos base (string vazia) não ocupam o memo.`);
  snap(L.call, `Chama f(0, 0): as duas strings inteiras.`);
  const ans = f(0, 0);
  const used = memo.filter((x) => x !== null).length;
  snap(L.call, `f(0, 0) = ${ans}. ${calls} chamadas, ${hits} cache hits, ${used}/${memo.length} células do memo usadas.`,
    { i: 0, j: 0, read: m && n ? [0] : [], result: ans });
  return out;
}

if (typeof module !== 'undefined') module.exports = { A, B, LCS_CODE, lcs2D, lcs1D, lcsMemo };
