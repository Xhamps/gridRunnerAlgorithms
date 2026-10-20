// First and Last Position: one step per executed line, as a snapshot for the player.
// Sorted array with duplicates: return [first, last] index of t, or [-1, -1].
// Runs in the browser (globals) and in node (module.exports) for the test.
if (typeof module !== 'undefined') globalThis.listing ??= require('./trace.js').listing;

const FL_NUMS = [1, 2, 4, 5, 7, 7, 7, 9];
const FL_T = 7;

const FL_CODE = {
  expande: listing([
    ['init', 'let lo = 0, hi = n - 1, achou = -1'],
    ['loop', 'while (lo <= hi && achou < 0) {            // t, se existe, está em a[lo..hi]'],
    ['mid', '  const mid = (lo + hi) >> 1'],
    ['lt', '  if (a[mid] < t) lo = mid + 1               // mid e a esquerda são pequenos'],
    ['gt', '  else if (a[mid] > t) hi = mid - 1          // mid e a direita são grandes'],
    ['hit', '  else achou = mid                           // qualquer ocorrência serve'],
    [null, '}'],
    ['ext', 'let first = achou, last = achou'],
    ['found', 'if (achou >= 0) {'],
    ['left', '  while (first > 0 && a[first - 1] === t) first--'],
    ['right', '  while (last < n - 1 && a[last + 1] === t) last++'],
    [null, '}'],
    ['ret', 'return [first, last]'],
  ]),
  fronteiras: listing([
    ['fn', 'function bound(upper) {                     // 1ª casa que "passa" de t'],
    ['init', '  let lo = 0, hi = n                        // resposta sempre em [lo, hi]'],
    ['loop', '  while (lo < hi) {'],
    ['mid', '    const mid = (lo + hi) >> 1'],
    ['cmp', '    if (upper ? a[mid] <= t : a[mid] < t) lo = mid + 1   // mid não é a resposta'],
    ['else', '    else hi = mid                            // mid pode ser a resposta'],
    [null, '  }'],
    ['bret', '  return lo                                // lo = hi: a fronteira'],
    [null, '}'],
    ['first', 'const first = bound(false)                  // 1ª casa com a[i] >= t'],
    ['last', 'const last = bound(true) - 1                // 1ª casa com a[i] > t, menos 1'],
    ['ret', 'return first <= last ? [first, last] : [-1, -1]'],
  ]),
};

const flShow = (a, lo, hi) => lo > hi ? '[]' : `[${a.slice(lo, hi + 1).join(', ')}]`;

// One binary search finds any t, then two linear walks widen it. O(log n + k).
function flExpand(nums = FL_NUMS, t = FL_T) {
  const L = FL_CODE.expande.at, a = nums.slice(), n = a.length, out = [];
  let lo = 0, hi = n - 1, achou = -1, cmps = 0;
  const snap = (line, msg, s = {}) => out.push({ dp: a.slice(), read: [], write: [], line, msg, cmps, t, ...s });
  const R = (s = {}) => ({ lo, hi, ...s, vars: { t, lo, hi, achou, ...s.vars } });

  snap(L.init, `lo = 0, hi = ${n - 1}: o intervalo de busca é o array inteiro. achou = -1 (nada ainda).`, R());
  for (;;) {
    if (!(lo <= hi && achou < 0)) {
      snap(L.loop, achou >= 0 ? `achou = ${achou}: a busca binária parou, já temos uma ocorrência.`
        : `lo = ${lo} > hi = ${hi}: o intervalo ficou vazio, ${t} não está no array.`, R());
      break;
    }
    snap(L.loop, `lo = ${lo} ≤ hi = ${hi}: ainda há ${hi - lo + 1} candidatas em ${flShow(a, lo, hi)}.`, R());
    const mid = (lo + hi) >> 1;
    snap(L.mid, `mid = (${lo} + ${hi}) >> 1 = ${mid}: olha o meio do intervalo.`, R({ mid, read: [mid], vars: { mid } }));
    cmps++;
    const M = R({ mid, read: [mid], vars: { mid } });
    if (a[mid] < t) {
      lo = mid + 1;
      snap(L.lt, `a[${mid}] = ${a[mid]} < ${t}: como o array é crescente, tudo até mid é pequeno demais. lo = ${lo}.`, M);
      continue;
    }
    snap(L.lt, `a[${mid}] = ${a[mid]} < ${t}? Falso.`, M);
    if (a[mid] > t) {
      hi = mid - 1;
      snap(L.gt, `a[${mid}] = ${a[mid]} > ${t}: tudo a partir de mid é grande demais. hi = ${hi}.`, M);
      continue;
    }
    snap(L.gt, `a[${mid}] = ${a[mid]} > ${t}? Falso.`, M);
    achou = mid;
    snap(L.hit, `Nem menor nem maior: a[${mid}] = t. achou = ${mid}, mas não sabemos se é a primeira nem a última.`,
      R({ mid, read: [mid], vars: { mid } }));
  }
  let first = achou, last = achou;
  const E = (s = {}) => ({ first, last, ...s, vars: { t, achou, first, last, ...s.vars } });
  snap(L.ext, `first = last = ${achou}: as duas pontas começam na ocorrência encontrada.`, E());
  if (achou >= 0) {
    snap(L.found, `achou = ${achou} ≥ 0: existe, agora expande para os lados.`, E());
    for (;;) {
      cmps++;
      const go = first > 0 && a[first - 1] === t;
      snap(L.left, go ? `a[${first - 1}] = ${t}: também é t. first vai para ${first - 1}.`
        : first === 0 ? 'first = 0: chegou no começo do array, para.' : `a[${first - 1}] = ${a[first - 1]} ≠ ${t}: first = ${first} é a primeira.`,
      E({ read: first > 0 ? [first - 1] : [] }));
      if (!go) break;
      first--;
    }
    for (;;) {
      cmps++;
      const go = last < n - 1 && a[last + 1] === t;
      snap(L.right, go ? `a[${last + 1}] = ${t}: também é t. last vai para ${last + 1}.`
        : last === n - 1 ? `last = ${n - 1}: chegou no fim do array, para.` : `a[${last + 1}] = ${a[last + 1]} ≠ ${t}: last = ${last} é a última.`,
      E({ read: last < n - 1 ? [last + 1] : [] }));
      if (!go) break;
      last++;
    }
  } else snap(L.found, 'achou = -1: não há o que expandir.', E());
  snap(L.ret, `Resposta: [${first}, ${last}]. ${cmps} comparações; a expansão custa uma por cópia de t.`,
    { ...E(), result: [first, last] });
  return out;
}

