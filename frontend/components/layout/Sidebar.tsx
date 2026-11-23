"use client";

import React, { useState, useEffect } from "react";
import {
    Shield,
    Activity,
    Flame,
    Search,
    Crosshair,
    KeyRound,
    Bot,
    Globe2,
    GitFork,
    FileSearch,
    BrainCircuit,
    FileCheck2,
    PlugZap,
    Terminal,
    Settings,
    ChevronDown,
    ChevronRight,
    ShieldAlert,
    PanelLeftClose,
    PanelLeftOpen,
} from "lucide-react";

export type NavTab =
    | "overview"
    | "threats"
    | "firewall"
    | "api_sec"
    | "agents"
    | "scanner"
    | "redteam"
    | "intel"
    | "graph"
    | "forensics"
    | "ml_analytics"
    | "compliance"
    | "integrations"
    | "terminal"
    | "settings";

interface NavItem {
    id: NavTab;
    label: string;
    icon: any;
    badge?: string;
    badgeVariant?: "lime" | "amber" | "red" | "neutral";
}

interface NavSection {
    title: string;
    items: NavItem[];
}

const NAV_SECTIONS: NavSection[] = [
    {
        title: "Monitor",
        items: [
            { id: "overview", label: "Overview", icon: Shield },
            { id: "threats", label: "Live Threat Monitor", icon: Activity, badge: "LIVE", badgeVariant: "lime" },
        ],
    },
    {
        title: "Protect",
        items: [
            { id: "firewall", label: "AI Firewall", icon: Flame, badge: "ENFORCE", badgeVariant: "lime" },
            { id: "api_sec", label: "API Security", icon: KeyRound },
            { id: "agents", label: "Agent Behaviour", icon: Bot },
        ],
    },
    {
        title: "Test",
        items: [
            { id: "scanner", label: "Vulnerability Scanner", icon: Search },
            { id: "redteam", label: "Red Team Lab", icon: Crosshair },
        ],
    },
    {
        title: "Investigate",
        items: [
            { id: "intel", label: "Attack Intelligence", icon: Globe2 },
            { id: "graph", label: "Attack Graph", icon: GitFork },
            { id: "forensics", label: "Incident Forensics", icon: FileSearch, badge: "2 open", badgeVariant: "amber" },
            { id: "ml_analytics", label: "ML Analytics", icon: BrainCircuit },
        ],
    },
    {
        title: "Govern",
        items: [
            { id: "compliance", label: "Compliance Reports", icon: FileCheck2 },
            { id: "integrations", label: "Integrations", icon: PlugZap },
        ],
    },
    {
        title: "System",
        items: [
            { id: "terminal", label: "Developer Terminal", icon: Terminal },
            { id: "settings", label: "Settings", icon: Settings },
        ],
    },
];

interface SidebarProps {
    currentTab: NavTab;
    onTabChange: (tab: NavTab) => void;
    collapsed: boolean;
    onToggleCollapse: () => void;
}

