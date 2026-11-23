"use client";

import React, { useState, useEffect } from "react";
import {
  Settings,
  Key,
  Building,
  Users,
  CreditCard,
  Shield,
  Plus,
  Copy,
  Check,
  Trash2,
  AlertTriangle,
  UserPlus,
  Sliders,
  BellRing,
  Lock,
  X,
} from "lucide-react";
import { api } from "@/lib/api";
import { PageHeader } from "@/components/ui/PageHeader";

interface TeamMember {
  name: string;
  role: string;
  email: string;
}

export default function SettingsView() {
  const [keys, setKeys] = useState<any[]>([]);
  const [newKeyName, setNewKeyName] = useState("");
  const [createdKeyRaw, setCreatedKeyRaw] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [copied, setCopied] = useState(false);
  const [revokedKeys, setRevokedKeys] = useState<string[]>([]);

  // Team Members State
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([
    { name: "Aditya Rana", role: "Owner / Admin", email: "aditya@apexcyber.ai" },
    { name: "SecOps Threat Analyst", role: "Analyst", email: "analyst@apexcyber.ai" },
    { name: "Audit Viewer", role: "Viewer", email: "compliance@apexcyber.ai" },
  ]);
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [inviteName, setInviteName] = useState("");
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("Analyst");

  // Security Posture Policy Slider
  const [firewallStrictness, setFirewallStrictness] = useState<"standard" | "strict" | "paranoid">("strict");
  const [rateLimitCeiling, setRateLimitCeiling] = useState(120);
  const [autoQuarantine, setAutoQuarantine] = useState(true);
  const [savedSettingsNotice, setSavedSettingsNotice] = useState<string | null>(null);

  // Notification Toggles
  const [slackAlerts, setSlackAlerts] = useState(true);
  const [emailDigest, setEmailDigest] = useState(true);
  const [pagerdutyEscalation, setPagerdutyEscalation] = useState(true);

  const loadKeys = async () => {
    try {
      const data = await api.getApiKeys();
      setKeys(data);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    loadKeys();
  }, []);

  const handleGenerateKey = async () => {
    if (!newKeyName.trim()) return;
    setIsGenerating(true);
    try {
      const res = await api.createApiKey(newKeyName.trim());
      setCreatedKeyRaw(res.raw_key);
      setNewKeyName("");
      await loadKeys();
    } catch (e) {
      console.error(e);
    } finally {
      setIsGenerating(false);
    }
  };

  const copyToClipboard = () => {
    if (!createdKeyRaw) return;
    navigator.clipboard.writeText(createdKeyRaw);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  const handleRevokeKey = (keyId: string) => {
    setRevokedKeys((prev) => [...prev, keyId]);
    setSavedSettingsNotice("API Key revoked. Any future traffic with this key will be rejected.");
    setTimeout(() => setSavedSettingsNotice(null), 4000);
  };

  const handleInviteMember = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteName.trim() || !inviteEmail.trim()) return;
    const newMember: TeamMember = {
      name: inviteName.trim(),
      email: inviteEmail.trim(),
      role: inviteRole,
    };
    setTeamMembers((prev) => [...prev, newMember]);
    setIsInviteModalOpen(false);
    setInviteName("");
    setInviteEmail("");
    setSavedSettingsNotice(`Invitation sent to ${newMember.email} with ${newMember.role} privileges.`);
    setTimeout(() => setSavedSettingsNotice(null), 4000);
  };

  const handleRemoveMember = (emailToRemove: string) => {
    setTeamMembers((prev) => prev.filter((m) => m.email !== emailToRemove));
  };

  const handleSaveSecurityPolicies = () => {
    setSavedSettingsNotice("Security policies and firewall strictness rules saved successfully.");
    setTimeout(() => setSavedSettingsNotice(null), 4000);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 font-sans">
      {/* 1. Page Header */}
      <PageHeader
        title="Organization Settings, API Keys & RBAC"
        description="Manage reverse proxy ingestion API keys, team roles, automated defense thresholds, and subscription parameters."
        statusLine="Platform Configuration Vault · Enterprise RBAC Active"
        badge={{ text: "ADMIN SETTINGS", variant: "sky" }}
      />

      {savedSettingsNotice && (
        <div
          role="status"
          className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-xs font-sans text-emerald-300 flex items-center justify-between animate-in fade-in"
        >
          <div className="flex items-center gap-2">
            <Check className="w-4 h-4 text-emerald-400" />
            <span>{savedSettingsNotice}</span>
          </div>
          <button onClick={() => setSavedSettingsNotice(null)} className="text-slate-400 hover:text-white">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* 2. API Keys Management */}
      <div className="p-5 rounded-xl bg-[#0F1622] border border-[#1E293B] space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-[#1E293B]">
          <div className="flex items-center gap-2">
            <Key className="w-4 h-4 text-emerald-400" />
            <h2 className="text-base font-semibold text-white font-sans">
              API ingestion keys (Gateway Reverse Proxy)
            </h2>
          </div>
          <span className="text-xs text-slate-400 font-sans">Cryptographically hashed (SHA-256)</span>
        </div>

        {/* Generate Key Input */}
        <div className="flex flex-wrap items-center gap-3">
          <input
            type="text"
            value={newKeyName}
            onChange={(e) => setNewKeyName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleGenerateKey()}
            placeholder="Key label (e.g. Staging RAG Ingestion Proxy)"
            className="flex-1 min-w-[280px] max-w-md p-2.5 rounded-lg bg-[#080B10] border border-[#1E293B] text-xs font-sans text-slate-200 focus:outline-none focus:border-emerald-500"
          />
          <button
            type="button"
            onClick={handleGenerateKey}
            disabled={isGenerating || !newKeyName.trim()}
            className="px-4 py-2.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-black font-semibold text-xs font-sans flex items-center gap-2 transition-all disabled:opacity-50 cursor-pointer shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>{isGenerating ? "Generating..." : "Generate key"}</span>
          </button>
        </div>

        {/* Once-only key alert */}
        {createdKeyRaw && (
          <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 space-y-2 text-xs font-sans animate-in fade-in">
            <div className="text-emerald-400 font-semibold">
              ✔ Key Generated! Copy it now. For security, it will never be displayed in plain text again:
            </div>
            <div className="flex items-center gap-3 bg-[#080B10] p-2.5 rounded-lg border border-[#1E293B]">
              <span className="flex-1 font-mono text-white select-all break-all">{createdKeyRaw}</span>
              <button
                type="button"
                onClick={copyToClipboard}
                className="px-3 py-1.5 rounded-md bg-[#0F1622] hover:bg-[#151F2E] text-emerald-400 text-xs font-sans flex items-center gap-1.5 shrink-0 cursor-pointer"
              >
                {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? "Copied" : "Copy"}</span>
              </button>
            </div>
          </div>
        )}

        {/* Keys List Table */}
        <div className="overflow-x-auto rounded-lg border border-[#1E293B]">
          <table className="w-full text-left text-xs font-sans">
            <thead className="bg-[#080B10] text-slate-400 text-[11px] uppercase tracking-wider border-b border-[#1E293B]">
              <tr>
                <th className="py-3 px-4">Key Name</th>
                <th className="py-3 px-4">Key Mask / Prefix</th>
                <th className="py-3 px-4">Created Date</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1E293B] bg-[#0F1622]">
              {keys.map((k) => {
                const isRevoked = revokedKeys.includes(k.id) || k.is_revoked;
                return (
                  <tr key={k.id} className="hover:bg-[#151F2E]/50 transition-colors">
                    <td className="py-3 px-4 font-semibold text-slate-200">{k.name}</td>
                    <td className="py-3 px-4 font-mono text-sky-400">{k.prefix_display}</td>
                    <td className="py-3 px-4 text-slate-400 font-mono text-[11px]">
                      {new Date(k.created_at).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${
                          isRevoked
                            ? "bg-red-500/10 text-red-400 border-red-500/30"
                            : "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                        }`}
                      >
                        {isRevoked ? "REVOKED" : "ACTIVE"}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      {!isRevoked ? (
                        <button
                          type="button"
                          onClick={() => handleRevokeKey(k.id)}
                          className="px-2.5 py-1 rounded bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 text-xs font-sans transition-colors cursor-pointer"
                        >
                          Revoke
                        </button>
                      ) : (
                        <span className="text-slate-600 text-xs">Inactive</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* 3. Security Posture Policies Card */}
      <div className="p-5 rounded-xl bg-[#0F1622] border border-[#1E293B] space-y-5">
        <div className="flex items-center justify-between pb-3 border-b border-[#1E293B]">
          <div className="flex items-center gap-2">
            <Sliders className="w-4 h-4 text-sky-400" />
            <h2 className="text-base font-semibold text-white font-sans">
              Active defense & firewall strictness thresholds
            </h2>
          </div>
          <button
            type="button"
            onClick={handleSaveSecurityPolicies}
            className="px-4 py-1.5 rounded-lg bg-sky-500 hover:bg-sky-400 text-black font-semibold text-xs font-sans transition-all cursor-pointer shadow-sm"
          >
            Save policies
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs font-sans">
          <div className="space-y-2 p-4 rounded-xl bg-[#080B10] border border-[#1E293B]">
            <div className="font-semibold text-slate-200">Firewall Strictness Profile</div>
            <p className="text-slate-400 text-xs">Controls delimiter and persona detection sensitivity.</p>
            <div className="space-y-1.5 pt-2">
              {[
                {
                  id: "standard",
                  label: "Standard (Threshold 0.70)",
                  desc: "Balanced protection with minimal false alarms",
                },
                {
                  id: "strict",
                  label: "Strict (Threshold 0.60)",
                  desc: "Enforces strict structural and semantic boundary checks",
                },
                {
                  id: "paranoid",
                  label: "Maximum Fortress (0.45)",
                  desc: "High sensitivity against novel zero-day prompts",
                },
              ].map((p) => (
                <label
                  key={p.id}
                  onClick={() => setFirewallStrictness(p.id as any)}
                  className={`flex items-start gap-2.5 p-2 rounded-lg cursor-pointer border transition-all ${
                    firewallStrictness === p.id
                      ? "bg-emerald-500/10 border-emerald-500/40 text-white"
                      : "border-transparent text-slate-400 hover:bg-[#151F2E]"
                  }`}
                >
                  <input
                    type="radio"
                    name="strictness"
                    checked={firewallStrictness === p.id}
                    onChange={() => {}}
                    className="mt-0.5 accent-emerald-500 cursor-pointer"
                  />
                  <div>
                    <div className="font-semibold">{p.label}</div>
                    <div className="text-[11px] text-slate-400">{p.desc}</div>
                  </div>
                </label>
              ))}
            </div>
          </div>

          <div className="space-y-2 p-4 rounded-xl bg-[#080B10] border border-[#1E293B]">
            <div className="font-semibold text-slate-200">Rate Limiting & Consumption Guard</div>
            <p className="text-slate-400 text-xs">Enforces ceiling on requests per minute per IP.</p>
            <div className="pt-4 space-y-3">
              <div className="flex items-center justify-between font-semibold">
                <span className="text-slate-400">Limit per minute:</span>
                <span className="text-sky-400 font-mono text-sm">{rateLimitCeiling} req/min</span>
              </div>
              <input
                type="range"
                min="30"
                max="300"
                step="10"
                value={rateLimitCeiling}
                onChange={(e) => setRateLimitCeiling(Number(e.target.value))}
                className="w-full accent-sky-400 cursor-pointer"
              />
              <div className="text-[11px] text-slate-400">
                Excess traffic beyond {rateLimitCeiling} req/min triggers automatic HTTP 429 and temporary firewall hold.
              </div>
            </div>
          </div>

          <div className="space-y-2 p-4 rounded-xl bg-[#080B10] border border-[#1E293B]">
            <div className="font-semibold text-slate-200">Automated Defensive Actions</div>
            <p className="text-slate-400 text-xs">Instant automated response execution upon detection.</p>
            <div className="space-y-3 pt-3">
              <label className="flex items-center justify-between cursor-pointer">
                <span className="text-slate-300">Auto-quarantine compromised sessions</span>
                <input
                  type="checkbox"
                  checked={autoQuarantine}
                  onChange={(e) => setAutoQuarantine(e.target.checked)}
                  className="accent-emerald-500 w-4 h-4 cursor-pointer"
                />
              </label>

              <label className="flex items-center justify-between cursor-pointer">
                <span className="text-slate-300">Live Slack SOC alerts</span>
                <input
                  type="checkbox"
                  checked={slackAlerts}
                  onChange={(e) => setSlackAlerts(e.target.checked)}
                  className="accent-emerald-500 w-4 h-4 cursor-pointer"
                />
              </label>

              <label className="flex items-center justify-between cursor-pointer">
                <span className="text-slate-300">Escalate to PagerDuty on P1</span>
                <input
                  type="checkbox"
                  checked={pagerdutyEscalation}
                  onChange={(e) => setPagerdutyEscalation(e.target.checked)}
                  className="accent-emerald-500 w-4 h-4 cursor-pointer"
                />
              </label>
            </div>
          </div>
        </div>
      </div>

      {/* 4. Organization & Subscription Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Organization & RBAC */}
        <div className="p-5 rounded-xl bg-[#0F1622] border border-[#1E293B] space-y-4 font-sans">
          <div className="flex items-center justify-between pb-3 border-b border-[#1E293B]">
            <div className="flex items-center gap-2">
              <Building className="w-4 h-4 text-sky-400" />
              <h2 className="text-base font-semibold text-white">Organization & team roles</h2>
            </div>
            <button
              type="button"
              onClick={() => setIsInviteModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#080B10] hover:bg-[#151F2E] text-sky-400 border border-[#1E293B] text-xs font-sans transition-all cursor-pointer"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>Invite member</span>
            </button>
          </div>

          <div className="space-y-3 text-xs font-sans">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <span className="text-slate-400 text-[11px] uppercase">Organization Name</span>
                <div className="text-slate-200 font-semibold mt-0.5">Apex Cyber Systems</div>
              </div>
              <div>
                <span className="text-slate-400 text-[11px] uppercase">Tenant Slug</span>
                <div className="text-slate-200 font-mono mt-0.5">apex-cyber</div>
              </div>
            </div>

            <div>
              <span className="text-slate-400 text-[11px] uppercase">
                Team Members ({teamMembers.length})
              </span>
              <div className="mt-2 space-y-2">
                {teamMembers.map((m) => (
                  <div
                    key={m.email}
                    className="flex items-center justify-between p-2.5 rounded-lg bg-[#080B10] border border-[#1E293B] hover:border-slate-700 transition-colors"
                  >
                    <div>
                      <div className="font-semibold text-slate-200">{m.name}</div>
                      <div className="text-slate-400 text-[11px]">{m.email}</div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-[10px] font-bold text-emerald-400 px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/30">
                        {m.role}
                      </span>
                      {m.role !== "Owner / Admin" && (
                        <button
                          type="button"
                          onClick={() => handleRemoveMember(m.email)}
                          title="Remove Member"
                          className="text-slate-500 hover:text-red-400 p-1 transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Subscription Tier Simulation */}
        <div className="p-5 rounded-xl bg-[#0F1622] border border-[#1E293B] space-y-4 font-sans">
          <div className="flex items-center gap-2 pb-3 border-b border-[#1E293B]">
            <CreditCard className="w-4 h-4 text-purple-400" />
            <h2 className="text-base font-semibold text-white">Billing & subscription tier</h2>
          </div>
          <div className="space-y-3.5 text-xs font-sans">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-slate-400 text-[11px] uppercase">Current Plan</span>
                <div className="text-xl font-bold text-white mt-0.5">Enterprise SOC</div>
              </div>
              <span className="px-2.5 py-1 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 font-bold text-xs">
                ACTIVE
              </span>
            </div>

            <div className="space-y-1.5 pt-2 border-t border-[#1E293B]">
              <div className="flex items-center justify-between text-slate-400">
                <span>Monthly Request Quota:</span>
                <span className="text-white font-mono font-bold">1,842 / 5,000,000 (0.03%)</span>
              </div>
              <div className="w-full h-2 rounded-full bg-[#080B10] overflow-hidden border border-[#1E293B]">
                <div className="h-full bg-emerald-500 w-[2%]" />
              </div>
            </div>

            <div className="flex items-center justify-between text-slate-400 pt-1">
              <span>Active Seats:</span>
              <span className="text-white font-mono font-bold">{teamMembers.length} / 50</span>
            </div>

            <div className="p-3 rounded-lg bg-[#080B10] border border-[#1E293B] text-slate-400 text-[11px] leading-relaxed">
              Included Enterprise Capabilities: AI Firewall reverse proxy inspection, real-time WebSocket threat stream, Red Team lab, Isolation Forest ML anomaly detector, and automated OWASP/NIST compliance reporting.
            </div>
          </div>
        </div>
      </div>

      {/* 5. Invite Member Modal */}
      {isInviteModalOpen && (
        <div
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in"
          role="dialog"
          aria-modal="true"
        >
          <form
            onSubmit={handleInviteMember}
            className="w-full max-w-md bg-[#0F1622] border border-[#1E293B] rounded-xl shadow-2xl p-6 space-y-4 text-xs font-sans"
          >
            <div className="flex items-center justify-between border-b border-[#1E293B] pb-3">
              <h2 className="text-base font-bold text-white">Invite team member</h2>
              <button
                type="button"
                onClick={() => setIsInviteModalOpen(false)}
                className="p-1 rounded text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-1.5">
              <label className="text-slate-300 font-medium">Full Name</label>
              <input
                type="text"
                required
                value={inviteName}
                onChange={(e) => setInviteName(e.target.value)}
                placeholder="e.g. Elena Rostova"
                className="w-full p-2.5 rounded-lg bg-[#080B10] border border-[#1E293B] text-slate-200 focus:outline-none focus:border-sky-500"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-slate-300 font-medium">Work Email</label>
              <input
                type="email"
                required
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                placeholder="e.g. elena@apexcyber.ai"
                className="w-full p-2.5 rounded-lg bg-[#080B10] border border-[#1E293B] text-slate-200 focus:outline-none focus:border-sky-500"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-slate-300 font-medium">Assigned Role</label>
              <select
                value={inviteRole}
                onChange={(e) => setInviteRole(e.target.value)}
                className="w-full p-2.5 rounded-lg bg-[#080B10] border border-[#1E293B] text-slate-200 focus:outline-none focus:border-sky-500"
              >
                <option value="Admin">Admin (Full Policy & Key Control)</option>
                <option value="Analyst">Analyst (View & Respond to Threats)</option>
                <option value="Viewer">Viewer (Read-only Compliance Access)</option>
              </select>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#1E293B]">
              <button
                type="button"
                onClick={() => setIsInviteModalOpen(false)}
                className="px-3 py-2 rounded-lg text-slate-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-lg bg-sky-500 hover:bg-sky-400 text-black font-semibold text-xs transition-all cursor-pointer shadow-sm"
              >
                Send invitation
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
