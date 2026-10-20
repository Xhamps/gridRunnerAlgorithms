// Line-by-line navigation: every named line of each listing must be highlighted by some step.
const test = require('node:test');
const assert = require('node:assert');
const k = require('../assets/knapsack.js'), w = require('../assets/predict-winner.js');
const g = require('../assets/stone-game.js'), s = require('../assets/stock-cooldown.js'), r = require('../assets/regex-matching.js');

const cc = require('../assets/coin-change.js'), b = require('../assets/burst-balloons.js');
const lis = require('../assets/lis.js'), lc = require('../assets/lcs.js');

const isl = require('../assets/islands.js'), pe = require('../assets/path-exists.js');

const ff = require('../assets/flood-fill.js'), ma = require('../assets/max-area-island.js');
const ro = require('../assets/rotting-oranges.js'), pa = require('../assets/pacific-atlantic.js');
const li = require('../assets/large-island.js'), kr = require('../assets/keys-rooms.js');
const bp = require('../assets/bipartite.js'), cs = require('../assets/course-schedule.js');

const st = require('../assets/climbing-stairs.js'), pt = require('../assets/pascal-triangle.js');
const dj = require('../assets/dijkstra.js');

const mz = require('../assets/move-zeroes.js'), so = require('../assets/semi-ordered.js');
const sbb = require('../assets/sort-by-bits.js'), ks = require('../assets/kth-swaps.js'), mks = require('../assets/min-k-swaps.js');

const msa = require('../assets/merge-sorted.js'), mll = require('../assets/merge-lists.js');
const msort = require('../assets/merge-sort.js'), sl = require('../assets/sort-list.js'), rp = require('../assets/reverse-pairs.js');

const ps = require('../assets/parity-sort.js'), qs = require('../assets/quick-sort.js'), sc = require('../assets/sort-colors.js');
const kl = require('../assets/kth-largest.js'), wg = require('../assets/wiggle-sort.js');

const bs = require('../assets/binary-search.js'), ip = require('../assets/insert-position.js'), sq = require('../assets/sqrt.js');
const fl = require('../assets/first-last.js'), rs = require('../assets/rotated-search.js'), pk = require('../assets/peak.js');
const kk = require('../assets/koko.js'), sa = require('../assets/split-array.js'), md = require('../assets/median-two.js');
const rm = require('../assets/rotated-min.js');

