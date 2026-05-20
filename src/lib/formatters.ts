export const money = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
  maximumFractionDigits: 0,
});

export const moneyPrecise = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

export const percent = new Intl.NumberFormat("pt-BR", {
  style: "percent",
  maximumFractionDigits: 1,
});

export function formatMoney(value: number) {
  return money.format(value);
}

export function formatMoneyPrecise(value: number) {
  return moneyPrecise.format(value);
}

export function formatPercent(value: number) {
  return percent.format(value);
}

export function riskLabel(level: string) {
  const labels: Record<string, string> = {
    excellent: "Excelente",
    healthy: "Saudável",
    attention: "Atenção",
    risk: "Risco",
    critical: "Crítico",
    emergency: "Emergência",
    urgent: "Urgente",
    high: "Alta",
    medium: "Média",
    low: "Baixa",
  };

  return labels[level] ?? level;
}

export function statusLabel(status: string) {
  const labels: Record<string, string> = {
    open: "Aberta",
    closed: "Fechada",
    paid: "Paga",
    overdue: "Atrasada",
    scheduled: "Agendada",
    planned: "Planejada",
    running: "Em andamento",
    done: "Concluída",
    pending_validation: "Aguardando validação",
    validated: "Validada",
    imported: "Importada",
    failed: "Falhou",
  };

  return labels[status] ?? status;
}

export function essentialityLabel(value: string) {
  const labels: Record<string, string> = {
    essential: "Essencial",
    important: "Importante",
    superfluous: "Supérfluo",
    impulsive: "Impulsivo",
  };

  return labels[value] ?? value;
}

export function paymentRailLabel(value: string) {
  const labels: Record<string, string> = {
    bank: "Banco",
    card: "Cartão",
    cash: "Dinheiro",
    loan: "Dívida",
  };

  return labels[value] ?? value;
}

export function difficultyLabel(value: string) {
  const labels: Record<string, string> = {
    baixa: "Baixa",
    media: "Média",
    alta: "Alta",
  };

  return labels[value] ?? value;
}

export function importFieldLabel(value: string) {
  const labels: Record<string, string> = {
    date: "Data",
    description: "Descrição",
    amount: "Valor",
    category: "Categoria",
    card: "Cartão",
    bank: "Banco",
    installment: "Parcela",
    competence: "Competência",
  };

  return labels[value] ?? value;
}

export function alertSourceLabel(value: string) {
  const labels: Record<string, string> = {
    cashflow: "Fluxo de caixa",
    card: "Cartão",
    installments: "Parcelas",
    budget: "Orçamento",
    data: "Dados",
  };

  return labels[value] ?? value;
}
