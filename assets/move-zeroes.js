// Move Zeroes: one step per executed line, as a snapshot for the player.
// Push every 0 to the end in place, keeping the order of the other numbers.
// Runs in the browser (globals) and in node (module.exports) for the test.
if (typeof module !== 'undefined') globalThis.listing ??= require('./trace.js').listing;

const MZ_NUMS = [0, 1, 0, 3, 12];

const MZ_CODE = {
  bolha: listing([
    ['forp', 'for (let p = 0; p < n - 1; p++) {            // uma passada'],
    ['flag', '  let trocou = false'],
    ['forj', '  for (let j = 0; j < n - 1 - p; j++) {      // os p últimos já estão no lugar'],
    ['cmp', '    if (a[j] === 0 && a[j+1] !== 0) {        // zero antes de não-zero?'],
    ['swap', '      [a[j], a[j+1]] = [a[j+1], a[j]]        // troca vizinhos'],
    ['mark', '      trocou = true'],
    [null, '    }'],
    [null, '  }'],
    ['stop', '  if (!trocou) break                          // passada limpa: acabou'],
    [null, '}'],
    ['ret', 'return a'],
  ]),
  ponteiros: listing([
    ['init', 'let w = 0                         // próxima casa para um não-zero'],
    ['forr', 'for (let r = 0; r < n; r++) {'],
    ['cmp', '  if (a[r] !== 0) {'],
    ['swap', '    [a[w], a[r]] = [a[r], a[w]]     // não-zero vai para w, o zero vai para r'],
    ['inc', '    w++'],
    [null, '  }'],
    [null, '}'],
    ['ret', 'return a'],
  ]),
};

// Bubble sort on the key "is zero": adjacent swaps carry each zero to the right. O(n²).
function mzBubble(nums = MZ_NUMS) {
  const L = MZ_CODE.bolha.at, a = nums.slice(), n = a.length, out = [];
  let swaps = 0, cmps = 0;
  const snap = (line, msg, s = {}) => out.push({ dp: a.slice(), read: [], write: [], line, msg, swaps, cmps, ...s });

  let p = 0;
  for (; p < n - 1; p++) {
    snap(L.forp, `Passada p = ${p}. ${p ? `As ${p} últimas casas já estão no lugar final.` : 'Cada passada empurra um zero até o fim da parte aberta.'}`,
      { p, vars: { p, n } });
    let trocou = false;
    snap(L.flag, 'trocou = false: se a passada inteira não trocar nada, o array já está pronto.', { p, vars: { p, trocou } });
    for (let j = 0; j < n - 1 - p; j++) {
      snap(L.forj, `j = ${j}: olha o par a[${j}], a[${j + 1}].`, { p, j, vars: { p, j, trocou } });
      cmps++;
      const hit = a[j] === 0 && a[j + 1] !== 0;
      snap(L.cmp, hit ? `a[${j}] = 0 e a[${j + 1}] = ${a[j + 1]} ≠ 0: o zero está antes de um número. Troca.`
        : a[j] !== 0 ? `a[${j}] = ${a[j]} não é zero: nada a fazer.` : `a[${j}] e a[${j + 1}] são zeros: trocar não muda nada.`,
      { p, j, read: [j, j + 1], vars: { p, j, 'a[j]': a[j], 'a[j+1]': a[j + 1], trocou } });
      if (hit) {
        [a[j], a[j + 1]] = [a[j + 1], a[j]]; swaps++;
        snap(L.swap, `Troca: o ${a[j]} anda uma casa para a esquerda e o zero anda uma para a direita. A ordem dos não-zeros não muda.`,
          { p, j, write: [j, j + 1], vars: { p, j, 'a[j]': a[j], 'a[j+1]': a[j + 1], trocou } });
        trocou = true;
        snap(L.mark, 'trocou = true: vale a pena fazer outra passada.', { p, j, vars: { p, j, trocou } });
      }
    }
    if (!trocou) {
      snap(L.stop, `Nenhuma troca na passada ${p}: todo zero já está depois de todos os números. break.`, { p, vars: { p, trocou } });
      break;
    }
    snap(L.stop, `Houve troca na passada ${p}: segue para a próxima.`, { p, vars: { p, trocou } });
  }
  snap(L.ret, `Pronto: [${a.join(', ')}]. ${cmps} comparações e ${swaps} trocas.`, { p: n, result: a.slice() });
  return out;
}

// Write pointer: w = where the next non-zero goes. Each r is read once. O(n).
function mzPointers(nums = MZ_NUMS) {
  const L = MZ_CODE.ponteiros.at, a = nums.slice(), n = a.length, out = [];
  let swaps = 0, w = 0;
  const snap = (line, msg, s = {}) => out.push({ dp: a.slice(), read: [], write: [], line, msg, swaps, w, ...s });

  snap(L.init, 'w = 0: tudo antes de w já é não-zero, na ordem original. Por enquanto, nada.', { vars: { w } });
  for (let r = 0; r < n; r++) {
    snap(L.forr, `r = ${r}: lê a[${r}] = ${a[r]}.`, { r, vars: { r, w } });
    snap(L.cmp, a[r] !== 0 ? `a[${r}] = ${a[r]} ≠ 0: ele vai para a casa w = ${w}.` : `a[${r}] = 0: pula. w fica parado e marca o primeiro zero.`,
      { r, read: [r], vars: { r, w, 'a[r]': a[r] } });
    if (a[r] !== 0) {
      [a[w], a[r]] = [a[r], a[w]]; swaps++;
      snap(L.swap, w === r ? `w = r = ${r}: troca a casa com ela mesma, nada muda (ainda não apareceu zero).`
        : `Troca a[${w}] ↔ a[${r}]: o ${a[w]} pula para a casa ${w} e o zero vai para a ${r}.`,
      { r, write: w === r ? [r] : [w, r], vars: { r, w, 'a[w]': a[w], 'a[r]': a[r] } });
      w++;
      snap(L.inc, `w = ${w}: a[0..${w - 1}] já são os não-zeros na ordem certa.`, { r, vars: { r, w } });
    }
  }
  snap(L.ret, `Pronto: [${a.join(', ')}]. Uma única varredura, ${swaps} trocas.`, { result: a.slice() });
  return out;
}

if (typeof module !== 'undefined') module.exports = { MZ_NUMS, MZ_CODE, mzBubble, mzPointers };
