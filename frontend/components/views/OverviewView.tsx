"use client";

import React, { useEffect, useState } from "react";
import {
  ShieldAlert,
  Flame,
  Activity,
  Cpu,
  TrendingUp,
  AlertTriangle,
  ArrowUpRight,
  ShieldCheck,
  CheckCircle2,
  Clock,
  RefreshCw,
  Check,
  ChevronRight,
  Sparkles,
  Sliders,
  Bell,
  Play,
  Layers,
} from "lucide-react";
import { api, OverviewMetrics } from "@/lib/api";
import { NavTab } from "../layout/Sidebar";
import { PageHeader } from "@/components/ui/PageHeader";
import { StatCard } from "@/components/ui/StatCard";

interface OverviewViewProps {
  onNavigate: (tab: NavTab) => void;
}

export default function OverviewView({ onNavigate }: OverviewViewProps) {
  const [data, setData] = useState<OverviewMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [checklistDismissed, setChecklistDismissed] = useState(false);
  const [completedSteps, setCompletedSteps] = useState<Record<string, boolean>>({
    "connect-app": true,
    "run-test": true,
    "review-policies": false,
    "setup-alerts": false,
  });

  const loadData = async () => {
    try {
      const res = await api.getOverview();
      setData(res);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 10000);
    return () => clearInterval(interval);
  }, []);

  const metrics = data || {
    total_security_events: 1842,
    critical_incidents: 2,
    threat_detection_rate: 98.4,
    active_applications: 4,
    security_posture_score: 94,
    threat_categories: [
      { name: "Prompt Injection", count: 48, color: "#EF4444" },
      { name: "Data / Secret Leakage", count: 24, color: "#F59E0B" },
      { name: "Adversarial Jailbreak", count: 18, color: "#38BDF8" },
      { name: "Unauthorized Tool Use", count: 12, color: "#A855F7" },
      { name: "API Abuse / BOLA", count: 6, color: "#10B981" },
    ],
    activity_timeline: [
      { time: "00:00", threats: 4, blocked: 4, anomalies: 1 },
      { time: "04:00", threats: 2, blocked: 2, anomalies: 0 },
      { time: "08:00", threats: 12, blocked: 11, anomalies: 3 },
      { time: "12:00", threats: 28, blocked: 26, anomalies: 5 },
      { time: "16:00", threats: 35, blocked: 33, anomalies: 8 },
      { time: "20:00", threats: 18, blocked: 17, anomalies: 2 },
    ],
  };

  const stepsCompletedCount = Object.values(completedSteps).filter(Boolean).length;

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 font-sans">
      {/* 1. Page Header with SOC Posture Badge in Header */}
      <PageHeader
        title="Security Posture & AI Threat Observability"
        description="Real-time multi-tenant monitoring for LLM applications, autonomous agents, and AI API endpoints."
        statusLine="Autonomous Defense Cluster Active · 4 Applications Protected"
        badge={{
          text: `SOC Posture: ${metrics.security_posture_score}/100 · Optimal`,
          variant: "emerald",
        }}
        actions={
          <div className="flex items-center gap-3">
            <button
              onClick={loadData}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#0F1622] hover:bg-[#151F2E] text-slate-300 border border-[#1E293B] text-xs font-sans transition-colors cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Refresh</span>
            </button>
            <button
              onClick={() => onNavigate("firewall")}
              className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-black font-semibold text-xs font-sans transition-all shadow-sm cursor-pointer"
            >
              <Flame className="w-3.5 h-3.5" />
              <span>Configure AI Firewall</span>
            </button>
          </div>
        }
      />

      {/* 2. First-Run Onboarding Checklist */}
      {!checklistDismissed && (
        <div className="p-5 rounded-xl bg-[#0F1622] border border-[#1E293B] space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-md bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
              </div>
              <h2 className="text-sm font-semibold text-white font-sans">
                Getting started with AgentGuard
              </h2>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-xs text-slate-400 font-sans">
                {stepsCompletedCount} of 4 completed
              </span>
              <button
                onClick={() => setChecklistDismissed(true)}
                className="text-xs text-slate-500 hover:text-slate-300 font-sans cursor-pointer"
              >
                Dismiss
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            {/* Step 1: Connect an App */}
            <div
              onClick={() => onNavigate("integrations")}
              className={`p-3.5 rounded-lg border transition-all cursor-pointer ${
                completedSteps["connect-app"]
                  ? "bg-[#080B10] border-emerald-500/30 hover:border-emerald-500/50"
                  : "bg-[#080B10] border-[#1E293B] hover:border-slate-600"
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-mono text-slate-400 font-semibold">
                  STEP 1
                </span>
                <div
                  className={`w-5 h-5 rounded-full flex items-center justify-center ${
                    completedSteps["connect-app"]
                      ? "bg-emerald-500/20 text-emerald-400"
                      : "bg-[#1E293B] text-slate-500"
                  }`}
                >
                  <Check className="w-3 h-3" />
                </div>
              </div>
              <div className="text-xs font-semibold text-white font-sans">
                Connect an app
              </div>
              <p className="text-[11px] text-slate-400 font-sans mt-1">
                Deploy proxy middleware or Python/TS SDK
              </p>
            </div>

            {/* Step 2: Run a Test */}
            <div
              onClick={() => onNavigate("redteam")}
              className={`p-3.5 rounded-lg border transition-all cursor-pointer ${
                completedSteps["run-test"]
                  ? "bg-[#080B10] border-emerald-500/30 hover:border-emerald-500/50"
                  : "bg-[#080B10] border-[#1E293B] hover:border-slate-600"
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-mono text-slate-400 font-semibold">
                  STEP 2
                </span>
                <div
                  className={`w-5 h-5 rounded-full flex items-center justify-center ${
                    completedSteps["run-test"]
                      ? "bg-emerald-500/20 text-emerald-400"
                      : "bg-[#1E293B] text-slate-500"
                  }`}
                >
                  <Check className="w-3 h-3" />
                </div>
              </div>
              <div className="text-xs font-semibold text-white font-sans">
                Run a test
              </div>
              <p className="text-[11px] text-slate-400 font-sans mt-1">
                Execute automated Red Team penetration suite
              </p>
            </div>

            {/* Step 3: Review Policies */}
            <div
              onClick={() => onNavigate("firewall")}
              className={`p-3.5 rounded-lg border transition-all cursor-pointer ${
                completedSteps["review-policies"]
                  ? "bg-[#080B10] border-emerald-500/30"
                  : "bg-[#080B10] border-[#1E293B] hover:border-slate-600"
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-mono text-slate-400 font-semibold">
                  STEP 3
                </span>
                <div
                  className={`w-5 h-5 rounded-full flex items-center justify-center ${
                    completedSteps["review-policies"]
                      ? "bg-emerald-500/20 text-emerald-400"
                      : "bg-[#1E293B] text-slate-500"
                  }`}
                >
                  <ChevronRight className="w-3 h-3" />
                </div>
              </div>
              <div className="text-xs font-semibold text-white font-sans">
                Review policies
              </div>
              <p className="text-[11px] text-slate-400 font-sans mt-1">
                Inspect deterministic rules and tune thresholds
              </p>
            </div>

            {/* Step 4: Set Up Alerts */}
            <div
              onClick={() => onNavigate("settings")}
              className={`p-3.5 rounded-lg border transition-all cursor-pointer ${
                completedSteps["setup-alerts"]
                  ? "bg-[#080B10] border-emerald-500/30"
                  : "bg-[#080B10] border-[#1E293B] hover:border-slate-600"
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-mono text-slate-400 font-semibold">
                  STEP 4
                </span>
                <div
                  className={`w-5 h-5 rounded-full flex items-center justify-center ${
                    completedSteps["setup-alerts"]
                      ? "bg-emerald-500/20 text-emerald-400"
                      : "bg-[#1E293B] text-slate-500"
                  }`}
                >
                  <ChevronRight className="w-3 h-3" />
                </div>
              </div>
              <div className="text-xs font-semibold text-white font-sans">
                Set up alerts
              </div>
              <p className="text-[11px] text-slate-400 font-sans mt-1">
                Connect Slack, PagerDuty, or webhook alerts
              </p>
            </div>
          </div>
        </div>
      )}

      {/* 3. KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard
          label="Security Posture"
          value={`${metrics.security_posture_score} / 100`}
          subValue="Optimal defense boundary"
          variant="emerald"
          trend={{ value: "+2 pts", isPositive: true, timeframe: "vs last week" }}
          sparkline={[88, 89, 91, 92, 94]}
        />

        <StatCard
          label="Total Detections"
          value={metrics.total_security_events.toLocaleString()}
          subValue="Across 4 active LLM apps"
          variant="sky"
          trend={{ value: "+14.2%", isPositive: true, timeframe: "vs 24h ago" }}
          sparkline={[1420, 1510, 1680, 1750, 1842]}
          onClick={() => onNavigate("threats")}
        />

        <StatCard
          label="Critical Incidents"
          value={metrics.critical_incidents}
          subValue="Investigate correlated traces"
          variant="red"
          trend={{ value: "2 active", isNeutral: true }}
          sparkline={[1, 3, 2, 4, 2]}
          onClick={() => onNavigate("forensics")}
        />

        <StatCard
          label="Interception Rate"
          value={`${metrics.threat_detection_rate}%`}
          subValue="Automated block & quarantine"
          variant="emerald"
          trend={{ value: "+0.6%", isPositive: true }}
          sparkline={[97.1, 97.5, 97.8, 98.2, 98.4]}
          onClick={() => onNavigate("threats")}
        />

        <StatCard
          label="Protected Apps"
          value={metrics.active_applications}
          subValue="OpenAI & Claude runtimes"
          variant="default"
          trend={{ value: "100% online", isPositive: true }}
          sparkline={[3, 3, 4, 4, 4]}
          onClick={() => onNavigate("agents")}
        />
      </div>

      {/* 4. Threat Distribution & Activity Timeline */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Threat Category Breakdown */}
        <div className="p-5 rounded-xl bg-[#0F1622] border border-[#1E293B] flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-white font-sans">
                Threat category breakdown
              </h2>
              <span className="text-[11px] text-slate-400 font-sans">30-day window</span>
            </div>
            <div className="space-y-3">
              {metrics.threat_categories.map((cat, i) => {
                const total = metrics.threat_categories.reduce((a, b) => a + b.count, 0);
                const pct = Math.round((cat.count / (total || 1)) * 100);
                return (
                  <div key={i} className="space-y-1">
                    <div className="flex items-center justify-between text-xs font-sans">
                      <span className="text-slate-300">{cat.name}</span>
                      <span className="text-slate-400 font-mono">
                        {cat.count} ({pct}%)
                      </span>
                    </div>
                    <div className="w-full h-1.5 rounded-full bg-[#080B10] overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{ width: `${pct}%`, backgroundColor: cat.color }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          <div className="mt-6 pt-4 border-t border-[#1E293B] flex items-center justify-between text-xs font-sans text-slate-400">
            <span>DLP & Injection = 66%</span>
            <button
              onClick={() => onNavigate("threats")}
              className="text-emerald-400 hover:underline flex items-center gap-1 cursor-pointer"
            >
              <span>View live feed</span>
              <ArrowUpRight className="w-3 h-3" />
            </button>
          </div>
        </div>

        {/* Hourly Threat Volume & Firewall Actions */}
        <div className="lg:col-span-2 p-5 rounded-xl bg-[#0F1622] border border-[#1E293B]">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-semibold text-white font-sans">
                Hourly threat volume & firewall actions
              </h2>
              <p className="text-xs text-slate-400 font-sans mt-0.5">
                Visualizing incoming attack frequency vs autonomous blocking
              </p>
            </div>
            <div className="flex items-center gap-4 text-xs font-sans">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded bg-red-400" />
                <span className="text-slate-300">Total Probes</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded bg-emerald-400" />
                <span className="text-slate-300">Blocked</span>
              </div>
            </div>
          </div>

          {/* Bar Chart */}
          <div className="h-56 flex items-end justify-between gap-4 pt-6 px-2">
            {metrics.activity_timeline.map((item, idx) => {
              const maxVal = Math.max(...metrics.activity_timeline.map((t) => t.threats)) || 40;
              const threatH = Math.round((item.threats / maxVal) * 100);
              const blockedH = Math.round((item.blocked / maxVal) * 100);
              return (
                <div
                  key={idx}
                  className="flex-1 flex flex-col items-center gap-2 h-full justify-end group"
                >
                  <div className="w-full flex items-end justify-center gap-1.5 h-44">
                    <div
                      className="w-1/2 max-w-[20px] rounded-t bg-red-500/80 group-hover:bg-red-500 transition-all relative"
                      style={{ height: `${threatH}%` }}
                    >
                      <span className="opacity-0 group-hover:opacity-100 absolute -top-6 left-1/2 -translate-x-1/2 px-1.5 py-0.5 rounded bg-black text-[10px] font-mono text-white whitespace-nowrap pointer-events-none transition-opacity">
                        {item.threats}
                      </span>
                    </div>
                    <div
                      className="w-1/2 max-w-[20px] rounded-t bg-emerald-500/80 group-hover:bg-emerald-500 transition-all"
                      style={{ height: `${blockedH}%` }}
                    />
                  </div>
                  <span className="text-[11px] font-mono text-slate-400">{item.time}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* 5. Bottom Grid: Monitored Applications & Automated Security Workflows */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monitored Applications Status */}
        <div className="p-5 rounded-xl bg-[#0F1622] border border-[#1E293B]">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-white font-sans">
              Monitored AI applications & agents
            </h2>
            <button
              onClick={() => onNavigate("agents")}
              className="text-xs text-emerald-400 hover:underline font-sans cursor-pointer flex items-center gap-1"
            >
              <span>View agent sessions</span>
              <ArrowUpRight className="w-3 h-3" />
            </button>
          </div>
          <div className="space-y-2.5">
            {[
              {
                name: "Customer Support Assistant",
                env: "production",
                model: "OpenAI GPT-4o",
                status: "PROTECTED",
                requests: "48.2k",
                blocks: "1,240",
              },
              {
                name: "CloudOps Autonomous Agent",
                env: "staging",
                model: "Claude-3.5-Sonnet",
                status: "QUARANTINED",
                requests: "12.4k",
                blocks: "430",
              },
              {
                name: "Executive Finance Copilot",
                env: "production",
                model: "OpenAI GPT-4o",
                status: "PROTECTED",
                requests: "9.1k",
                blocks: "112",
              },
            ].map((app, i) => (
              <div
                key={i}
                className="flex items-center justify-between p-3 rounded-lg bg-[#080B10] border border-[#1E293B] text-xs font-sans"
              >
                <div>
                  <div className="font-semibold text-slate-200 flex items-center gap-2">
                    {app.name}
                    <span className="px-1.5 py-0.2 rounded bg-[#101722] text-[10px] font-mono text-slate-400 border border-[#1E293B]">
                      {app.env}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-400 font-sans mt-0.5">
                    {app.model} • <span className="font-mono">{app.requests}</span> reqs •{" "}
                    <span className="font-mono text-red-400">{app.blocks}</span> blocked
                  </div>
                </div>
                <span
                  className={`px-2 py-0.5 rounded text-[10px] font-sans font-bold ${
                    app.status === "PROTECTED"
                      ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30"
                      : "bg-purple-500/10 text-purple-400 border border-purple-500/30"
                  }`}
                >
                  {app.status}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Launchpad Workflows */}
        <div className="p-5 rounded-xl bg-[#0F1622] border border-[#1E293B] flex flex-col justify-between">
          <div>
            <h2 className="text-sm font-semibold text-white font-sans mb-1">
              Automated security workflows
            </h2>
            <p className="text-xs text-slate-400 font-sans mb-4">
              Trigger authorized adversarial testing suites, regression benchmarks, or compliance audits.
            </p>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => onNavigate("redteam")}
                className="p-3 rounded-lg bg-[#080B10] border border-[#1E293B] hover:border-emerald-500/40 text-left transition-all group cursor-pointer"
              >
                <div className="text-xs font-semibold text-slate-200 group-hover:text-emerald-400 flex items-center justify-between">
                  Red Team Lab
                  <ArrowUpRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-emerald-400" />
                </div>
                <p className="text-[11px] text-slate-400 mt-1 font-sans">
                  Run OWASP LLM injection & jailbreak benchmark suites
                </p>
              </button>

              <button
                onClick={() => onNavigate("scanner")}
                className="p-3 rounded-lg bg-[#080B10] border border-[#1E293B] hover:border-sky-500/40 text-left transition-all group cursor-pointer"
              >
                <div className="text-xs font-semibold text-slate-200 group-hover:text-sky-400 flex items-center justify-between">
                  Vulnerability Scan
                  <ArrowUpRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-sky-400" />
                </div>
                <p className="text-[11px] text-slate-400 mt-1 font-sans">
                  Scan APIs for BOLA, broken auth & secret leaks
                </p>
              </button>

              <button
                onClick={() => onNavigate("terminal")}
                className="p-3 rounded-lg bg-[#080B10] border border-[#1E293B] hover:border-purple-400/40 text-left transition-all group cursor-pointer"
              >
                <div className="text-xs font-semibold text-slate-200 group-hover:text-purple-400 flex items-center justify-between">
                  Security Terminal
                  <ArrowUpRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-purple-400" />
                </div>
                <p className="text-[11px] text-slate-400 mt-1 font-sans">
                  Interactive agentguard CLI terminal shell
                </p>
              </button>

              <button
                onClick={() => onNavigate("compliance")}
                className="p-3 rounded-lg bg-[#080B10] border border-[#1E293B] hover:border-amber-400/40 text-left transition-all group cursor-pointer"
              >
                <div className="text-xs font-semibold text-slate-200 group-hover:text-amber-400 flex items-center justify-between">
                  Compliance Report
                  <ArrowUpRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-amber-400" />
                </div>
                <p className="text-[11px] text-slate-400 mt-1 font-sans">
                  Export OWASP LLM & NIST AI RMF assessment
                </p>
              </button>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-[#1E293B] flex items-center justify-between text-[11px] font-sans text-slate-500">
            <span>Environment: <strong className="text-slate-400">Production</strong></span>
            <span>Policy Engine: <strong className="text-slate-400 font-mono">v1.4.2 Active</strong></span>
          </div>
        </div>
      </div>
    </div>
  );
}