// Two lower-bound searches: bound(false) uses <, bound(true) uses <=. O(log n) each.
function flBounds(nums = FL_NUMS, t = FL_T) {
  const L = FL_CODE.fronteiras.at, a = nums.slice(), n = a.length, out = [], stack = [];
  let cmps = 0, calls = 0, maxDepth = 0, first, last;
  const snap = (line, msg, s = {}) => out.push({
    dp: a.slice(), read: [], write: [], stack: stack.map((f) => ({ ...f })), calls, maxDepth, cmps, t, line, msg, ...s,
  });
  const G = () => ({ t, first, last });

  const bound = (upper) => {
    const op = upper ? '<=' : '<', fr = { call: `bound(${upper})`, note: `a[mid] ${op} t` };
    stack.push(fr); calls++; maxDepth = Math.max(maxDepth, stack.length);
    let lo = 0, hi = n;
    const R = (s = {}) => ({ lo, hi, half: true, ...s, vars: { upper, t, lo, hi, ...s.vars } });
    snap(L.fn, `Entra em bound(${upper}): procura a 1ª casa com a[i] ${upper ? '>' : '>='} ${t}. Para isso o teste "fica à esquerda" é a[mid] ${op} t.`,
      { vars: { upper, t } });
    snap(L.init, `lo = 0, hi = ${n}: hi = n (uma casa depois do fim) porque a resposta pode ser "nenhuma casa", ou seja, n.`, R());
    for (;;) {
      if (lo >= hi) {
        snap(L.loop, `lo = hi = ${lo}: sobrou um único lugar possível: a fronteira é ${lo}.`, R());
        break;
      }
      snap(L.loop, `lo = ${lo} < hi = ${hi}: a fronteira ainda pode estar em ${hi - lo + 1} lugares.`, R());
      const mid = (lo + hi) >> 1;
      snap(L.mid, `mid = (${lo} + ${hi}) >> 1 = ${mid}.`, R({ mid, read: [mid], vars: { mid } }));
      cmps++;
      const left = upper ? a[mid] <= t : a[mid] < t;
      if (left) {
        lo = mid + 1;
        snap(L.cmp, `a[${mid}] = ${a[mid]} ${op} ${t}: verdadeiro, mid ainda está antes da fronteira. lo = ${lo}.`,
          R({ mid, read: [mid], vars: { mid } }));
        continue;
      }
      snap(L.cmp, `a[${mid}] = ${a[mid]} ${op} ${t}: falso${a[mid] === t ? ` (com ${op} o igual ${upper ? 'iria' : 'não vai'} para a esquerda)` : ''}.`,
        R({ mid, read: [mid], vars: { mid } }));
      hi = mid;
      snap(L.else, `mid = ${mid} pode ser a fronteira: hi = ${mid}, sem descartar o próprio mid.`, R({ mid, read: [mid], vars: { mid } }));
    }
    fr.note = `→ ${lo}`;
    snap(L.bret, `Retorna ${lo}: a[0..${lo - 1}] são ${op} ${t} e de ${lo} em diante não são. Desempilha.`,
      { b: lo, vars: { upper, lo } });
    stack.pop();
    return lo;
  };

  snap(L.first, 'Chama bound(false): com "<", os iguais a t ficam à direita, então a fronteira cai na 1ª ocorrência.', { vars: G() });
  first = bound(false);
  snap(L.first, `bound(false) voltou ${first}: first = ${first}.`, { first, vars: G() });
  snap(L.last, 'Chama bound(true): com "<=", os iguais a t ficam à esquerda, então a fronteira cai logo depois da última.', { first, vars: G() });
  const b = bound(true);
  last = b - 1;
  snap(L.last, `bound(true) voltou ${b}: last = ${b} - 1 = ${last}.`, { first, last, vars: G() });
  const result = first <= last ? [first, last] : [-1, -1];
  snap(L.ret, first <= last ? `first = ${first} ≤ last = ${last}: t aparece ${last - first + 1} vezes. Resposta [${first}, ${last}], ${cmps} comparações.`
    : `first = ${first} > last = ${last}: as duas fronteiras coincidem, t não existe. Resposta [-1, -1].`,
  { first: result[0], last: result[1], vars: G(), result });
  return out;
}

if (typeof module !== 'undefined') module.exports = { FL_NUMS, FL_T, FL_CODE, flExpand, flBounds };
