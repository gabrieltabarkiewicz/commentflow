# Prompt — configurar e rodar o CommentFlow

## Atalho

Cole no seu agente (Claude Code, Codex, etc.) com acesso ao diretório de destino:

```text
Leia https://raw.githubusercontent.com/gabrieltabarkiewicz/commentflow/main/docs/prompts/00-setup.md e execute o setup neste diretório.
```

> A linha acima só funciona quando o repositório é **público** (o `raw.githubusercontent.com`
> exige autenticação em repo privado). Com o repo privado, clone-o e aponte para
> o arquivo local `docs/prompts/00-setup.md`.

## Prompt

Cole num agente com acesso ao diretório do projeto (ou ao repositório clonado):

```text
Configure e rode o CommentFlow neste diretório.

Contexto: app Next.js (App Router, TypeScript) + Postgres/Prisma que automatiza
comentários do Instagram (resposta pública + comentário→DM + fluxos multi-passo
com quick replies) usando a API oficial da Meta. Leia, nesta ordem: README.md,
docs/setup.md, docs/architecture.md, AGENTS.md e PRODUCT.md.

Faça:
1. Verifique o ambiente (Docker, ou Node 22.19+ e Postgres). Prefira Docker.
2. Crie o .env a partir de .env.example. Gere IG_VERIFY_TOKEN e ENCRYPTION_KEY
   aleatórios. Peça ao usuário META_APP_ID, META_APP_SECRET e a URL pública do
   túnel (para META_REDIRECT_URI). Não invente segredos nem os exponha.
3. Suba com `docker compose up --build` (aplica migrations) ou, sem Docker,
   `npm install && npm run prisma:migrate && npm run dev`.
4. Valide: landing em / e painel em /app carregam; o webhook responde ao
   handshake GET. Não conecte contas reais nem dispare mensagens sem o OK do
   usuário.
5. Relate: comando para rodar, URLs, pendências e a próxima tarefa.

Restrições: somente APIs oficiais; não copiar/clonar produtos de terceiros; não
versionar segredos; respeitar os Termos da Meta. Peça apenas o que for
indispensável; siga o guia humano em docs/GUIA.md quando precisar de detalhe.
```

> Este prompt executa o setup e as validações locais. Para o passo a passo
> manual (criar o app na Meta, túnel, conectar conta, testar botões), use o
> [GUIA.md](../GUIA.md).
