import { useState } from "react";
import {
  Brain,
  CheckCircle2,
  CircleHelp,
  RotateCcw,
  TestTube2,
  TriangleAlert,
} from "lucide-react";
import { IconBadge, RiskPill } from "../ui/FinanceUI";

const aiModes = [
  {
    value: "rules",
    label: "Sem instalar nada",
    title: "Grátis e imediato",
    description:
      "Usa o motor financeiro do sistema. Não depende de internet, chave nem instalação.",
  },
  {
    value: "local",
    label: "IA grátis no computador",
    title: "Ollama local",
    description:
      "Roda no seu próprio computador e melhora os textos do diagnóstico sem expor dados em nuvem.",
  },
  {
    value: "edge-function",
    label: "IA em nuvem",
    title: "Avançado",
    description:
      "Só funciona quando existir uma Edge Function pronta no Supabase com provedor configurado.",
  },
  {
    value: "auto",
    label: "Automático com fallback",
    title: "Tenta IA e volta para regras",
    description:
      "Primeiro tenta IA configurada. Se falhar, continua com regras puras sem quebrar o sistema.",
  },
] as const;

const localModels = [
  { value: "qwen2.5:3b", label: "Qwen 2.5 3B - leve" },
  { value: "qwen2.5:7b", label: "Qwen 2.5 7B - recomendado" },
  { value: "llama3.2:3b", label: "Llama 3.2 3B - leve" },
  { value: "mistral:7b", label: "Mistral 7B - alternativo" },
  { value: "llama3.1:8b", label: "Llama 3.1 8B - pesado" },
];

type SimpleMode = (typeof aiModes)[number]["value"];

function localStorageValue(key: string, fallback: string) {
  return localStorage.getItem(key) || fallback;
}

function friendlyFetchError(error: unknown) {
  if (error instanceof Error) {
    if (error.name === "AbortError") {
      return "A IA local demorou demais para responder. Isso costuma acontecer quando o Ollama não está aberto ou o modelo ainda não foi carregado.";
    }

    if (error.message.includes("Failed to fetch")) {
      return "Não consegui alcançar a IA local no seu computador. Em geral isso acontece quando o Ollama não está instalado, não está aberto ou ainda não baixou o modelo.";
    }

    return error.message;
  }

  return "Falha ao conectar com a IA local.";
}

function statusLevel(mode: SimpleMode, statusKind: "ok" | "warn" | "info") {
  if (statusKind === "ok") return "healthy";
  if (mode === "rules") return "healthy";
  return "attention";
}

