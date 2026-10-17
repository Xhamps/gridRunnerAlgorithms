// Regular Expression Matching ('.' and '*'): generates one step per executed line, as a snapshot for the player.
// dp[i][j] = do the first i chars of s match the first j chars of p?
// Runs in the browser (globals) and in node (module.exports) for the test.
if (typeof module !== 'undefined') globalThis.listing ??= require('./trace.js').listing;

const S = 'aabb', P = '.*a*b';

const REGEX_CODE = {
  matriz: listing([
    ['alloc', 'const dp = Array.from({ length: m + 1 }, () => Array(n + 1).fill(false))'],
    ['base', 'dp[0][0] = true                                     // vazio casa com vazio'],
    ['row0', "for (let j = 1; j <= n; j++) dp[0][j] = p[j-1] === '*' && dp[0][j-2]"],
    ['fori', 'for (let i = 1; i <= m; i++)'],
    ['forj', '  for (let j = 1; j <= n; j++)'],
    ['star', "    if (p[j-1] === '*')"],
    ['starv', '      dp[i][j] = dp[i][j-2] || (casa(s[i-1], p[j-2]) && dp[i-1][j])'],
    ['lit', '    else dp[i][j] = casa(s[i-1], p[j-1]) && dp[i-1][j-1]'],
    ['ret', 'return dp[m][n]'],
  ]),
  array: listing([
    ['alloc', 'const dp = Array(n + 1).fill(false)'],
    ['base', 'dp[0] = true'],
    ['row0', "for (let j = 1; j <= n; j++) dp[j] = p[j-1] === '*' && dp[j-2]"],
    ['fori', 'for (let i = 1; i <= m; i++) {'],
    ['prev', '  let prev = dp[0]; dp[0] = false                // prev = diagonal'],
    ['forj', '  for (let j = 1; j <= n; j++) {'],
    ['up', '    const up = dp[j]                              // dp[i-1][j], antes de sobrescrever'],
    ['star', "    dp[j] = p[j-1] === '*'"],
    ['starv', '      ? dp[j-2] || (casa(s[i-1], p[j-2]) && up)'],
    ['lit', '      : casa(s[i-1], p[j-1]) && prev'],
    ['shift', '    prev = up                                     // vira a diagonal da coluna j+1'],
    [null, '  }'],
    [null, '}'],
    ['ret', 'return dp[n]'],
  ]),
  memo: listing([
    ['alloc', 'const memo = Array.from({ length: m + 1 }, () => Array(n + 1))'],
    ['fn', 'function f(i, j) {                                  // s[i..] casa com p[j..]?'],
    ['base', '  if (j === n) return i === m'],
    ['hit', '  if (memo[i][j] !== undefined) return memo[i][j]   // cache hit'],
    ['first', "  const first = i < m && (p[j] === '.' || p[j] === s[i])"],
    ['star', "  const ans = p[j+1] === '*'"],
    ['zero', '    ? f(i, j + 2) || (first && f(i + 1, j))           // zero vezes || consome um'],
    ['lit', '    : first && f(i + 1, j + 1)                        // casa um e avança'],
    ['save', '  return memo[i][j] = ans'],
    [null, '}'],
    ['call', 'return f(0, 0)'],
  ]),
};

const casa = (c, pc) => pc === '.' || pc === c;
const tf = (b) => b ? 'T' : 'F';

