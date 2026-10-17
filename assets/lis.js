// Longest Increasing Subsequence: generates one step per executed line, as a snapshot for the player.
// Runs in the browser (globals) and in node (module.exports) for the test.
if (typeof module !== 'undefined') globalThis.listing ??= require('./trace.js').listing;

const SEQ = [3, 5, 6, 1, 7];

const LIS_CODE = {
  matriz: listing([
    ['alloc', 'const dp = Array.from({ length: n + 1 }, () => Array(n + 1))'],
    ['base', 'for (let p = 0; p <= n; p++) dp[n][p] = 0            // caso base: acabou o array'],
    ['fori', 'for (let i = n - 1; i >= 0; i--)'],
    ['forp', '  for (let p = 0; p <= i; p++) {                      // p = prev + 1'],
    ['skip', '    dp[i][p] = dp[i+1][p]                             // pular'],
    ['if', '    if (p === 0 || nums[p-1] < nums[i])'],
    ['take', '      dp[i][p] = max(dp[i][p], 1 + dp[i+1][i+1])     // pegar'],
    [null, '  }'],
    ['ret', 'return dp[0][0]'],
  ]),
  array: listing([
    ['alloc', 'const dp = Array(n)'],
    ['fori', 'for (let i = 0; i < n; i++) {'],
    ['init', '  dp[i] = 1                          // só nums[i]'],
    ['forj', '  for (let j = 0; j < i; j++)'],
    ['if', '    if (nums[j] < nums[i])'],
    ['upd', '      dp[i] = max(dp[i], dp[j] + 1)   // estende a que termina em j'],
    [null, '}'],
    ['ret', 'return max(...dp)'],
  ]),
  memo: listing([
    ['alloc', 'const memo = Array.from({ length: n }, () => Array(n + 1))'],
    ['fn', 'function f(i, prev) {'],
    ['base', '  if (i === n) return 0'],
    ['hit', '  if (memo[i][prev+1] !== undefined) return memo[i][prev+1]   // cache hit'],
    ['skip', '  let best = f(i + 1, prev)                       // pular'],
    ['fits', '  if (prev === -1 || nums[prev] < nums[i])'],
    ['take', '    best = max(best, 1 + f(i + 1, i))             // pegar'],
    ['save', '  return memo[i][prev+1] = best'],
    [null, '}'],
    ['call', 'return f(0, -1)'],
  ]),
  binaria: listing([
    ['alloc', 'const tails = []'],
    ['forx', 'for (const x of nums) {'],
    ['init', '  let lo = 0, hi = tails.length'],
    ['while', '  while (lo < hi) {'],
    ['mid', '    const mid = (lo + hi) >> 1'],
    ['if', '    if (tails[mid] < x) lo = mid + 1'],
    ['else', '    else hi = mid'],
    [null, '  }'],
    ['set', '  tails[lo] = x                  // substitui ou estende'],
    [null, '}'],
    ['ret', 'return tails.length'],
  ]),
};

