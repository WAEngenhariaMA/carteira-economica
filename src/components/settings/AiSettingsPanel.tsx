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
    value: "openrouter",
    label: "OpenRouter (chave de API)",
    title: "Claude, GPT-4o, Llama e mais",
    description:
      "Uma chave, centenas de modelos. Tem opções gratuitas. Coloque sua chave OpenRouter e escolha o modelo.",
  },
  {
    value: "gemini-direct",
    label: "Google Gemini (chave de API)",
    title: "Gemini 2.0 Flash e outros",
    description:
      "Chame o Gemini diretamente com sua chave Google AI Studio. Tier gratuito generoso sem cartão.",
  },
  {
    value: "edge-function",
    label: "IA em nuvem (Edge Function)",
    title: "Avançado — backend Supabase",
    description:
      "Só funciona quando existir uma Edge Function pronta no Supabase com provedor configurado.",
  },
  {
    value: "auto",
    label: "Automático com fallback",
    title: "Tenta IA e volta para regras",
    description:
      "Primeiro tenta a API direta configurada. Se falhar, cai para local e depois para regras.",
  },
] as const;

const localModels = [
  { value: "qwen2.5:3b", label: "Qwen 2.5 3B — leve" },
  { value: "qwen2.5:7b", label: "Qwen 2.5 7B — recomendado" },
  { value: "llama3.2:3b", label: "Llama 3.2 3B — leve" },
  { value: "mistral:7b", label: "Mistral 7B — alternativo" },
  { value: "llama3.1:8b", label: "Llama 3.1 8B — pesado" },
];

const openrouterModels = [
  { value: "meta-llama/llama-3.1-8b-instruct:free", label: "Llama 3.1 8B — Grátis" },
  { value: "google/gemma-2-9b-it:free", label: "Google Gemma 2 9B — Grátis" },
  { value: "mistralai/mistral-7b-instruct:free", label: "Mistral 7B — Grátis" },
  { value: "anthropic/claude-haiku-4-5", label: "Claude Haiku 4.5 — Pago (melhor)" },
  { value: "openai/gpt-4o-mini", label: "GPT-4o Mini — Pago (confiável)" },
  { value: "google/gemini-2.0-flash-exp:free", label: "Gemini 2.0 Flash Exp — Grátis" },
];

