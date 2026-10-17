"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { DmFlow } from "@/lib/flowTypes";

type Scope = "ALL_POSTS" | "SPECIFIC_POST";
type MatchType = "ANY" | "KEYWORD";
type DmMode = "simple" | "flow";

export interface FlowDTO {
  id: string;
  name: string;
  enabled: boolean;
  scope: Scope;
  mediaId: string | null;
  matchType: MatchType;
  keywords: string[];
  publicReplies: string[];
  dmMessage: string | null;
  dmFlow: DmFlow | null;
}

interface QRDraft {
  title: string;
  next: string; // step id or "" (end)
}
interface StepDraft {
  id: string;
  text: string;
  quickReplies: QRDraft[];
}

interface Draft {
  id: string | null;
  name: string;
  enabled: boolean;
  scope: Scope;
  mediaId: string;
  matchType: MatchType;
  keywords: string;
  publicReplies: string;
  dmMode: DmMode;
  dmMessage: string;
  steps: StepDraft[];
}

function emptyDraft(): Draft {
  return {
    id: null,
    name: "",
    enabled: true,
    scope: "ALL_POSTS",
    mediaId: "",
    matchType: "ANY",
    keywords: "",
    publicReplies: "",
    dmMode: "simple",
    dmMessage: "",
    steps: [],
  };
}

function stepsFromDmFlow(df: DmFlow): StepDraft[] {
  const ids = [df.entry, ...Object.keys(df.steps).filter((k) => k !== df.entry)];
  return ids
    .filter((id) => df.steps[id])
    .map((id) => ({
      id,
      text: df.steps[id].text ?? "",
      quickReplies: (df.steps[id].quickReplies ?? []).map((q) => ({
        title: q.title,
        next: q.next ?? "",
      })),
    }));
}

function toDraft(f: FlowDTO): Draft {
  const hasFlow = Boolean(f.dmFlow);
  return {
    id: f.id,
    name: f.name,
    enabled: f.enabled,
    scope: f.scope,
    mediaId: f.mediaId ?? "",
    matchType: f.matchType,
    keywords: f.keywords.join("\n"),
    publicReplies: f.publicReplies.join("\n"),
    dmMode: hasFlow ? "flow" : "simple",
    dmMessage: f.dmMessage ?? "",
    steps: hasFlow && f.dmFlow ? stepsFromDmFlow(f.dmFlow) : [],
  };
}

function lines(s: string): string[] {
  return s
    .split("\n")
    .map((x) => x.trim())
    .filter(Boolean);
}

function newStepId(steps: StepDraft[]): string {
  const ids = new Set(steps.map((s) => s.id));
  let n = 1;
  while (ids.has(`s${n}`)) n++;
  return `s${n}`;
}

