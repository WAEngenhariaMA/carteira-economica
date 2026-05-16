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
    healthy: "Saudavel",
    attention: "Atencao",
    risk: "Risco",
    critical: "Critico",
    emergency: "Emergencia",
  };

  return labels[level] ?? level;
}
