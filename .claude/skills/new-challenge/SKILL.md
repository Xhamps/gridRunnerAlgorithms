---
name: new-challenge
description: Adiciona um novo desafio de algoritmo ao GRID//RUNNER (visualizador passo a passo de DP, grafos etc.). Use quando o usuário pedir para implementar, adicionar ou criar um desafio, problema ou algoritmo novo no site, inclusive quando ele colar um link de um problema ou só disser o nome (ex.: "implementa o Edit Distance", "adiciona 3 desafios de grafos easy").
---

# Novo desafio no GRID//RUNNER

Cada desafio tem 3 arquivos novos e 2 integrações. O site é HTML/CSS/JS puro, sem build: os geradores rodam no
navegador (globais) e no Node (`module.exports`), e os mesmos geradores alimentam a página e os testes.

```
assets/<id>.js        listagens de código + um gerador de passos por aba
<cat>/<id>.html       enunciado + abas (<template>) + render de cada aba
test/<id>.test.js     corretude contra uma solução independente
test/lines.test.js    + 1 entrada (toda linha nomeada é visitada)
index.html            + 1 card, na seção e na posição do nível
```

## Regras do usuário (inegociáveis)

- **Todo texto do site em PT-BR**, escrito com palavras próprias. O enunciado tem descrição, exemplos e
  restrições, sem copiar a fonte.
- **Nunca mencionar o LeetCode** (nem link, nem nome), mesmo quando o usuário colar um link de lá.
- **Navegação linha a linha, sem pular etapas.** Cada linha executada gera um passo: cabeçalhos de laço, cada
  `if` (mesmo quando é falso) e, na recursão, um passo "chama f(...)" e outro "f(...) voltou X" na linha da
  chamada.
- Toda página tem uma **tag de dificuldade** (`easy`, `medium` ou `hard`) e, em cada aba, um **box de
  complexidade** de tempo e espaço em Big O.

## 1. Escolha as abas

Cada aba deve ensinar algo diferente. Os padrões:

| Família | Abas (chave → rótulo) | Referência para copiar |
|---|---|---|
| DP com tabela 2D | `matriz` Matriz · `array` Array · `memo` Memo | `knapsack`, `lcs`, `coin-change` |
| DP 1D | `array` Array · `vars` Variáveis · `memo` Memo | `climbing-stairs` |
| DP de intervalo | `matriz` · `array` (se der) · `memo` | `predict-winner`, `burst-balloons` (sem Array: explique por quê) |
| Grafo em grade | `dfs` DFS · `bfs` BFS | `islands` |
| Grafo de nós | `dfs` DFS · `bfs` BFS | `path-exists` (não dirigido), `keys-rooms` / `course-schedule` (dirigido) |

Uma 4ª aba é bem-vinda quando traz uma ideia nova, como `binaria` no `lis`. Se o problema for uma variação de um
que já existe, **reaproveite os geradores** passando um parâmetro, em vez de duplicar (`stone-game.js` reusa
`predict-winner.js`).

Leia **inteiros** os arquivos de referência (módulo, página e teste) antes de escrever, e copie as convenções.

## 2. `assets/<id>.js`

```js
// <Nome>: one step per executed line, as a snapshot for the player.
if (typeof module !== 'undefined') globalThis.listing ??= require('./trace.js').listing;

const <SAMPLE> = ...;                       // exemplo padrão (ver "Escolha do exemplo")

const <ID>_CODE = {
  matriz: listing([
    ['alloc', 'const dp = Array.from({ length: n + 1 }, () => Array(W + 1))'],
    ['fori',  'for (let i = 1; i <= n; i++)'],
    [null,    '}'],                          // linha sem passo próprio: nome null
    ...
  ]),
};

function <id>2D(...) {
  const L = <ID>_CODE.matriz.at, out = [], dp = new Array(size).fill(null);
  const snap = (line, msg, s = {}) => out.push({ dp: dp.slice(), read: [], write: [], line, msg, ...s });
  snap(L.alloc, 'malloc: ...');
  ...
  snap(L.ret, `Resposta: ...`, { read: [k], result: ans });   // o último passo tem `result`
  return out;
}

if (typeof module !== 'undefined') module.exports = { <SAMPLE>, <ID>_CODE, <id>2D, ... };
```