export function FlowsManager({ initialFlows }: { initialFlows: FlowDTO[] }) {
  const router = useRouter();
  const [flows, setFlows] = useState<FlowDTO[]>(initialFlows);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function openNew() {
    setError(null);
    setDraft(emptyDraft());
  }
  function openEdit(f: FlowDTO) {
    setError(null);
    setDraft(toDraft(f));
  }
  function close() {
    setDraft(null);
    setError(null);
  }

  // --- step editor helpers ---
  function addStep() {
    setDraft((d) =>
      d ? { ...d, steps: [...d.steps, { id: newStepId(d.steps), text: "", quickReplies: [] }] } : d,
    );
  }
  function removeStep(i: number) {
    setDraft((d) => (d ? { ...d, steps: d.steps.filter((_, idx) => idx !== i) } : d));
  }
  function setStepText(i: number, text: string) {
    setDraft((d) =>
      d ? { ...d, steps: d.steps.map((s, idx) => (idx === i ? { ...s, text } : s)) } : d,
    );
  }
  function addQR(i: number) {
    setDraft((d) =>
      d
        ? {
            ...d,
            steps: d.steps.map((s, idx) =>
              idx === i ? { ...s, quickReplies: [...s.quickReplies, { title: "", next: "" }] } : s,
            ),
          }
        : d,
    );
  }
  function setQR(i: number, j: number, patch: Partial<QRDraft>) {
    setDraft((d) =>
      d
        ? {
            ...d,
            steps: d.steps.map((s, idx) =>
              idx === i
                ? {
                    ...s,
                    quickReplies: s.quickReplies.map((q, jdx) =>
                      jdx === j ? { ...q, ...patch } : q,
                    ),
                  }
                : s,
            ),
          }
        : d,
    );
  }
  function removeQR(i: number, j: number) {
    setDraft((d) =>
      d
        ? {
            ...d,
            steps: d.steps.map((s, idx) =>
              idx === i
                ? { ...s, quickReplies: s.quickReplies.filter((_, jdx) => jdx !== j) }
                : s,
            ),
          }
        : d,
    );
  }

  async function save() {
    if (!draft) return;
    if (!draft.name.trim()) {
      setError("Dê um nome ao fluxo.");
      return;
    }
    if (draft.dmMode === "flow" && draft.steps.length === 0) {
      setError("Adicione ao menos um passo ao fluxo.");
      return;
    }
    setSaving(true);
    setError(null);

    const dmFlow =
      draft.dmMode === "flow" && draft.steps.length > 0
        ? {
            entry: draft.steps[0].id,
            steps: Object.fromEntries(
              draft.steps.map((s) => [
                s.id,
                {
                  text: s.text,
                  quickReplies: s.quickReplies
                    .filter((q) => q.title.trim())
                    .map((q) => ({ title: q.title.trim(), next: q.next || null })),
                },
              ]),
            ),
          }
        : null;

    const payload = {
      name: draft.name.trim(),
      enabled: draft.enabled,
      scope: draft.scope,
      mediaId:
        draft.scope === "SPECIFIC_POST" ? draft.mediaId.trim() || null : null,
      matchType: draft.matchType,
      keywords: draft.matchType === "KEYWORD" ? lines(draft.keywords) : [],
      publicReplies: lines(draft.publicReplies),
      dmMessage: draft.dmMode === "simple" ? draft.dmMessage.trim() || null : null,
      dmFlow,
    };

    try {
      const res = await fetch(draft.id ? `/api/flows/${draft.id}` : "/api/flows", {
        method: draft.id ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const b = await res.json().catch(() => null);
        setError(typeof b?.error === "string" ? b.error : "Falha ao salvar.");
        return;
      }
      const saved: FlowDTO = await res.json();
      setFlows((prev) => {
        const exists = prev.some((f) => f.id === saved.id);
        return exists
          ? prev.map((f) => (f.id === saved.id ? saved : f))
          : [saved, ...prev];
      });
      setDraft(null);
      router.refresh();
    } catch (e) {
      setError(String(e));
    } finally {
      setSaving(false);
    }
  }

  async function toggle(f: FlowDTO) {
    const res = await fetch(`/api/flows/${f.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ enabled: !f.enabled }),
    });
    if (res.ok) {
      const saved: FlowDTO = await res.json();
      setFlows((prev) => prev.map((x) => (x.id === saved.id ? saved : x)));
      router.refresh();
    }
  }

  async function remove(f: FlowDTO) {
    if (!confirm(`Excluir o fluxo "${f.name}"?`)) return;
    const res = await fetch(`/api/flows/${f.id}`, { method: "DELETE" });
    if (res.ok) {
      setFlows((prev) => prev.filter((x) => x.id !== f.id));
      router.refresh();
    }
  }

  function dmSummary(f: FlowDTO): string {
    if (f.dmFlow) return ` · fluxo de ${Object.keys(f.dmFlow.steps).length} passos`;
    if (f.dmMessage) return " · com DM";
    return "";
  }

  return (
    <section>
      <div className="section-head">
        <div className="section-title" style={{ margin: 0 }}>
          Fluxos
        </div>
        {!draft && (
          <button className="btn btn-primary" onClick={openNew}>
            + Novo fluxo
          </button>
        )}
      </div>

      {draft && (
        <div className="card editor">
          <div className="field">
            <label>Nome</label>
            <input
              value={draft.name}
              onChange={(e) => setDraft({ ...draft, name: e.target.value })}
              placeholder="Ex.: Sorteio do post X"
            />
          </div>

          <div className="field-row">
            <div className="field">
              <label>Gatilho</label>
              <select
                value={draft.scope}
                onChange={(e) =>
                  setDraft({ ...draft, scope: e.target.value as Scope })
                }
              >
                <option value="ALL_POSTS">Todos os posts</option>
                <option value="SPECIFIC_POST">Post específico</option>
              </select>
            </div>
            {draft.scope === "SPECIFIC_POST" && (
              <div className="field">
                <label>Media ID do post</label>
                <input
                  value={draft.mediaId}
                  onChange={(e) =>
                    setDraft({ ...draft, mediaId: e.target.value })
                  }
                  placeholder="ID do post"
                />
              </div>
            )}
          </div>

          <div className="field">
            <label>Condição</label>
            <select
              value={draft.matchType}
              onChange={(e) =>
                setDraft({ ...draft, matchType: e.target.value as MatchType })
              }
            >
              <option value="ANY">Qualquer comentário</option>
              <option value="KEYWORD">Palavra-chave</option>
            </select>
          </div>

          {draft.matchType === "KEYWORD" && (
            <div className="field">
              <label>
                Palavras-chave <span className="hint">(uma por linha)</span>
              </label>
              <textarea
                rows={3}
                value={draft.keywords}
                onChange={(e) => setDraft({ ...draft, keywords: e.target.value })}
                placeholder={"quero\neu quero\nlink"}
              />
            </div>
          )}

          <div className="field">
            <label>
              Respostas públicas{" "}
              <span className="hint">(uma por linha; uma é sorteada)</span>
            </label>
            <textarea
              rows={3}
              value={draft.publicReplies}
              onChange={(e) =>
                setDraft({ ...draft, publicReplies: e.target.value })
              }
              placeholder={"Te mandei no direct! 💜\nOlha seu DM 👀"}
            />
          </div>

          <div className="field">
            <label>Mensagem no Direct</label>
            <select
              value={draft.dmMode}
              onChange={(e) =>
                setDraft({ ...draft, dmMode: e.target.value as DmMode })
              }
            >
              <option value="simple">DM simples (uma mensagem)</option>
              <option value="flow">Fluxo com botões (quick replies)</option>
            </select>
          </div>

          {draft.dmMode === "simple" && (
            <div className="field">
              <label>
                Texto da DM{" "}
                <span className="hint">(vazio = não envia DM)</span>
              </label>
              <textarea
                rows={3}
                value={draft.dmMessage}
                onChange={(e) =>
                  setDraft({ ...draft, dmMessage: e.target.value })
                }
                placeholder="Oi! Aqui está o link que você pediu: https://..."
              />
            </div>
          )}

          {draft.dmMode === "flow" && (
            <div className="field">
              <label>
                Passos do fluxo{" "}
                <span className="hint">(o 1º passo é a DM inicial)</span>
              </label>
              {draft.steps.map((s, i) => (
                <div className="step-card" key={s.id}>
                  <div className="step-head">
                    <span className="pill on">
                      {i === 0 ? "Início" : `Passo ${i + 1}`}
                    </span>
                    <button
                      className="btn btn-sm btn-danger"
                      onClick={() => removeStep(i)}
                    >
                      Remover passo
                    </button>
                  </div>
                  <textarea
                    rows={2}
                    value={s.text}
                    onChange={(e) => setStepText(i, e.target.value)}
                    placeholder="Mensagem deste passo"
                  />
                  {s.quickReplies.map((q, j) => (
                    <div className="qr-row" key={j}>
                      <input
                        value={q.title}
                        onChange={(e) => setQR(i, j, { title: e.target.value })}
                        placeholder="Texto do botão (máx 20)"
                        maxLength={20}
                      />
                      <select
                        value={q.next}
                        onChange={(e) => setQR(i, j, { next: e.target.value })}
                      >
                        <option value="">↳ Encerrar</option>
                        {draft.steps.map((t, idx) => (
                          <option value={t.id} key={t.id}>
                            ↳ {idx === 0 ? "Início" : `Passo ${idx + 1}`}
                          </option>
                        ))}
                      </select>
                      <button
                        className="btn btn-sm btn-danger"
                        onClick={() => removeQR(i, j)}
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                  <button className="btn btn-sm" onClick={() => addQR(i)}>
                    + botão
                  </button>
                </div>
              ))}
              <button className="btn btn-sm" onClick={addStep}>
                + Adicionar passo
              </button>
            </div>
          )}

          <label className="checkbox">
            <input
              type="checkbox"
              checked={draft.enabled}
              onChange={(e) => setDraft({ ...draft, enabled: e.target.checked })}
            />
            Ativo
          </label>

          {error && <div className="form-error">{error}</div>}

          <div className="editor-actions">
            <button className="btn btn-primary" disabled={saving} onClick={save}>
              {saving
                ? "Salvando..."
                : draft.id
                  ? "Salvar alterações"
                  : "Criar fluxo"}
            </button>
            <button className="btn" disabled={saving} onClick={close}>
              Cancelar
            </button>
          </div>
        </div>
      )}

      {flows.length === 0 && !draft && (
        <p className="muted">Nenhum fluxo ainda. Clique em “Novo fluxo”.</p>
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
            {f.scope === "ALL_POSTS"
              ? "Todos os posts"
              : `Post ${f.mediaId ?? "?"}`}{" "}
            ·{" "}
            {f.matchType === "ANY"
              ? "qualquer comentário"
              : `palavras: ${f.keywords.join(", ") || "—"}`}
            {dmSummary(f)}
          </p>
          <div className="card-actions">
            <button className="btn btn-sm" onClick={() => toggle(f)}>
              {f.enabled ? "Desativar" : "Ativar"}
            </button>
            <button className="btn btn-sm" onClick={() => openEdit(f)}>
              Editar
            </button>
            <button className="btn btn-sm btn-danger" onClick={() => remove(f)}>
              Excluir
            </button>
          </div>
        </div>
      ))}
    </section>
  );
}