// Matrix (m+1) x (n+1), row-major.
function regex2D(s, p) {
  const L = REGEX_CODE.matriz.at, m = s.length, n = p.length, cols = n + 1;
  const dp = new Array((m + 1) * cols).fill(false), out = [];
  const at = (i, j) => i * cols + j;
  const snap = (line, msg, x = {}) => out.push({ dp: dp.slice(), read: [], write: [], line, msg, ...x });

  snap(L.alloc, `malloc: (m+1)×(n+1) = ${(m + 1) * cols} células, todas F. Linha i = "s[0..i)", coluna j = "p[0..j)".`);
  dp[0] = true;
  snap(L.base, 'dp[0][0] = T: string vazia casa com padrão vazio. A coluna 0 (padrão vazio) fica F para qualquer s não vazio.', { i: 0, j: 0, write: [0] });

  for (let j = 1; j <= n; j++) {
    const star = p[j - 1] === '*';
    dp[at(0, j)] = star && dp[at(0, j - 2)];
    snap(L.row0, star ? `j = ${j}: "${p.slice(0, j)}" casa com vazio se "${p[j - 2]}*" usar zero ocorrências: dp[0][${j - 2}] = ${tf(dp[at(0, j)])}.`
      : `j = ${j}: "${p.slice(0, j)}" termina em "${p[j - 1]}", que precisa de um caractere: não casa com vazio → F.`,
      { i: 0, j, read: star ? [at(0, j - 2)] : [], write: [at(0, j)], vars: { i: 0, j, 'p[j-1]': p[j - 1], 'dp[0][j]': tf(dp[at(0, j)]) } });
  }

  for (let i = 1; i <= m; i++) {
    snap(L.fori, `i = ${i}: linha do prefixo "${s.slice(0, i)}" (último caractere "${s[i - 1]}").`, { i, j: 0, vars: { i, 's[i-1]': s[i - 1] } });
    for (let j = 1; j <= n; j++) {
      const v = { i, j, 's[i-1]': s[i - 1], 'p[j-1]': p[j - 1] }, star = p[j - 1] === '*';
      snap(L.forj, `j = ${j}: "${s.slice(0, i)}" casa com "${p.slice(0, j)}"?`, { i, j, vars: v });
      snap(L.star, `p[${j - 1}] = "${p[j - 1]}" é '*'? ${star ? `Sim: o último elemento é "${p[j - 2]}*".` : 'Não: vai para o else (caractere ou ".").'}`, { i, j, star, vars: v });
      if (star) {
        const zero = dp[at(i, j - 2)], ok = casa(s[i - 1], p[j - 2]), more = ok && dp[at(i - 1, j)];
        dp[at(i, j)] = zero || more;
        snap(L.starv, `"${p[j - 2]}*" zero vezes: dp[${i}][${j - 2}] = ${tf(zero)} · consumir "${s[i - 1]}"` +
          (ok ? ` (casa com "${p[j - 2]}") e repetir: dp[${i - 1}][${j}] = ${tf(more)}` : ` não dá: "${s[i - 1]}" ≠ "${p[j - 2]}"`) + ` → ${tf(dp[at(i, j)])}.`,
          { i, j, star: true, read: [at(i, j - 2), at(i - 1, j)], write: [at(i, j)],
            vars: { ...v, 'zero vezes': tf(zero), [`casa(${s[i - 1]}, ${p[j - 2]})`]: tf(ok), 'mais uma': tf(more), 'dp[i][j]': tf(dp[at(i, j)]) } });
      } else {
        const ok = casa(s[i - 1], p[j - 1]);
        dp[at(i, j)] = ok && dp[at(i - 1, j - 1)];
        snap(L.lit, ok ? `"${s[i - 1]}" casa com "${p[j - 1]}": herda a diagonal dp[${i - 1}][${j - 1}] = ${tf(dp[at(i, j)])}.` : `"${s[i - 1]}" ≠ "${p[j - 1]}" → F.`,
          { i, j, read: [at(i - 1, j - 1)], write: [at(i, j)], vars: { ...v, [`casa(${s[i - 1]}, ${p[j - 1]})`]: tf(ok), 'dp[i][j]': tf(dp[at(i, j)]) } });
      }
    }
  }
  const ans = dp[at(m, n)];
  snap(L.ret, `dp[${m}][${n}] = ${tf(ans)}: "${s}" ${ans ? 'casa' : 'não casa'} com "${p}".`, { read: [at(m, n)], result: ans });
  return out;
}

