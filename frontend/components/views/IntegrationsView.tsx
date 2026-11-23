"use client";

import React, { useState, useEffect } from "react";
import {
  PlugZap,
  CheckCircle2,
  Sliders,
  ExternalLink,
  ShieldCheck,
  Activity,
  Send,
  RefreshCw,
  Power,
  X,
  Eye,
  EyeOff,
  Check,
  AlertCircle,
} from "lucide-react";
import { api } from "@/lib/api";
import { PageHeader } from "@/components/ui/PageHeader";

interface IntegrationItem {
  id: string;
  name: string;
  category: string;
  status: string;
  desc: string;
  enabled: boolean;
  channel?: string;
  last_synced?: string;
  events_dispatched: number;
}

export default function IntegrationsView() {
  const [integrations, setIntegrations] = useState<IntegrationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState("ALL");
  const [testingId, setTestingId] = useState<string | null>(null);
  const [testResult, setTestResult] = useState<{
    id: string;
    success: boolean;
    message: string;
    latency_ms: number;
  } | null>(null);

  // Modal state
  const [selectedConfig, setSelectedConfig] = useState<IntegrationItem | null>(null);
  const [webhookUrl, setWebhookUrl] = useState("https://hooks.slack.com/services/T000/B000/XXXX");
  const [apiSecret, setApiSecret] = useState("sec_live_9fa821c4801b");
  const [showSecret, setShowSecret] = useState(false);
  const [channelInput, setChannelInput] = useState("");
  const [minSeverity, setMinSeverity] = useState("HIGH");
  const [isSaving, setIsSaving] = useState(false);

  const loadIntegrations = async () => {
    try {
      const data = await api.getIntegrations();
      setIntegrations(data);
    } catch (err) {
      console.error("Failed to load integrations", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadIntegrations();
  }, []);

  const handleTestConnection = async (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setTestingId(id);
    try {
      const res = await api.testIntegration(id);
      setTestResult({
        id,
        success: res.success,
        message: res.message,
        latency_ms: res.latency_ms,
      });
      await loadIntegrations();
      setTimeout(() => setTestResult(null), 6000);
    } catch (err: any) {
      setTestResult({
        id,
        success: false,
        message: err.message || "Failed to reach endpoint",
        latency_ms: 0,
      });
    } finally {
      setTestingId(null);
    }
  };

  const handleToggleEnable = async (item: IntegrationItem, e: React.MouseEvent) => {
    e.stopPropagation();
    const newEnabled = !item.enabled;
    const newStatus = newEnabled ? "CONNECTED" : "DISABLED";
    try {
      await api.updateIntegration({
        ...item,
        enabled: newEnabled,
        status: newStatus,
      });
      setIntegrations((prev) =>
        prev.map((it) => (it.id === item.id ? { ...it, enabled: newEnabled, status: newStatus } : it))
      );
    } catch (err) {
      console.error(err);
    }
  };

  const openConfigModal = (item: IntegrationItem) => {
    setSelectedConfig(item);
    setChannelInput(item.channel || "");
    setShowSecret(false);
  };

  const saveConfig = async () => {
    if (!selectedConfig) return;
    setIsSaving(true);
    try {
      await api.updateIntegration({
        ...selectedConfig,
        channel: channelInput,
      });
      await loadIntegrations();
      setSelectedConfig(null);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  const categories = [
    "ALL",
    "Incident Notification",
    "Telemetry Export",
    "Escalation",
    "Model Ingestion",
    "Observability",
  ];

  const filteredIntegrations =
    activeCategory === "ALL"
      ? integrations
      : integrations.filter((item) => item.category === activeCategory);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 font-sans">
      {/* 1. Page Header */}
      <PageHeader
        title="Integrations & Incident Response Webhooks"
        description="Connect AgentGuard to Slack, Splunk, PagerDuty, Datadog, and LLM gateway reverse proxies with live test verification."
        statusLine="Enterprise SIEM & Ecosystem Connectors Active · 6 Connectors Installed"
        badge={{ text: "SIEM & WEBHOOKS", variant: "sky" }}
        actions={
          <button
            type="button"
            onClick={loadIntegrations}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#0F1622] hover:bg-[#151F2E] text-slate-300 border border-[#1E293B] text-xs font-sans transition-all cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            <span>Sync status</span>
          </button>
        }
      />

      {/* 2. Global Test Result Notification Banner */}
      {testResult && (
        <div
          role="status"
          className={`p-4 rounded-xl border text-xs font-sans flex items-start justify-between gap-3 animate-in fade-in ${testResult.success
            ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-300"
            : "bg-red-500/10 border-red-500/30 text-red-300"
            }`}
        >
          <div className="flex items-start gap-2.5">
            {testResult.success ? (
              <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0 text-emerald-400" />
            ) : (
              <AlertCircle className="w-4 h-4 mt-0.5 shrink-0 text-red-400" />
            )}
            <div>
              <div className="font-semibold text-white">
                {testResult.success ? "Connection Verified Successfully" : "Connection Verification Failed"}
              </div>
              <p className="text-slate-300 mt-0.5">{testResult.message}</p>
              {testResult.latency_ms > 0 && (
                <div className="text-[11px] text-slate-400 font-mono mt-1">
                  Handshake Latency: <strong className="text-white">{testResult.latency_ms}ms</strong>
                </div>
              )}
            </div>
          </div>
          <button
            type="button"
            onClick={() => setTestResult(null)}
            className="text-slate-400 hover:text-white p-1"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* 3. Category Filter Pills */}
      <div className="flex flex-wrap items-center gap-2">
        {categories.map((cat) => (
          <button
            key={cat}
            type="button"
            onClick={() => setActiveCategory(cat)}
            className={`px-3 py-1.5 rounded-lg text-xs font-sans transition-all cursor-pointer ${activeCategory === cat
              ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/40 font-semibold"
              : "bg-[#0F1622] text-slate-400 border border-[#1E293B] hover:text-slate-200"
              }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* 4. Integrations Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredIntegrations.map((item) => {
          const isTesting = testingId === item.id;
          const statusBadge =
            item.status === "CONNECTED" || item.status === "ACTIVE"
              ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
              : item.status === "DISABLED"
                ? "bg-slate-800 text-slate-400 border-slate-700"
                : item.status === "READY"
                  ? "bg-sky-500/10 text-sky-400 border-sky-500/30"
                  : "bg-purple-500/10 text-purple-400 border-purple-500/30";

          return (
            <div
              key={item.id}
              className={`p-5 rounded-xl bg-[#0F1622] border transition-all flex flex-col justify-between space-y-4 hover:border-slate-700 ${item.enabled ? "border-[#1E293B]" : "border-[#1E293B]/40 opacity-70"
                }`}
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] font-sans uppercase tracking-wider text-slate-400">
                    {item.category}
                  </span>
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${statusBadge}`}>
                      {item.status}
                    </span>
                    <button
                      type="button"
                      onClick={(e) => handleToggleEnable(item, e)}
                      title={item.enabled ? "Disable Integration" : "Enable Integration"}
                      className={`p-1 rounded transition-colors cursor-pointer ${item.enabled
                        ? "text-emerald-400 hover:bg-emerald-500/10"
                        : "text-slate-500 hover:bg-slate-800"
                        }`}
                    >
                      <Power className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <h3 className="text-base font-bold text-white font-sans flex items-center gap-2">
                  {item.name}
                </h3>
                <p className="text-xs text-slate-400 font-sans mt-1.5 leading-relaxed">
                  {item.desc}
                </p>

                {item.channel && (
                  <div className="mt-3 p-2 rounded bg-[#080B10] border border-[#1E293B] text-xs font-mono text-slate-400 flex items-center justify-between">
                    <span className="text-slate-500 font-sans">Target:</span>
                    <span className="text-sky-400 font-medium">{item.channel}</span>
                  </div>
                )}
              </div>

              <div className="space-y-3 pt-3 border-t border-[#1E293B] font-sans">
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span>
                    Dispatched: <strong className="font-mono text-white">{item.events_dispatched.toLocaleString()}</strong>
                  </span>
                  <span className="text-[11px] text-slate-400">{item.last_synced || "Recent"}</span>
                </div>

                <div className="flex items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={(e) => handleTestConnection(item.id, e)}
                    disabled={isTesting || !item.enabled}
                    className="flex-1 py-1.5 px-2.5 rounded-lg bg-[#080B10] hover:bg-[#151F2E] border border-[#1E293B] hover:border-emerald-500/30 text-xs font-sans text-emerald-400 flex items-center justify-center gap-1.5 disabled:opacity-40 transition-all cursor-pointer"
                  >
                    <Send className={`w-3 h-3 ${isTesting ? "animate-pulse text-sky-400" : ""}`} />
                    <span>{isTesting ? "Testing..." : "Test ping"}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => openConfigModal(item)}
                    className="py-1.5 px-3 rounded-lg bg-[#151F2E] hover:bg-[#1C293D] text-slate-300 hover:text-white border border-[#1E293B] text-xs font-sans flex items-center gap-1.5 transition-all cursor-pointer"
                  >
                    <Sliders className="w-3 h-3" />
                    <span>Configure</span>
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* 5. Configuration Modal */}
      {selectedConfig && (
        <div
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-150"
          role="dialog"
          aria-modal="true"
        >
          <div className="w-full max-w-lg bg-[#0F1622] border border-[#1E293B] rounded-xl shadow-2xl p-6 space-y-5 font-sans">
            <div className="flex items-center justify-between border-b border-[#1E293B] pb-3">
              <div>
                <span className="text-[11px] uppercase text-emerald-400 font-medium">Connector Configuration</span>
                <h2 className="text-base font-bold text-white mt-0.5">{selectedConfig.name}</h2>
              </div>
              <button
                type="button"
                onClick={() => setSelectedConfig(null)}
                className="p-1 rounded text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4 text-xs font-sans">
              <div className="space-y-1.5">
                <label className="text-slate-300 font-medium">Webhook / Target Endpoint URL</label>
                <input
                  type="text"
                  value={webhookUrl}
                  onChange={(e) => setWebhookUrl(e.target.value)}
                  className="w-full p-2.5 rounded-lg bg-[#080B10] border border-[#1E293B] text-slate-200 font-mono focus:outline-none focus:border-emerald-500"
                  placeholder="https://..."
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-slate-300 font-medium">Channel / Destination Identifier</label>
                <input
                  type="text"
                  value={channelInput}
                  onChange={(e) => setChannelInput(e.target.value)}
                  className="w-full p-2.5 rounded-lg bg-[#080B10] border border-[#1E293B] text-slate-200 font-mono focus:outline-none focus:border-emerald-500"
                  placeholder="#alerts-channel or index_name"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-slate-300 font-medium">Authentication Token / Webhook Secret</label>
                <div className="relative">
                  <input
                    type={showSecret ? "text" : "password"}
                    value={apiSecret}
                    onChange={(e) => setApiSecret(e.target.value)}
                    className="w-full p-2.5 pr-10 rounded-lg bg-[#080B10] border border-[#1E293B] text-slate-200 font-mono focus:outline-none focus:border-emerald-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowSecret(!showSecret)}
                    className="absolute right-3 top-3 text-slate-400 hover:text-slate-200"
                  >
                    {showSecret ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-slate-300 font-medium">Minimum Severity Trigger</label>
                <select
                  value={minSeverity}
                  onChange={(e) => setMinSeverity(e.target.value)}
                  className="w-full p-2.5 rounded-lg bg-[#080B10] border border-[#1E293B] text-slate-200 focus:outline-none focus:border-emerald-500"
                >
                  <option value="CRITICAL">Critical Threats Only (P1)</option>
                  <option value="HIGH">High and Critical (P1, P2)</option>
                  <option value="ALL">All Alerts (Info, Medium, High, Critical)</option>
                </select>
              </div>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-[#1E293B]">
              <button
                type="button"
                onClick={() => handleTestConnection(selectedConfig.id)}
                className="px-3.5 py-2 rounded-lg bg-[#080B10] hover:bg-[#151F2E] border border-[#1E293B] text-sky-400 text-xs font-sans flex items-center gap-1.5 cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Test endpoint</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedConfig(null)}
                  className="px-3 py-2 rounded-lg bg-transparent text-slate-400 hover:text-white text-xs font-sans"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={saveConfig}
                  disabled={isSaving}
                  className="px-4 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-black font-semibold text-xs font-sans flex items-center gap-1.5 transition-all cursor-pointer shadow-sm disabled:opacity-50"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>{isSaving ? "Saving..." : "Save configuration"}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