- Referencie as linhas **pelo nome** (`L.fori`), nunca pelo número.
- Campos do snapshot que o player entende:
  - `dp`: array no heap; `null` aparece como lixo `░░`, `true`/`false` como T/F.
  - `read`/`write`: índices em `dp`. A ordem de `read` define a cor: o primeiro é ciano, o segundo rosa.
  - `vars`: registradores.
  - `stack` (`[{ call, note }]`), `calls`, `maxDepth`, `hits`: call stack do memo ou da DFS. Deixe `hits` fora
    na DFS.
  - `queue` (rótulos), `head`, `pushed`, `popped`, `maxQueue`: fila da BFS.
  - `cur`, `nb`: célula `[r, c]` ou nó atual e vizinho olhado. `i`/`j`: destaques usados pela página.
  - `result`: a resposta, no último passo.
- **Globais:** cada página carrega só o seu módulo, mas não colida com o `player.js` (`$`, `esc`, `hex`, `addr`,
  `BASE`, `QBASE`, `STACK_TOP`, `FRAME`) nem com `N`/`CODE`, que são usados nos scripts inline. Prefixe as
  constantes do módulo (`STAIRS_N`, `FILL_DIRS`).
- **Grafos:**
  - Marque como visitado **ao enfileirar**, não ao sair da fila, e explique isso na mensagem.
  - Nas grades, `s.dp` é a grade marcada no lugar ou o `visto[]`.
  - Grafos de nós levam `pos: [[x, y]]` numa caixa de 0 a 100 para o `renderGraph`.

## 3. Escolha do exemplo

- Toda linha nomeada precisa ser visitada pelo exemplo padrão (`test/lines.test.js` cobra isso). Se um
  `return false` final nunca é alcançado, escolha um exemplo cuja resposta passe por ele (o `path-exists` usa um
  destino em outra componente).
- Memo e DFS precisam ter **cache hits reais** ou revisitas visíveis. Procure candidatos com um script em vez
  de chutar.
- Mantenha as abas com no máximo 150 a 220 passos. Use exemplos pequenos (n de 4 a 6, grades 3×3 a 3×5).
- Confira com uma força bruta toda afirmação numérica dos exemplos do enunciado, como "Alice termina com 9 × 8".

## 4. `<cat>/<id>.html`

Crie em `dp/`, `grafos/`, `ordenacao/` ou `busca/` (a pasta da categoria; os caminhos são relativos, por isso `../assets/` e `../index.html`). Copie uma página da mesma família. Estrutura:

- `<title>Nome · GRID//RUNNER</title>` e o nav de categorias, com `class="on"` na categoria certa:
  `<nav><a class="on" href="../index.html#dp">Dynamic Programming</a><a href="../index.html#grafos">Grafos</a><a href="../index.html#ordenacao">Ordenação</a><a href="../index.html#busca">Busca Binária</a></nav>`
  (para uma categoria nova, crie a pasta, a seção no index, um `COPY` no `Dockerfile` e atualize o nav em **todas** as páginas).
- `<h1>NOME <span class="diff medium">MEDIUM</span></h1>`.
- `<section class="panel problem"><h2>problema</h2>`: enunciado, `.ex` com exemplos (um deles é o animado),
  `.legend` com as restrições. Strings e padrões no `h2` levam `style="text-transform:none"`.
- `<nav class="tabs" id="tabs">` + `<div id="variant">` + um `<template id="tpl-<aba>" data-label="Rótulo">`
  por aba. Cada template tem:
  - `<p class="lead">` explicando a ideia **daquela** variação;
  - o box de complexidade: `<div class="cx"><span>tempo <b>O(n·W)</b></span><span>espaço <b>O(W)</b></span><p>de onde vem: estados × custo, e o que ocupa memória (tabela, memo, call stack, fila)</p></div>`;
  - `<div class="layout">` com painéis `.panel` (use `.full` para largura total). Os ids que o player usa são
    `vars`, `code`, `mem`, `memstat`, `stack`, `stackstat`, `queue`, `queuestat`; a visualização principal fica
    em `viz`.
