// Trocas até a k-ésima permutação: one step per executed line, as a snapshot for the player.
// Part 1 applies next-permutation k times to find the target; part 2 counts adjacent swaps greedily (bubble left).
// Runs in the browser (globals) and in node (module.exports) for the test.
if (typeof module !== 'undefined') globalThis.listing ??= require('./trace.js').listing;

const KTH_NUM = '26613', KTH_K = 4;

const KTH_CODE = {
  proxima: listing([
    ['alloc', 'const d = num.split(\'\'), n = d.length'],
    ['forr', 'for (let r = 0; r < k; r++) {'],
    ['initi', '  let i = n - 2'],
    ['scani', '  while (i >= 0 && d[i] >= d[i+1]) i--     // sobe enquanto o sufixo não cresce'],
    ['initj', '  let j = n - 1'],
    ['scanj', '  while (d[j] <= d[i]) j--                  // menor dígito do sufixo maior que o pivô'],
    ['swap', '  [d[i], d[j]] = [d[j], d[i]]'],
    ['forrev', '  for (let l = i + 1, h = n - 1; l < h; l++, h--)'],
    ['rev', '    [d[l], d[h]] = [d[h], d[l]]            // inverte o sufixo: vira o menor possível'],
    [null, '}'],
    ['ret', 'return d.join(\'\')'],
  ]),
  trocas: listing([
    ['init', 'const cur = num.split(\'\'); let swaps = 0'],
    ['fori', 'for (let i = 0; i < n; i++) {'],
    ['initj', '  let j = i'],
    ['findj', '  while (cur[j] !== target[i]) j++          // primeiro cur[j] igual ao alvo'],
    ['whilej', '  while (j > i) {'],
    ['swap', '    [cur[j-1], cur[j]] = [cur[j], cur[j-1]]; j--; swaps++'],
    [null, '  }'],
    [null, '}'],
    ['ret', 'return swaps'],
  ]),
};

// Plain next permutation, used by the trocas tab to get the target without tracing it again.
function kthNext(d) {
  let i = d.length - 2;
  while (i >= 0 && d[i] >= d[i + 1]) i--;
  let j = d.length - 1;
  while (d[j] <= d[i]) j--;
  [d[i], d[j]] = [d[j], d[i]];
  for (let l = i + 1, h = d.length - 1; l < h; l++, h--) [d[l], d[h]] = [d[h], d[l]];
}

// Heap: d[0..n-1], the digits being permuted in place.
function kthProxima(num = KTH_NUM, k = KTH_K) {
  const L = KTH_CODE.proxima.at, d = num.split(''), n = d.length, out = [];
  const snap = (line, msg, s = {}) => out.push({ dp: d.slice(), read: [], write: [], line, msg, ...s });

  snap(L.alloc, `Copia os ${n} dígitos de "${num}" para um array: vamos permutá-los no lugar ${k} vezes.`, { vars: { num, k, n } });
  for (let r = 0; r < k; r++) {
    snap(L.forr, `Rodada ${r + 1} de ${k}: d = ${d.join('')}. Buscar a próxima permutação maior.`, { vars: { r, d: d.join('') } });
    let i = n - 2;
    snap(L.initi, `O pivô começa no penúltimo dígito (i = ${i}).`, { i, vars: { r, i } });
    for (;;) {
      const go = i >= 0 && d[i] >= d[i + 1];
      snap(L.scani, go
        ? `d[${i}] = ${d[i]} ≥ d[${i + 1}] = ${d[i + 1]}: o sufixo a partir de ${i} não cresce, nada a melhorar aqui. i--.`
        : `d[${i}] = ${d[i]} < d[${i + 1}] = ${d[i + 1]}: achou o pivô (i = ${i}). Tudo à direita está em ordem decrescente.`,
      { i, read: [i, i + 1], vars: { r, i, 'd[i]': d[i], 'd[i+1]': d[i + 1] } });
      if (!go) break;
      i--;
    }
    let j = n - 1;
    snap(L.initj, `j começa no último dígito: procurar, da direita para a esquerda, o primeiro maior que o pivô ${d[i]}.`, { i, j, read: [i], vars: { r, i, j } });
    for (;;) {
      const go = d[j] <= d[i];
      snap(L.scanj, go
        ? `d[${j}] = ${d[j]} ≤ ${d[i]}: não serve como sucessor. j--.`
        : `d[${j}] = ${d[j]} > ${d[i]}: como o sufixo é decrescente, este é o menor dígito maior que o pivô.`,
      { i, j, read: [i, j], vars: { r, i, j, 'd[i]': d[i], 'd[j]': d[j] } });
      if (!go) break;
      j--;
    }
    [d[i], d[j]] = [d[j], d[i]];
    snap(L.swap, `Troca pivô e sucessor: d = ${d.join('')}. A posição ${i} subiu o mínimo possível.`, { i, j, write: [i, j], vars: { r, i, j } });
    for (let l = i + 1, h = n - 1; ; l++, h--) {
      const go = l < h;
      snap(L.forrev, go
        ? `l = ${l} < h = ${h}: ainda há par para inverter.`
        : `l = ${l} ≥ h = ${h}: sufixo invertido. Resultado da rodada: ${d.join('')}.`,
      { i: l, j: h, vars: { r, l, h } });
      if (!go) break;
      [d[l], d[h]] = [d[h], d[l]];
      snap(L.rev, `Troca d[${l}] ↔ d[${h}]: d = ${d.join('')}. O sufixo vai de decrescente para crescente, o menor arranjo.`,
        { i: l, j: h, write: [l, h], vars: { r, l, h } });
    }
  }
  const target = d.join('');
  snap(L.ret, `Depois de ${k} rodadas, o alvo é ${target}.`, { result: target, vars: { target } });
  return out;
}

