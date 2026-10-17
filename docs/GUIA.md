# Guia passo a passo — ligar e testar o CommentFlow

Feito pra quem nunca fez isso. Siga na ordem. Tempo estimado: 30–45 min
(a maior parte é configurar o app na Meta).

Legenda: 🖥️ = no seu computador · 🌐 = no site da Meta · ✅ = checagem.

---

## Parte 0 — O que você vai precisar

1. Uma conta **Instagram Profissional** (Business ou Creator).
2. Uma **Página do Facebook** ligada a esse Instagram.
3. **Docker Desktop** instalado (é o jeito mais fácil: sobe o app + o banco
   com um comando). Baixe em https://www.docker.com/products/docker-desktop/
4. O código do CommentFlow na sua máquina.

> Por que Docker? Porque você não precisa instalar Node nem Postgres na mão —
> o Docker cuida de tudo.

---

## Parte 1 — Deixar o Instagram pronto 🌐

1. No app do Instagram: **Configurações → Conta → Mudar para conta
   profissional** (Business ou Creator).
2. Ligue essa conta a uma **Página do Facebook** (o próprio Instagram pede isso
   no processo, ou faça pelo Facebook em "Configurações da Página → Instagram").

✅ Você tem: um Instagram profissional + uma Página do Facebook conectada.

---

## Parte 2 — Criar o app na Meta 🌐

1. Entre em https://developers.facebook.com/ e faça login.
2. **Meus apps → Criar app**. Tipo: escolha **"Outro" → Empresa** (Business).
3. Dentro do app, adicione os **produtos** (menu lateral "Adicionar produto"):
   - **Instagram**
   - **Webhooks**
   - **Login do Facebook para Empresas** (Facebook Login for Business)
4. Em **Configurações → Básico**, copie o **ID do app** e a
   **Chave secreta do app** (App Secret). Guarde — vão no `.env`.

✅ Você tem: App ID e App Secret.

> Deixe essa aba da Meta aberta — você volta nela na Parte 5.

---

## Parte 3 — Gerar as chaves locais 🖥️

Abra o terminal (PowerShell) na pasta do projeto e gere dois valores aleatórios:

Token de verificação do webhook (qualquer string; use este gerador):

```bash
node -e "console.log(require('crypto').randomBytes(16).toString('hex'))"
```

Chave de criptografia dos tokens:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

Copie os dois resultados — já já colamos no `.env`.

---

## Parte 4 — Configurar o `.env` 🖥️

1. Na pasta do projeto, copie o exemplo:

```bash
copy .env.example .env
```

2. Abra o `.env` num editor e preencha:

```
META_APP_ID="cole aqui o ID do app"
META_APP_SECRET="cole aqui a chave secreta"
IG_VERIFY_TOKEN="cole aqui o primeiro valor gerado"
ENCRYPTION_KEY="cole aqui o segundo valor gerado"
```

O `META_REDIRECT_URI` a gente preenche na Parte 5 (depois de ter o túnel).
Deixe `IG_ACCESS_TOKEN` e `IG_USER_ID` vazios (vamos conectar pelo OAuth).

---

## Parte 5 — Expor seu computador pra internet (túnel) 🖥️🌐

A Meta precisa "alcançar" seu computador por um endereço público (https). Um
túnel faz isso. Opção simples: **cloudflared**.

1. Suba o app primeiro (Parte 6) OU deixe o túnel pronto agora apontando pra
   porta 3000. Com o cloudflared instalado:

```bash
cloudflared tunnel --url http://localhost:3000
```

2. Ele imprime uma URL tipo `https://algo-aleatorio.trycloudflare.com`.
   **Essa é a sua URL pública.** Copie.

3. No `.env`, preencha:

```
META_REDIRECT_URI="https://algo-aleatorio.trycloudflare.com/api/auth/meta/callback"
```

4. 🌐 Na Meta, em **Login do Facebook para Empresas → Configurações**, no campo
   **URIs de redirecionamento do OAuth válidos**, cole a mesma URL:
   `https://algo-aleatorio.trycloudflare.com/api/auth/meta/callback`

5. 🌐 Na Meta, em **Webhooks** (ou Instagram → Configuração de webhooks):
   - **URL de callback:** `https://algo-aleatorio.trycloudflare.com/api/webhooks/instagram`
   - **Token de verificação:** o mesmo `IG_VERIFY_TOKEN` do `.env`
   - Clique em **Verificar e salvar**.
   - Depois, **assine (subscribe)** os campos **`comments`** e **`messages`**.

