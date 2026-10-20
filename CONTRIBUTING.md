# Contribuindo com o GRID//RUNNER

Valeu pelo interesse! Contribuições são bem-vindas: novos desafios, novas variações (abas) de desafios que já
existem, correções de texto, de visual ou de bugs.

## Antes de começar

- Para algo grande (um desafio novo, uma categoria nova, mudanças no `player.js`), abra uma issue antes
  descrevendo a ideia. Assim a gente alinha o formato antes de você investir tempo.
- Correções pequenas (erro de digitação, um passo com mensagem errada) podem ir direto num pull request.

## Rodando localmente

Não há build nem dependências. Precisa só do Node 18+ para os testes.

```bash
git clone git@github.com:Xhamps/gridRunnerAlgorithms.git
cd gridRunnerAlgorithms
python3 -m http.server 8765   # → http://localhost:8765
npm test
```

Se a página continuar com a versão antiga de um arquivo de `assets/`, recarregue sem cache (**Cmd+Shift+R** /
**Ctrl+Shift+R**).

## Regras do projeto

- **Todo texto do site em português (PT-BR)**, escrito com suas próprias palavras. Enunciados, exemplos e
  restrições não devem ser copiados de sites de problemas, e o site não faz referência a eles.
- **Navegação linha a linha, sem pular etapas.** Cada linha executada gera um passo: cabeçalhos de laço, cada
  `if` (mesmo quando é falso) e, na recursão, um passo ao chamar e outro quando a chamada volta.
- Todo desafio tem uma **tag de dificuldade** (`easy`, `medium`, `hard`) e, em cada aba, um **box de
  complexidade** de tempo e espaço em Big O.
- Sem dependências e sem etapa de build: HTML, CSS e JavaScript puros.
- Siga o estilo do código ao redor: nomes, densidade de comentários, linhas referenciadas pelo nome (`L.forw`),
  nunca pelo número.

## Adicionando um desafio

O passo a passo completo, com modelos de módulo, página e teste, está em
[`.claude/skills/new-challenge/SKILL.md`](.claude/skills/new-challenge/SKILL.md). Resumindo:

1. `assets/<desafio>.js`: listagens de código (`listing`) e um gerador de passos por aba.
2. `<categoria>/<desafio>.html` (`dp/`, `grafos/`): enunciado, um `<template>` por aba, box `.cx` de complexidade.
3. `test/<desafio>.test.js`: compara cada aba com uma solução independente (força bruta, fórmula...).
4. Uma entrada em `test/lines.test.js`, que garante que toda linha do código mostrado é visitada.
5. Um card em `index.html`, na seção certa e na posição do nível (easy → medium → hard).
6. Se mudar algo descrito no `README.md` (tabela de desafios, abas), atualize o README.

## Pull requests

- `npm test` precisa passar.
- Abra cada aba que você criou ou alterou no navegador e confira que não há erros no console.
- Descreva o que mudou e, se for visual, inclua um screenshot.
- Mensagens de commit em português, no imperativo ("Adiciona Edit Distance", "Corrige passo do BFS").

## Licença

Ao contribuir, você concorda que sua contribuição será distribuída sob a [licença MIT](LICENSE.md) do projeto.
