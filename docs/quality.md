# Qualidade

## Estado atual (honesto)
O projeto foi escrito com cuidado, mas **ainda não foi compilado nem executado**
no ambiente de criação (o ambiente bloqueia instalar dependências). A primeira
execução (`docker compose up --build` ou `npm run dev`) é a verificação real.
Reporte qualquer erro de build/typecheck que aparecer — é esperado ajustar.

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
