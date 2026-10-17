import { prisma } from "@/lib/db";
import { FlowsManager, type FlowDTO } from "@/components/FlowsManager";

export const dynamic = "force-dynamic";

async function getData() {
  try {
    const [flowsRaw, logs, events] = await Promise.all([
      prisma.flow.findMany({ orderBy: { createdAt: "desc" } }),
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
    const activity = logs.map((l) => ({
      id: l.id,
      type: l.type,
      createdAt: l.createdAt.toISOString(),
    }));
    return { flows, activity, events, error: null as string | null };
  } catch (e) {
    return {
      flows: [] as FlowDTO[],
      activity: [] as { id: string; type: string; createdAt: string }[],
      events: 0,
      error: (e as Error).message,
    };
  }
}

export default async function Home() {
  const { flows, activity, events, error } = await getData();

  return (
    <main className="container">
      <h1>CommentFlow</h1>
      <p className="subtitle">
        Automação de comentários do Instagram via API oficial da Meta.
      </p>

      {error && (
        <div className="banner">
          Banco indisponível: {error}
          <br />
          Rode <span className="mono">npm run prisma:migrate</span> (ou{" "}
          <span className="mono">docker compose up</span>) depois de configurar o{" "}
          <span className="mono">DATABASE_URL</span>.
        </div>
      )}

      <div className="stats">
        <div className="card stat">
          <strong>{flows.length}</strong>
          <span className="muted">fluxos</span>
        </div>
        <div className="card stat">
          <strong>{events}</strong>
          <span className="muted">comentários recebidos</span>
        </div>
      </div>

      <FlowsManager initialFlows={flows} />

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
    </main>
  );
}
