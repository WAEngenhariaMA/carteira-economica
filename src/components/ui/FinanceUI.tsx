import clsx from "clsx";
import { AlertTriangle, Gauge, type LucideIcon } from "lucide-react";
import { riskLabel, statusLabel } from "../../lib/formatters";

export function IconBadge({ icon: Icon, tone = "neutral" }: { icon: LucideIcon; tone?: string }) {
  return (
    <span className={clsx("icon-badge", `tone-${tone}`)}>
      <Icon size={18} strokeWidth={2} />
    </span>
  );
}

export function RiskPill({ level, label }: { level: string; label?: string }) {
  return <span className={clsx("risk-pill", `risk-${level}`)}>{label ?? riskLabel(level)}</span>;
}

export function StatusPill({ status }: { status: string }) {
  return <span className={clsx("risk-pill", `status-${status}`)}>{statusLabel(status)}</span>;
}

export function Panel({
  title,
  action,
  children,
  className,
}: {
  title?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={clsx("panel", className)}>
      {(title || action) && (
        <div className="panel-header">
          {title && <h2>{title}</h2>}
          {action}
        </div>
      )}
      {children}
    </section>
  );
}

export function MetricCard({
  label,
  value,
  helper,
  icon,
  tone = "neutral",
}: {
  label: string;
  value: string;
  helper: string;
  icon: LucideIcon;
  tone?: string;
}) {
  return (
    <article className="metric-card">
      <div className="metric-top">
        <IconBadge icon={icon} tone={tone} />
        <Gauge className={clsx("metric-direction", `tone-${tone}`)} size={18} />
      </div>
      <span className="metric-label">{label}</span>
      <strong>{value}</strong>
      <small>{helper}</small>
    </article>
  );
}

export function LoadingState({ label = "Carregando dados financeiros" }: { label?: string }) {
  return (
    <div className="state-card">
      <div className="state-spinner" />
      <strong>{label}</strong>
      <span>Sincronizando dados do usuário logado.</span>
    </div>
  );
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="state-card error">
      <IconBadge icon={AlertTriangle} tone="danger" />
      <strong>Falha ao carregar</strong>
      <span>{message}</span>
      {onRetry && (
        <button className="primary-button" type="button" onClick={onRetry}>
          Tentar novamente
        </button>
      )}
    </div>
  );
}

export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="empty-state">
      <strong>{title}</strong>
      <span>{description}</span>
      {action}
    </div>
  );
}