const runs = {
  knapsack: [k.KNAPSACK_CODE, { matriz: k.steps2D(k.ITEMS, k.CAP), array: k.steps1D(k.ITEMS, k.CAP), memo: k.stepsMemo(k.ITEMS, k.CAP) }],
  winner: [w.WINNER_CODE, { matriz: w.winner2D(w.NUMS), array: w.winner1D(w.NUMS), memo: w.winnerMemo(w.NUMS) }],
  stone: [g.STONE_CODE, { matriz: w.winner2D(g.PILES, g.STONE), array: w.winner1D(g.PILES, g.STONE), memo: w.winnerMemo(g.PILES, g.STONE) }],
  stock: [s.STOCK_CODE, { matriz: s.stock2D(s.PRICES), array: s.stock1D(s.PRICES), memo: s.stockMemo(s.PRICES) }],
  regex: [r.REGEX_CODE, { matriz: r.regex2D(r.S, r.P), array: r.regex1D(r.S, r.P), memo: r.regexMemo(r.S, r.P) }],
  coin: [cc.COIN_CODE, { matriz: cc.coin2D(cc.COINS, cc.AMOUNT), array: cc.coin1D(cc.COINS, cc.AMOUNT), memo: cc.coinMemo(cc.COINS, cc.AMOUNT) }],
  balloons: [b.BALLOON_CODE, { matriz: b.balloon2D(b.BALLOONS), memo: b.balloonMemo(b.BALLOONS) }],
  lis: [lis.LIS_CODE, { matriz: lis.lis2D(lis.SEQ), array: lis.lis1D(lis.SEQ), memo: lis.lisMemo(lis.SEQ), binaria: lis.lisBinary(lis.SEQ) }],
  lcs: [lc.LCS_CODE, { matriz: lc.lcs2D(lc.A, lc.B), array: lc.lcs1D(lc.A, lc.B), memo: lc.lcsMemo(lc.A, lc.B) }],
  islands: [isl.ISLAND_CODE, { dfs: isl.islandsDFS(), bfs: isl.islandsBFS() }],
  path: [pe.PATH_CODE, { dfs: pe.pathDFS(), bfs: pe.pathBFS() }],
  fill: [ff.FILL_CODE, { dfs: ff.fillDFS(), bfs: ff.fillBFS() }],
  area: [ma.AREA_CODE, { dfs: ma.areaDFS(), bfs: ma.areaBFS() }],
  oranges: [ro.ORANGE_CODE, { dfs: ro.orangesDFS(), bfs: ro.orangesBFS() }],
  pacific: [pa.PA_CODE, { dfs: pa.pacificDFS(), bfs: pa.pacificBFS() }],
  largeIsland: [li.LARGE_CODE, { dfs: li.largeDFS(), bfs: li.largeBFS() }],
  rooms: [kr.ROOMS_CODE, { dfs: kr.roomsDFS(), bfs: kr.roomsBFS() }],
  bipartite: [bp.BIP_CODE, { dfs: bp.bipDFS(), bfs: bp.bipBFS() }],
  course: [cs.COURSE_CODE, { dfs: cs.courseDFS(), bfs: cs.courseBFS() }],
  dijkstra: [dj.DIJ_CODE, { array: dj.dijkstraArray(), heap: dj.dijkstraHeap() }],
  stairs: [st.STAIRS_CODE, { array: st.stairsArray(), vars: st.stairsVars(), memo: st.stairsMemo() }],
  pascal: [pt.PASCAL_CODE, { matriz: pt.pascal2D(), array: pt.pascal1D(), memo: pt.pascalMemo() }],
  moveZeroes: [mz.MZ_CODE, { bolha: mz.mzBubble(), ponteiros: mz.mzPointers() }],
  semiOrdered: [so.SEMI_CODE, { bolha: so.semiBubble(), formula: so.semiFormula() }],
  sortByBits: [sbb.BITS_CODE, { bolha: sbb.bitsBubble(), grupos: sbb.bitsGroups() }],
  kthSwaps: [ks.KTH_CODE, { proxima: ks.kthProxima(), trocas: ks.kthTrocas() }],
  minKSwaps: [mks.MKS_CODE, { bolha: mks.mksBubble(), fenwick: mks.mksFenwick() }],
  mergeSorted: [msa.MSA_CODE, { frente: msa.msFront(), tras: msa.msBack() }],
  mergeLists: [mll.MLL_CODE, { iterativo: mll.mllIter(), recursivo: mll.mllRec() }],
  mergeSort: [msort.MS_CODE, { recursivo: msort.msRecursive(), iterativo: msort.msIterative() }],
  sortList: [sl.SL_CODE, { recursivo: sl.slRecursive(), iterativo: sl.slIterative() }],
  reversePairs: [rp.RP_CODE, { forca: rp.rpBrute(), merge: rp.rpMerge() }],
  paritySort: [ps.PAR_CODE, { hoare: ps.parHoare(), lomuto: ps.parLomuto() }],
  quickSort: [qs.QS_CODE, { lomuto: qs.qsLomuto(), hoare: qs.qsHoare() }],
  sortColors: [sc.SC_CODE, { duas: sc.scTwoPass(), bandeira: sc.scDutch() }],
  kthLargest: [kl.KL_CODE, { quickselect: kl.klQuick(), heap: kl.klHeap() }],
  wiggleSort: [wg.WG_CODE, { ordena: wg.wgSorted(), mediana: wg.wgMedian() }],
  binarySearch: [bs.BS_CODE, { fechado: bs.bsClosed(), semiaberto: bs.bsHalfOpen() }],
  insertPosition: [ip.IP_CODE, { linear: ip.ipLinear(), binaria: ip.ipBinary() }],
  sqrt: [sq.SQ_CODE, { linear: sq.sqLinear(), binaria: sq.sqBinary() }],
  firstLast: [fl.FL_CODE, { expande: fl.flExpand(), fronteiras: fl.flBounds() }],
  rotatedSearch: [rs.RS_CODE, { pivo: rs.rsPivot(), direta: rs.rsDirect() }],
  peak: [pk.PK_CODE, { linear: pk.pkLinear(), binaria: pk.pkBinary() }],
  koko: [kk.KK_CODE, { linear: kk.kkLinear(), binaria: kk.kkBinary() }],
  splitArray: [sa.SA_CODE, { binaria: sa.saBinary(), matriz: sa.saDP() }],
  medianTwo: [md.MD_CODE, { merge: md.mdMerge(), corte: md.mdCut() }],
  rotatedMin: [rm.RM_CODE, { binaria: rm.rmSteps(rm.RM_NUMS), pior: rm.rmSteps(rm.RM_WORST) }],
};

for (const [name, [code, variants]] of Object.entries(runs)) {
  test(`${name}: every named line is visited`, () => {
    for (const [tab, steps] of Object.entries(variants)) {
      const seen = new Set(steps.map((x) => x.line));
      const missing = Object.entries(code[tab].at).filter(([, i]) => !seen.has(i)).map(([n]) => n);
      assert.deepStrictEqual(missing, [], `${name}/${tab} never highlights: ${missing}`);
      assert.ok(steps.every((x) => Number.isInteger(x.line) && x.msg), `${name}/${tab}: step without line or msg`);
    }
  });
}
