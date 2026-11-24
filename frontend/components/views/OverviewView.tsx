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
import dynamic from "next/dynamic";
import { BrushableTimeline } from "./overview/BrushableTimeline";
import { ThreatHeatmap } from "./overview/ThreatHeatmap";
import { SankeyPipeline } from "./overview/SankeyPipeline";

const AttackGlobeCanvas = dynamic(
  () => import("@/components/3d/AttackGlobeCanvas"),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-[320px] rounded-2xl bg-[#0A0B0D] border border-[#1F2128] flex items-center justify-center font-mono text-xs text-[#8A8D93]">
        INITIALIZING 3D ATTACK GLOBE...
      </div>
    ),
  }
);

interface OverviewViewProps {
  onNavigate: (tab: NavTab) => void;
}

export default function OverviewView({ onNavigate }: OverviewViewProps) {
  const [data, setData] = useState<OverviewMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [checklistDismissed, setChecklistDismissed] = useState(false);
  const [selectedOrigin, setSelectedOrigin] = useState<string | null>(null);
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
      { name: "Prompt Injection", count: 48, color: "#FF443A" },
      { name: "Data / Secret Leakage", count: 24, color: "#FF9F0A" },
      { name: "Adversarial Jailbreak", count: 18, color: "#64D2FF" },
      { name: "Unauthorized Tool Use", count: 12, color: "#C6F432" },
      { name: "API Abuse / BOLA", count: 6, color: "#30D158" },
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
      {/* 1. Page Header with SOC Posture Badge */}
      <PageHeader
        title="Security Posture & AI Threat Observability"
        description="Continuous deterministic protection for LLM prompts, autonomous agents, and AI API endpoints."
        statusLine="Autonomous Defense Cluster Active · 4 Applications Protected"
        badge={{
          text: `SOC Posture: ${metrics.security_posture_score}/100 · Optimal`,
          variant: "lime",
        }}
        actions={
          <div className="flex items-center gap-2.5">
            <button
              onClick={loadData}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#121316] hover:bg-[#15171C] text-[#8A8D93] hover:text-[#EDEBE6] border border-[#1F2128] text-xs font-sans transition-colors cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Refresh</span>
            </button>
            <button
              onClick={() => onNavigate("firewall")}
              className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-[#C6F432] hover:bg-[#b5e028] text-black font-semibold text-xs font-sans transition-all shadow-sm cursor-pointer"
            >
              <Flame className="w-3.5 h-3.5" />
              <span>Configure AI firewall</span>
            </button>
          </div>
        }
      />

      {/* 2. Onboarding Checklist */}
      {!checklistDismissed && (
        <div className="p-5 rounded-2xl bg-[#121316] border border-[#1F2128] space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg bg-[#C6F432]/10 border border-[#C6F432]/20 flex items-center justify-center">
                <Sparkles className="w-3.5 h-3.5 text-[#C6F432]" />
              </div>
              <h2 className="text-sm font-semibold text-[#EDEBE6] font-display">
                Getting started with AgentGuard
              </h2>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-xs text-[#8A8D93] font-sans">
                {stepsCompletedCount} of 4 completed
              </span>
              <button
                onClick={() => setChecklistDismissed(true)}
                className="text-xs text-[#565961] hover:text-[#8A8D93] font-sans cursor-pointer"
              >
                Dismiss
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            {/* Step 1: Connect an App */}
            <div
              onClick={() => onNavigate("integrations")}
              className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
                completedSteps["connect-app"]
                  ? "bg-[#0A0B0D] border-[#C6F432]/30 hover:border-[#C6F432]/50"
                  : "bg-[#0A0B0D] border-[#1F2128] hover:border-[#2B2E38]"
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-mono text-[#8A8D93] font-semibold">
                  STEP 1
                </span>
                <div
                  className={`w-5 h-5 rounded-full flex items-center justify-center ${
                    completedSteps["connect-app"]
                      ? "bg-[#C6F432]/20 text-[#C6F432]"
                      : "bg-[#1F2128] text-[#565961]"
                  }`}
                >
                  <Check className="w-3 h-3" />
                </div>
              </div>
              <div className="text-xs font-semibold text-[#EDEBE6] font-sans">
                Connect an app
              </div>
              <p className="text-[11px] text-[#8A8D93] font-sans mt-1">
                Deploy proxy middleware or Python/TS SDK
              </p>
            </div>

            {/* Step 2: Run a Test */}
            <div
              onClick={() => onNavigate("redteam")}
              className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
                completedSteps["run-test"]
                  ? "bg-[#0A0B0D] border-[#C6F432]/30 hover:border-[#C6F432]/50"
                  : "bg-[#0A0B0D] border-[#1F2128] hover:border-[#2B2E38]"
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-mono text-[#8A8D93] font-semibold">
                  STEP 2
                </span>
                <div
                  className={`w-5 h-5 rounded-full flex items-center justify-center ${
                    completedSteps["run-test"]
                      ? "bg-[#C6F432]/20 text-[#C6F432]"
                      : "bg-[#1F2128] text-[#565961]"
                  }`}
                >
                  <Check className="w-3 h-3" />
                </div>
              </div>
              <div className="text-xs font-semibold text-[#EDEBE6] font-sans">
                Run a test
              </div>
              <p className="text-[11px] text-[#8A8D93] font-sans mt-1">
                Execute automated Red Team penetration suite
              </p>
            </div>

            {/* Step 3: Review Policies */}
            <div
              onClick={() => onNavigate("firewall")}
              className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
                completedSteps["review-policies"]
                  ? "bg-[#0A0B0D] border-[#C6F432]/30"
                  : "bg-[#0A0B0D] border-[#1F2128] hover:border-[#2B2E38]"
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-mono text-[#8A8D93] font-semibold">
                  STEP 3
                </span>
                <div
                  className={`w-5 h-5 rounded-full flex items-center justify-center ${
                    completedSteps["review-policies"]
                      ? "bg-[#C6F432]/20 text-[#C6F432]"
                      : "bg-[#1F2128] text-[#565961]"
                  }`}
                >
                  <ChevronRight className="w-3 h-3" />
                </div>
              </div>
              <div className="text-xs font-semibold text-[#EDEBE6] font-sans">
                Review policies
              </div>
              <p className="text-[11px] text-[#8A8D93] font-sans mt-1">
                Inspect deterministic rules and tune thresholds
              </p>
            </div>

            {/* Step 4: Set Up Alerts */}
            <div
              onClick={() => onNavigate("settings")}
              className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
                completedSteps["setup-alerts"]
                  ? "bg-[#0A0B0D] border-[#C6F432]/30"
                  : "bg-[#0A0B0D] border-[#1F2128] hover:border-[#2B2E38]"
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-mono text-[#8A8D93] font-semibold">
                  STEP 4
                </span>
                <div
                  className={`w-5 h-5 rounded-full flex items-center justify-center ${
                    completedSteps["setup-alerts"]
                      ? "bg-[#C6F432]/20 text-[#C6F432]"
                      : "bg-[#1F2128] text-[#565961]"
                  }`}
                >
                  <ChevronRight className="w-3 h-3" />
                </div>
              </div>
              <div className="text-xs font-semibold text-[#EDEBE6] font-sans">
                Set up alerts
              </div>
              <p className="text-[11px] text-[#8A8D93] font-sans mt-1">
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
          variant="lime"
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

      {/* 4. Threat Distribution & Interactive 3D Attack Globe */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Interactive 3D Globe with click-to-filter (5 cols) */}
        <div className="lg:col-span-5 flex flex-col justify-between">
          <AttackGlobeCanvas onSelectNode={(node) => setSelectedOrigin(node.name)} />
          {selectedOrigin && (
            <div className="mt-2 px-3 py-1.5 rounded-xl bg-[#C6F432]/10 border border-[#C6F432]/30 flex items-center justify-between text-xs font-mono text-[#C6F432]">
              <span>FILTERED BY ORIGIN: {selectedOrigin}</span>
              <button
                onClick={() => setSelectedOrigin(null)}
                className="underline hover:text-[#EDEBE6] cursor-pointer ml-2 text-[11px]"
              >
                Clear filter
              </button>
            </div>
          )}
        </div>

        {/* Threat Category Breakdown (7 cols) */}
        <div className="lg:col-span-7 p-5 rounded-2xl bg-[#121316] border border-[#1F2128] flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-[#EDEBE6] font-display">
                Threat category breakdown
              </h2>
              <span className="text-[11px] text-[#8A8D93] font-sans">30-day window</span>
            </div>
            <div className="space-y-3">
              {metrics.threat_categories.map((cat, i) => {
                const total = metrics.threat_categories.reduce((a, b) => a + b.count, 0);
                const pct = Math.round((cat.count / (total || 1)) * 100);
                return (
                  <div key={i} className="space-y-1">
                    <div className="flex items-center justify-between text-xs font-sans">
                      <span className="text-[#EDEBE6]">{cat.name}</span>
                      <span className="text-[#8A8D93] font-mono">
                        {cat.count} ({pct}%)
                      </span>
                    </div>
                    <div className="w-full h-1.5 rounded-full bg-[#0A0B0D] overflow-hidden">
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
          <div className="mt-6 pt-4 border-t border-[#1F2128] flex items-center justify-between text-xs font-sans text-[#8A8D93]">
            <span>DLP & Injection = 66%</span>
            <button
              onClick={() => onNavigate("threats")}
              className="text-[#C6F432] hover:underline flex items-center gap-1 cursor-pointer"
            >
              <span>View live feed</span>
              <ArrowUpRight className="w-3 h-3" />
            </button>
          </div>
        </div>

        {/* Sankey Flow Diagram */}
        <div className="lg:col-span-12">
          <SankeyPipeline />
        </div>

        {/* Brushable Threat Timeline */}
        <div className="lg:col-span-12 p-5 rounded-2xl bg-[#121316] border border-[#1F2128]">
          <BrushableTimeline />
        </div>

        {/* 24-Hour Attack Category Heatmap */}
        <div className="lg:col-span-12 p-5 rounded-2xl bg-[#121316] border border-[#1F2128]">
          <ThreatHeatmap />
        </div>
      </div>

      {/* 5. Bottom Grid: Monitored Applications & Automated Security Workflows */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monitored Applications Status */}
        <div className="p-5 rounded-2xl bg-[#121316] border border-[#1F2128]">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-[#EDEBE6] font-display">
              Monitored AI applications & agents
            </h2>
            <button
              onClick={() => onNavigate("agents")}
              className="text-xs text-[#C6F432] hover:underline font-sans cursor-pointer flex items-center gap-1"
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
                className="flex items-center justify-between p-3 rounded-xl bg-[#0A0B0D] border border-[#1F2128] text-xs font-sans"
              >
                <div>
                  <div className="font-semibold text-[#EDEBE6] flex items-center gap-2 font-display">
                    {app.name}
                    <span className="px-1.5 py-0.2 rounded bg-[#15171C] text-[10px] font-mono text-[#8A8D93] border border-[#1F2128]">
                      {app.env}
                    </span>
                  </div>
                  <div className="text-[11px] text-[#8A8D93] font-sans mt-0.5">
                    {app.model} • <span className="font-mono">{app.requests}</span> reqs •{" "}
                    <span className="font-mono text-[#FF443A]">{app.blocks}</span> blocked
                  </div>
                </div>
                <span
                  className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                    app.status === "PROTECTED"
                      ? "bg-[#30D158]/10 text-[#30D158] border border-[#30D158]/30"
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
        <div className="p-5 rounded-2xl bg-[#121316] border border-[#1F2128] flex flex-col justify-between">
          <div>
            <h2 className="text-sm font-semibold text-[#EDEBE6] font-display mb-1">
              Automated security workflows
            </h2>
            <p className="text-xs text-[#8A8D93] font-sans mb-4">
              Trigger authorized adversarial testing suites, regression benchmarks, or compliance audits.
            </p>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => onNavigate("redteam")}
                className="p-3 rounded-xl bg-[#0A0B0D] border border-[#1F2128] hover:border-[#C6F432]/40 text-left transition-all group cursor-pointer"
              >
                <div className="text-xs font-semibold text-[#EDEBE6] group-hover:text-[#C6F432] flex items-center justify-between font-display">
                  Red Team Lab
                  <ArrowUpRight className="w-3.5 h-3.5 text-[#565961] group-hover:text-[#C6F432]" />
                </div>
                <p className="text-[11px] text-[#8A8D93] mt-1 font-sans">
                  Run OWASP LLM injection & jailbreak benchmark suites
                </p>
              </button>

              <button
                onClick={() => onNavigate("scanner")}
                className="p-3 rounded-xl bg-[#0A0B0D] border border-[#1F2128] hover:border-[#64D2FF]/40 text-left transition-all group cursor-pointer"
              >
                <div className="text-xs font-semibold text-[#EDEBE6] group-hover:text-[#64D2FF] flex items-center justify-between font-display">
                  Vulnerability Scan
                  <ArrowUpRight className="w-3.5 h-3.5 text-[#565961] group-hover:text-[#64D2FF]" />
                </div>
                <p className="text-[11px] text-[#8A8D93] mt-1 font-sans">
                  Scan APIs for BOLA, broken auth & secret leaks
                </p>
              </button>

              <button
                onClick={() => onNavigate("terminal")}
                className="p-3 rounded-xl bg-[#0A0B0D] border border-[#1F2128] hover:border-purple-400/40 text-left transition-all group cursor-pointer"
              >
                <div className="text-xs font-semibold text-[#EDEBE6] group-hover:text-purple-400 flex items-center justify-between font-display">
                  Security Terminal
                  <ArrowUpRight className="w-3.5 h-3.5 text-[#565961] group-hover:text-purple-400" />
                </div>
                <p className="text-[11px] text-[#8A8D93] mt-1 font-sans">
                  Interactive agentguard CLI terminal shell
                </p>
              </button>

              <button
                onClick={() => onNavigate("compliance")}
                className="p-3 rounded-xl bg-[#0A0B0D] border border-[#1F2128] hover:border-[#FF9F0A]/40 text-left transition-all group cursor-pointer"
              >
                <div className="text-xs font-semibold text-[#EDEBE6] group-hover:text-[#FF9F0A] flex items-center justify-between font-display">
                  Compliance Report
                  <ArrowUpRight className="w-3.5 h-3.5 text-[#565961] group-hover:text-[#FF9F0A]" />
                </div>
                <p className="text-[11px] text-[#8A8D93] mt-1 font-sans">
                  Export OWASP LLM & NIST AI RMF assessment
                </p>
              </button>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-[#1F2128] flex items-center justify-between text-[11px] font-sans text-[#565961]">
            <span>Environment: <strong className="text-[#8A8D93]">Production</strong></span>
            <span>Policy Engine: <strong className="text-[#8A8D93] font-mono">v1.4.2 Active</strong></span>
          </div>
        </div>
      </div>
    </div>
  );
}