// (n+1) x (n+1), row-major. dp[i][p] = LIS of nums[i..] when the last chosen index is p-1 (p = 0: none yet).
function lis2D(nums) {
  const L = LIS_CODE.matriz.at, n = nums.length, cols = n + 1;
  const dp = new Array((n + 1) * cols).fill(null), out = [];
  const snap = (line, msg, s = {}) => out.push({ dp: dp.slice(), read: [], write: [], line, msg, ...s });
  const prevOf = (p) => p ? `nums[${p - 1}]=${nums[p - 1]}` : 'nenhum';

  snap(L.alloc, `malloc: ${(n + 1) * cols} células (${n + 1} × ${cols}). Só p ≤ i é usado: o anterior vem antes de i.`);
  for (let p = 0; p <= n; p++) dp[n * cols + p] = 0;
  snap(L.base, `Caso base: i = ${n} (passou do fim), não há mais números para escolher → 0.`, { write: [...Array(cols).keys()].map((p) => n * cols + p) });

  for (let i = n - 1; i >= 0; i--) {
    snap(L.fori, `i = ${i}: decidir sobre nums[${i}] = ${nums[i]}. De baixo para cima, porque a linha i lê a linha i+1.`, { i, vars: { i, 'nums[i]': nums[i] } });
    for (let p = 0; p <= i; p++) {
      const v = { i, p, anterior: prevOf(p) }, idx = i * cols + p, down = (i + 1) * cols + p;
      snap(L.forp, `p = ${p}: último escolhido = ${prevOf(p)}.`, { i, j: p - 1, vars: v });
      dp[idx] = dp[down];
      snap(L.skip, `Pular nums[${i}]: herda dp[${i + 1}][${p}] = ${dp[down]}.`, { i, j: p - 1, read: [down], write: [idx], vars: { ...v, pular: dp[down] } });
      const ok = p === 0 || nums[p - 1] < nums[i];
      snap(L.if, ok ? (p ? `${nums[p - 1]} < ${nums[i]}: dá para pegar nums[${i}].` : `Nada escolhido ainda: dá para pegar nums[${i}].`)
        : `${nums[p - 1]} < ${nums[i]}? Não: pegar quebraria a ordem crescente.`, { i, j: p - 1, vars: { ...v, pular: dp[down] } });
      if (ok) {
        const diag = (i + 1) * cols + i + 1, take = 1 + dp[diag], skip = dp[idx];
        dp[idx] = Math.max(skip, take);
        snap(L.take, `Pegar = 1 + dp[${i + 1}][${i + 1}] = ${take} (agora o anterior é nums[${i}]). max(${skip}, ${take}) = ${dp[idx]}.`,
          { i, j: p - 1, read: [down, diag], write: [idx], vars: { ...v, pular: skip, pegar: take, 'dp[i][p]': dp[idx] } });
      }
    }
  }
  snap(L.ret, `Resposta: dp[0][0] = ${dp[0]} (começando do índice 0, sem anterior).`, { read: [0], result: dp[0] });
  return out;
}

// Classic O(n²): dp[i] = longest increasing subsequence ending exactly at i.
function lis1D(nums) {
  const L = LIS_CODE.array.at, n = nums.length, dp = new Array(n).fill(null), out = [];
  const snap = (line, msg, s = {}) => out.push({ dp: dp.slice(), read: [], write: [], line, msg, ...s });

  snap(L.alloc, `malloc: ${n} células. dp[i] = a maior subsequência crescente que TERMINA em nums[i].`);
  for (let i = 0; i < n; i++) {
    snap(L.fori, `i = ${i}: qual a maior sequência que termina em ${nums[i]}?`, { i, vars: { i, 'nums[i]': nums[i] } });
    dp[i] = 1;
    snap(L.init, `Sozinho, ${nums[i]} já é uma sequência de tamanho 1.`, { i, write: [i], vars: { i, 'dp[i]': 1 } });
    for (let j = 0; j < i; j++) {
      const v = { i, j, 'nums[j]': nums[j], 'nums[i]': nums[i] };
      snap(L.forj, `j = ${j}: dá para colocar ${nums[i]} depois de ${nums[j]}?`, { i, j, vars: v });
      const ok = nums[j] < nums[i];
      snap(L.if, ok ? `${nums[j]} < ${nums[i]}: sim, ${nums[i]} pode estender a sequência que termina em ${nums[j]}.`
        : `${nums[j]} < ${nums[i]}? Não: não seria crescente.`, { i, j, vars: v });
      if (ok) {
        const old = dp[i];
        dp[i] = Math.max(old, dp[j] + 1);
        snap(L.upd, `dp[${j}] + 1 = ${dp[j] + 1}. max(${old}, ${dp[j] + 1}) = ${dp[i]}.`, { i, j, read: [i, j], write: [i], vars: { ...v, 'dp[j]+1': dp[j] + 1, 'dp[i]': dp[i] } });
      }
    }
  }
  const ans = Math.max(...dp), at = dp.indexOf(ans);
  snap(L.ret, `Resposta: o maior dp[i] é dp[${at}] = ${ans}. A sequência pode terminar em qualquer posição, por isso o max.`, { read: [at], result: ans });
  return out;
}