> ⚠️ A URL grátis do cloudflared **muda** cada vez que você reinicia o túnel. Se
> mudar, atualize nos 3 lugares (`.env`, redirect do OAuth, URL do webhook) e
> reinicie o app. Pra algo fixo, use um túnel com domínio reservado (ngrok pago
> ou cloudflare tunnel nomeado).

✅ Você tem: URL pública nos 3 lugares e o `.env` completo.

---

## Parte 6 — Ligar o projeto 🖥️

Na pasta do projeto, com o Docker Desktop aberto:

```bash
docker compose up --build
```

Na primeira vez demora um pouco (baixa e monta tudo). Quando aparecer que o
servidor está pronto:

- **Site (landing):** http://localhost:3000
- **Painel:** http://localhost:3000/app

✅ Abra o painel e veja a tela com "Visão geral", "Conexão" e "Fluxos".

> Parar: `Ctrl + C` no terminal. Ligar de novo: `docker compose up` (sem
> `--build`, a não ser que você mude o código).

---

## Parte 7 — Conectar sua conta 🖥️

1. No painel (`/app`), clique em **Conectar Instagram**.
2. Faça login no Facebook e **autorize** as permissões.
3. Você volta pro painel com a mensagem verde "conta(s) conectada(s)".

✅ Em "Conexão" aparece sua conta com a tag **conectado**.

---

## Parte 8 — Criar um fluxo com botões 🖥️

1. Em "Fluxos", clique **+ Novo fluxo**.
2. Preencha:
   - **Nome:** Teste
   - **Gatilho:** Todos os posts
   - **Condição:** Palavra-chave → escreva `quero` (uma por linha)
   - **Respostas públicas:** `Te mandei no direct! 💜`
   - **Mensagem no Direct:** escolha **Fluxo com botões (quick replies)**
3. Em "Passos do fluxo", clique **+ Adicionar passo** e monte, por exemplo:
   - **Passo 1 (Início):** "Oi! Quer receber o link?"
     - Botão: `Quero!` → aponta pra **Passo 2**
     - Botão: `Agora não` → aponta pra **Passo 3**
   - **Passo 2:** "Aqui está: https://seu-link.com"
   - **Passo 3:** "Tranquilo! Qualquer coisa é só comentar. 👋"

   (Adicione os passos primeiro; depois volte nos botões e selecione o destino.)
4. Deixe **Ativo** marcado e clique **Criar fluxo**.

✅ O fluxo aparece na lista como "ativo · fluxo de 3 passos".

---

## Parte 9 — Testar de verdade 🖥️📱

1. Com **outra conta** (peça pra um amigo, ou use uma conta sua diferente),
   comente a palavra **quero** num post da sua conta profissional.
2. Em alguns segundos:
   - aparece a **resposta pública** no comentário;
   - chega a **DM do Passo 1** com os botões **Quero!** e **Agora não**.
3. Toque em **Quero!** → chega a mensagem do **Passo 2** (o link).
4. No painel, em **Atividade recente**, aparecem os registros
   (`public_reply`, `dm_flow`, `dm_step`).

✅ Se os 4 itens acima acontecerem, está tudo funcionando.

---

## Parte 10 — Se algo não funcionar 🔧

- **O webhook não verifica (erro ao salvar na Meta):** o `IG_VERIFY_TOKEN` do
  `.env` tem que ser idêntico ao digitado na Meta, e o app precisa estar no ar
  (Parte 6) com o túnel ativo apontando pra porta 3000.
- **Erro de "redirect URI" ao conectar:** a URL em **Login do Facebook →
  redirecionamentos válidos** tem que ser **exatamente** igual à do
  `META_REDIRECT_URI` (mesma URL do túnel, terminando em
  `/api/auth/meta/callback`).
- **Os botões não respondem:** confira se você assinou o campo **`messages`** no
  webhook (não só `comments`).
- **A resposta pública sai, mas a DM não chega:** veja se as permissões
  `instagram_manage_messages` estão concedidas e se a conta que comentou pode
  receber DM. Em modo de desenvolvedor, só contas adicionadas como testadoras
  interagem.
- **"Banco indisponível" no painel:** rode `docker compose up` de novo; o
  serviço do Postgres precisa estar de pé (o Compose cuida disso).
- **A URL do túnel mudou:** atualize nos 3 lugares (`.env`, redirect do OAuth,
  webhook) e reinicie o app.

---

## Observação honesta

Este projeto foi escrito com cuidado, mas **não foi executado/testado** no
ambiente onde foi criado. A primeira execução (Parte 6) é o teste de verdade.
Se aparecer qualquer erro no terminal ou no navegador, **copie a mensagem** —
ela diz exatamente o que ajustar.