const geminiModels = [
  { value: "gemini-2.0-flash-lite", label: "Gemini 2.0 Flash Lite — mais rápido" },
  { value: "gemini-2.0-flash", label: "Gemini 2.0 Flash — recomendado" },
  { value: "gemini-1.5-flash", label: "Gemini 1.5 Flash — estável" },
  { value: "gemini-1.5-pro", label: "Gemini 1.5 Pro — maior qualidade" },
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
  const [apiDirectKey, setApiDirectKey] = useState(
    localStorageValue("ceia.apiDirectKey", ""),
  );
  const [apiDirectProvider, setApiDirectProvider] = useState(
    localStorageValue("ceia.apiDirectProvider", "openrouter"),
  );
  const [apiDirectModel, setApiDirectModel] = useState(
    localStorageValue("ceia.apiDirectModel", "meta-llama/llama-3.1-8b-instruct:free"),
  );
  const [showApiKey, setShowApiKey] = useState(false);
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
    localStorage.setItem("ceia.apiDirectKey", apiDirectKey.trim());
    localStorage.setItem("ceia.apiDirectProvider", apiDirectProvider);
    localStorage.setItem("ceia.apiDirectModel", apiDirectModel);
    setLocalUrl(baseUrl);
    setStatusKind("info");
    setStatus(
      mode === "rules"
        ? "Modo gratuito sem instalação salvo. O sistema continuará usando regras puras."
        : mode === "local"
          ? "Configuração da IA local salva. Teste a conexão para validar o Ollama."
          : mode === "openrouter" || mode === "gemini-direct"
            ? apiDirectKey.trim()
              ? "Chave de API salva. Clique em Gerar diagnóstico com IA para testar."
              : "Configure a chave de API para ativar este modo."
            : "Configuração salva. Este modo usa backend avançado com fallback seguro.",
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
            <strong>Sem instalar nada</strong> — funciona agora, sem custo. Usa o motor de regras.
          </p>
          <p>
            <strong>Ollama local</strong> — melhor custo-benefício sem pagar API. Exige instalar o Ollama.
          </p>
          <p>
            <strong>OpenRouter</strong> — uma chave, acesso a Claude, GPT-4o, Llama e outros. Tem modelos grátis. Obtenha sua chave em openrouter.ai.
          </p>
          <p>
            <strong>Google Gemini</strong> — tier gratuito generoso (1.500 req/dia). Obtenha sua chave em aistudio.google.com.
          </p>
          <p>
            <strong>Edge Function</strong> — para quem tem backend Supabase configurado.
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

      {(mode === "openrouter" || mode === "gemini-direct") && (
        <div className="ai-local-setup">
          <div className="ai-setup-callout">
            <strong>Como configurar a IA com chave de API</strong>
            {mode === "openrouter" && (
              <>
                <span>1. Acesse <strong>openrouter.ai</strong> e crie uma conta gratuita.</span>
                <span>2. Vá em Keys e gere uma chave de API.</span>
                <span>3. Cole a chave abaixo e escolha o modelo.</span>
                <span>4. Modelos com <em>:free</em> não cobram nada.</span>
              </>
            )}
            {mode === "gemini-direct" && (
              <>
                <span>1. Acesse <strong>aistudio.google.com</strong> e faça login.</span>
                <span>2. Clique em <em>Get API Key</em> e copie.</span>
                <span>3. Cole a chave abaixo. Tier gratuito: 1.500 req/dia.</span>
              </>
            )}
          </div>

          <div className="entry-form ai-entry-form">
            <label>
              Chave de API
              <div style={{ display: "flex", gap: 8 }}>
                <input
                  type={showApiKey ? "text" : "password"}
                  value={apiDirectKey}
                  onChange={(e) => setApiDirectKey(e.target.value)}
                  placeholder={mode === "openrouter" ? "sk-or-..." : "AIza..."}
                  style={{ flex: 1 }}
                />
                <button
                  type="button"
                  className="ghost-button"
                  onClick={() => setShowApiKey((v) => !v)}
                  style={{ whiteSpace: "nowrap" }}
                >
                  {showApiKey ? "Ocultar" : "Mostrar"}
                </button>
              </div>
            </label>
            <label>
              Modelo
              <select
                value={apiDirectModel}
                onChange={(e) => {
                  setApiDirectModel(e.target.value);
                  setApiDirectProvider(mode);
                }}
              >
                {(mode === "openrouter" ? openrouterModels : geminiModels).map((m) => (
                  <option key={m.value} value={m.value}>
                    {m.label}
                  </option>
                ))}
              </select>
            </label>
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
            Provider em nuvem (Edge Function)
            <select
              value={cloudProvider}
              onChange={(event) => setCloudProvider(event.target.value)}
            >
              <option value="gemini">Gemini via Edge Function</option>
              <option value="openai">OpenAI via Edge Function</option>
              <option value="anthropic">Anthropic via Edge Function</option>
              <option value="groq">Groq via Edge Function</option>
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
          <CheckCircle2 size={15} /> Grátis imediato: regras puras analisam a saúde financeira sem depender de IA.
        </span>
        <span>
          <Brain size={15} /> Grátis local: Ollama no seu computador, sem expor dados.
        </span>
        <span>
          <CheckCircle2 size={15} /> OpenRouter: acesso a Claude, GPT-4o, Llama com uma chave — modelos grátis disponíveis.
        </span>
        <span>
          <CheckCircle2 size={15} /> Gemini Direct: tier gratuito do Google (1.500 req/dia). Chave em aistudio.google.com.
        </span>
        <span>
          <TriangleAlert size={15} /> Edge Function: requer backend Supabase configurado.
        </span>
      </div>
    </div>
  );
}
