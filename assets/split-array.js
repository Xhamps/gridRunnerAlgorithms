// Split Array Largest Sum: one step per executed line, as a snapshot for the player.
// Cut a into k non-empty contiguous parts so the largest part sum is as small as possible; return that sum.
// Runs in the browser (globals) and in node (module.exports) for the test.
if (typeof module !== 'undefined') globalThis.listing ??= require('./trace.js').listing;

const SA_NUMS = [7, 2, 5, 10, 8];
const SA_K = 2;

const SA_CODE = {
  binaria: listing([
    ['fn', 'function cabe(S) {                   // dá para usar ≤ k partes com soma ≤ S?'],
    ['init', '  let partes = 1, soma = 0'],
    ['forx', '  for (const x of a) {'],
    ['cut', '    if (soma + x > S) {               // x não cabe na parte atual'],
    ['new', '      partes++; soma = 0              // corta antes de x'],
    [null, '    }'],
    ['add', '    soma += x'],
    [null, '  }'],
    ['fret', '  return partes <= k'],
    [null, '}'],
    ['lohi', 'let lo = max(a), hi = sum(a)          // a resposta está em [lo, hi]'],
    ['loop', 'while (lo < hi) {'],
    ['mid', '  const mid = (lo + hi) >> 1'],
    ['test', '  if (cabe(mid)) hi = mid             // serve: talvez dê menos'],
    ['else', '  else lo = mid + 1                   // não serve: nada ≤ mid serve'],
    [null, '}'],
    ['ret', 'return lo'],
  ]),
  matriz: listing([
    ['pre', 'const pre = prefixos(a)               // pre[i] = a[0] + … + a[i-1]'],
    ['alloc', 'const dp = Array.from({ length: k + 1 }, () => Array(n + 1).fill(Infinity))'],
    ['base', 'dp[0][0] = 0                          // 0 elementos em 0 partes'],
    ['forj', 'for (let j = 1; j <= k; j++)'],
    ['fori', '  for (let i = j; i <= n; i++)'],
    ['form', '    for (let m = j - 1; m < i; m++)   // última parte = a[m..i-1]'],
    ['upd', '      dp[j][i] = min(dp[j][i], max(dp[j-1][m], pre[i] - pre[m]))'],
    ['ret', 'return dp[k][n]'],
  ]),
};

const saInf = (v) => v === Infinity ? '∞' : v;

// Binary search on the answer S. cabe(S) cuts greedily; parts[x] = part index of a[x] in the current trace.
function saBinary(nums = SA_NUMS, k = SA_K) {
  const L = SA_CODE.binaria.at, a = nums.slice(), out = [];
  let lo = Math.max(...a), hi = a.reduce((x, y) => x + y, 0), mid, parts = [], calls = 0;
  const MIN = lo, MAX = hi;
  const snap = (line, msg, s = {}) => out.push({
    dp: a.slice(), read: [], write: [], parts: parts.slice(), min: MIN, max: MAX, lo, hi, mid, calls, line, msg, ...s,
  });

  const cabe = (S) => {
    calls++; parts = [];
    snap(L.fn, `Entra em cabe(${S}): corta a da esquerda para a direita, sem deixar nenhuma parte passar de ${S}.`, { S, vars: { S } });
    let partes = 1, soma = 0;
    snap(L.init, 'partes = 1, soma = 0: começa a primeira parte, ainda vazia.', { S, vars: { S, partes, soma } });
    for (let x = 0; x < a.length; x++) {
      snap(L.forx, `x = a[${x}] = ${a[x]}.`, { S, x, read: [x], vars: { S, x: a[x], partes, soma } });
      const over = soma + a[x] > S;
      snap(L.cut, over ? `${soma} + ${a[x]} = ${soma + a[x]} > ${S}: o ${a[x]} não cabe na parte ${partes}.`
        : `${soma} + ${a[x]} = ${soma + a[x]} ≤ ${S}: cabe na parte ${partes}.`, { S, x, read: [x], vars: { S, x: a[x], partes, soma } });
      if (over) {
        partes++; soma = 0;
        snap(L.new, `Corta antes de a[${x}]: abre a parte ${partes}. Juntar mais só aumentaria a soma, então cortar o mais tarde possível é o melhor.`,
          { S, x, cutAt: x, vars: { S, x: a[x], partes, soma } });
      }
      soma += a[x]; parts[x] = partes - 1;
      snap(L.add, `soma = ${soma}: a[${x}] entra na parte ${partes}.`, { S, x, write: [x], vars: { S, x: a[x], partes, soma } });
    }
    const ok = partes <= k;
    snap(L.fret, `${partes} parte${partes > 1 ? 's' : ''} ${ok ? '≤' : '>'} k = ${k}: cabe(${S}) retorna ${ok}.`,
      { S, vars: { S, partes, k, ret: ok } });
    return ok;
  };

  snap(L.lohi, `lo = max(a) = ${lo}: o maior elemento sempre fica inteiro em alguma parte. hi = soma(a) = ${hi}: tudo numa parte só. A resposta está em [${lo}, ${hi}].`,
    { vars: { lo, hi } });
  for (;;) {
    snap(L.loop, lo < hi ? `lo = ${lo} < hi = ${hi}: ainda há ${hi - lo + 1} candidatos.` : `lo = hi = ${lo}: só sobrou um candidato.`, { vars: { lo, hi } });
    if (lo >= hi) break;
    mid = (lo + hi) >> 1;
    snap(L.mid, `mid = (${lo} + ${hi}) >> 1 = ${mid}: testa se ${mid} basta como limite.`, { vars: { lo, hi, mid } });
    snap(L.test, `chama cabe(${mid}).`, { vars: { lo, hi, mid } });
    const ok = cabe(mid);
    if (ok) {
      hi = mid;
      snap(L.test, `cabe(${mid}) voltou true: ${mid} serve, e todo S maior também. hi = ${mid}; descarta (${mid}, ${MAX}].`,
        { vars: { lo, hi, mid, 'cabe(mid)': true } });
    } else {
      snap(L.test, `cabe(${mid}) voltou false: ${mid} é pequeno demais, e todo S menor também.`, { vars: { lo, hi, mid, 'cabe(mid)': false } });
      lo = mid + 1;
      snap(L.else, `lo = ${mid} + 1 = ${lo}; descarta [${MIN}, ${mid}].`, { vars: { lo, hi, mid } });
    }
  }
  parts = [];
  snap(L.ret, `Resposta: ${lo}. ${calls} chamadas de cabe para ${MAX - MIN + 1} candidatos.`, { vars: { lo }, result: lo });
  return out;
}