// Single row of n+1 + a "prev" cell holding the diagonal dp[i-1][j-1]. Cell n+1 = prev. gen[k] = which row (i).
function regex1D(s, p) {
  const L = REGEX_CODE.array.at, m = s.length, n = p.length, PV = n + 1;
  const dp = new Array(n + 2).fill(false), gen = new Array(n + 2).fill(0), out = [];
  dp[PV] = null; gen[PV] = null;
  const snap = (line, msg, x = {}) => out.push({ dp: dp.slice(), gen: gen.slice(), read: [], write: [], line, msg, ...x });

  snap(L.alloc, `Só uma linha de n+1 = ${n + 1} células + 1 variável prev. A matriz teria ${(m + 1) * (n + 1)}.`);
  dp[0] = true;
  snap(L.base, 'dp[0] = T: vazio casa com vazio (linha i=0).', { i: 0, j: 0, write: [0] });
  for (let j = 1; j <= n; j++) {
    const star = p[j - 1] === '*';
    dp[j] = star && dp[j - 2];
    snap(L.row0, star ? `j = ${j}: "${p.slice(0, j)}" com "${p[j - 2]}*" zero vezes: dp[${j - 2}] = ${tf(dp[j])}.` : `j = ${j}: "${p.slice(0, j)}" não casa com vazio → F.`,
      { i: 0, j, read: star ? [j - 2] : [], write: [j], vars: { i: 0, j, 'p[j-1]': p[j - 1], 'dp[j]': tf(dp[j]) } });
  }

  for (let i = 1; i <= m; i++) {
    snap(L.fori, `i = ${i}: o array passa a representar a linha "${s.slice(0, i)}". Por enquanto ainda guarda a linha i=${i - 1}.`, { i, j: 0, vars: { i, 's[i-1]': s[i - 1] } });
    dp[PV] = dp[0]; gen[PV] = i - 1; dp[0] = false; gen[0] = i;
    snap(L.prev, `prev guarda dp[0] antigo (${tf(dp[PV])}) antes de sobrescrever com F: string não vazia nunca casa com padrão vazio.`,
      { i, j: 0, write: [PV, 0], vars: { i, prev: tf(dp[PV]) } });
    for (let j = 1; j <= n; j++) {
      const v = { i, j, 's[i-1]': s[i - 1], 'p[j-1]': p[j - 1] }, star = p[j - 1] === '*';
      snap(L.forj, `j = ${j}: "${s.slice(0, i)}" casa com "${p.slice(0, j)}"?`, { i, j, vars: { ...v, prev: tf(dp[PV]) } });
      const up = dp[j];
      snap(L.up, `up = dp[${j}] = ${tf(up)}: ainda é a linha i=${i - 1}, o valor "de cima".`, { i, j, read: [j], vars: { ...v, up: tf(up), prev: tf(dp[PV]) } });
      snap(L.star, `p[${j - 1}] = "${p[j - 1]}" é '*'? ${star ? 'Sim → primeiro lado do ternário.' : 'Não → segundo lado do ternário.'}`, { i, j, star, vars: { ...v, up: tf(up), prev: tf(dp[PV]) } });
      if (star) {
        const zero = dp[j - 2], ok = casa(s[i - 1], p[j - 2]);
        dp[j] = zero || (ok && up); gen[j] = i;
        snap(L.starv, `dp[${j - 2}] já é da linha i=${i} (zero vezes = ${tf(zero)}) e up = ${tf(up)} (linha i=${i - 1})` +
          `${ok ? '' : `, mas "${s[i - 1]}" ≠ "${p[j - 2]}"`} → ${tf(dp[j])}.`,
          { i, j, star: true, read: [j - 2, j], write: [j], vars: { ...v, up: tf(up), prev: tf(dp[PV]), 'dp[j]': tf(dp[j]) } });
      } else {
        const ok = casa(s[i - 1], p[j - 1]);
        dp[j] = ok && dp[PV]; gen[j] = i;
        snap(L.lit, ok ? `"${s[i - 1]}" casa com "${p[j - 1]}": usa prev = dp[${i - 1}][${j - 1}] = ${tf(dp[j])}. dp[${j - 1}] já foi sobrescrito, por isso precisamos do prev.`
          : `"${s[i - 1]}" ≠ "${p[j - 1]}" → F.`,
          { i, j, read: [PV], write: [j], vars: { ...v, up: tf(up), prev: tf(dp[PV]), 'dp[j]': tf(dp[j]) } });
      }
      dp[PV] = up; gen[PV] = i - 1;
      snap(L.shift, `prev = up (${tf(up)}): é a diagonal dp[${i - 1}][${j}] que a coluna ${j + 1} vai precisar.`, { i, j, write: [PV], vars: { i, j, prev: tf(up) } });
    }
  }
  snap(L.ret, `dp[${n}] = ${tf(dp[n])}: "${s}" ${dp[n] ? 'casa' : 'não casa'} com "${p}".`, { read: [n], result: dp[n] });
  return out;
}

