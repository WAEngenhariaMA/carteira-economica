import { ProfileSetupForm } from "../components/forms/ProfileSetupForm";

export function ProfileSetupPage({
  onSubmit,
}: {
  onSubmit: Parameters<typeof ProfileSetupForm>[0]["onSubmit"];
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
        </div>
        <ProfileSetupForm onSubmit={onSubmit} />
      </section>
    </main>
  );
}
