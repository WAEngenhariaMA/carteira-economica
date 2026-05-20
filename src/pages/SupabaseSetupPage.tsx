import { Database } from "lucide-react";

export function SupabaseSetupPage() {
  return (
    <main className="auth-shell">
      <section className="auth-panel">
        <div className="brand auth-brand">
          <div className="brand-mark">CE</div>
          <div>
            <strong>Carteira Econômica IA</strong>
            <span>Configuração obrigatória de produto</span>
          </div>
        </div>
        <div className="auth-copy">
          <Database size={36} />
          <h1>Supabase não configurado</h1>
          <p>Para operar como sistema profissional, configure as variáveis de ambiente e execute o schema SQL.</p>
        </div>
        <div className="setup-steps">
          <code>VITE_SUPABASE_URL=https://seu-projeto.supabase.co</code>
          <code>VITE_SUPABASE_ANON_KEY=sua-chave-anon</code>
          <span>Depois rode `supabase/schema.sql` no SQL Editor do Supabase.</span>
        </div>
      </section>
    </main>
  );
}