// Top-down f(i, prev): memo n x (n+1), column = prev + 1.
function lisMemo(nums) {
  const L = LIS_CODE.memo.at, n = nums.length, cols = n + 1;
  const memo = new Array(n * cols).fill(null), stack = [], out = [];
  let calls = 0, hits = 0, maxDepth = 0;
  const snap = (line, msg, s = {}) => out.push({ dp: memo.slice(), stack: stack.map((f) => ({ ...f })), read: [], write: [], calls, hits, maxDepth, line, msg, ...s });

  const f = (i, prev) => {
    const fr = { call: `f(${i}, ${prev})`, note: '' };
    stack.push(fr); calls++; maxDepth = Math.max(maxDepth, stack.length);
    const idx = i * cols + prev + 1, v = { i, prev, anterior: prev < 0 ? 'nenhum' : nums[prev] }, at = { i, j: prev };
    snap(L.fn, `Entra em ${fr.call}: empilha um frame (profundidade ${stack.length}).`, { ...at, vars: v });

    if (i === n) {
      fr.note = 'ret 0';
      snap(L.base, `i = ${n}: passou do fim, retorna 0 (caso base, não usa o memo).`, { ...at, vars: { ...v, ret: 0 } });
      stack.pop(); return 0;
    }
    snap(L.base, `i = ${i} < ${n}: ainda há números, não é caso base.`, { ...at, vars: v });
    if (memo[idx] !== null) {
      hits++; fr.note = `hit → ${memo[idx]}`;
      snap(L.hit, `CACHE HIT: memo[${i}][${prev + 1}] = ${memo[idx]} já foi calculado. Retorna sem recursão.`, { ...at, read: [idx], vars: { ...v, memo: memo[idx] } });
      stack.pop(); return memo[idx];
    }
    snap(L.hit, `memo[${i}][${prev + 1}] vazio: precisa calcular.`, { ...at, vars: v });

    snap(L.skip, `Pular nums[${i}]=${nums[i]}: chama f(${i + 1}, ${prev}).`, { ...at, vars: v });
    let best = f(i + 1, prev);
    fr.note = `pular=${best}`;
    snap(L.skip, `f(${i + 1}, ${prev}) voltou ${best} → best = ${best}.`, { ...at, vars: { ...v, best } });

    const ok = prev === -1 || nums[prev] < nums[i];
    snap(L.fits, ok ? (prev < 0 ? `Nada escolhido ainda: dá para pegar ${nums[i]}.` : `${nums[prev]} < ${nums[i]}: dá para pegar ${nums[i]}.`)
      : `${nums[prev]} < ${nums[i]}? Não: pegar quebraria a ordem.`, { ...at, vars: { ...v, best } });
    if (ok) {
      snap(L.take, `Pegar ${nums[i]}: chama f(${i + 1}, ${i}), agora com ${nums[i]} como anterior.`, { ...at, vars: { ...v, best } });
      const sub = f(i + 1, i), take = 1 + sub;
      fr.note += ` pegar=${take}`;
      snap(L.take, `f(${i + 1}, ${i}) voltou ${sub}. Pegar = 1 + ${sub} = ${take} → best = max(${best}, ${take}) = ${Math.max(best, take)}.`,
        { ...at, vars: { ...v, best: Math.max(best, take), pegar: take } });
      best = Math.max(best, take);
    }
    memo[idx] = best; fr.note += ` → ${best}`;
    snap(L.save, `Grava memo[${i}][${prev + 1}] = ${best}, retorna e desempilha.`, { ...at, write: [idx], vars: { ...v, memo: best } });
    stack.pop(); return best;
  };

  snap(L.alloc, `malloc: memo com ${n}×${cols} = ${memo.length} células vazias. Coluna = prev + 1 (prev = -1 vira a coluna 0).`);
  snap(L.call, `Chama f(0, -1): começa no índice 0, sem nenhum número escolhido.`);
  const ans = f(0, -1);
  const used = memo.filter((x) => x !== null).length;
  snap(L.call, `Resposta: ${ans}. ${calls} chamadas, ${hits} cache hits, ${used}/${memo.length} células do memo usadas.`, { read: n ? [0] : [], result: ans });
  return out;
}