- O footer `.ctrl` é idêntico em todas as páginas: copie.
- Scripts, nesta ordem: `../assets/trace.js`, o módulo (e o módulo base, se reaproveitar), `../assets/player.js`.
  Depois, inline:

```js
mountTabs({
  matriz: () => mountPlayer(<id>2D(SAMPLE), (s) => {
    renderCode(<ID>_CODE.matriz.text, s.line);
    renderVars(s.vars);
    renderMemory(s, (k) => `dp[${k}]`, (k) => `base + ${k}·4`, rowLen);
    // + renderStack(s) no memo/DFS, renderQueue(s) na BFS, e a visualização principal:
    //   tabela <table class="grid">, .arr de .slot/.cell, renderGrid('viz', C, cells), renderGraph('viz', g, nodeCls, edgeCls)
  }),
});
```

- Classes visuais prontas:
  - células: `.cell` com `r0`, `r1`, `w`, `junk`, `yes`, `rng`;
  - grade: `.gc` com `land`, `water`, `seen`, `cur`, `nb`;
  - nós do grafo: `cur`, `nb`, `seen`, `goal`, `c0`, `c1`, `done`;
  - arestas: `on`, `used`.
  CSS só do desafio vai num `<style>` da própria página. Só mexa em `style.css` ou `player.js` quando o recurso
  servir a vários desafios.

## 5. `test/<id>.test.js`

```js
const test = require('node:test');
const assert = require('node:assert');
const { SAMPLE, gen2D, gen1D, genMemo } = require('../assets/<id>.js');

test('all variants match brute force', () => {
  const cases = [SAMPLE, /* casos de borda */];
  for (let k = 0; k < 60; k++) cases.push(/* caso gerado deterministicamente a partir de k */);
  for (const c of cases) {
    const want = bruteForce(c);           // solução INDEPENDENTE: força bruta, union-find, fórmula...
    assert.deepStrictEqual(gen2D(c).at(-1).result, want);
  }
});
```

Depois, adicione o desafio em `test/lines.test.js`, com o require no topo e a entrada no `runs`:

```js
  <id>: [x.<ID>_CODE, { matriz: x.<id>2D(), array: x.<id>1D(), memo: x.<id>Memo() }],
```

## 6. `index.html`

Adicione o card na seção certa (`#dp`, `#grafos`, `#ordenacao`, `#busca`), **na posição do nível**: os cards de cada seção ficam em
ordem easy → medium → hard. O atributo `data-diff` alimenta o filtro e as contagens.

```html
  <a class="card" data-diff="medium" href="<cat>/<id>.html">
    <span class="tag">● ONLINE · MATRIZ · ARRAY · MEMO</span><span class="diff medium">MEDIUM</span>
    <h3>Nome</h3>
    <p>Uma linha dizendo o que o desafio ensina de novo.</p>
  </a>
```

Se o desafio mudar algo descrito no `README.md` (tabelas de desafios, novas abas ou famílias), atualize o README
também.

## 7. Verificação (antes de dizer que terminou)

1. `npm test`: tudo passa.
2. Abra no navegador, com `python3 -m http.server 8765` (o Chrome via MCP não abre `file://`):
   - **Cmd+Shift+R** na primeira página: o servidor deixa o navegador usar `player.js`/`style.css` antigos do
     cache;
   - percorra cada aba (setas, `End`) e tire screenshots;
   - leia o console só com erros. `renderX is not defined` quase sempre é cache.
3. No resumo final, diga quais abas você viu no navegador e quais só foram cobertas pelos testes.

## Vários desafios de uma vez

Cada desafio é independente, então dá para usar um agente por desafio (ou por par) em paralelo. Instrua cada um a
**criar só os seus 3 arquivos** e a devolver a linha do `lines.test.js` e o texto do card. A integração em
`lines.test.js`, `index.html`, nav e README é feita por quem coordena, no final, para evitar conflito.
