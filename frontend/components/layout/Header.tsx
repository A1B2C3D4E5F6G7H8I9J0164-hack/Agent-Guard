"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  Bell,
  Search,
  Command,
  Building2,
  ChevronDown,
  User,
  Terminal,
  Settings,
  LogOut,
  ExternalLink,
  Check,
  X,
  ShieldCheck,
} from "lucide-react";
import { NavTab } from "./Sidebar";

interface HeaderProps {
  onOpenTerminal: () => void;
  onOpenCommandPalette: () => void;
  onNavigate?: (tab: NavTab) => void;
  onSwitchToLanding?: () => void;
}

interface NotificationItem {
  id: string;
  title: string;
  time: string;
  desc: string;
  severity: "critical" | "high" | "info";
  read: boolean;
}

export default function Header({
  onOpenTerminal,
  onOpenCommandPalette,
  onNavigate,
  onSwitchToLanding,
}: HeaderProps) {
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);
  const userRef = useRef<HTMLDivElement>(null);

  const [notifications, setNotifications] = useState<NotificationItem[]>([
    {
      id: "notif-1",
      title: "Critical Threat Intercepted",
      time: "12m ago",
      desc: "ChatML delimiter injection blocked on Customer Support Assistant from 198.51.100.18",
      severity: "critical",
      read: false,
    },
    {
      id: "notif-2",
      title: "Tool Policy Violation",
      time: "2h ago",
      desc: "Agent session sess_198_51 attempted destructive OS command and was quarantined.",
      severity: "high",
      read: false,
    },
  ]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
      if (userRef.current && !userRef.current.contains(event.target as Node)) {
        setShowUserMenu(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleMarkAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const handleDismissNotification = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  return (
    <header className="h-16 bg-[#080B10]/95 backdrop-blur-md border-b border-[#1E293B] px-6 flex items-center justify-between sticky top-0 z-20 select-none">
      {/* Left: Org Switcher ONLY (as requested in specs) */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#0F1622] border border-[#1E293B] text-xs font-sans text-slate-200 cursor-pointer hover:border-slate-600 transition-colors">
          <Building2 className="w-3.5 h-3.5 text-sky-400" />
          <span className="font-semibold text-white">Apex Cyber Systems</span>
          <span className="px-1.5 py-0.2 rounded bg-emerald-500/10 text-emerald-400 text-[10px] font-mono uppercase font-bold border border-emerald-500/30">
            Enterprise
          </span>
          <ChevronDown className="w-3 h-3 text-slate-400" />
        </div>
      </div>

      {/* Center: Global Search (Cmd+K) */}
      <div className="flex-1 max-w-md mx-6 hidden md:block">
        <button
          type="button"
          onClick={onOpenCommandPalette}
          className="w-full flex items-center justify-between px-3.5 py-1.5 rounded-lg bg-[#0F1622] border border-[#1E293B] text-xs text-slate-400 hover:text-slate-200 hover:border-slate-600 transition-colors focus-ring"
        >
          <div className="flex items-center gap-2">
            <Search className="w-3.5 h-3.5 text-slate-400" />
            <span className="font-sans">Search commands, rules, payloads...</span>
          </div>
          <kbd className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-[#080B10] text-[11px] text-slate-400 font-mono border border-[#1E293B]">
            <Command className="w-2.5 h-2.5" /> K
          </kbd>
        </button>
      </div>

      {/* Right: Notifications & User Menu */}
      <div className="flex items-center gap-3">
        {onSwitchToLanding && (
          <button
            type="button"
            onClick={onSwitchToLanding}
            className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#121316] border border-[#1F2128] hover:border-[#2B2E3A] text-xs font-mono text-[#C6F432] transition-colors cursor-pointer"
            title="View 3D Landing Page"
          >
            <span>3D Landing</span>
          </button>
        )}
        {/* Mobile Search button */}
        <button
          type="button"
          onClick={onOpenCommandPalette}
          className="p-2 rounded-lg bg-[#0F1622] border border-[#1E293B] text-slate-300 md:hidden hover:text-white"
          title="Search"
        >
          <Search className="w-4 h-4" />
        </button>

        {/* Notifications Popover */}
        <div className="relative" ref={notifRef}>
          <button
            type="button"
            onClick={() => setShowNotifications(!showNotifications)}
            className="p-2 rounded-lg bg-[#0F1622] border border-[#1E293B] text-slate-300 hover:text-white transition-colors relative focus-ring"
            title="SOC Notifications"
            aria-label="Notifications"
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-red-500 text-[9px] font-mono font-bold text-white flex items-center justify-center animate-pulse">
                {unreadCount}
              </span>
            )}
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 rounded-xl bg-[#0F1622] border border-[#1E293B] shadow-2xl p-4 text-xs font-sans z-50 animate-in fade-in slide-in-from-top-2">
              <div className="flex items-center justify-between pb-2 mb-2 border-b border-[#1E293B]">
                <span className="font-semibold text-slate-200">
                  SOC Alerts ({notifications.length})
                </span>
                {unreadCount > 0 && (
                  <button
                    type="button"
                    onClick={handleMarkAllRead}
                    className="text-[11px] text-emerald-400 hover:underline"
                  >
                    Mark all read
                  </button>
                )}
              </div>

              <div className="space-y-2 max-h-72 overflow-y-auto">
                {notifications.length > 0 ? (
                  notifications.map((n) => (
                    <div
                      key={n.id}
                      onClick={() => {
                        if (onNavigate) onNavigate("threats");
                        setShowNotifications(false);
                      }}
                      className={`p-2.5 rounded-lg border transition-all cursor-pointer ${
                        n.severity === "critical"
                          ? "bg-[#080B10] border-red-500/30 hover:border-red-500/60"
                          : "bg-[#080B10] border-amber-500/30 hover:border-amber-500/60"
                      } ${n.read ? "opacity-60" : ""}`}
                    >
                      <div className="flex items-center justify-between text-[11px] font-semibold">
                        <span className={n.severity === "critical" ? "text-red-400" : "text-amber-400"}>
                          {n.title}
                        </span>
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] text-slate-500 font-mono">{n.time}</span>
                          <button
                            type="button"
                            onClick={(e) => handleDismissNotification(n.id, e)}
                            className="text-slate-500 hover:text-white p-0.5"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                      <p className="text-xs text-slate-300 mt-1 leading-snug">{n.desc}</p>
                    </div>
                  ))
                ) : (
                  <div className="py-6 text-center text-slate-500 text-xs">
                    No active unread alerts.
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* User Menu */}
        <div className="relative" ref={userRef}>
          <button
            type="button"
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-[#0F1622] transition-colors focus-ring"
          >
            <div className="w-8 h-8 rounded-full bg-[#0F1622] border border-emerald-500/40 flex items-center justify-center text-xs font-bold text-emerald-400 font-mono">
              AR
            </div>
            <div className="hidden xl:flex flex-col text-left">
              <span className="text-xs font-semibold text-slate-200 leading-tight">
                Aditya Rana
              </span>
              <span className="text-[11px] text-slate-500 font-sans">
                Principal SecOps
              </span>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-slate-500" />
          </button>

          {showUserMenu && (
            <div className="absolute right-0 mt-2 w-56 rounded-xl bg-[#0F1622] border border-[#1E293B] shadow-2xl p-2 text-xs font-sans z-50 animate-in fade-in slide-in-from-top-2">
              <div className="px-3 py-2 border-b border-[#1E293B] mb-1">
                <div className="font-semibold text-white">Aditya Rana</div>
                <div className="text-[11px] text-slate-400 font-mono">aditya@apexcyber.ai</div>
                <span className="inline-block mt-1 px-1.5 py-0.2 rounded bg-emerald-500/10 text-emerald-400 text-[10px] font-mono uppercase font-bold border border-emerald-500/30">
                  Owner / SecOps
                </span>
              </div>

              <div className="space-y-0.5">
                <button
                  type="button"
                  onClick={() => {
                    onOpenTerminal();
                    setShowUserMenu(false);
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-slate-300 hover:text-white hover:bg-[#182335] text-left transition-colors"
                >
                  <Terminal className="w-3.5 h-3.5 text-slate-400" />
                  <span>Developer Terminal</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    if (onNavigate) onNavigate("settings");
                    setShowUserMenu(false);
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-slate-300 hover:text-white hover:bg-[#182335] text-left transition-colors"
                >
                  <Settings className="w-3.5 h-3.5 text-slate-400" />
                  <span>Organization & Keys</span>
                </button>
              </div>

              <div className="border-t border-[#1E293B] mt-1.5 pt-1.5">
                <button
                  type="button"
                  onClick={() => setShowUserMenu(false)}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-red-400 hover:bg-red-500/10 text-left transition-colors"
                >
                  <LogOut className="w-3.5 h-3.5 text-red-400" />
                  <span>Sign out</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
