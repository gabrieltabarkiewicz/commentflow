import Link from "next/link";

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="shell">
      <aside className="sidebar">
        <div className="sidebar-brand">
          <span className="brand-dot" /> CommentFlow
        </div>
        <nav className="sidebar-nav">
          <a href="#visao">Visão geral</a>
          <a href="#conexao">Conexão</a>
          <a href="#fluxos">Fluxos</a>
          <a href="#atividade">Atividade</a>
        </nav>
        <Link className="sidebar-back" href="/">
          ← Voltar ao site
        </Link>
      </aside>

      <div className="panel-main">
        <header className="topbar">
          <strong>Painel</strong>
          <a className="btn btn-sm" href="/api/auth/meta/login">
            Conectar Instagram
          </a>
        </header>
        <div className="panel-content">{children}</div>
      </div>
    </div>
  );
}