export function AiSettingsPanel() {
  const [mode, setMode] = useState<SimpleMode>(
    (localStorageValue(
      "ceia.aiMode",
      import.meta.env.VITE_AI_MODE || "rules",
    ) as SimpleMode) || "rules",
  );
  const [localUrl, setLocalUrl] = useState(
    localStorageValue(
      "ceia.localAiUrl",
      import.meta.env.VITE_LOCAL_AI_URL || "http://localhost:11434",
    ),
  );
  const [localModel, setLocalModel] = useState(
    localStorageValue(
      "ceia.localAiModel",
      import.meta.env.VITE_LOCAL_AI_MODEL || "qwen2.5:3b",
    ),
  );
  const [cloudProvider, setCloudProvider] = useState(
    localStorageValue(
      "ceia.cloudProvider",
      import.meta.env.VITE_CLOUD_AI_PROVIDER || "gemini",
    ),
  );
  const [cloudFunction, setCloudFunction] = useState(
    localStorageValue(
      "ceia.cloudFunction",
      import.meta.env.VITE_AI_DIAGNOSTIC_FUNCTION || "generate-diagnostic",
    ),
  );
  const [status, setStatus] = useState(
    "Você pode usar o sistema sem IA. Se quiser um texto mais consultivo sem pagar API, use a opção de IA grátis no computador.",
  );
  const [statusKind, setStatusKind] = useState<"ok" | "warn" | "info">("info");
  const [testing, setTesting] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);

  function normalizedLocalBaseUrl() {
    const trimmed = localUrl.trim().replace(/\/$/, "");
    if (trimmed.endsWith("/api/chat")) return trimmed.replace(/\/api\/chat$/, "");
    return trimmed;
  }

  function saveConfig() {
    const baseUrl = normalizedLocalBaseUrl();
    localStorage.setItem("ceia.aiMode", mode);
    localStorage.setItem("ceia.localAiUrl", baseUrl);
    localStorage.setItem("ceia.localAiModel", localModel);
    localStorage.setItem("ceia.cloudProvider", cloudProvider);
    localStorage.setItem("ceia.cloudFunction", cloudFunction);
    setLocalUrl(baseUrl);
    setStatusKind("info");
    setStatus(
      mode === "rules"
        ? "Modo gratuito sem instalação salvo. O sistema continuará usando regras puras."
        : mode === "local"
          ? "Configuração da IA grátis no computador salva. Agora teste a conexão para validar o Ollama."
          : "Configuração salva. Esse modo depende de infraestrutura avançada e continua com fallback seguro.",
    );
  }

  async function testLocalAi() {
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 8000);
    const baseUrl = normalizedLocalBaseUrl();
    setTesting(true);
    setStatusKind("info");
    setStatus("Verificando se a IA local está aberta no seu computador...");

    try {
      const tagsResponse = await fetch(`${baseUrl}/api/tags`, {
        method: "GET",
        signal: controller.signal,
      });

      if (!tagsResponse.ok) {
        throw new Error(`Ollama respondeu HTTP ${tagsResponse.status}.`);
      }

      const tagsPayload = (await tagsResponse.json()) as {
        models?: Array<{ name?: string }>;
      };
      const hasModel = Boolean(
        tagsPayload.models?.some((item) => item.name === localModel),
      );

      if (!hasModel) {
        setStatusKind("warn");
        setStatus(
          `O Ollama está aberto, mas o modelo ${localModel} ainda não foi encontrado. Abra o terminal e rode: ollama pull ${localModel}`,
        );
        return;
      }

      const chatResponse = await fetch(`${baseUrl}/api/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: controller.signal,
        body: JSON.stringify({
          model: localModel,
          messages: [{ role: "user", content: "Responda apenas ok" }],
          stream: false,
        }),
      });

      if (!chatResponse.ok) {
        throw new Error(`Teste de conversa respondeu HTTP ${chatResponse.status}.`);
      }

      localStorage.setItem("ceia.aiMode", "local");
      localStorage.setItem("ceia.localAiUrl", baseUrl);
      localStorage.setItem("ceia.localAiModel", localModel);
      setMode("local");
      setLocalUrl(baseUrl);
      setStatusKind("ok");
      setStatus(
        `IA local conectada com sucesso. O sistema já pode usar ${localModel} no seu computador sem depender de API paga.`,
      );
    } catch (error) {
      setStatusKind("warn");
      setStatus(
        `${friendlyFetchError(error)} Se quiser continuar agora sem instalar nada, use o modo "Sem instalar nada".`,
      );
    } finally {
      window.clearTimeout(timeout);
      setTesting(false);
    }
  }

  function useRulesMode() {
    setMode("rules");
    localStorage.setItem("ceia.aiMode", "rules");
    setStatusKind("ok");
    setStatus(
      "Modo gratuito sem instalação ativado. O sistema continuará gerando diagnóstico com regras puras, sem falhar.",
    );
  }

  function useFreeLocalPreset() {
    setMode("local");
    setLocalUrl("http://localhost:11434");
    setLocalModel("qwen2.5:3b");
    setStatusKind("info");
    setStatus(
      'Preset gratuito aplicado. Agora abra o Ollama e teste. Se ainda não instalou, rode "ollama pull qwen2.5:3b".',
    );
  }

  const selectedMode =
    aiModes.find((item) => item.value === mode) ?? aiModes[0];

  return (
    <div className="ai-settings">
      <div className="ai-status-card">
        <IconBadge
          icon={statusKind === "warn" ? TriangleAlert : Brain}
          tone={statusKind === "ok" ? "good" : statusKind === "warn" ? "warn" : "neutral"}
        />
        <div>
          <strong>{selectedMode.title}</strong>
          <span>{status}</span>
        </div>
        <RiskPill
          level={statusLevel(mode, statusKind)}
          label={
            statusKind === "ok"
              ? "Pronto para usar"
              : mode === "rules"
                ? "Sem instalação"
                : "Fallback seguro"
          }
        />
      </div>

      <div className="ai-choice-grid">
        {aiModes.map((option) => (
          <button
            key={option.value}
            type="button"
            className={`ai-choice-card ${mode === option.value ? "active" : ""}`}
            onClick={() => setMode(option.value)}
          >
            <strong>{option.label}</strong>
            <span>{option.description}</span>
          </button>
        ))}
      </div>

      <div className="ai-guide-panel">
        <div className="ai-guide-header">
          <CircleHelp size={16} />
          <strong>Qual opção escolher?</strong>
        </div>
        <div className="ai-guide-copy">
          <p>
            `Sem instalar nada` é a opção mais simples e já funciona agora,
            totalmente grátis.
          </p>
          <p>
            `IA grátis no computador` é a melhor opção sem custo de API, mas
            exige instalar e abrir o Ollama.
          </p>
          <p>
            `IA em nuvem` só vale quando existir backend seguro pronto no
            Supabase. Não é a opção ideal para começar.
          </p>
        </div>
      </div>

      {(mode === "local" || mode === "auto") && (
        <div className="ai-local-setup">
          <div className="ai-setup-callout">
            <strong>Como ativar a IA grátis no seu computador</strong>
            <span>1. Instale o Ollama.</span>
            <span>2. Rode `ollama pull {localModel}` no terminal.</span>
            <span>3. Deixe o Ollama aberto.</span>
            <span>4. Clique em `Testar IA local`.</span>
          </div>

          <div className="entry-form ai-entry-form">
            <label>
              Modelo gratuito no computador
              <select
                value={localModel}
                onChange={(event) => setLocalModel(event.target.value)}
              >
                {localModels.map((model) => (
                  <option key={model.value} value={model.value}>
                    {model.label}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Endereço da IA local
              <input
                value={localUrl}
                onChange={(event) => setLocalUrl(event.target.value)}
                placeholder="http://localhost:11434"
              />
            </label>
            <div className="form-actions">
              <button
                className="primary-button"
                type="button"
                onClick={testLocalAi}
                disabled={testing}
              >
                <TestTube2 size={16} />
                {testing ? "Testando..." : "Testar IA local"}
              </button>
              <button
                className="ghost-button"
                type="button"
                onClick={useFreeLocalPreset}
              >
                <CheckCircle2 size={16} />
                Aplicar preset gratuito
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="ai-actions-row">
        <button className="primary-button" type="button" onClick={saveConfig}>
          <CheckCircle2 size={16} />
          Salvar configuração
        </button>
        <button className="ghost-button" type="button" onClick={useRulesMode}>
          <RotateCcw size={16} />
          Usar grátis sem instalar
        </button>
        <button
          className="ghost-button"
          type="button"
          onClick={() => setShowAdvanced((current) => !current)}
        >
          <CircleHelp size={16} />
          {showAdvanced ? "Ocultar avançado" : "Mostrar avançado"}
        </button>
      </div>

      {showAdvanced && (
        <div className="ai-advanced-grid">
          <label>
            Modo técnico
            <select
              value={mode}
              onChange={(event) => setMode(event.target.value as SimpleMode)}
            >
              {aiModes.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
          <label>
            Provider em nuvem
            <select
              value={cloudProvider}
              onChange={(event) => setCloudProvider(event.target.value)}
            >
              <option value="gemini">Gemini via Edge Function</option>
              <option value="future">Outro futuro</option>
            </select>
          </label>
          <label>
            Nome da Edge Function
            <input
              value={cloudFunction}
              onChange={(event) => setCloudFunction(event.target.value)}
            />
          </label>
          <div className="ai-advanced-note">
            <strong>Explicação rápida</strong>
            <span>
              `Provider` é a empresa ou serviço de IA. `Edge Function` é o
              backend seguro que conversa com a IA em nuvem sem expor chave no
              navegador.
            </span>
          </div>
        </div>
      )}

      <div className="ai-mode-notes">
        <span>
          <CheckCircle2 size={15} /> Grátis imediato: regras puras já analisam
          a saúde financeira sem depender de IA.
        </span>
        <span>
          <Brain size={15} /> Grátis com texto mais consultivo: Ollama local no
          seu computador.
        </span>
        <span>
          <TriangleAlert size={15} /> Nuvem avançada: só usar depois de preparar
          uma Edge Function segura no Supabase.
        </span>
      </div>
    </div>
  );
}