// Top-down: f(i, j) = does s[i..] match p[j..]? memo (m+1) x (n+1). A step for each line, plus one when a call returns.
function regexMemo(s, p) {
  const L = REGEX_CODE.memo.at, m = s.length, n = p.length, cols = n + 1;
  const memo = new Array((m + 1) * cols).fill(null), stack = [], out = [];
  let calls = 0, hits = 0, maxDepth = 0;
  const snap = (line, msg, x = {}) => out.push({ dp: memo.slice(), stack: stack.map((f) => ({ ...f })), read: [], write: [], calls, hits, maxDepth, line, msg, ...x });

  const f = (i, j) => {
    const fr = { call: `f(${i}, ${j})`, note: '' };
    stack.push(fr); calls++; maxDepth = Math.max(maxDepth, stack.length);
    const idx = i * cols + j, v = { i, j, 's[i..]': `"${s.slice(i)}"`, 'p[j..]': `"${p.slice(j)}"` };
    snap(L.fn, `Entra em ${fr.call}: "${s.slice(i)}" casa com "${p.slice(j)}"? (profundidade ${stack.length})`, { i, j, vars: v });

    if (j === n) {
      fr.note = `ret ${tf(i === m)}`;
      snap(L.base, `j = n: padrão acabou → ${i === m ? 'T, a string também acabou' : 'F, sobrou texto'}.`, { i, j, vars: { ...v, ret: tf(i === m) } });
      stack.pop(); return i === m;
    }
    snap(L.base, `j < n: o padrão ainda tem "${p.slice(j)}", não é caso base.`, { i, j, vars: v });
    if (memo[idx] !== null) {
      hits++; fr.note = `hit → ${tf(memo[idx])}`;
      snap(L.hit, `CACHE HIT: memo[${i}][${j}] = ${tf(memo[idx])} já foi calculado. Retorna sem recursão.`, { i, j, read: [idx], vars: { ...v, memo: tf(memo[idx]) } });
      stack.pop(); return memo[idx];
    }
    snap(L.hit, `memo[${i}][${j}] vazio: precisa calcular.`, { i, j, vars: v });

    const first = i < m && casa(s[i], p[j]), fv = { ...v, first: tf(first) };
    snap(L.first, i < m ? `first: "${s[i]}" ${first ? 'casa' : 'não casa'} com "${p[j]}" → ${tf(first)}.` : `first = F: a string acabou, mas o padrão ainda tem "${p.slice(j)}".`, { i, j, vars: fv });

    const star = p[j + 1] === '*';
    snap(L.star, star ? `p[${j + 1}] é '*': o elemento atual é "${p[j]}*" → primeiro lado do ternário.` : `p[${j + 1}] não é '*': "${p[j]}" casa um caractere só → segundo lado do ternário.`, { i, j, star, vars: fv });
    let ans;
    if (star) {
      snap(L.zero, `"${p[j]}*" zero vezes: chama f(${i}, ${j + 2}).`, { i, j, star, vars: fv });
      const zero = f(i, j + 2);
      fr.note = `zero=${tf(zero)}`;
      ans = zero;
      if (zero) {
        snap(L.zero, `f(${i}, ${j + 2}) voltou T → o || faz curto-circuito: ans = T sem tentar consumir.`, { i, j, star, vars: { ...fv, 'zero vezes': 'T' } });
      } else if (!first) {
        snap(L.zero, `f(${i}, ${j + 2}) voltou F e first = F → não dá para consumir: ans = F.`, { i, j, star, vars: { ...fv, 'zero vezes': 'F' } });
      } else {
        snap(L.zero, `f(${i}, ${j + 2}) voltou F. first = T: "${p[j]}*" consome "${s[i]}" e continua → chama f(${i + 1}, ${j}).`, { i, j, star, vars: { ...fv, 'zero vezes': 'F' } });
        ans = f(i + 1, j);
        fr.note += ` consome=${tf(ans)}`;
        snap(L.zero, `f(${i + 1}, ${j}) voltou ${tf(ans)} → ans = ${tf(ans)}.`, { i, j, star, vars: { ...fv, 'zero vezes': 'F', consome: tf(ans) } });
      }
    } else if (first) {
      snap(L.lit, `first = T: casou "${s[i]}", avança os dois → chama f(${i + 1}, ${j + 1}).`, { i, j, vars: fv });
      ans = f(i + 1, j + 1); fr.note = `avança=${tf(ans)}`;
      snap(L.lit, `f(${i + 1}, ${j + 1}) voltou ${tf(ans)} → ans = ${tf(ans)}.`, { i, j, vars: { ...fv, avança: tf(ans) } });
    } else {
      ans = false;
      snap(L.lit, 'first = F → o && faz curto-circuito: ans = F sem recursão.', { i, j, vars: fv });
    }
    memo[idx] = ans; fr.note += `${fr.note ? ' ' : ''}→ ${tf(ans)}`;
    snap(L.save, `Grava memo[${i}][${j}] = ${tf(ans)}, retorna e desempilha.`, { i, j, write: [idx], vars: { ...v, 'memo[i][j]': tf(ans) } });
    stack.pop(); return ans;
  };

  snap(L.alloc, `malloc: memo (m+1)×(n+1) = ${(m + 1) * cols} células vazias.`);
  snap(L.call, `Chama f(0, 0): a string inteira contra o padrão inteiro.`);
  const ans = f(0, 0);
  snap(L.call, `f(0, 0) = ${tf(ans)}: "${s}" ${ans ? 'casa' : 'não casa'} com "${p}". ${calls} chamadas, ${hits} cache hits.`, { read: [0], result: ans });
  return out;
}

if (typeof module !== 'undefined') module.exports = { S, P, REGEX_CODE, regex2D, regex1D, regexMemo };
