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
    badgeVariant?: "emerald" | "amber" | "red" | "neutral";
}

interface NavSection {
    title: string;
    items: NavItem[];
}

const NAV_SECTIONS: NavSection[] = [
    {
        title: "MONITOR",
        items: [
            { id: "overview", label: "Overview", icon: Shield },
            { id: "threats", label: "Live Threat Monitor", icon: Activity, badge: "LIVE", badgeVariant: "emerald" },
        ],
    },
    {
        title: "PROTECT",
        items: [
            { id: "firewall", label: "AI Firewall", icon: Flame, badge: "ENFORCE", badgeVariant: "emerald" },
            { id: "api_sec", label: "API Security", icon: KeyRound },
            { id: "agents", label: "Agent Behaviour", icon: Bot },
        ],
    },
    {
        title: "TEST",
        items: [
            { id: "scanner", label: "Vulnerability Scanner", icon: Search },
            { id: "redteam", label: "Red Team Lab", icon: Crosshair },
        ],
    },
    {
        title: "INVESTIGATE",
        items: [
            { id: "intel", label: "Attack Intelligence", icon: Globe2 },
            { id: "graph", label: "Attack Graph", icon: GitFork },
            { id: "forensics", label: "Incident Forensics", icon: FileSearch, badge: "2 open", badgeVariant: "amber" },
            { id: "ml_analytics", label: "ML Analytics", icon: BrainCircuit },
        ],
    },
    {
        title: "GOVERN",
        items: [
            { id: "compliance", label: "Compliance Reports", icon: FileCheck2 },
            { id: "integrations", label: "Integrations", icon: PlugZap },
        ],
    },
    {
        title: "SYSTEM",
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
    // Collapsed state of sections stored in local memory
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
            className={`h-screen bg-[#080B10] border-r border-[#1E293B] flex flex-col transition-all duration-300 z-30 select-none shrink-0 ${collapsed ? "w-16" : "w-64"
                }`}
        >
            {/* Brand Header */}
            <div className="h-16 flex items-center justify-between px-4 border-b border-[#1E293B]">
                <div className="flex items-center gap-3 overflow-hidden">
                    <div className="w-8 h-8 rounded-lg bg-[#0F1622] border border-emerald-500/40 flex items-center justify-center shrink-0 glow-emerald">
                        <ShieldAlert className="w-4 h-4 text-emerald-400" />
                    </div>
                    {!collapsed && (
                        <div className="flex flex-col truncate">
                            <span className="font-bold text-sm tracking-wide text-white font-sans flex items-center gap-1">
                                Agent<span className="text-emerald-400">Guard</span>
                            </span>
                            <span className="text-[11px] text-slate-400 font-sans tracking-normal">
                                AI Threat & Red Team SOC
                            </span>
                        </div>
                    )}
                </div>

                {/* Collapse button */}
                <button
                    type="button"
                    onClick={onToggleCollapse}
                    className="p-1 rounded text-slate-400 hover:text-white hover:bg-[#182335] transition-colors focus-ring"
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
                                    className="w-full flex items-center justify-between px-2.5 py-1 text-[11px] font-sans font-semibold tracking-wider text-slate-400 hover:text-slate-200 uppercase transition-colors"
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
                                            emerald: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30",
                                            amber: "bg-amber-500/10 text-amber-400 border-amber-500/30",
                                            red: "bg-red-500/10 text-red-400 border-red-500/30",
                                            neutral: "bg-slate-800 text-slate-400 border-slate-700",
                                        }[item.badgeVariant || "neutral"];

                                        return (
                                            <button
                                                key={item.id}
                                                type="button"
                                                onClick={() => onTabChange(item.id)}
                                                className={`w-full flex items-center gap-3 px-2.5 py-2 rounded-lg text-sm font-sans transition-all relative group text-left ${isActive
                                                    ? "bg-[#182335] text-white font-medium shadow-sm border-l-2 border-emerald-400 rounded-l-none pl-3"
                                                    : "text-slate-400 hover:text-slate-200 hover:bg-[#0F1622]"
                                                    }`}
                                                title={collapsed ? item.label : undefined}
                                            >
                                                <Icon
                                                    className={`w-4 h-4 shrink-0 transition-colors ${isActive
                                                        ? "text-emerald-400"
                                                        : "text-slate-400 group-hover:text-slate-200"
                                                        }`}
                                                />
                                                {!collapsed && (
                                                    <>
                                                        <span className="flex-1 truncate">{item.label}</span>
                                                        {item.badge && (
                                                            <span
                                                                className={`px-1.5 py-0.2 rounded text-[10px] font-mono tracking-tight uppercase border ${badgeStyle}`}
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
                <div className="p-3 mx-2 mb-2 rounded-lg bg-[#0F1622] border border-[#1E293B] text-xs font-sans text-slate-400 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                        <span className="text-slate-300 font-medium">Cluster Healthy</span>
                    </div>
                    <span className="font-mono text-[11px] text-slate-500">v1.4.2</span>
                </div>
            )}
        </aside>
    );
}
