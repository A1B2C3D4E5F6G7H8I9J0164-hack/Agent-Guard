"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
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
  LogIn,
  X,
  Sparkles,
} from "lucide-react";
import { NavTab } from "./Sidebar";
import { AuthModal } from "@/components/ui/AuthModal";
import { useAuth } from "@/lib/auth";

interface HeaderProps {
  onOpenTerminal: () => void;
  onOpenCommandPalette: () => void;
  onNavigate?: (tab: NavTab) => void;
  onSwitchToLanding?: () => void;
  onStartTour?: () => void;
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
  onStartTour,
}: HeaderProps) {
  const router = useRouter();
  const { user, isAuthenticated, signOut } = useAuth();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);
  const userRef = useRef<HTMLDivElement>(null);

  const displayName = user?.full_name || user?.email?.split("@")[0] || "Guest";
  const displayEmail = user?.email || "Not signed in";
  const displayRole = user?.role ? user.role.toUpperCase() : "GUEST";
  const initials = displayName
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || "")
    .join("") || "AG";

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
    <header className="h-16 bg-[#0A0B0D]/95 backdrop-blur-md border-b border-[#1F2128] px-6 flex items-center justify-between sticky top-0 z-20 select-none">
      {/* Left: Org Switcher */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl bg-[#121316] border border-[#1F2128] text-xs font-sans text-[#EDEBE6] cursor-pointer hover:border-[#2B2E38] transition-colors">
          <Building2 className="w-3.5 h-3.5 text-[#C6F432]" />
          <span className="font-semibold text-[#EDEBE6] font-display">Apex Cyber Systems</span>
          <span className="px-1.5 py-0.2 rounded bg-[#C6F432]/10 text-[#C6F432] text-[10px] font-mono uppercase font-bold border border-[#C6F432]/30">
            Enterprise
          </span>
          <ChevronDown className="w-3 h-3 text-[#8A8D93]" />
        </div>
      </div>

      {/* Center: Global Search (Cmd+K) */}
      <div className="flex-1 max-w-md mx-6 hidden md:block">
        <button
          type="button"
          onClick={onOpenCommandPalette}
          className="w-full flex items-center justify-between px-3.5 py-1.5 rounded-xl bg-[#121316] border border-[#1F2128] text-xs text-[#8A8D93] hover:text-[#EDEBE6] hover:border-[#2B2E38] transition-colors focus-ring cursor-pointer"
        >
          <div className="flex items-center gap-2">
            <Search className="w-3.5 h-3.5 text-[#8A8D93]" />
            <span className="font-sans">Search commands, rules, payloads...</span>
          </div>
          <kbd className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-[#0A0B0D] text-[10px] text-[#8A8D93] font-mono border border-[#1F2128]">
            <Command className="w-2.5 h-2.5" /> K
          </kbd>
        </button>
      </div>

      {/* Right: Actions, Notifications & User Menu */}
      <div className="flex items-center gap-2.5">
        {onStartTour && (
          <button
            type="button"
            onClick={onStartTour}
            className="hidden lg:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#C6F432]/10 border border-[#C6F432]/30 hover:bg-[#C6F432]/20 text-xs font-sans font-medium text-[#C6F432] transition-colors cursor-pointer"
            title="Start Guided SOC Tour"
          >
            <Sparkles className="w-3 h-3" />
            <span>Guided Tour</span>
          </button>
        )}

        {onSwitchToLanding && (
          <button
            type="button"
            onClick={onSwitchToLanding}
            className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#121316] border border-[#1F2128] hover:border-[#C6F432]/40 text-xs font-sans text-[#EDEBE6] hover:text-[#C6F432] transition-colors cursor-pointer"
            title="View 3D Landing Page"
          >
            <Sparkles className="w-3 h-3 text-[#C6F432]" />
            <span>Marketing Site</span>
          </button>
        )}

        {/* Mobile Search button */}
        <button
          type="button"
          onClick={onOpenCommandPalette}
          className="p-2 rounded-xl bg-[#121316] border border-[#1F2128] text-[#8A8D93] md:hidden hover:text-[#EDEBE6] cursor-pointer"
          title="Search"
        >
          <Search className="w-4 h-4" />
        </button>

        {/* Notifications Popover */}
        <div className="relative" ref={notifRef}>
          <button
            type="button"
            onClick={() => setShowNotifications(!showNotifications)}
            className="p-2 rounded-xl bg-[#121316] border border-[#1F2128] text-[#8A8D93] hover:text-[#EDEBE6] hover:border-[#2B2E38] transition-colors relative cursor-pointer"
            title="SOC Notifications"
            aria-label="Notifications"
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-[#FF443A] text-[9px] font-mono font-bold text-white flex items-center justify-center animate-pulse">
                {unreadCount}
              </span>
            )}
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 rounded-2xl bg-[#121316] border border-[#1F2128] shadow-2xl p-4 text-xs font-sans z-50 animate-in fade-in slide-in-from-top-2">
              <div className="flex items-center justify-between pb-2 mb-2 border-b border-[#1F2128]">
                <span className="font-semibold text-[#EDEBE6] font-display">
                  SOC Alerts ({notifications.length})
                </span>
                {unreadCount > 0 && (
                  <button
                    type="button"
                    onClick={handleMarkAllRead}
                    className="text-[11px] text-[#C6F432] hover:underline cursor-pointer"
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
                      className={`p-2.5 rounded-xl border transition-all cursor-pointer ${
                        n.severity === "critical"
                          ? "bg-[#0A0B0D] border-[#FF443A]/30 hover:border-[#FF443A]/60"
                          : "bg-[#0A0B0D] border-[#FF9F0A]/30 hover:border-[#FF9F0A]/60"
                      } ${n.read ? "opacity-60" : ""}`}
                    >
                      <div className="flex items-center justify-between text-[11px] font-semibold">
                        <span className={n.severity === "critical" ? "text-[#FF443A]" : "text-[#FF9F0A]"}>
                          {n.title}
                        </span>
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] text-[#565961] font-mono">{n.time}</span>
                          <button
                            type="button"
                            onClick={(e) => handleDismissNotification(n.id, e)}
                            className="text-[#565961] hover:text-[#EDEBE6] p-0.5 cursor-pointer"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                      <p className="text-xs text-[#8A8D93] mt-1 leading-snug">{n.desc}</p>
                    </div>
                  ))
                ) : (
                  <div className="py-6 text-center text-[#565961] text-xs">
                    No active unread alerts.
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* User Menu */}
        <div className="relative" ref={userRef}>
          {isAuthenticated && user ? (
            <button
              type="button"
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-[#15171C] transition-colors cursor-pointer"
            >
              {user.avatar_url ? (
                <img
                  src={user.avatar_url}
                  alt={displayName}
                  referrerPolicy="no-referrer"
                  className="w-8 h-8 rounded-full border border-[#C6F432]/40 object-cover"
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-[#15171C] border border-[#C6F432]/40 flex items-center justify-center text-xs font-bold text-[#C6F432] font-mono">
                  {initials}
                </div>
              )}
              <div className="hidden xl:flex flex-col text-left">
                <span className="text-xs font-semibold text-[#EDEBE6] leading-tight font-display">
                  {displayName}
                </span>
                <span className="text-[10px] text-[#8A8D93] font-sans truncate max-w-[140px]">
                  {displayEmail}
                </span>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-[#565961]" />
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                href="/login"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[#1F2128] bg-[#121316] hover:border-[#2B2E38] text-[#EDEBE6] text-xs font-semibold font-sans transition-colors"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Sign In</span>
              </Link>
              <Link
                href="/signup"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#C6F432] hover:bg-[#b5e028] text-black text-xs font-semibold font-sans transition-colors"
              >
                <span>Sign Up</span>
              </Link>
            </div>
          )}

          {showUserMenu && isAuthenticated && user && (
            <div className="absolute right-0 mt-2 w-60 rounded-2xl bg-[#121316] border border-[#1F2128] shadow-2xl p-2 text-xs font-sans z-50 animate-in fade-in slide-in-from-top-2">
              <div className="px-3 py-2 border-b border-[#1F2128] mb-1">
                <div className="font-semibold text-[#EDEBE6] font-display truncate">{displayName}</div>
                <div className="text-[11px] text-[#8A8D93] font-mono truncate">{displayEmail}</div>
                <div className="flex items-center gap-1.5 mt-1.5">
                  <span className="inline-block px-1.5 py-0.2 rounded bg-[#C6F432]/10 text-[#C6F432] text-[9px] font-mono uppercase font-bold border border-[#C6F432]/30">
                    {displayRole}
                  </span>
                  {user.auth_provider === "google" && (
                    <span className="inline-block px-1.5 py-0.2 rounded bg-white/10 text-[#EDEBE6] text-[9px] font-mono uppercase border border-white/15">
                      Google
                    </span>
                  )}
                </div>
              </div>

              <div className="space-y-0.5">
                <button
                  type="button"
                  onClick={() => {
                    onOpenTerminal();
                    setShowUserMenu(false);
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-[#8A8D93] hover:text-[#EDEBE6] hover:bg-[#15171C] text-left transition-colors cursor-pointer"
                >
                  <Terminal className="w-3.5 h-3.5 text-[#8A8D93]" />
                  <span>Developer Terminal</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    if (onNavigate) onNavigate("settings");
                    setShowUserMenu(false);
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-[#8A8D93] hover:text-[#EDEBE6] hover:bg-[#15171C] text-left transition-colors cursor-pointer"
                >
                  <Settings className="w-3.5 h-3.5 text-[#8A8D93]" />
                  <span>Organization & Keys</span>
                </button>
              </div>

              <div className="border-t border-[#1F2128] mt-1.5 pt-1.5">
                <button
                  type="button"
                  onClick={() => {
                    setShowUserMenu(false);
                    signOut();
                    router.push("/login");
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-[#FF443A] hover:bg-[#FF443A]/10 text-left transition-colors cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5 text-[#FF443A]" />
                  <span>Sign out</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
      />
    </header>
  );
}
