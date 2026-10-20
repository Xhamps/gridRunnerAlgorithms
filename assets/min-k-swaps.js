// Smallest number with at most k adjacent swaps: one step per executed line, as a snapshot for the player.
// bolha: greedy, for each slot i bubble the smallest digit within reach (window [i, i+k]) to the left, O(n²).
// fenwick: queues of positions per digit + a Fenwick tree counting removed positions, O(n log n · 10).
// Runs in the browser (globals) and in node (module.exports) for the test.
if (typeof module !== 'undefined') globalThis.listing ??= require('./trace.js').listing;

const MKS_NUM = '400132', MKS_K = 4;

const MKS_CODE = {
  bolha: listing([
    ['alloc', 'const a = num.split(\'\'), n = a.length'],
    ['fori', 'for (let i = 0; i < n && k > 0; i++) {'],
    ['best', '  let p = i                                // menor dígito ao alcance'],
    ['forj', '  for (let j = i + 1; j < n && j - i <= k; j++)   // janela [i, i+k]'],
    ['less', '    if (a[j] < a[p]) p = j                  // estrito: fica a 1ª ocorrência'],
    ['bub', '  for (let j = p; j > i; j--)               // borbulha a[p] até i'],
    ['swap', '    [a[j-1], a[j]] = [a[j], a[j-1]]         // 1 troca adjacente'],
    ['k', '  k -= p - i                               // gastou a distância'],
    [null, '}'],
    ['ret', 'return a.join(\'\')'],
  ]),
  fenwick: listing([
    ['alloc', 'const q = 10 filas vazias, bit = Array(n + 1).fill(0)'],
    ['fill', 'for (let p = 0; p < n; p++) q[num[p]].push(p)   // posições por dígito'],
    ['fort', 'for (let t = 0; t < n; t++) {               // cada casa da resposta'],
    ['ford', '  for (let d = 0; d <= 9; d++) {'],
    ['empty', '    if (q[d].length === 0) continue          // dígito esgotado'],
    ['cost', '    const pos = q[d][0], custo = pos − soma(bit, pos)   // removidos à esquerda'],
    ['fit', '    if (custo > k) continue                  // não cabe no orçamento'],
    ['take', '    k -= custo; out += d; q[d].shift()'],
    ['mark', '    add(bit, pos + 1, 1)                     // pos sai da string'],
    ['brk', '    break'],
    [null, '  }'],
    [null, '}'],
    ['ret', 'return out'],
  ]),
};

function mksBubble(num = MKS_NUM, k = MKS_K) {
  const L = MKS_CODE.bolha.at, a = num.split('').map(Number), n = a.length, out = [];
  const snap = (line, msg, s = {}) => out.push({ dp: a.slice(), read: [], write: [], line, msg, ...s });

  snap(L.alloc, `Copia "${num}" para um array de ${n} dígitos. Orçamento: k = ${k} trocas adjacentes.`, { vars: { n, k } });
  let i = 0;
  for (; ; i++) {
    if (!(i < n && k > 0)) {
      snap(L.fori, i < n ? `k = 0: o orçamento acabou. O resto (a partir de a[${i}]) fica como está.` : 'Todas as casas foram decididas.', { done: i, vars: { i, k } });
      break;
    }
    snap(L.fori, `i = ${i}: qual o menor dígito que dá para trazer até a casa ${i} com até ${k} trocas?`, { i, vars: { i, k } });
    let p = i;
    snap(L.best, `Começa com p = ${i} (a[${i}] = ${a[i]}): ficar parado custa 0.`, { i, read: [i], vars: { i, k, p } });
    for (let j = i + 1; ; j++) {
      if (!(j < n && j - i <= k)) {
        snap(L.forj, j < n ? `j = ${j}: precisaria de ${j - i} trocas, mas k = ${k}. Fora da janela, para de procurar.` : `j = ${j} passou do fim.`,
          { i, j: j < n ? j : undefined, vars: { i, k, p, j } });
        break;
      }
      snap(L.forj, `j = ${j}: a ${j - i} troca(s) de distância, cabe em k = ${k}.`, { i, j, vars: { i, k, p, j } });
      const less = a[j] < a[p];
      snap(L.less, less ? `a[${j}] = ${a[j]} < a[${p}] = ${a[p]}: novo menor, p = ${j}.`
        : `a[${j}] = ${a[j]} ≥ a[${p}] = ${a[p]}: não melhora${a[j] === a[p] ? ' (empate: o mais perto custa menos)' : ''}.`,
        { i, j, read: [j, p], vars: { i, k, p: less ? j : p, j } });
      if (less) p = j;
    }
    for (let j = p; j > i; j--) {
      snap(L.bub, `j = ${j}: o ${a[j]} ainda está ${j - i} casa(s) à direita de i.`, { i, j, read: [j], vars: { i, k, p, j } });
      [a[j - 1], a[j]] = [a[j], a[j - 1]];
      snap(L.swap, `Troca a[${j - 1}] e a[${j}]: o ${a[j - 1]} anda uma casa para a esquerda.`, { i, j: j - 1, write: [j - 1, j], vars: { i, k, p, j } });
    }
    if (p === i) snap(L.bub, `p = i: o ${a[i]} já está no lugar, nenhuma troca.`, { i, vars: { i, k, p } });
    k -= p - i;
    snap(L.k, `k -= ${p - i}: sobram ${k} troca(s). Casa ${i} fixada com ${a[i]}.`, { i, read: [i], vars: { i, k, p } });
  }
  const ans = a.join('');
  snap(L.ret, `Resposta: "${ans}".`, { done: n, vars: { k }, result: ans });
  return out;
}

