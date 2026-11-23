"use client";

import React, { useState, useEffect } from "react";
import {
  Search,
  Terminal,
  Flame,
  Crosshair,
  Shield,
  Activity,
  X,
  KeyRound,
  Bot,
  Globe2,
  GitFork,
  FileSearch,
  BrainCircuit,
  FileCheck2,
  PlugZap,
  Settings,
  Zap,
  CheckCircle2,
} from "lucide-react";
import { NavTab } from "./Sidebar";
import { api } from "@/lib/api";

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectTab: (tab: NavTab) => void;
  onTriggerAction?: (action: string) => void;
}

export default function CommandPalette({
  isOpen,
  onClose,
  onSelectTab,
}: CommandPaletteProps) {
  const [query, setQuery] = useState("");
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        onClose();
      }
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const ALL_ITEMS = [
    // Quick Actions
    {
      label: "Simulate Critical Threat Injection",
      desc: "Injects sample prompt injection to observe live SOC detection",
      icon: Zap,
      category: "ACTIONS",
      action: async () => {
        try {
          await api.simulateThreat("prompt_injection", "critical");
          setToast("Simulated threat published! Navigating to Live Threat Monitor...");
          setTimeout(() => {
            onSelectTab("threats");
            onClose();
          }, 700);
        } catch (e) {
          console.error(e);
        }
      },
    },
    {
      label: "Set AI Firewall Mode: ENFORCE (Active Blocking)",
      desc: "Blocks prompts, redacts secrets, quarantines rogue sessions",
      icon: Flame,
      category: "ACTIONS",
      action: async () => {
        await api.updateFirewallMode("enforce");
        setToast("AI Firewall enforcement mode set to ENFORCE");
        setTimeout(() => onClose(), 600);
      },
    },
    {
      label: "Set AI Firewall Mode: MONITOR (Passive Audit)",
      desc: "Logs adversarial events without blocking live requests",
      icon: Flame,
      category: "ACTIONS",
      action: async () => {
        await api.updateFirewallMode("monitor");
        setToast("AI Firewall enforcement mode set to MONITOR");
        setTimeout(() => onClose(), 600);
      },
    },

    // Navigation Tabs
    { label: "Overview & Posture Score", desc: "Executive KPI dashboard and security score", icon: Shield, tab: "overview" as NavTab, category: "NAVIGATION" },
    { label: "Live Threat Monitor", desc: "Real-time streaming SOC event feed", icon: Activity, tab: "threats" as NavTab, category: "NAVIGATION" },
    { label: "AI Firewall & Real-Time Inspection", desc: "Active reverse proxy and policy rule engine", icon: Flame, tab: "firewall" as NavTab, category: "NAVIGATION" },
    { label: "API Security & Fuzzing", desc: "OWASP API top 10 and controlled parameter fuzzing", icon: KeyRound, tab: "api_sec" as NavTab, category: "NAVIGATION" },
    { label: "Agent Behaviour & Tool Monitor", desc: "Autonomous agent execution sequence guardrails", icon: Bot, tab: "agents" as NavTab, category: "NAVIGATION" },
    { label: "Vulnerability Scanner", desc: "OWASP LLM and hardcoded secret scanning", icon: Search, tab: "scanner" as NavTab, category: "NAVIGATION" },
    { label: "Red Team Lab", desc: "Automated adversarial benchmark testing suites", icon: Crosshair, tab: "redteam" as NavTab, category: "NAVIGATION" },
    { label: "Attack Intelligence", desc: "Global IOC threat feed and IP reputation lookup", icon: Globe2, tab: "intel" as NavTab, category: "NAVIGATION" },
    { label: "Attack Topology Graph", desc: "Interactive ingress-to-asset vector visualization", icon: GitFork, tab: "graph" as NavTab, category: "NAVIGATION" },
    { label: "Incident Forensics", desc: "Correlated incidents and one-click remediation", icon: FileSearch, tab: "forensics" as NavTab, category: "NAVIGATION" },
    { label: "ML Anomaly Analytics", desc: "Unsupervised Isolation Forest behavioral models", icon: BrainCircuit, tab: "ml_analytics" as NavTab, category: "NAVIGATION" },
    { label: "Compliance Assessment Reports", desc: "Standardized OWASP LLM and NIST AI RMF reports", icon: FileCheck2, tab: "compliance" as NavTab, category: "NAVIGATION" },
    { label: "Ecosystem Integrations", desc: "Slack, Splunk, Datadog, PagerDuty webhooks", icon: PlugZap, tab: "integrations" as NavTab, category: "NAVIGATION" },
    { label: "Developer Terminal", desc: "Interactive agentguard CLI console", icon: Terminal, tab: "terminal" as NavTab, category: "NAVIGATION" },
    { label: "Organization Settings & Keys", desc: "API keys, team roles, and subscription tier", icon: Settings, tab: "settings" as NavTab, category: "NAVIGATION" },
  ];

  const filtered = ALL_ITEMS.filter(
    (a) =>
      a.label.toLowerCase().includes(query.toLowerCase()) ||
      a.desc?.toLowerCase().includes(query.toLowerCase()) ||
      a.category.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div
      className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-start justify-center pt-20 px-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-xl bg-[#121316] border border-[#1F2128] rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Input Bar */}
        <div className="flex items-center px-4 py-3.5 border-b border-[#1F2128] gap-3">
          <Search className="w-4 h-4 text-[#8A8D93] shrink-0" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Type a command, tool, or view name..."
            className="flex-1 bg-transparent text-sm text-[#EDEBE6] placeholder:text-[#565961] focus:outline-none font-sans"
            autoFocus
          />
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-md text-[#8A8D93] hover:text-[#EDEBE6] cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {toast && (
          <div className="p-2.5 bg-[#C6F432]/10 border-b border-[#C6F432]/30 text-[#C6F432] text-xs font-sans flex items-center gap-2 px-4">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>{toast}</span>
          </div>
        )}

        {/* Results List */}
        <div className="p-2 max-h-96 overflow-y-auto space-y-1">
          {filtered.length > 0 ? (
            filtered.map((item, idx) => {
              const Icon = item.icon;
              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    if (item.action) {
                      item.action();
                    } else if (item.tab) {
                      onSelectTab(item.tab);
                      onClose();
                    }
                  }}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs text-[#8A8D93] hover:text-[#EDEBE6] hover:bg-[#15171C] transition-colors text-left group cursor-pointer"
                >
                  <div
                    className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 border ${
                      item.category === "ACTIONS"
                        ? "bg-[#FF443A]/10 border-[#FF443A]/25 text-[#FF443A]"
                        : "bg-[#C6F432]/10 border-[#C6F432]/25 text-[#C6F432]"
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-sans font-medium text-[#EDEBE6] truncate">
                      {item.label}
                    </div>
                    {item.desc && (
                      <div className="text-[11px] text-[#565961] truncate font-sans">
                        {item.desc}
                      </div>
                    )}
                  </div>
                  <span
                    className={`text-[9px] px-1.5 py-0.5 rounded border uppercase tracking-wider font-mono font-bold ${
                      item.category === "ACTIONS"
                        ? "text-[#FF443A] bg-[#FF443A]/10 border-[#FF443A]/30"
                        : "text-[#8A8D93] bg-[#0A0B0D] border-[#1F2128]"
                    }`}
                  >
                    {item.category}
                  </span>
                </button>
              );
            })
          ) : (
            <div className="p-6 text-center text-xs font-sans text-[#565961]">
              No matching commands or actions found for "{query}".
            </div>
          )}
        </div>

        {/* Footer hints */}
        <div className="px-4 py-2 border-t border-[#1F2128] bg-[#0A0B0D] flex items-center justify-between text-[11px] font-sans text-[#565961]">
          <span>Press ESC to dismiss</span>
          <span className="font-mono">AgentGuard v1.4.2</span>
        </div>
      </div>
    </div>
  );
}
