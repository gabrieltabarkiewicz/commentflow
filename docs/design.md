# Design

## Princípios
Interface escura, limpa e direta; foco em deixar o operador criar um fluxo e
conectar a conta em poucos cliques.

## Identidade
- Marca: **CommentFlow**.
- Cor principal: roxo (`--accent: #7c5cff`).
- Tema escuro por padrão; superfícies planas, bordas de 1px, cantos
  arredondados (12px nos cards).
- Tokens de cor em `src/app/globals.css` (`--bg`, `--card`, `--border`,
  `--text`, `--muted`, `--accent`, `--ok`, `--err`).

## Superfícies
- **Landing (`/`)**: hero, como funciona (3 passos), recursos, métricas,
  preços (placeholders), FAQ, CTA e rodapé. Objetivo: explicar e converter.
- **Painel (`/app`)**: shell com sidebar + topo; seções Visão geral, Conexão,
  Fluxos e Atividade. Objetivo: operar.

## Componentes
- `FlowsManager` — lista e editor de fluxos (DM simples ou fluxo com botões).
- `ConnectionPanel` — conectar/desconectar contas e status.

## Acessibilidade e responsivo
- Layout responsivo (grid colapsa no mobile; sidebar vira barra).
- Contraste alto no tema escuro; evitar texto abaixo de 13px.

## Originalidade
Design e textos são próprios do CommentFlow. A estrutura segue padrões comuns
de SaaS, sem copiar identidade visual, textos ou marca de terceiros.
