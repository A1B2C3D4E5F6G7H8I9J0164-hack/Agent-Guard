"use client";

import React, { useState, useEffect } from "react";
import {
  Crosshair,
  ShieldCheck,
  ShieldAlert,
  Play,
  RotateCcw,
  CheckCircle2,
  XCircle,
  Clock,
  Sparkles,
  Zap,
  X,
  AlertTriangle,
  ArrowRight,
} from "lucide-react";
import { api, RedTeamSuite, RedTeamRunResult } from "@/lib/api";
import { PageHeader } from "@/components/ui/PageHeader";
import { DecisionBadge } from "@/components/ui/DecisionBadge";
import { SeverityBadge } from "@/components/ui/SeverityBadge";

export default function RedTeamView() {
  const [suites, setSuites] = useState<RedTeamSuite[]>([]);
  const [selectedSuite, setSelectedSuite] = useState<string>("all");
  const [isRunning, setIsRunning] = useState(false);
  const [runResult, setRunResult] = useState<RedTeamRunResult | null>(null);

  const [regressionCases, setRegressionCases] = useState<any[]>([]);
  const [regressionResult, setRegressionResult] = useState<any>(null);
  const [isRunningRegression, setIsRunningRegression] = useState(false);

  // Simulate Threat Modal State
  const [isSimulateModalOpen, setIsSimulateModalOpen] = useState(false);
  const [simThreatType, setSimThreatType] = useState("prompt_injection");
  const [simSeverity, setSimSeverity] = useState("critical");
  const [isSimulating, setIsSimulating] = useState(false);
  const [simSuccessNotice, setSimSuccessNotice] = useState<string | null>(null);

  useEffect(() => {
    async function loadSuites() {
      try {
        const s = await api.getRedTeamSuites();
        setSuites(s);
        const rCases = await api.getRegressionCases();
        setRegressionCases(rCases);
      } catch (e) {
        console.error(e);
      }
    }
    loadSuites();
  }, []);

  const handleRunRedTeam = async () => {
    setIsRunning(true);
    try {
      const res = await api.runRedTeam(selectedSuite);
      setRunResult(res);
    } catch (e) {
      console.error(e);
    } finally {
      setIsRunning(false);
    }
  };

  const handleRunRegression = async () => {
    setIsRunningRegression(true);
    try {
      const res = await api.runRegression();
      setRegressionResult(res);
    } catch (e) {
      console.error(e);
    } finally {
      setIsRunningRegression(false);
    }
  };

  const handleTriggerSimulate = async () => {
    setIsSimulating(true);
    try {
      const res = await api.simulateThreat(simThreatType, simSeverity);
      setSimSuccessNotice(`Simulated ${simThreatType} (${simSeverity}) generated with Event ID: ${res.event_id}`);
      setIsSimulateModalOpen(false);
      setTimeout(() => setSimSuccessNotice(null), 6000);
    } catch (e) {
      console.error("Simulation failed", e);
    } finally {
      setIsSimulating(false);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 font-sans">
      {/* 1. Page Header with Simulate Threat & Run Suite */}
      <PageHeader
        title="Red Team Lab & Adversarial Benchmark Testing"
        description="Executes automated adversarial test suites against protected AI models to evaluate defense boundaries and OWASP LLM compliance."
        statusLine="OWASP LLM Benchmark v2.1 Ready · 4 Suites Configured"
        actions={
          <div className="flex flex-wrap items-center gap-3">
            {/* Suite Selector */}
            <select
              value={selectedSuite}
              onChange={(e) => setSelectedSuite(e.target.value)}
              className="px-3 py-1.5 rounded-lg bg-[#0F1622] border border-[#1E293B] text-xs font-sans text-slate-200 focus:outline-none focus:border-red-500"
            >
              <option value="all">All Benchmark Suites</option>
              <option value="prompt_injection">Prompt Injection Suite (LLM01)</option>
              <option value="jailbreak">Persona Jailbreak Suite (LLM01)</option>
              <option value="data_extraction">Data Exfiltration Suite (LLM06)</option>
              <option value="tool_abuse">Agent Tool Abuse Suite (LLM08)</option>
            </select>

            {/* Simulate Threat Button */}
            <button
              onClick={() => setIsSimulateModalOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-[#0F1622] hover:bg-[#151F2E] text-slate-200 border border-[#1E293B] hover:border-amber-500/40 text-xs font-semibold font-sans transition-all cursor-pointer"
            >
              <Zap className="w-3.5 h-3.5 text-amber-400" />
              <span>Simulate threat</span>
            </button>

            {/* Run Suite Button */}
            <button
              onClick={handleRunRedTeam}
              disabled={isRunning}
              className="flex items-center gap-2 px-4 py-1.5 rounded-lg bg-red-500 hover:bg-red-400 text-white font-semibold text-xs font-sans transition-all shadow-sm cursor-pointer disabled:opacity-50"
            >
              <Play className="w-3.5 h-3.5 fill-white" />
              <span>{isRunning ? "Running tests..." : "Run benchmark suite"}</span>
            </button>
          </div>
        }
      />

      {/* Simulation Success Toast */}
      {simSuccessNotice && (
        <div
          role="status"
          className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 flex items-center justify-between text-xs font-sans animate-in fade-in duration-200"
        >
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0" />
            <span>{simSuccessNotice}</span>
          </div>
          <button
            onClick={() => setSimSuccessNotice(null)}
            className="text-slate-400 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* 2. Benchmark Execution Results */}
      {runResult && (
        <div className="p-5 rounded-xl bg-[#0F1622] border border-[#1E293B] space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-4 pb-3 border-b border-[#1E293B]">
            <div>
              <div className="text-xs text-slate-400 font-sans">
                Benchmark execution report
              </div>
              <div className="text-sm font-semibold text-slate-200 font-sans mt-0.5">
                Target: <span className="font-mono text-emerald-400">{runResult.target}</span> • Execution ID:{" "}
                <span className="font-mono text-slate-300">{runResult.execution_id.slice(0, 8)}</span>
              </div>
            </div>

            <div className="flex items-center gap-3 text-xs font-sans">
              <div className="p-2.5 rounded-lg bg-[#080B10] border border-[#1E293B] text-center min-w-[100px]">
                <div className="text-[10px] text-slate-400 uppercase">Defense Rate</div>
                <div className="font-bold text-emerald-400 font-mono text-base mt-0.5">
                  {runResult.defense_rate_percent}%
                </div>
              </div>
              <div className="p-2.5 rounded-lg bg-[#080B10] border border-[#1E293B] text-center min-w-[80px]">
                <div className="text-[10px] text-slate-400 uppercase">Blocked</div>
                <div className="font-bold text-emerald-400 font-mono text-base mt-0.5">
                  {runResult.blocked_count}
                </div>
              </div>
              <div className="p-2.5 rounded-lg bg-[#080B10] border border-[#1E293B] text-center min-w-[80px]">
                <div className="text-[10px] text-slate-400 uppercase">Bypassed</div>
                <div className="font-bold text-red-400 font-mono text-base mt-0.5">
                  {runResult.bypassed_count}
                </div>
              </div>
            </div>
          </div>

          {/* Test Cases Table */}
          <div className="overflow-x-auto rounded-lg border border-[#1E293B]">
            <table className="w-full text-left text-xs font-sans">
              <thead className="bg-[#080B10] text-slate-400 text-[11px] uppercase tracking-wider border-b border-[#1E293B]">
                <tr>
                  <th className="py-2.5 px-3">Test ID</th>
                  <th className="py-2.5 px-3">Test Name</th>
                  <th className="py-2.5 px-3">Category</th>
                  <th className="py-2.5 px-3">Risk</th>
                  <th className="py-2.5 px-3">Decision</th>
                  <th className="py-2.5 px-3">Result</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1E293B] bg-[#0F1622]">
                {runResult.results.map((r, i) => (
                  <tr key={i} className="hover:bg-[#151F2E]/50 transition-colors">
                    <td className="py-2.5 px-3 font-mono font-bold text-sky-400">{r.test_id}</td>
                    <td className="py-2.5 px-3 font-medium text-slate-200">{r.test_name}</td>
                    <td className="py-2.5 px-3 text-slate-400">{r.category}</td>
                    <td className="py-2.5 px-3 font-mono font-bold text-white">{r.risk_score}</td>
                    <td className="py-2.5 px-3">
                      <DecisionBadge decision={r.decision as any} size="sm" />
                    </td>
                    <td className="py-2.5 px-3">
                      {r.defended ? (
                        <span className="flex items-center gap-1.5 text-emerald-400 font-semibold">
                          <CheckCircle2 className="w-4 h-4" /> Defended
                        </span>
                      ) : (
                        <span className="flex items-center gap-1.5 text-red-400 font-semibold">
                          <XCircle className="w-4 h-4" /> Bypass
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 3. Security Regression Testing Suite */}
      <div className="p-5 rounded-xl bg-[#0F1622] border border-[#1E293B] space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4 pb-3 border-b border-[#1E293B]">
          <div>
            <div className="flex items-center gap-2">
              <RotateCcw className="w-4 h-4 text-emerald-400" />
              <h2 className="text-base font-semibold text-white font-sans">
                Security regression testing & attack replay
              </h2>
            </div>
            <p className="text-xs text-slate-400 font-sans mt-0.5">
              Replays historical attack vectors to detect recurring vulnerabilities and generate CI/CD exit codes.
            </p>
          </div>

          <button
            onClick={handleRunRegression}
            disabled={isRunningRegression}
            className="flex items-center gap-2 px-4 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-black font-semibold text-xs font-sans transition-all shadow-sm cursor-pointer disabled:opacity-50"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>{isRunningRegression ? "Replaying attacks..." : "Run regression suite"}</span>
          </button>
        </div>

        {regressionResult && (
          <div className="p-4 rounded-lg bg-[#080B10] border border-[#1E293B] space-y-2 text-xs font-sans">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-slate-200">
                Regression status:{" "}
                <span
                  className={
                    regressionResult.status === "PASSED"
                      ? "text-emerald-400 font-bold"
                      : "text-red-400 font-bold"
                  }
                >
                  {regressionResult.status}
                </span>
              </span>
              <span className="text-slate-400 font-mono">
                CI Exit Code: {regressionResult.ci_exit_code}
              </span>
            </div>
            <div className="text-slate-400">
              Passed: <strong className="text-emerald-400 font-mono">{regressionResult.passed_cases}</strong> /{" "}
              {regressionResult.total_cases} • Regressions detected:{" "}
              <strong
                className={
                  regressionResult.regressions_detected > 0
                    ? "text-red-400 font-mono"
                    : "text-emerald-400 font-mono"
                }
              >
                {regressionResult.regressions_detected}
              </strong>
            </div>
          </div>
        )}

        <div className="space-y-2">
          {regressionCases.map((c, idx) => (
            <div
              key={idx}
              className="p-3 rounded-lg bg-[#080B10] border border-[#1E293B] text-xs font-sans flex items-center justify-between"
            >
              <div>
                <span className="font-mono font-bold text-sky-400">{c.case_id}:</span>{" "}
                <span className="text-slate-200 font-semibold">{c.name}</span>
                <span className="text-slate-400 text-[11px] ml-2 font-mono">({c.category})</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-slate-400 text-[11px] font-mono">
                  Baseline: {c.baseline_decision}
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] bg-[#0F1622] text-emerald-400 border border-emerald-500/30 font-semibold">
                  ACTIVE WATCH
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 4. Simulate Threat Modal */}
      {isSimulateModalOpen && (
        <div
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-150"
          role="dialog"
          aria-modal="true"
        >
          <div className="w-full max-w-md bg-[#0F1622] border border-[#1E293B] rounded-xl p-6 shadow-2xl space-y-4 animate-in zoom-in-95 duration-150 font-sans">
            <div className="flex items-start justify-between pb-3 border-b border-[#1E293B]">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
                  <Zap className="w-4 h-4 text-amber-400" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Simulate attack vector</h3>
                  <p className="text-xs text-slate-400">
                    Inject a synthetic threat into the live SOC event bus
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsSimulateModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-medium text-slate-300">
                  Threat Category
                </label>
                <select
                  value={simThreatType}
                  onChange={(e) => setSimThreatType(e.target.value)}
                  className="w-full mt-1 px-3 py-2 rounded-lg bg-[#080B10] border border-[#1E293B] text-xs text-slate-200 focus:outline-none focus:border-amber-500"
                >
                  <option value="prompt_injection">Prompt Injection (Adversarial override)</option>
                  <option value="jailbreak">Adversarial Jailbreak (Roleplay bypass)</option>
                  <option value="data_leak">Sensitive Data / Secret Exfiltration</option>
                  <option value="tool_anomaly">Unauthorized Autonomous Tool Call</option>
                  <option value="api_abuse">API Security / BOLA Attempt</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-medium text-slate-300">
                  Severity Level
                </label>
                <select
                  value={simSeverity}
                  onChange={(e) => setSimSeverity(e.target.value)}
                  className="w-full mt-1 px-3 py-2 rounded-lg bg-[#080B10] border border-[#1E293B] text-xs text-slate-200 focus:outline-none focus:border-amber-500"
                >
                  <option value="critical">Critical</option>
                  <option value="high">High</option>
                  <option value="medium">Medium</option>
                  <option value="low">Low</option>
                </select>
              </div>

              <div className="p-3 rounded-lg bg-[#080B10] border border-[#1E293B] text-xs text-slate-400 leading-relaxed">
                This triggers a realistic telemetry event through the AgentGuard event pipeline, updating threat monitors and testing alerting integrations.
              </div>
            </div>

            <div className="pt-3 border-t border-[#1E293B] flex items-center justify-end gap-2">
              <button
                onClick={() => setIsSimulateModalOpen(false)}
                className="px-4 py-2 rounded-lg text-xs text-slate-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                onClick={handleTriggerSimulate}
                disabled={isSimulating}
                className="px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-black text-xs font-semibold cursor-pointer disabled:opacity-50"
              >
                {isSimulating ? "Injecting threat..." : "Trigger simulation"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
