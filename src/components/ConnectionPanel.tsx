"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export interface AccountDTO {
  id: string;
  igUserId: string;
  username: string | null;
  connected: boolean;
}

export function ConnectionPanel({ accounts }: { accounts: AccountDTO[] }) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);

  async function disconnect(id: string) {
    if (!confirm("Desconectar esta conta?")) return;
    setBusy(id);
    const res = await fetch(`/api/accounts/${id}`, { method: "DELETE" });
    setBusy(null);
    if (res.ok) router.refresh();
  }

  return (
    <section>
      <div className="section-head">
        <div className="section-title" style={{ margin: 0 }}>
          Conexão
        </div>
        <a className="btn btn-primary" href="/api/auth/meta/login">
          {accounts.length ? "Conectar outra conta" : "Conectar Instagram"}
        </a>
      </div>

      {accounts.length === 0 && (
        <p className="muted">
          Nenhuma conta conectada. Clique em “Conectar Instagram” para autorizar
          pelo Facebook — sem colar token na mão.
        </p>
      )}

      {accounts.map((a) => (
        <div className="card" key={a.id}>
          <div className="row">
            <strong>@{a.username ?? a.igUserId}</strong>
            <span className={`pill ${a.connected ? "on" : ""}`}>
              {a.connected ? "conectado" : "sem token"}
            </span>
          </div>
          <p className="muted mono">IG ID: {a.igUserId}</p>
          <div className="card-actions">
            <button
              className="btn btn-sm btn-danger"
              disabled={busy === a.id}
              onClick={() => disconnect(a.id)}
            >
              {busy === a.id ? "..." : "Desconectar"}
            </button>
          </div>
        </div>
      ))}
    </section>
  );
}
