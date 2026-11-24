"use client";

import React, { useState, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import Sidebar, { NavTab } from "@/components/layout/Sidebar";
import Header from "@/components/layout/Header";
import CommandPalette from "@/components/layout/CommandPalette";
import { LandingView } from "@/components/landing/LandingView";
import { OnboardingTour } from "@/components/ui/OnboardingTour";

// Views
import OverviewView from "@/components/views/OverviewView";
import ThreatMonitorView from "@/components/views/ThreatMonitorView";
import FirewallView from "@/components/views/FirewallView";
import ScannerView from "@/components/views/ScannerView";
import RedTeamView from "@/components/views/RedTeamView";
import ApiSecurityView from "@/components/views/ApiSecurityView";
import AgentBehaviourView from "@/components/views/AgentBehaviourView";
import AttackIntelligenceView from "@/components/views/AttackIntelligenceView";
import AttackGraphView from "@/components/attack-graph/AttackGraphView";
import IncidentForensicsView from "@/components/views/IncidentForensicsView";
import MLAnalyticsView from "@/components/views/MLAnalyticsView";
import ComplianceReportsView from "@/components/views/ComplianceReportsView";
import IntegrationsView from "@/components/views/IntegrationsView";
import XTermTerminal from "@/components/terminal/XTermTerminal";
import SettingsView from "@/components/views/SettingsView";

export default function Home() {
  const [viewMode, setViewMode] = useState<"landing" | "console">("landing");
  const [currentTab, setCurrentTab] = useState<NavTab>("overview");
  const [collapsed, setCollapsed] = useState(false);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [isTourOpen, setIsTourOpen] = useState(false);

  // Global Cmd+K / Ctrl+K shortcut to toggle Command Palette
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setIsCommandPaletteOpen((prev) => !prev);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Sync tab & mode from URL query param if present
  React.useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const tabParam = params.get("tab") as NavTab;
      const modeParam = params.get("mode");

      if (modeParam === "console" || tabParam) {
        setViewMode("console");
      }

      const validTabs: NavTab[] = [
        "overview",
        "threats",
        "firewall",
        "scanner",
        "redteam",
        "api_sec",
        "agents",
        "intel",
        "graph",
        "forensics",
        "ml_analytics",
        "compliance",
        "integrations",
        "terminal",
        "settings",
      ];
      if (tabParam && validTabs.includes(tabParam)) {
        setCurrentTab(tabParam);
      }
    }
  }, []);

  const handleTabChange = (tab: NavTab) => {
    setCurrentTab(tab);
    if (typeof window !== "undefined") {
      const url = new URL(window.location.href);
      url.searchParams.set("tab", tab);
      url.searchParams.set("mode", "console");
      window.history.replaceState({}, "", url.toString());
    }
  };

  const handleSwitchMode = (mode: "landing" | "console") => {
    setViewMode(mode);
    if (typeof window !== "undefined") {
      const url = new URL(window.location.href);
      if (mode === "landing") {
        url.searchParams.delete("mode");
        url.searchParams.delete("tab");
      } else {
        url.searchParams.set("mode", "console");
        url.searchParams.set("tab", currentTab);
      }
      window.history.replaceState({}, "", url.toString());
    }
  };

  // Auto-collapse sidebar below 1100px per UX design requirements
  React.useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 1100) {
        setCollapsed(true);
      }
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  if (viewMode === "landing") {
    return <LandingView onEnterConsole={() => handleSwitchMode("console")} />;
  }

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#0A0B0D] text-[#EDEBE6]">
      {/* Collapsible Left Sidebar */}
      <Sidebar
        currentTab={currentTab}
        onTabChange={handleTabChange}
        collapsed={collapsed}
        onToggleCollapse={() => setCollapsed(!collapsed)}
      />

      {/* Main Workspace */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Header */}
        <Header
          onOpenTerminal={() => handleTabChange("terminal")}
          onOpenCommandPalette={() => setIsCommandPaletteOpen(true)}
          onNavigate={(tab) => handleTabChange(tab as NavTab)}
          onSwitchToLanding={() => handleSwitchMode("landing")}
          onStartTour={() => setIsTourOpen(true)}
        />

        {/* Dynamic Main Page Content with 180ms Smooth Transitions */}
        <main className="flex-1 overflow-y-auto p-6 bg-[#0A0B0D] bg-noise">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentTab}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
            >
              {currentTab === "overview" && <OverviewView onNavigate={handleTabChange} />}
              {currentTab === "threats" && <ThreatMonitorView />}
              {currentTab === "firewall" && <FirewallView />}
              {currentTab === "scanner" && <ScannerView />}
              {currentTab === "redteam" && <RedTeamView />}
              {currentTab === "api_sec" && <ApiSecurityView />}
              {currentTab === "agents" && <AgentBehaviourView />}
              {currentTab === "intel" && <AttackIntelligenceView />}
              {currentTab === "graph" && <AttackGraphView />}
              {currentTab === "forensics" && <IncidentForensicsView />}
              {currentTab === "ml_analytics" && <MLAnalyticsView />}
              {currentTab === "compliance" && <ComplianceReportsView />}
              {currentTab === "integrations" && <IntegrationsView />}
              {currentTab === "terminal" && <XTermTerminal />}
              {currentTab === "settings" && <SettingsView />}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      {/* Cmd+K Global Command Palette */}
      <CommandPalette
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
        onSelectTab={handleTabChange}
        onStartTour={() => setIsTourOpen(true)}
      />

      {/* Interactive First-Run Spotlight Tour */}
      <OnboardingTour
        isOpen={isTourOpen}
        onClose={() => setIsTourOpen(false)}
        onNavigate={handleTabChange}
      />
    </div>
  );
}
