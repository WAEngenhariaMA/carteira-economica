import { useState } from "react";
import { Brain, CheckCircle2, RotateCcw, TestTube2, XCircle } from "lucide-react";
import { IconBadge, RiskPill } from "../ui/FinanceUI";

const aiModes = [
  { value: "rules", label: "Regras puras" },
  { value: "local", label: "IA Local - Ollama" },
  { value: "edge-function", label: "IA em Nuvem - Edge Function" },
  { value: "auto", label: "Automático com fallback" },
  { value: "mock", label: "Mock" },
] as const;

const localModels = ["qwen2.5:7b", "qwen2.5:3b", "llama3.1:8b", "llama3.2:3b", "mistral:7b"];

function localStorageValue(key: string, fallback: string) {
  return localStorage.getItem(key) || fallback;
}

export function AiSettingsPanel() {
  const [mode, setMode] = useState(localStorageValue("ceia.aiMode", import.meta.env.VITE_AI_MODE || "rules"));
  const [localUrl, setLocalUrl] = useState(localStorageValue("ceia.localAiUrl", import.meta.env.VITE_LOCAL_AI_URL || "http://localhost:11434/api/chat"));
  const [localModel, setLocalModel] = useState(localStorageValue("ceia.localAiModel", import.meta.env.VITE_LOCAL_AI_MODEL || "qwen2.5:7b"));
  const [cloudProvider, setCloudProvider] = useState(localStorageValue("ceia.cloudProvider", import.meta.env.VITE_CLOUD_AI_PROVIDER || "gemini"));
  const [cloudFunction, setCloudFunction] = useState(localStorageValue("ceia.cloudFunction", import.meta.env.VITE_AI_DIAGNOSTIC_FUNCTION || "generate-diagnostic"));
  const [status, setStatus] = useState("Regras puras ativas. Fallback automático disponível.");
  const [testing, setTesting] = useState(false);

  function saveConfig() {
    localStorage.setItem("ceia.aiMode", mode);
    localStorage.setItem("ceia.localAiUrl", localUrl);
    localStorage.setItem("ceia.localAiModel", localModel);
    localStorage.setItem("ceia.cloudProvider", cloudProvider);
    localStorage.setItem("ceia.cloudFunction", cloudFunction);
    setStatus("Configuração salva. O próximo diagnóstico usará essas preferências.");
  }

  async function testLocalAi() {
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 8000);
    setTesting(true);
    setStatus("Testando IA local...");

    try {
      const response = await fetch(localUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: controller.signal,
        body: JSON.stringify({
          model: localModel,
          messages: [{ role: "user", content: "Responda apenas: ok" }],
          stream: false,
        }),
      });

      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      setStatus("IA local conectada. Ollama respondeu com sucesso.");
    } catch (error) {
      setStatus(`IA local indisponível. O sistema continuará com regras puras. ${error instanceof Error ? error.message : ""}`);
    } finally {
      window.clearTimeout(timeout);
      setTesting(false);
    }
  }

  function resetRules() {
    setMode("rules");
    localStorage.setItem("ceia.aiMode", "rules");
    setStatus("Modo alterado para regras puras. Sempre funciona e não depende de IA.");
  }

  const connected = status.includes("conectada");

  return (
    <div className="ai-settings">
      <div className="ai-status-card">
        <IconBadge icon={Brain} tone={connected ? "good" : "neutral"} />
        <div>
          <strong>Diagnóstico com fallback seguro</strong>
          <span>{status}</span>
        </div>
        <RiskPill level={connected ? "healthy" : mode === "rules" ? "healthy" : "attention"} label={connected ? "IA local conectada" : mode === "rules" ? "Regras ativas" : "Fallback ativo"} />
      </div>

      <div className="entry-form">
        <label>
          Modo de IA
          <select value={mode} onChange={(event) => setMode(event.target.value)}>
            {aiModes.map((option) => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
        </label>
        <label>
          URL da IA Local
          <input value={localUrl} onChange={(event) => setLocalUrl(event.target.value)} />
        </label>
        <label>
          Modelo Local
          <select value={localModel} onChange={(event) => setLocalModel(event.target.value)}>
            {localModels.map((model) => (
              <option key={model} value={model}>{model}</option>
            ))}
          </select>
        </label>
        <label>
          Provider em nuvem
          <select value={cloudProvider} onChange={(event) => setCloudProvider(event.target.value)}>
            <option value="gemini">Gemini via Edge Function</option>
            <option value="future">Outro futuro</option>
          </select>
        </label>
        <label>
          Edge Function
          <input value={cloudFunction} onChange={(event) => setCloudFunction(event.target.value)} />
        </label>
        <div className="form-actions">
          <button className="primary-button" type="button" onClick={saveConfig}>
            <CheckCircle2 size={16} />
            Salvar IA
          </button>
          <button className="ghost-button" type="button" onClick={testLocalAi} disabled={testing}>
            <TestTube2 size={16} />
            {testing ? "Testando..." : "Testar IA Local"}
          </button>
          <button className="ghost-button" type="button" onClick={resetRules}>
            <RotateCcw size={16} />
            Voltar para regras
          </button>
        </div>
      </div>

      <div className="ai-mode-notes">
        <span><XCircle size={15} /> Regras puras: sempre funcionam e não dependem de IA.</span>
        <span><CheckCircle2 size={15} /> IA local: roda no computador com Ollama e aumenta a privacidade.</span>
        <span><Brain size={15} /> IA em nuvem: preparada para Edge Function; chaves ficam apenas em Supabase Secrets.</span>
      </div>
    </div>
  );
}
