# GRID//RUNNER

```
 ██████╗ ██████╗ ██╗██████╗
██╔════╝ ██╔══██╗██║██╔══██╗
██║  ███╗██████╔╝██║██║  ██║
██║   ██║██╔══██╗██║██║  ██║
╚██████╔╝██║  ██║██║██████╔╝
 ╚═════╝ ╚═╝  ╚═╝╚═╝╚═════╝  //RUNNER
```

> jack in. rode os algoritmos step by step e veja a memória sendo alocada

Visualizador interativo de algoritmos clássicos, com visual cyberpunk. Cada desafio executa o algoritmo
**linha a linha**: você navega pelos passos e vê a linha de código ativa, os registradores e cada célula de
memória sendo lida e escrita. Nos algoritmos recursivos aparece também a call stack, e nas buscas em
largura, a fila no heap.

O site é feito para quem está estudando algoritmos e quer *ver* o que acontece, em vez de só ler o código.

**Acesse: [gridrunner.xhamps.com.br](https://gridrunner.xhamps.com.br)**

## Como rodar

O site é HTML, CSS e JavaScript puros, sem build e sem dependências.

Em produção, `assets/analytics.js` carrega o [PostHog](https://posthog.com) (pageviews e cliques). Ele não roda em
`localhost`.

```bash
# opção 1: abrir direto no navegador
open index.html

# opção 2: servidor local
python3 -m http.server 8765
# → http://localhost:8765
```

> Se depois de alterar um arquivo em `assets/` a página continuar com a versão antiga, recarregue sem cache
> (**Cmd+Shift+R** / **Ctrl+Shift+R**).

### Testes

Requer Node 18+ (usa o `node:test` nativo).

```bash
npm test
```

Os testes verificam duas coisas:

- **Corretude:** cada variação de cada desafio é comparada com uma solução independente (força bruta,
  union-find, `RegExp` nativo, fórmula binomial...) em dezenas de casos gerados.
- **Navegação linha a linha:** `test/lines.test.js` garante que toda linha do código mostrado na página é
  destacada por pelo menos um passo do exemplo, e que todo passo tem linha e mensagem.

## Controles

| Ação | Botão | Teclado |
|---|---|---|
| Passo anterior / próximo | ◀ / ▶ | ← / → |
| Executar / pausar | ▶ RUN | Espaço |
| Primeiro / último passo | ⏮ / ⏭ | Home / End |
| Pular para um passo | barra de navegação | — |
| Velocidade da execução | `speed` | — |

As abas de cada desafio (Matriz, Array, Memo, DFS, BFS...) ficam na URL (`dp/knapsack.html#memo`), e o filtro
de dificuldade do index também (`index.html?nivel=easy`).

## Desafios

Cada página traz o enunciado com exemplos e restrições, uma aba por variação da solução e, em cada aba, um
box com a complexidade de **tempo** e **espaço** em Big O.

### Dynamic Programming

| Desafio | Nível | Abas |
|---|---|---|
| Climbing Stairs | EASY | Array · Variáveis · Memo |
| Pascal's Triangle | EASY | Matriz · Array · Memo |
| Knapsack 0/1 | MEDIUM | Matriz · Array · Memo |
| Coin Change | MEDIUM | Matriz · Array · Memo |
| Predict the Winner | MEDIUM | Matriz · Array · Memo |
| Stock com Cooldown | MEDIUM | Matriz · Array · Memo |
| Longest Increasing Subsequence | MEDIUM | Matriz · Array · Memo · Binária |
| Longest Common Subsequence | MEDIUM | Matriz · Array · Memo |
| Burst Balloons | HARD | Matriz · Memo |
| Regex Matching | HARD | Matriz · Array · Memo |

- **Matriz:** tabulation clássica, com a tabela inteira no heap.
- **Array:** a versão com espaço otimizado, que reaproveita uma linha só. A página explica a direção do laço
  (para frente ou de trás para frente) e por que ela importa.
- **Memo:** top-down com memoization, mostrando a call stack, as chamadas e os cache hits.

#### Série Stone Game

| Desafio | Nível | Abas |
|---|---|---|
| Stone Game | MEDIUM | Matriz · Array · Memo |
| Stone Game II | MEDIUM | Matriz · Memo |
| Stone Game VI | MEDIUM | Força bruta · Guloso |
| Stone Game VII | MEDIUM | Matriz · Array · Memo |
| Stone Game IX | MEDIUM | Memo · Contagem |
| Stone Game III | HARD | Array · Variáveis · Memo |
| Stone Game IV | HARD | Array · Memo |
| Stone Game V | HARD | Matriz · Memo |
| Stone Game VIII | HARD | Array · Variáveis |

### Grafos · DFS × BFS

| Desafio | Nível | Tipo |
|---|---|---|
| Flood Fill | EASY | grade |
| Find if Path Exists | EASY | grafo não dirigido |
| Number of Islands | MEDIUM | grade |
| Max Area of Island | MEDIUM | grade |
| Rotting Oranges | MEDIUM | grade, BFS multi-origem |
| Pacific Atlantic Water Flow | MEDIUM | grade, busca reversa |
| Keys and Rooms | MEDIUM | grafo dirigido |
| Is Graph Bipartite | MEDIUM | grafo, 2 cores |
| Course Schedule | MEDIUM | grafo dirigido: DFS com 3 estados × BFS de Kahn |
| Pathfinder · Dijkstra | MEDIUM | grade com pesos: Dijkstra com varredura de array × min-heap |
| Making a Large Island | HARD | grade, rótulos + soma de ilhas vizinhas |

- **DFS:** busca em profundidade recursiva, com a call stack visível.
- **BFS:** busca em largura com a fila no heap, mostrando os endereços, os ponteiros `head` e `tail` e os itens
  que já saíram.
- **Array / Min-heap** (Dijkstra): escolhe a célula aberta mais barata varrendo `dist[]` em O(V²), ou tirando a raiz
  de um min-heap, com as entradas velhas descartadas quando saem.

### Ordenação · bubble sort

| Desafio | Nível | Abas |
|---|---|---|
| Move Zeroes | EASY | bolha × dois ponteiros |
| Semi-Ordered Permutation | EASY | bolha × fórmula |
| Find if Array Can Be Sorted | MEDIUM | bolha restrita × grupos de popcount |
| Minimum Adjacent Swaps to Reach the Kth Smallest Number | MEDIUM | próxima permutação × trocas |
| Minimum Possible Integer After at Most K Adjacent Swaps | HARD | bolha gulosa × Fenwick tree |

- **Bolha:** a simulação direta com trocas entre vizinhos, O(n²), para ver cada troca acontecer na memória.
- A outra aba mostra o atalho: contar as trocas sem fazê-las, ou fazê-las em O(n) / O(n log n).

### Ordenação · merge sort

| Desafio | Nível | Abas |
|---|---|---|
| Merge Sorted Array | EASY | pela frente × de trás |
| Merge Two Sorted Lists | EASY | iterativo × recursivo |
| Sort an Array | MEDIUM | recursivo (top-down) × iterativo (bottom-up) |
| Sort List | MEDIUM | recursivo × iterativo, em lista ligada |
| Reverse Pairs | HARD | força bruta × contagem durante o merge |

- **Recursivo:** divide ao meio até sobrar um elemento, com a call stack visível, e junta na volta.
- **Iterativo:** sem recursão, junta blocos de tamanho 1, 2, 4... lado a lado.

### Ordenação · quick sort

| Desafio | Nível | Abas |
|---|---|---|
| Sort Array By Parity | EASY | duas pontas (Hoare) × Lomuto |
| Sort an Array (quick sort) | MEDIUM | partição de Lomuto × partição de Hoare |
| Sort Colors | MEDIUM | duas partições × três ponteiros (bandeira holandesa) |
| Kth Largest Element in an Array | MEDIUM | quickselect × min-heap |
| Wiggle Sort II | HARD | ordena e intercala × quickselect + 3 vias com índice virtual |

- **Partição:** escolhe um pivô e separa menores de maiores in place. Lomuto usa um ponteiro de escrita, Hoare
  usa dois ponteiros vindo das pontas.
- **Quickselect:** particiona e desce só para o lado que contém a posição procurada, O(n) em média.

### Busca Binária

| Desafio | Nível | Abas |
|---|---|---|
| Binary Search | EASY | intervalo fechado × semiaberto |
| Search Insert Position | EASY | linear × lower bound |
| Sqrt(x) | EASY | linear × binária na resposta |
| Find First and Last Position | MEDIUM | acha e expande × duas fronteiras |
| Search in Rotated Sorted Array | MEDIUM | acha o pivô × uma busca só |
| Find Peak Element | MEDIUM | linear × segue a subida |
| Koko Eating Bananas | MEDIUM | velocidade crescente × binária na resposta |
| Split Array Largest Sum | HARD | binária na resposta × DP |
| Median of Two Sorted Arrays | HARD | merge até o meio × busca do corte |
| Find Minimum in Rotated Sorted Array II | HARD | caso comum × pior caso (`hi--`) |

- **lo / mid / hi:** os três ponteiros aparecem sob o array, e a metade descartada fica apagada.
- **Binária na resposta:** quando não há array ordenado, busca o menor valor que passa num teste monotônico.

## Modelo de memória

Os endereços são ilustrativos, para mostrar como os dados ficariam numa memória contígua (como em C ou num
`Int32Array`):

- **Heap:** a partir de `0x7F00A000`, 4 bytes por célula, matrizes em row-major. Células nunca escritas
  aparecem como lixo (`░░`).
- **Fila da BFS:** a partir de `0x7F00B000`, 8 bytes por item.
- **Call stack:** a partir de `0x7FFE1000`, frames de 32 bytes crescendo para endereços menores.

Cores: **ciano** e **rosa** são leituras (primeira e segunda), **amarelo** é escrita, **verde** marca valores
verdadeiros, intervalos e componentes.

## Estrutura

```
index.html                 lista de desafios, com filtro por dificuldade
dp/, grafos/, ordenacao/,
busca/                     uma página por desafio, na pasta da categoria: enunciado, abas (<template>) e o render de cada aba
assets/
  style.css                tema cyberpunk e componentes visuais
  player.js                player de passos + painéis (código, registradores, memória, stack, fila, grade, grafo)
  trace.js                 listing(): código com linhas nomeadas
  <desafio>.js             listagens de código + geradores de passos de cada variação
test/
  <desafio>.test.js        corretude contra uma solução independente
  lines.test.js            toda linha nomeada é visitada
```

Cada `assets/<desafio>.js` roda no navegador (como globais) e no Node (`module.exports`), por isso os mesmos
geradores alimentam a página e os testes.

### Como funciona um gerador

O código mostrado na página é declarado junto com o gerador, com nomes nas linhas:

```js
const KNAPSACK_CODE = {
  array: listing([
    ['alloc', 'const dp = Array(W + 1)'],
    ['fill',  'dp.fill(0)'],
    ['fori',  'for (let i = 1; i <= n; i++)'],
    ['forw',  '  for (let w = W; w >= peso[i]; w--)   // reverso!'],
    ['upd',   '    dp[w] = max(dp[w], dp[w - peso[i]] + valor[i])'],
    ['ret',   'return dp[W]'],
  ]),
};
```

O gerador executa o algoritmo de verdade e, a cada linha executada, guarda um snapshot referenciando a linha
pelo nome (`L.forw`), nunca pelo número. Assim, o destaque não sai de sincronia com o código:

```js
snap(L.upd, 'mensagem explicando o passo', { read: [w, w - peso], write: [w], vars: { i, w } });
```

Um snapshot é um objeto simples:

| Campo | Conteúdo |
|---|---|
| `line`, `msg` | linha ativa e explicação do passo |
| `dp` | cópia do array no heap (tabela, memo, `visto[]`, grade...) |
| `read`, `write` | índices lidos e escritos nesse passo |
| `vars` | registradores |
| `stack`, `calls`, `maxDepth`, `hits` | call stack (memo / DFS) |
| `queue`, `head`, `pushed`, `popped` | fila (BFS) |
| `cur`, `nb` | célula ou nó atual e vizinho olhado (grafos) |
| `result` | resposta, no último passo |

A página só desenha: `mountTabs({ aba: () => mountPlayer(gerador(), render) })`.

### Adicionando um desafio

1. Crie `assets/<desafio>.js` com as listagens (`listing`) e um gerador por aba.
   - Gere um passo por linha executada: laços, `if` (mesmo quando falso) e, na recursão, um passo ao chamar e
     outro quando a chamada volta.
2. Crie `<categoria>/<desafio>.html` (`dp/`, `grafos/`, `ordenacao/`, `busca/`) a partir de uma página parecida. Cada página tem enunciado, um `<template>` por aba e
   um box `.cx` de complexidade.
3. Crie `test/<desafio>.test.js` comparando com uma solução independente.
4. Adicione o desafio em `test/lines.test.js`.
5. Adicione o card em `index.html` com `data-diff="easy|medium|hard"`, na posição do seu nível.

## Contribuindo

Veja o [CONTRIBUTING.md](CONTRIBUTING.md).

## Licença

[MIT](LICENSE.md): livre para usar, copiar, modificar e distribuir, inclusive comercialmente.
