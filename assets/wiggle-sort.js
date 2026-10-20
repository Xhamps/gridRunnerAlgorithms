// Wiggle Sort: one step per executed line, as a snapshot for the player.
// Reorder a so that a[0] < a[1] > a[2] < a[3] > ... (strict). The input always admits an answer.
// Runs in the browser (globals) and in node (module.exports) for the test.
if (typeof module !== 'undefined') globalThis.listing ??= require('./trace.js').listing;

const WG_NUMS = [2, 3, 5, 3, 1, 3];

const WG_CODE = {
  ordena: listing([
    ['sort', 'const s = a.slice().sort((x, y) => x - y)   // cópia ordenada'],
    ['half', 'const m = (n + 1) >> 1           // s[0..m-1]: metade pequena'],
    ['big', 'let j = n - 1                     // fim da metade grande'],
    ['fodd', 'for (let i = 1; i < n; i += 2)    // casas ímpares: picos'],
    ['wodd', '  a[i] = s[j--]'],
    ['small', 'j = m - 1                         // fim da metade pequena'],
    ['feven', 'for (let i = 0; i < n; i += 2)    // casas pares: vales'],
    ['weven', '  a[i] = s[j--]'],
    ['ret', 'return a'],
  ]),
  mediana: listing([
    ['qs', 'let lo = 0, hi = n - 1, k = n >> 1   // a mediana é o k-ésimo menor'],
    ['qwhile', 'while (lo < hi) {'],
    ['piv', '  const p = a[hi]                    // pivô: o último do trecho'],
    ['st', '  let s = lo                         // a[lo..s-1] < p'],
    ['qfor', '  for (let i = lo; i < hi; i++)'],
    ['qcmp', '    if (a[i] < p)'],
    ['qswap', '      swap(s++, i)'],
    ['qput', '  swap(s, hi)                        // pivô no lugar final'],
    ['qhit', '  if (s === k) break'],
    ['qlt', '  if (s < k) lo = s + 1'],
    ['qgt', '  else hi = s - 1'],
    [null, '}'],
    ['med', 'const mid = a[k]'],
    ['vidx', 'const at = (v) => (1 + 2 * v) % (n | 1)   // virtual → real'],
    ['dinit', 'let l = 0, i = 0, r = n - 1        // índices virtuais'],
    ['dwhile', 'while (i <= r) {'],
    ['dgt', '  if (a[at(i)] > mid)'],
    ['dgts', '    swap(at(l++), at(i++))         // maior: vai para a esquerda'],
    ['dlt', '  else if (a[at(i)] < mid)'],
    ['dlts', '    swap(at(i), at(r--))           // menor: vai para a direita'],
    ['deq', '  else i++                          // igual: fica no meio'],
    [null, '}'],
    ['ret', 'return a'],
  ]),
};

const wgShow = (arr) => `[${arr.join(', ')}]`;

// Copy, sort, then interleave the halves backwards: big half on odd slots, small half on even slots.
function wgSorted(nums = WG_NUMS) {
  const L = WG_CODE.ordena.at, a = nums.slice(), n = a.length, s = new Array(n).fill(null), out = [];
  const snap = (line, msg, x = {}) => out.push({ dp: [...a, ...s], read: [], write: [], line, msg, ...x });

  s.splice(0, n, ...nums.slice().sort((x, y) => x - y));
  snap(L.sort, `Copia a para s e ordena: s = ${wgShow(s)}. A ordenação não é o foco aqui, então conta como um passo só.`,
    { write: [...Array(n).keys()].map((k) => n + k) });
  const m = (n + 1) >> 1;
  snap(L.half, `m = (${n} + 1) >> 1 = ${m}: s[0..${m - 1}] é a metade pequena (vai para os vales) e s[${m}..${n - 1}] a grande (vai para os picos).`,
    { m, vars: { n, m } });
  let j = n - 1;
  snap(L.big, `j = ${j}: começa pelo MAIOR elemento da metade grande e anda para trás.`, { m, j, vars: { m, j } });
  for (let i = 1; ; i += 2) {
    if (i >= n) {
      snap(L.fodd, `i = ${i} ≥ n: todos os picos foram preenchidos.`, { m, vars: { m, i, j } });
      break;
    }
    snap(L.fodd, `i = ${i}: casa ímpar, um pico.`, { m, i, j, vars: { m, i, j } });
    a[i] = s[j];
    snap(L.wodd, `a[${i}] = s[${j}] = ${s[j]}. j desce para ${j - 1}.`, { m, i, j, read: [n + j], write: [i], vars: { m, i, j, 's[j]': s[j] } });
    j--;
  }
  j = m - 1;
  snap(L.small, `j = m - 1 = ${j}: agora o MAIOR da metade pequena, também andando para trás. Assim o maior vale fica longe do menor pico.`,
    { m, j, vars: { m, j } });
  for (let i = 0; ; i += 2) {
    if (i >= n) {
      snap(L.feven, `i = ${i} ≥ n: todos os vales foram preenchidos.`, { m, vars: { m, i, j } });
      break;
    }
    snap(L.feven, `i = ${i}: casa par, um vale.`, { m, i, j, vars: { m, i, j } });
    a[i] = s[j];
    const nb = [i - 1, i + 1].filter((x) => x >= 0 && x < n);
    snap(L.weven, `a[${i}] = s[${j}] = ${s[j]}, menor que ${nb.map((x) => `a[${x}] = ${a[x]}`).join(' e ')}. j desce para ${j - 1}.`,
      { m, i, j, read: [n + j], write: [i], vars: { m, i, j, 's[j]': s[j] } });
    j--;
  }
  snap(L.ret, `Pronto: ${wgShow(a)}. Cada vale é menor que os picos vizinhos.`, { result: a.slice() });
  return out;
}

