"use client";

import React, { useState } from "react";
import Sidebar, { NavTab } from "@/components/layout/Sidebar";
import Header from "@/components/layout/Header";
import CommandPalette from "@/components/layout/CommandPalette";

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
  const [currentTab, setCurrentTab] = useState<NavTab>("overview");
  const [collapsed, setCollapsed] = useState(false);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);

  // Sync tab from URL query param if present
  React.useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const tabParam = params.get("tab") as NavTab;
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

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#080B10] text-slate-200">
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
        />

        {/* Dynamic Main Page Content */}
        <main className="flex-1 overflow-y-auto p-6 bg-[#080B10]">
          {currentTab === "overview" && <OverviewView onNavigate={handleTabChange} />}
          {currentTab === "threats" && <ThreatMonitorView />}
          {currentTab === "firewall" && <FirewallView onNavigate={handleTabChange} />}
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
          {currentTab === "terminal" && (
            <div className="h-[calc(100vh-120px)]">
              <XTermTerminal />
            </div>
          )}
          {currentTab === "settings" && <SettingsView />}
        </main>
      </div>

      {/* Global Command Palette */}
      <CommandPalette
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
        onSelectTab={handleTabChange}
      />
    </div>
  );
}
