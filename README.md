# CommentFlow

Automação de comentários do **Instagram** via **API oficial da Meta** (Instagram
Graph API). Quando alguém comenta num post, o CommentFlow pode responder
publicamente e/ou enviar uma DM (private reply) — tudo dentro das APIs oficiais.

> Projeto autoral. Não é afiliado, não copia nem redistribui nenhum produto de
> terceiros.

---

## 🚀 Rodar (1 comando, com Docker)

Pré-requisito único: **Docker Desktop** instalado. Não precisa de Node nem
Postgres na máquina — o Compose sobe tudo (app + banco) e aplica as migrations
sozinho.

```bash
# 1. clonar
git clone <URL-DO-SEU-REPO> commentflow
cd commentflow

# 2. criar o .env (preencher as credenciais da Meta)
cp .env.example .env     # no Windows: copy .env.example .env

# 3. subir a plataforma
docker compose up --build
```

Pronto: painel em **http://localhost:3000** e webhook em
**http://localhost:3000/api/webhooks/instagram**.

Para expor o webhook pra Meta (que precisa de HTTPS público), use um túnel:

```bash
cloudflared tunnel --url http://localhost:3000
# ou: ngrok http 3000
```

## 🧩 O que preencher no `.env`

| Variável          | O que é                                                                 |
| ----------------- | ----------------------------------------------------------------------- |
| `META_APP_SECRET` | App secret do app na Meta (valida a assinatura `X-Hub-Signature-256`).  |
| `IG_VERIFY_TOKEN` | String aleatória que você escolhe; a mesma vai no webhook da Meta.      |
| `IG_ACCESS_TOKEN` | Token com `instagram_manage_comments` + `instagram_manage_messages`.    |
| `IG_USER_ID`      | Id da sua conta IG Business (remetente da DM no comentário→DM).          |
| `GRAPH_API_VERSION` | Versão da Graph API (padrão `v21.0`).                                 |
| `DATABASE_URL`    | No Docker é definido automaticamente; só importa pra rodar sem Docker.  |

## ⚙️ Pré-requisitos na Meta (API oficial)

1. Conta **Instagram Business/Creator** ligada a uma **Página do Facebook**.
2. App no **[Meta for Developers](https://developers.facebook.com/)** com o
   produto *Instagram* + webhooks.
3. Permissões: `instagram_basic`, `instagram_manage_comments`,
   `instagram_manage_messages`, `pages_manage_metadata`.
   - Em **modo de desenvolvedor** dá pra testar na própria conta sem App Review.
4. No painel do app, configure o webhook do Instagram:
   - **Callback URL:** `https://SEU-TUNEL/api/webhooks/instagram`
   - **Verify token:** o mesmo valor de `IG_VERIFY_TOKEN`
   - Assine o campo **`comments`**.

## 🧪 Criar um fluxo

No painel (`http://localhost:3000`) use **“+ Novo fluxo”** para criar, editar,
ativar/desativar e excluir fluxos — sem linha de comando.

Se preferir, a API continua disponível:

```bash
curl -X POST http://localhost:3000/api/flows \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Sorteio",
    "scope": "ALL_POSTS",
    "matchType": "KEYWORD",
    "keywords": ["eu quero", "quero"],
    "publicReplies": ["Te mandei no direct! 💜", "Olha seu DM 👀"],
    "dmMessage": "Oi! Aqui está o link que você pediu: https://seu-link.com"
  }'
```

Comente uma das palavras-chave num post seu → o CommentFlow responde o
comentário e manda a DM.

---

## 🖥️ Rodar sem Docker (opcional)

Precisa de **Node.js 22.19+** e **PostgreSQL** locais.

```bash
npm install
cp .env.example .env     # ajuste o DATABASE_URL para o seu Postgres
npm run prisma:migrate   # cria as tabelas
npm run dev
```

## 🏗️ Stack

- **Next.js** (App Router, TypeScript) — painel + rotas de API/webhook
- **PostgreSQL + Prisma** — persistência (migration inicial já incluída)
- **Zod** — validação de entrada
- **Docker Compose** — app + banco prontos pra subir

## 📂 Estrutura

```
src/
  app/
    api/
      webhooks/instagram/route.ts   # verificação (GET) + ingestão (POST)
      flows/route.ts                # CRUD de fluxos (GET/POST)
    page.tsx                        # dashboard
    layout.tsx
    globals.css
  lib/
    db.ts              # Prisma client
    env.ts             # variáveis de ambiente
    signature.ts       # verificação X-Hub-Signature-256
    meta.ts            # chamadas à Graph API (reply + DM)
    processComment.ts  # match + ações + dedup
prisma/
  schema.prisma
  migrations/          # migration inicial (migrate deploy)
Dockerfile
docker-compose.yml
```

## 🗺️ Roadmap

- [x] Editor de fluxos no painel (criar/editar/ativar/excluir)
- [ ] OAuth da Meta no painel (conectar conta sem colar token na mão)
- [ ] Quick replies encadeados / nós visuais no editor
- [ ] Fila (BullMQ/Redis) com rate-limit e retry
- [ ] Multiconta e multiusuário
- [ ] Broadcast e segmentação por tags

## ⚖️ Uso responsável

Use dentro dos Termos da Meta e das plataformas. Respeite limites de API,
consentimento dos usuários e políticas de spam.