// Heap: cur[0..n-1] followed by target[0..n-1] (read only). Indices n.. are the target row.
function kthTrocas(num = KTH_NUM, k = KTH_K) {
  const L = KTH_CODE.trocas.at, cur = num.split(''), n = cur.length, out = [];
  const target = num.split('');
  for (let r = 0; r < k; r++) kthNext(target);
  let swaps = 0;
  const snap = (line, msg, s = {}) => out.push({ dp: [...cur, ...target], read: [], write: [], line, msg, swaps, ...s });

  snap(L.init, `cur = ${num}, alvo = ${target.join('')} (da aba Próxima permutação). Zero trocas até agora.`, { vars: { swaps } });
  for (let i = 0; i < n; i++) {
    snap(L.fori, `i = ${i}: a posição ${i} precisa ficar com ${target[i]}.`, { i, read: [n + i], vars: { i, 'target[i]': target[i], swaps } });
    let j = i;
    snap(L.initj, `j = ${i}: procura a partir de i, porque cur[0..${i - 1}] já está fixado.`, { i, j, vars: { i, j, swaps } });
    for (;;) {
      const go = cur[j] !== target[i];
      snap(L.findj, go
        ? `cur[${j}] = ${cur[j]} ≠ ${target[i]}: pula. j++.`
        : `cur[${j}] = ${cur[j]} = ${target[i]}: é a cópia mais próxima, a que custa menos trocas para trazer.`,
      { i, j, read: [j, n + i], vars: { i, j, 'cur[j]': cur[j], 'target[i]': target[i], swaps } });
      if (!go) break;
      j++;
    }
    for (;;) {
      const go = j > i;
      snap(L.whilej, go
        ? `j = ${j} > i = ${i}: o ${cur[j]} ainda está ${j - i} casa(s) à direita.`
        : `j = i = ${i}: posição ${i} resolvida.`,
      { i, j, read: [j], vars: { i, j, swaps } });
      if (!go) break;
      [cur[j - 1], cur[j]] = [cur[j], cur[j - 1]]; j--; swaps++;
      snap(L.swap, `Troca vizinhos ${j} ↔ ${j + 1}: cur = ${cur.join('')}. swaps = ${swaps}.`, { i, j, write: [j, j + 1], vars: { i, j, swaps } });
    }
  }
  snap(L.ret, `cur virou o alvo ${target.join('')} com ${swaps} trocas adjacentes.`, { result: swaps, vars: { swaps } });
  return out;
}

if (typeof module !== 'undefined') module.exports = { KTH_NUM, KTH_K, KTH_CODE, kthProxima, kthTrocas };