// O(n log n): tails[k] = smallest possible tail of an increasing subsequence of length k+1.
function lisBinary(nums) {
  const L = LIS_CODE.binaria.at, n = nums.length, tails = new Array(n).fill(null), out = [];
  let len = 0;
  const snap = (line, msg, s = {}) => out.push({ dp: tails.slice(), len, read: [], write: [], line, msg, ...s });

  snap(L.alloc, `tails começa vazio (reservamos ${n} slots, o máximo possível). tails[k] = o menor final de uma sequência de tamanho k+1.`);
  nums.forEach((x, i) => {
    snap(L.forx, `x = nums[${i}] = ${x}: onde ${x} entra em tails?`, { i, vars: { x, tails: `[${tails.slice(0, len)}]` } });
    let lo = 0, hi = len;
    snap(L.init, `Busca binária em tails[0..${len}): lo = 0, hi = ${len}. Procura o primeiro tails[k] ≥ ${x}.`, { i, lo, hi, vars: { x, lo, hi } });
    for (;;) {
      const go = lo < hi;
      snap(L.while, go ? `${lo} < ${hi}: ainda há intervalo para buscar.` : `${lo} < ${hi}? Não: a busca terminou, posição = ${lo}.`, { i, lo, hi, vars: { x, lo, hi } });
      if (!go) break;
      const mid = (lo + hi) >> 1;
      snap(L.mid, `mid = (${lo} + ${hi}) >> 1 = ${mid}.`, { i, lo, hi, mid, vars: { x, lo, hi, mid } });
      if (tails[mid] < x) {
        lo = mid + 1;
        snap(L.if, `tails[${mid}] = ${tails[mid]} < ${x}: ${x} vai depois. lo = ${lo}.`, { i, lo, hi, mid, read: [mid], vars: { x, lo, hi, mid } });
      } else {
        snap(L.if, `tails[${mid}] = ${tails[mid]} < ${x}? Não: vai para o else.`, { i, lo, hi, mid, read: [mid], vars: { x, lo, hi, mid } });
        hi = mid;
        snap(L.else, `${tails[mid]} ≥ ${x}: a posição é mid ou antes. hi = ${hi}.`, { i, lo, hi, mid, vars: { x, lo, hi, mid } });
      }
    }
    const old = tails[lo];
    tails[lo] = x; if (lo === len) len++;
    snap(L.set, lo === len - 1 && old === null
      ? `tails[${lo}] = ${x}: ${x} é maior que todos os finais, a maior sequência cresce para ${len}.`
      : `tails[${lo}] = ${x} substitui ${old}: uma sequência de tamanho ${lo + 1} agora pode terminar num valor menor, o que facilita estender depois.`,
      { i, lo, write: [lo], vars: { x, lo, tails: `[${tails.slice(0, len)}]` } });
  });
  snap(L.ret, `Resposta: tails.length = ${len}. Atenção: tails = [${tails.slice(0, len)}] não é necessariamente uma subsequência válida, só o tamanho é garantido.`,
    { read: len ? [len - 1] : [], result: len });
  return out;
}

if (typeof module !== 'undefined') module.exports = { SEQ, LIS_CODE, lis2D, lis1D, lisMemo, lisBinary };