// dp[j][i] = smallest possible largest sum when the first i elements go into exactly j parts. Row-major (k+1) x (n+1).
function saDP(nums = SA_NUMS, k = SA_K) {
  const L = SA_CODE.matriz.at, a = nums.slice(), n = a.length, C = n + 1, out = [];
  const pre = [0];
  for (const x of a) pre.push(pre.at(-1) + x);
  const dp = new Array((k + 1) * C).fill(null);
  const snap = (line, msg, s = {}) => out.push({ dp: dp.map(saInf), read: [], write: [], pre, line, msg, ...s });

  snap(L.pre, `pre = [${pre.join(', ')}]: a soma de a[m..i-1] vira pre[i] - pre[m], em O(1).`, { vars: { n, k } });
  dp.fill(Infinity);
  snap(L.alloc, `malloc: ${(k + 1) * C} células (${k + 1} linhas × ${C} colunas), todas ∞ (impossível).`, { write: [...dp.keys()] });
  dp[0] = 0;
  snap(L.base, 'dp[0][0] = 0: nenhum elemento em nenhuma parte, nada para somar.', { write: [0] });
  for (let j = 1; j <= k; j++) {
    snap(L.forj, `j = ${j}: agora com exatamente ${j} parte${j > 1 ? 's' : ''}.`, { j, vars: { j } });
    for (let i = j; i <= n; i++) {
      snap(L.fori, `i = ${i}: os primeiros ${i} elementos [${a.slice(0, i).join(', ')}] em ${j} parte${j > 1 ? 's' : ''}. i começa em j: cada parte precisa de ao menos um.`,
        { j, i, vars: { j, i } });
      for (let m = j - 1; m < i; m++) {
        const idx = j * C + i, prev = (j - 1) * C + m, part = pre[i] - pre[m], cand = Math.max(dp[prev], part), old = dp[idx];
        snap(L.form, `m = ${m}: a última parte é a[${m}..${i - 1}] = [${a.slice(m, i).join(', ')}]; as outras ${j - 1} cobrem os ${m} primeiros.`,
          { j, i, m, seg: [m, i - 1], vars: { j, i, m } });
        dp[idx] = Math.min(old, cand);
        snap(L.upd, `max(dp[${j - 1}][${m}] = ${saInf(dp[prev])}, pre[${i}] - pre[${m}] = ${part}) = ${saInf(cand)}. ` +
          `min(${saInf(old)}, ${saInf(cand)}) = ${saInf(dp[idx])}.${dp[prev] === Infinity ? ` ∞: ${j - 1} parte${j - 1 === 1 ? '' : 's'} não cobre${j - 1 === 1 ? '' : 'm'} ${m} elemento${m === 1 ? '' : 's'}.` : ''}`,
          { j, i, m, seg: [m, i - 1], read: [prev, idx], write: [idx], vars: { j, i, m, 'dp[j-1][m]': saInf(dp[prev]), parte: part, 'dp[j][i]': saInf(dp[idx]) } });
      }
    }
  }
  const last = k * C + n;
  snap(L.ret, `Resposta: dp[${k}][${n}] = ${saInf(dp[last])}.`, { read: [last], result: dp[last] });
  return out;
}

if (typeof module !== 'undefined') module.exports = { SA_NUMS, SA_K, SA_CODE, saBinary, saDP };
