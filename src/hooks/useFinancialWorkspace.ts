import { useCallback, useEffect, useMemo, useState } from "react";
import { buildFinancialSummary, buildRuleBasedActions } from "../lib/financeEngine";
import type { FinancialProfile, FinancialWorkspace } from "../types/finance";
import { actionPlanService } from "../services/actionPlanService";
import { cardService } from "../services/cardService";
import { debtService } from "../services/debtService";
import { goalService } from "../services/goalService";
import { installmentService } from "../services/installmentService";
import { investmentService } from "../services/investmentService";
import { invoiceService } from "../services/invoiceService";
import { profileService } from "../services/profileService";
import { transactionService } from "../services/transactionService";

interface WorkspaceState {
  loading: boolean;
  error: string | null;
  data: FinancialWorkspace | null;
}

export function useFinancialWorkspace(userId: string | undefined, competence: string) {
  const [state, setState] = useState<WorkspaceState>({
    loading: Boolean(userId),
    error: null,
    data: null,
  });
  const [version, setVersion] = useState(0);

  const refresh = useCallback(() => setVersion((value) => value + 1), []);

  const createProfile = useCallback(
    async (profile: Omit<FinancialProfile, "id">) => {
      if (!userId) throw new Error("Usuário não autenticado");
      await profileService.create(userId, profile);
      refresh();
    },
    [refresh, userId],
  );

  useEffect(() => {
    if (!userId) {
      setState({ loading: false, error: null, data: null });
      return;
    }

    const currentUserId = userId;
    let cancelled = false;
    setState((current) => ({ ...current, loading: true, error: null }));

    async function load() {
      try {
        const currentProfile = await profileService.getCurrent(currentUserId);
        if (!currentProfile) {
          if (!cancelled) {
            setState({ loading: false, error: null, data: null });
          }
          return;
        }

        const [
          currentTransactions,
          currentCards,
          currentInvoices,
          currentInstallments,
          currentDebts,
          currentInvestments,
          currentGoals,
          currentActions,
        ] = await Promise.all([
          transactionService.listByCompetence(currentUserId, competence),
          cardService.listWithMetrics(currentUserId, competence),
          invoiceService.listByCompetence(currentUserId, competence),
          installmentService.listFuture(currentUserId, competence),
          debtService.list(currentUserId),
          investmentService.list(currentUserId),
          goalService.list(currentUserId),
          actionPlanService.list(currentUserId),
        ]);

        const summary = buildFinancialSummary(
          currentProfile,
          currentTransactions,
          currentCards,
          currentDebts,
          currentInstallments,
          competence,
        );
        const fallbackActions = currentActions.length > 0 ? currentActions : buildRuleBasedActions(summary);

        if (!cancelled) {
          setState({
            loading: false,
            error: null,
            data: {
              profile: currentProfile,
              transactions: currentTransactions,
              cards: currentCards,
              invoices: currentInvoices,
              installments: currentInstallments,
              debts: currentDebts,
              investments: currentInvestments,
              goals: currentGoals,
              actions: fallbackActions,
            },
          });
        }
      } catch (error) {
        if (!cancelled) {
          setState({
            loading: false,
            error: error instanceof Error ? error.message : "Erro ao carregar dados financeiros",
            data: null,
          });
        }
      }
    }

    load();

    return () => {
      cancelled = true;
    };
  }, [competence, userId, version]);

  const summary = useMemo(() => {
    if (!state.data) return null;
    return buildFinancialSummary(
      state.data.profile,
      state.data.transactions,
      state.data.cards,
      state.data.debts,
      state.data.installments,
      competence,
    );
  }, [competence, state.data]);

  return {
    ...state,
    summary,
    refresh,
    createProfile,
  };
}
