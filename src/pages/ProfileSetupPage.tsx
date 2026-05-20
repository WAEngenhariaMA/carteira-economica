import { LogOut } from "lucide-react";
import { ProfileSetupForm } from "../components/forms/ProfileSetupForm";

export function ProfileSetupPage({
  onSubmit,
  onLogout,
}: {
  onSubmit: Parameters<typeof ProfileSetupForm>[0]["onSubmit"];
  onLogout: () => Promise<void>;
}) {
  return (
    <main className="auth-shell">
      <section className="auth-panel wide">
        <div className="brand auth-brand">
          <div className="brand-mark">CE</div>
          <div>
            <strong>Cadastro financeiro inicial</strong>
            <span>Crie o perfil antes de carregar o painel, importações e diagnósticos.</span>
          </div>
          <button className="ghost-button auth-logout-button" type="button" onClick={onLogout} aria-label="Sair e entrar com outra conta">
            <LogOut size={17} />
            Sair
          </button>
        </div>
        <ProfileSetupForm onSubmit={onSubmit} />
      </section>
    </main>
  );
}
