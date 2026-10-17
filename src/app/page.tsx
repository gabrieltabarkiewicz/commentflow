import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

async function getData() {
  try {
    const [flows, logs, events] = await Promise.all([
      prisma.flow.findMany({ orderBy: { createdAt: "desc" } }),
      prisma.activityLog.findMany({ orderBy: { createdAt: "desc" }, take: 20 }),
      prisma.commentEvent.count(),
    ]);
    return { flows, logs, events, error: null as string | null };
  } catch (e) {
    return {
      flows: [],
      logs: [],
      events: 0,
      error: (e as Error).message,
    };
  }
}

export default async function Home() {
  const { flows, logs, events, error } = await getData();

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
          Rode <span className="mono">npm run prisma:migrate</span> depois de
          configurar o <span className="mono">DATABASE_URL</span>.
        </div>
      )}

      <div className="card">
        <div className="row">
          <strong>{flows.length}</strong>
          <span className="muted">fluxos</span>
        </div>
      </div>
      <div className="card">
        <div className="row">
          <strong>{events}</strong>
          <span className="muted">comentários recebidos</span>
        </div>
      </div>

      <div className="section-title">Fluxos</div>
      {flows.length === 0 && (
        <p className="muted">
          Nenhum fluxo ainda. Crie um via{" "}
          <span className="mono">POST /api/flows</span> (veja o README).
        </p>
      )}
      {flows.map((f) => (
        <div className="card" key={f.id}>
          <div className="row">
            <strong>{f.name}</strong>
            <span className={`pill ${f.enabled ? "on" : ""}`}>
              {f.enabled ? "ativo" : "inativo"}
            </span>
          </div>
          <p className="muted">
            {f.scope === "ALL_POSTS" ? "Todos os posts" : `Post ${f.mediaId}`} ·{" "}
            {f.matchType === "ANY"
              ? "qualquer comentário"
              : `palavras: ${f.keywords.join(", ")}`}
            {f.dmMessage ? " · com DM" : ""}
          </p>
        </div>
      ))}

      <div className="section-title">Atividade recente</div>
      {logs.length === 0 && <p className="muted">Sem atividade ainda.</p>}
      {logs.map((l) => (
        <div className="card" key={l.id}>
          <div className="row">
            <span className="mono">{l.type}</span>
            <span className="muted">{l.createdAt.toISOString()}</span>
          </div>
        </div>
      ))}
    </main>
  );
}
