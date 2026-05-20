import { useState } from "react";
import { ShieldCheck } from "lucide-react";
import { useAuth } from "../hooks/useAuth";

type AuthMode = "login" | "signup" | "reset";

export function AuthPage() {
  const auth = useAuth();
  const [mode, setMode] = useState<AuthMode>("login");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");
    setMessage("");

    try {
      if (mode === "login") {
        await auth.signIn(email, password);
      }
      if (mode === "signup") {
        await auth.signUp(email, password, fullName);
        setMessage("Cadastro criado. Confirme seu e-mail antes de acessar.");
      }
      if (mode === "reset") {
        await auth.resetPassword(email);
        setMessage("Enviamos um link de redefinição para seu e-mail.");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Falha na autenticação");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="auth-shell">
      <section className="auth-panel">
        <div className="brand auth-brand">
          <div className="brand-mark">CE</div>
          <div>
            <strong>Carteira Econômica IA</strong>
            <span>Plataforma profissional de inteligência financeira</span>
          </div>
        </div>
        <div className="auth-copy">
          <ShieldCheck size={34} />
          <h1>{mode === "login" ? "Acesse sua central financeira" : mode === "signup" ? "Crie sua conta" : "Redefina sua senha"}</h1>
          <p>Autenticação via Supabase Auth, sessão protegida e dados isolados por RLS.</p>
        </div>
        <form className="auth-form" onSubmit={handleSubmit}>
          {mode === "signup" && (
            <label>
              Nome
              <input value={fullName} onChange={(event) => setFullName(event.target.value)} required />
            </label>
          )}
          <label>
            E-mail
            <input value={email} type="email" onChange={(event) => setEmail(event.target.value)} required />
          </label>
          {mode !== "reset" && (
            <label>
              Senha
              <input value={password} type="password" minLength={8} onChange={(event) => setPassword(event.target.value)} required />
            </label>
          )}
          {error && <p className="form-error">{error}</p>}
          {message && <p className="form-success">{message}</p>}
          <button className="primary-button" type="submit" disabled={loading}>
            {loading ? "Processando..." : mode === "login" ? "Entrar" : mode === "signup" ? "Cadastrar" : "Enviar link"}
          </button>
        </form>
        <div className="auth-switch">
          <button type="button" onClick={() => setMode("login")}>Entrar</button>
          <button type="button" onClick={() => setMode("signup")}>Cadastro</button>
          <button type="button" onClick={() => setMode("reset")}>Esqueci a senha</button>
        </div>
      </section>
    </main>
  );
}
