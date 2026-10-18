# Qualidade

## Estado atual

Verificado em 2026-10-18 (servidor de produção local, sem Docker):
- `npm install` + `npx prisma generate`: OK.
- `npx tsc --noEmit` (typecheck): **sem erros**.
- `npm run build` (Next 15): **OK** — compilou, lint/type-check passaram, 4
  páginas geradas, todas as rotas presentes.
- Smoke test runtime: `GET /` → 200; `GET /app` → 200 (resiliente sem banco);
  webhook verify → 200 com token correto e 403 com errado; `POST` sem
  assinatura → 401; OAuth login sem `META_APP_ID` → 500.

Ainda **não testado com dados reais** (Postgres + conta Meta) — isso exige suas
credenciais. A validação de ponta a ponta (conectar conta, comentar, tocar no
botão) segue o [GUIA.md](GUIA.md).

### Vulnerabilidades (npm audit)
5 avisos (1 moderada, 4 altas) em dependências de **build** do toolchain do Next
(ex.: PostCSS, leitura de source maps). `npm audit fix` não resolve sem
`--force` (que troca versões major e pode quebrar o Next). Baixo risco em
runtime; reavaliar quando o Next atualizar o toolchain.

## Como verificar
1. **Build/typecheck:** `npm install` e `npm run build` (ou `npx tsc --noEmit`).
2. **Subir tudo:** `docker compose up --build` — deve aplicar a migration e
   servir `/` e `/app`.
3. **Ponta a ponta:** siga o [GUIA.md](GUIA.md) — conectar conta, criar fluxo
   com botões, comentar a palavra-chave, tocar no botão, conferir o log.

## Checklist de aceitação
- [ ] `npm run build` passa sem erros de tipo.
- [ ] `docker compose up` sobe app + banco e aplica a migration.
- [ ] Landing (`/`) e painel (`/app`) carregam.
- [ ] OAuth conecta a conta e salva o token (criptografado).
- [ ] Comentário dispara resposta pública + DM.
- [ ] Botão da DM entrega o passo seguinte.
- [ ] Ações aparecem em Atividade.

## Próximos passos de qualidade
- Testes automatizados (Vitest) para `processComment`, `processMessaging`,
  `signature` e `crypto`.
- Lint/format (ESLint/Prettier) e typecheck no CI.
- Fila com retry/rate-limit e testes de limites da API.
