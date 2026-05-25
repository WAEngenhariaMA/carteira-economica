import { formatMoney } from "../../lib/formatters";

export const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      labels: {
        color: "#667085",
        boxWidth: 10,
        usePointStyle: true,
      },
    },
    tooltip: {
      backgroundColor: "#0b1726",
      padding: 12,
      titleColor: "#ffffff",
      bodyColor: "#d9e2ee",
      borderColor: "#1f3a55",
      borderWidth: 1,
      callbacks: {
        label: (context: any) => {
          const value = typeof context.parsed === "object" ? context.parsed.y : context.parsed;
          return `${context.dataset.label ?? "Valor"}: ${formatMoney(Number(value ?? 0))}`;
        },
      },
    },
  },
  scales: {
    x: {
      grid: { display: false },
      ticks: { color: "#667085" },
      border: { display: false },
    },
    y: {
      grid: { color: "#edf2f7" },
      ticks: {
        color: "#667085",
        callback: (value: string | number) => formatMoney(Number(value)),
      },
      border: { display: false },
    },
  },
};

export const doughnutOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      position: "bottom" as const,
      labels: {
        color: "#667085",
        boxWidth: 10,
        usePointStyle: true,
      },
    },
    tooltip: {
      callbacks: {
        label: (context: any) => `${context.label}: ${formatMoney(Number(context.parsed ?? 0))}`,
      },
    },
  },
};