export default function Sidebar({
    currentTab,
    onTabChange,
    collapsed,
    onToggleCollapse,
}: SidebarProps) {
    const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>({});

    useEffect(() => {
        try {
            const saved = localStorage.getItem("agentguard_sidebar_sections");
            if (saved) {
                setCollapsedSections(JSON.parse(saved));
            }
        } catch {
            // ignore
        }
    }, []);

    const toggleSection = (title: string) => {
        setCollapsedSections((prev) => {
            const next = { ...prev, [title]: !prev[title] };
            try {
                localStorage.setItem("agentguard_sidebar_sections", JSON.stringify(next));
            } catch { }
            return next;
        });
    };

    return (
        <aside
            className={`h-screen bg-[#0A0B0D] border-r border-[#1F2128] flex flex-col transition-all duration-300 z-30 select-none shrink-0 ${
                collapsed ? "w-16" : "w-64"
            }`}
        >
            {/* Brand Header */}
            <div className="h-16 flex items-center justify-between px-4 border-b border-[#1F2128]">
                <div className="flex items-center gap-3 overflow-hidden">
                    <div className="w-8 h-8 rounded-lg bg-[#121316] border border-[#C6F432]/40 flex items-center justify-center shrink-0 shadow-sm">
                        <ShieldAlert className="w-4 h-4 text-[#C6F432]" />
                    </div>
                    {!collapsed && (
                        <div className="flex flex-col truncate">
                            <span className="font-bold text-sm tracking-tight text-[#EDEBE6] font-display flex items-center gap-1">
                                Agent<span className="text-[#C6F432]">Guard</span>
                            </span>
                            <span className="text-[11px] text-[#8A8D93] font-sans tracking-normal">
                                AI Firewall & SOC
                            </span>
                        </div>
                    )}
                </div>

                {/* Collapse button */}
                <button
                    type="button"
                    onClick={onToggleCollapse}
                    className="p-1.5 rounded-md text-[#8A8D93] hover:text-[#EDEBE6] hover:bg-[#15171C] transition-colors cursor-pointer"
                    title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
                    aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
                >
                    {collapsed ? (
                        <PanelLeftOpen className="w-4 h-4" />
                    ) : (
                        <PanelLeftClose className="w-4 h-4" />
                    )}
                </button>
            </div>

            {/* Navigation Sections */}
            <nav className="flex-1 overflow-y-auto px-2 py-3 space-y-4">
                {NAV_SECTIONS.map((section) => {
                    const isSectionCollapsed = collapsedSections[section.title];

                    return (
                        <div key={section.title} className="space-y-1">
                            {!collapsed && (
                                <button
                                    type="button"
                                    onClick={() => toggleSection(section.title)}
                                    className="w-full flex items-center justify-between px-2.5 py-1 text-[11px] font-sans font-medium tracking-wider text-[#565961] hover:text-[#8A8D93] uppercase transition-colors"
                                >
                                    <span>{section.title}</span>
                                    {isSectionCollapsed ? (
                                        <ChevronRight className="w-3 h-3" />
                                    ) : (
                                        <ChevronDown className="w-3 h-3" />
                                    )}
                                </button>
                            )}

                            {(!isSectionCollapsed || collapsed) && (
                                <div className="space-y-0.5">
                                    {section.items.map((item) => {
                                        const Icon = item.icon;
                                        const isActive = currentTab === item.id;

                                        const badgeStyle = {
                                            lime: "bg-[#C6F432]/10 text-[#C6F432] border-[#C6F432]/30",
                                            amber: "bg-[#FF9F0A]/10 text-[#FF9F0A] border-[#FF9F0A]/30",
                                            red: "bg-[#FF443A]/10 text-[#FF443A] border-[#FF443A]/30",
                                            neutral: "bg-[#1F2128] text-[#8A8D93] border-[#2B2E38]",
                                        }[item.badgeVariant || "neutral"];

                                        return (
                                            <button
                                                key={item.id}
                                                type="button"
                                                onClick={() => onTabChange(item.id)}
                                                className={`w-full flex items-center gap-3 px-2.5 py-2 rounded-xl text-xs font-sans transition-all relative group text-left cursor-pointer ${
                                                    isActive
                                                        ? "bg-[#15171C] text-[#EDEBE6] font-medium shadow-sm border border-[#C6F432]/30 text-[#C6F432]"
                                                        : "text-[#8A8D93] hover:text-[#EDEBE6] hover:bg-[#121316]"
                                                }`}
                                                title={collapsed ? item.label : undefined}
                                            >
                                                <Icon
                                                    className={`w-4 h-4 shrink-0 transition-colors ${
                                                        isActive
                                                            ? "text-[#C6F432]"
                                                            : "text-[#8A8D93] group-hover:text-[#EDEBE6]"
                                                    }`}
                                                />
                                                {!collapsed && (
                                                    <>
                                                        <span className={`flex-1 truncate ${isActive ? "text-[#EDEBE6] font-medium" : ""}`}>{item.label}</span>
                                                        {item.badge && (
                                                            <span
                                                                className={`px-1.5 py-0.2 rounded text-[9px] font-mono tracking-tight uppercase border ${badgeStyle}`}
                                                            >
                                                                {item.badge}
                                                            </span>
                                                        )}
                                                    </>
                                                )}
                                            </button>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    );
                })}
            </nav>

            {/* Footer status indicator */}
            {!collapsed && (
                <div className="p-3 mx-2 mb-2 rounded-xl bg-[#121316] border border-[#1F2128] text-xs font-sans text-[#8A8D93] flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#C6F432] animate-pulse" />
                        <span className="text-[#EDEBE6] text-xs font-medium">Cluster Healthy</span>
                    </div>
                    <span className="font-mono text-[10px] text-[#565961]">v1.4.2</span>
                </div>
            )}
        </aside>
    );
}
