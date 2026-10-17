# Onboarding

## Para rodar e testar (passo a passo completo)
Veja o **[GUIA.md](GUIA.md)** — feito para quem nunca fez isso: instala o
Docker, configura o app na Meta, liga e testa os botões do fluxo.

## Para desenvolver (resumo)
1. Node 22.19+ e Postgres (ou só Docker).
2. `npm install`
3. `cp .env.example .env` e preencher (veja a tabela no [README](../README.md)).
4. `npm run prisma:migrate` (cria as tabelas).
5. `npm run dev` → http://localhost:3000 (landing) e `/app` (painel).

## Onde mexer
- Lógica de automação: `src/lib/processComment.ts`, `src/lib/processMessaging.ts`.
- Chamadas à Meta: `src/lib/meta.ts`.
- Editor de fluxos: `src/components/FlowsManager.tsx`.
- Modelo de dados: `prisma/schema.prisma` (+ nova migration ao mudar o schema).

## Convenções
Veja [AGENTS.md](../AGENTS.md) (comandos, convenções, fronteiras, segurança).