// Quickselect (Lomuto, last element as pivot) finds the median, then a 3-way partition over virtual
// indices at(v) = (1 + 2v) % (n | 1) puts the bigger values on odd slots and the smaller ones on even slots.
function wgMedian(nums = WG_NUMS) {
  const L = WG_CODE.mediana.at, a = nums.slice(), n = a.length, out = [];
  let swaps = 0;
  const at = (v) => (1 + 2 * v) % (n | 1);
  const snap = (line, msg, x = {}) => out.push({ dp: a.slice(), read: [], write: [], line, msg, swaps, ...x });
  const swap = (x, y) => { [a[x], a[y]] = [a[y], a[x]]; swaps++; };

  let lo = 0, hi = n - 1;
  const k = n >> 1;
  snap(L.qs, `Quickselect: procura o ${k}º menor (contando do 0), a mediana. Ele não ordena tudo: só garante que a[${k}] fica certo.`,
    { lo, hi, k, vars: { lo, hi, k } });
  for (;;) {
    const Q = (x = {}) => ({ lo, hi, k, ...x, vars: { lo, hi, k, ...x.vars } });
    if (lo >= hi) {
      snap(L.qwhile, `lo = ${lo}, hi = ${hi}: o trecho tem um elemento só, e ele é o ${k}º menor.`, Q());
      break;
    }
    snap(L.qwhile, `lo = ${lo} < hi = ${hi}: a resposta ainda está em a[${lo}..${hi}].`, Q());
    const p = a[hi];
    snap(L.piv, `p = a[${hi}] = ${p}. Pivô fixo (o último) para o passo a passo ser sempre o mesmo.`, Q({ read: [hi], vars: { p } }));
    let st = lo;
    snap(L.st, `s = ${st}: tudo antes de s será menor que ${p}.`, Q({ st, vars: { p, s: st } }));
    for (let i = lo; ; i++) {
      if (i >= hi) {
        snap(L.qfor, `i = ${i} chegou em hi: varredura feita. ${st - lo} valor(es) do trecho são menores que ${p}.`, Q({ st, vars: { p, s: st, i } }));
        break;
      }
      snap(L.qfor, `i = ${i}: olha a[${i}] = ${a[i]}.`, Q({ st, qi: i, vars: { p, s: st, i } }));
      const lt = a[i] < p;
      snap(L.qcmp, lt ? `a[${i}] = ${a[i]} < ${p}: vai para o lado dos menores.` : `a[${i}] = ${a[i]} ≥ ${p}: falso, fica onde está.`,
        Q({ st, qi: i, read: [i, hi], vars: { p, s: st, i, 'a[i]': a[i] } }));
      if (lt) {
        swap(st, i);
        snap(L.qswap, st === i ? `s = i = ${i}: troca a casa com ela mesma. s anda para ${st + 1}.`
          : `Troca a[${st}] ↔ a[${i}]: o ${a[st]} entra no lado dos menores. s anda para ${st + 1}.`,
        Q({ st, qi: i, write: st === i ? [i] : [st, i], vars: { p, s: st + 1, i } }));
        st++;
      }
    }
    swap(st, hi);
    snap(L.qput, st === hi ? `s = hi = ${hi}: o pivô ${p} já está no lugar final (troca consigo mesmo).` : `Troca a[${st}] ↔ a[${hi}]: o pivô ${p} vai para a casa ${st}, seu lugar na ordem final.`,
      Q({ st, write: st === hi ? [st] : [st, hi], vars: { p, s: st } }));
    if (st === k) {
      snap(L.qhit, `s = k = ${k}: o pivô é o ${k}º menor. break.`, Q({ st, read: [st], vars: { p, s: st } }));
      break;
    }
    snap(L.qhit, `s = ${st} ≠ k = ${k}: ainda não é a mediana.`, Q({ st, vars: { p, s: st } }));
    if (st < k) {
      lo = st + 1;
      snap(L.qlt, `s = ${st} < k: a mediana está à direita do pivô. lo = ${lo}.`, Q({ st, vars: { p, s: st } }));
    } else {
      snap(L.qlt, `s = ${st} > k: falso.`, Q({ st, vars: { p, s: st } }));
      hi = st - 1;
      snap(L.qgt, `A mediana está à esquerda do pivô. hi = ${hi}.`, Q({ st, vars: { p, s: st } }));
    }
  }
  const mid = a[k];
  snap(L.med, `mid = a[${k}] = ${mid}. É a mediana: no máximo metade dos valores é maior e no máximo metade é menor.`,
    { k, read: [k], mid, vars: { k, mid } });
  snap(L.vidx, `n | 1 = ${n | 1}. A posição virtual v vira a casa real ${[...Array(n).keys()].map(at).join(', ')}: primeiro as ímpares, depois as pares.`,
    { mid, virt: true, vars: { mid, 'n | 1': n | 1 } });
  let l = 0, i = 0, r = n - 1;
  const D = (x = {}) => ({ mid, virt: true, l, vi: i, r, ...x, vars: { mid, l, i, r, ...x.vars } });
  snap(L.dinit, 'Bandeira holandesa nas posições virtuais: [0..l-1] maiores que mid, [l..i-1] iguais, [r+1..] menores.', D());
  for (;;) {
    if (i > r) {
      snap(L.dwhile, `i = ${i} > r = ${r}: todas as posições virtuais foram classificadas.`, D());
      break;
    }
    snap(L.dwhile, `i = ${i} ≤ r = ${r}: v = ${i} é a casa real ${at(i)}, com ${a[at(i)]}.`, D());
    const x = a[at(i)];
    if (x > mid) {
      snap(L.dgt, `a[${at(i)}] = ${x} > ${mid}: é grande, vai para a esquerda virtual (casas ímpares).`, D({ read: [at(i)], vars: { 'a[at(i)]': x } }));
      const A = at(l), B = at(i);
      swap(A, B);
      snap(L.dgts, A === B ? `l = i = ${i}: troca a casa ${A} com ela mesma. l e i andam.` : `Troca a[${A}] ↔ a[${B}] (virtuais ${l} e ${i}). l e i andam.`,
        D({ write: A === B ? [A] : [A, B] }));
      l++; i++;
      continue;
    }
    snap(L.dgt, `a[${at(i)}] = ${x} > ${mid}: falso.`, D({ read: [at(i)], vars: { 'a[at(i)]': x } }));
    if (x < mid) {
      snap(L.dlt, `a[${at(i)}] = ${x} < ${mid}: é pequeno, vai para a direita virtual (casas pares, do fim).`, D({ read: [at(i)], vars: { 'a[at(i)]': x } }));
      const A = at(i), B = at(r);
      swap(A, B);
      snap(L.dlts, A === B ? `i = r: troca a casa ${A} com ela mesma. r recua.`
        : `Troca a[${A}] ↔ a[${B}] (virtuais ${i} e ${r}). r recua; i fica, porque o valor que chegou ainda não foi olhado.`,
      D({ write: A === B ? [A] : [A, B] }));
      r--;
      continue;
    }
    snap(L.dlt, `a[${at(i)}] = ${x} < ${mid}: falso.`, D({ read: [at(i)], vars: { 'a[at(i)]': x } }));
    i++;
    snap(L.deq, `${x} = mid: fica no meio. i anda para ${i}.`, D());
  }
  snap(L.ret, `Pronto: ${wgShow(a)}. Os iguais à mediana caíram nas pontas opostas das casas pares e ímpares, longe uns dos outros.`,
    { mid, virt: true, result: a.slice() });
  return out;
}

if (typeof module !== 'undefined') module.exports = { WG_NUMS, WG_CODE, wgSorted, wgMedian };
