import { prisma } from "@/lib/db";
import { FlowsManager, type FlowDTO } from "@/components/FlowsManager";
import { ConnectionPanel, type AccountDTO } from "@/components/ConnectionPanel";

export const dynamic = "force-dynamic";

async function getData() {
  try {
    const [flowsRaw, accountsRaw, logs, events] = await Promise.all([
      prisma.flow.findMany({ orderBy: { createdAt: "desc" } }),
      prisma.account.findMany({ orderBy: { createdAt: "desc" } }),
      prisma.activityLog.findMany({ orderBy: { createdAt: "desc" }, take: 20 }),
      prisma.commentEvent.count(),
    ]);
    const flows: FlowDTO[] = flowsRaw.map((f) => ({
      id: f.id,
      name: f.name,
      enabled: f.enabled,
      scope: f.scope,
      mediaId: f.mediaId,
      matchType: f.matchType,
      keywords: f.keywords,
      publicReplies: f.publicReplies,
      dmMessage: f.dmMessage,
    }));
    const accounts: AccountDTO[] = accountsRaw.map((a) => ({
      id: a.id,
      igUserId: a.igUserId,
      username: a.username,
      connected: Boolean(a.accessToken),
    }));
    const activity = logs.map((l) => ({
      id: l.id,
      type: l.type,
      createdAt: l.createdAt.toISOString(),
    }));
    return { flows, accounts, activity, events, error: null as string | null };
  } catch (e) {
    return {
      flows: [] as FlowDTO[],
      accounts: [] as AccountDTO[],
      activity: [] as { id: string; type: string; createdAt: string }[],
      events: 0,
      error: (e as Error).message,
    };
  }
}

function metaNotice(meta: string | undefined) {
  if (!meta) return null;
  if (meta.startsWith("conectado:")) {
    const n = meta.split(":")[1] ?? "1";
    return { ok: true, text: `✅ ${n} conta(s) conectada(s) com sucesso.` };
  }
  return {
    ok: false,
    text: `⚠️ Não foi possível conectar — ${meta.replace(/^erro:/, "")}`,
  };
}

export default async function AppHome({
  searchParams,
}: {
  searchParams: Promise<{ meta?: string }>;
}) {
  const { flows, accounts, activity, events, error } = await getData();
  const sp = await searchParams;
  const notice = metaNotice(sp.meta);

  return (
    <>
      <h1>Visão geral</h1>
      <p className="subtitle">
        Gerencie conexões e fluxos de automação de comentários.
      </p>

      {notice && (
        <div
          className="card"
          style={{
            borderColor: notice.ok ? "var(--ok)" : "var(--err)",
            color: notice.ok ? "var(--ok)" : "var(--err)",
          }}
        >
          {notice.text}
        </div>
      )}

      {error && (
        <div className="banner">
          Banco indisponível: {error}
          <br />
          Rode <span className="mono">npm run prisma:migrate</span> (ou{" "}
          <span className="mono">docker compose up</span>) depois de configurar o{" "}
          <span className="mono">DATABASE_URL</span>.
        </div>
      )}

      <div id="visao" className="stats">
        <div className="card stat">
          <strong>{flows.length}</strong>
          <span className="muted">fluxos</span>
        </div>
        <div className="card stat">
          <strong>{events}</strong>
          <span className="muted">comentários recebidos</span>
        </div>
      </div>

      <div id="conexao">
        <ConnectionPanel accounts={accounts} />
      </div>

      <div id="fluxos">
        <FlowsManager initialFlows={flows} />
      </div>

      <div id="atividade">
        <div className="section-title">Atividade recente</div>
        {activity.length === 0 && <p className="muted">Sem atividade ainda.</p>}
        {activity.map((l) => (
          <div className="card" key={l.id}>
            <div className="row">
              <span className="mono">{l.type}</span>
              <span className="muted">{l.createdAt}</span>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