function mksFenwick(num = MKS_NUM, k = MKS_K) {
  const L = MKS_CODE.fenwick.at, n = num.length, d0 = num.split('').map(Number), out = [];
  const q = Array.from({ length: 10 }, () => []), bit = new Array(n + 1).fill(0), removed = new Array(n).fill(false);
  let res = '';
  const snap = (line, msg, s = {}) => out.push({ dp: bit.slice(), q: q.map((x) => x.slice()), removed: removed.slice(), res,
    read: [], write: [], line, msg, ...s });
  // prefix sum bit[1..p] = removed positions < p; returns the visited cells
  const sum = (p) => { let s = 0; const cells = []; for (let x = p; x > 0; x -= x & -x) { s += bit[x]; cells.push(x); } return [s, cells]; };
  const add = (p) => { const cells = []; for (let x = p; x <= n; x += x & -x) { bit[x]++; cells.push(x); } return cells; };

  snap(L.alloc, `10 filas vazias (uma por dígito) e a árvore de Fenwick bit[] com ${n + 1} zeros (bit[0] não é usado). Orçamento: k = ${k}.`, { vars: { n, k } });
  for (let p = 0; p < n; p++) q[d0[p]].push(p);
  snap(L.fill, `Cada posição entra na fila do seu dígito, em ordem: a cabeça de cada fila é a ocorrência mais à esquerda.`, { vars: { n, k } });
  for (let t = 0; t < n; t++) {
    snap(L.fort, `Casa ${t} da resposta: procura o menor dígito que dá para puxar até a frente com até ${k} troca(s).`, { t, vars: { t, k, out: res || '""' } });
    for (let d = 0; d <= 9; d++) {
      snap(L.ford, `d = ${d}.`, { t, d, vars: { t, k, d } });
      if (!q[d].length) {
        snap(L.empty, `Fila do ${d} vazia: ${d0.includes(d) ? 'todas as ocorrências já foram usadas' : `não há ${d} em "${num}"`}.`, { t, d, vars: { t, k, d } });
        continue;
      }
      snap(L.empty, `Fila do ${d} tem ${q[d].length} posição(ões): [${q[d].join(', ')}].`, { t, d, vars: { t, k, d } });
      const pos = q[d][0], [rm, cells] = sum(pos), custo = pos - rm;
      snap(L.cost, `pos = ${pos}. ${cells.length ? `soma(bit, ${pos}) visita bit[${cells.join('], bit[')}]` : 'soma(bit, 0) não visita nada'} = ${rm} removido(s) à esquerda, então o ${d} está a ${custo} casa(s) da frente.`,
        { t, d, pos, read: cells, vars: { t, k, d, pos, removidos: rm, custo } });
      if (custo > k) {
        snap(L.fit, `custo ${custo} > k = ${k}: não cabe. Tenta o próximo dígito.`, { t, d, pos, vars: { t, k, d, pos, custo } });
        continue;
      }
      snap(L.fit, `custo ${custo} ≤ k = ${k}: cabe! Como d cresce de 0 a 9, é o menor possível.`, { t, d, pos, vars: { t, k, d, pos, custo } });
      k -= custo; res += d; q[d].shift(); removed[pos] = true;
      snap(L.take, `Gasta ${custo}: k = ${k}. A resposta vira "${res}" e a posição ${pos} sai da fila do ${d}.`, { t, d, pos, vars: { t, k, d, pos, out: res } });
      const w = add(pos + 1);
      snap(L.mark, `add(bit, ${pos + 1}): soma 1 em bit[${w.join('], bit[')}]. Quem está à direita de ${pos} passa a contar esta remoção.`,
        { t, d, pos, write: w, vars: { t, k, d, pos, out: res } });
      snap(L.brk, `Casa ${t} resolvida com ${d}.`, { t, d, vars: { t, k, out: res } });
      break;
    }
  }
  snap(L.ret, `Resposta: "${res}".`, { vars: { k, out: res }, result: res });
  return out;
}

if (typeof module !== 'undefined') module.exports = { MKS_NUM, MKS_K, MKS_CODE, mksBubble, mksFenwick };
