"use client";

import React, { useState, useEffect } from "react";
import {
  Globe2,
  ShieldAlert,
  Search,
  ShieldCheck,
  AlertTriangle,
  Plus,
  Filter,
  CheckCircle2,
  X,
  ExternalLink,
  ShieldX,
  Database,
} from "lucide-react";
import { api } from "@/lib/api";
import { PageHeader } from "@/components/ui/PageHeader";
import { SeverityBadge } from "@/components/ui/SeverityBadge";

interface ThreatSignature {
  id: string;
  name: string;
  type: string;
  severity: string;
  added_at: string;
  pattern?: string;
  description?: string;
}

interface ReputationResult {
  ip: string;
  reputation: string;
  threat_type: string;
  confidence: number;
  is_known_threat: boolean;
  details?: {
    asn?: string;
    country?: string;
    last_seen?: string;
    incidents_triggered?: number;
    recommended_action?: string;
  };
}

export default function AttackIntelligenceView() {
  const [ipInput, setIpInput] = useState("198.51.100.18");
  const [lookupResult, setLookupResult] = useState<ReputationResult | null>(null);
  const [isSearching, setIsSearching] = useState(false);

  // Threat Feed state
  const [signatures, setSignatures] = useState<ThreatSignature[]>([]);
  const [filterType, setFilterType] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  // Add IOC Modal state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newSigName, setNewSigName] = useState("");
  const [newSigType, setNewSigType] = useState("jailbreak_template");
  const [newSigSeverity, setNewSigSeverity] = useState("critical");
  const [newSigPattern, setNewSigPattern] = useState("");
  const [newSigDesc, setNewSigDesc] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);

  const loadFeed = async () => {
    try {
      const feed = await api.getThreatFeed();
      setSignatures(feed);
    } catch (err) {
      console.error("Failed to load threat feed", err);
    }
  };

  const handleLookup = async (targetIp?: string) => {
    const ipToQuery = targetIp || ipInput.trim();
    if (!ipToQuery) return;
    setIsSearching(true);
    try {
      const res = await api.getIpReputation(ipToQuery);
      setLookupResult(res);
    } catch (err) {
      console.error("IP lookup failed", err);
    } finally {
      setIsSearching(false);
    }
  };

  useEffect(() => {
    loadFeed();
    handleLookup("198.51.100.18");
  }, []);

  const handleAddSignature = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSigName.trim()) return;
    setIsSubmitting(true);
    try {
      const created = await api.addThreatSignature({
        name: newSigName.trim(),
        type: newSigType,
        severity: newSigSeverity,
        pattern: newSigPattern.trim(),
        description: newSigDesc.trim(),
      });
      setSignatures((prev) => [created, ...prev]);
      setStatusMsg(`Successfully added IOC Signature ${created.id}`);
      setIsAddModalOpen(false);
      setNewSigName("");
      setNewSigPattern("");
      setNewSigDesc("");
      setTimeout(() => setStatusMsg(null), 5000);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const vectorTypes = [
    "ALL",
    "jailbreak_template",
    "character_evasion",
    "code_execution_probe",
    "dlp_exfiltration",
    "delimiter_hijacking",
  ];

  const filteredSignatures = signatures.filter((sig) => {
    const matchesType = filterType === "ALL" || sig.type === filterType;
    const matchesSearch =
      sig.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      sig.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (sig.pattern && sig.pattern.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesType && matchesSearch;
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 font-sans">
      {/* 1. Page Header */}
      <PageHeader
        title="Attack Intelligence & Reputation Investigation"
        description="Continuous threat feed ingestion covering known adversarial jailbreak templates, attacker subnets, and zero-day prompt injection IOCs."
        statusLine="Global Threat Intelligence Active · AS64496 Telemetry Connected"
        badge={{ text: "THREAT INTEL", variant: "sky" }}
        actions={
          <button
            type="button"
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-sky-500 hover:bg-sky-400 text-black font-semibold text-xs font-sans transition-all cursor-pointer shadow-sm"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add custom IOC</span>
          </button>
        }
      />

      {statusMsg && (
        <div
          role="status"
          className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-xs font-sans text-emerald-300 flex items-center justify-between animate-in fade-in"
        >
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>{statusMsg}</span>
          </div>
          <button onClick={() => setStatusMsg(null)} className="text-slate-400 hover:text-white">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* 2. IP Lookup Tool & Enrichment Card */}
      <div className="p-5 rounded-xl bg-[#0F1622] border border-[#1E293B] space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-[#1E293B]">
          <div className="flex items-center gap-2">
            <Search className="w-4 h-4 text-sky-400" />
            <h2 className="text-base font-semibold text-white font-sans">
              IOC IP & reputation investigation gateway
            </h2>
          </div>
          <span className="text-xs text-slate-400 font-sans">Live AS64496 enrichment feed</span>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <input
            type="text"
            value={ipInput}
            onChange={(e) => setIpInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleLookup()}
            className="flex-1 min-w-[260px] max-w-lg p-2.5 rounded-lg bg-[#080B10] border border-[#1E293B] text-xs font-mono text-slate-200 focus:outline-none focus:border-sky-500"
            placeholder="Enter IP to investigate (e.g. 198.51.100.18, 203.0.113.88)"
          />
          <button
            type="button"
            onClick={() => handleLookup()}
            disabled={isSearching || !ipInput.trim()}
            className="px-4 py-2.5 rounded-lg bg-sky-500 hover:bg-sky-400 text-black font-semibold text-xs font-sans flex items-center gap-2 transition-all disabled:opacity-50 cursor-pointer shadow-sm"
          >
            <Search className={`w-3.5 h-3.5 ${isSearching ? "animate-spin" : ""}`} />
            <span>{isSearching ? "Querying feed..." : "Investigate IP"}</span>
          </button>

          {/* Preset chips */}
          <div className="flex items-center gap-1.5 text-xs font-sans text-slate-400">
            <span>Presets:</span>
            {["198.51.100.18", "203.0.113.88", "192.0.2.45"].map((sample) => (
              <button
                key={sample}
                type="button"
                onClick={() => {
                  setIpInput(sample);
                  handleLookup(sample);
                }}
                className="px-2 py-0.5 rounded bg-[#080B10] border border-[#1E293B] hover:border-sky-500 text-sky-400 font-mono text-[11px] cursor-pointer"
              >
                {sample}
              </button>
            ))}
          </div>
        </div>

        {lookupResult && (
          <div className="p-4 rounded-xl bg-[#080B10] border border-[#1E293B] text-xs font-sans space-y-3 mt-3 animate-in fade-in">
            <div className="flex flex-wrap items-center justify-between gap-2 pb-2.5 border-b border-[#1E293B]">
              <div className="flex items-center gap-2">
                <span className="font-bold text-base text-white font-mono">{lookupResult.ip}</span>
                <span className="text-[11px] text-slate-400 font-mono">
                  ASN: {lookupResult.details?.asn || "Unknown"}
                </span>
              </div>
              <span
                className={`px-2.5 py-1 rounded text-[11px] font-bold uppercase tracking-wider ${
                  lookupResult.reputation === "malicious"
                    ? "bg-red-500/10 text-red-400 border border-red-500/30"
                    : lookupResult.reputation === "suspicious"
                    ? "bg-amber-500/10 text-amber-400 border border-amber-500/30"
                    : "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30"
                }`}
              >
                Reputation: {lookupResult.reputation}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-slate-400">
              <div className="p-3 rounded-lg bg-[#0F1622] border border-[#1E293B]">
                <span className="text-slate-400 text-[11px] uppercase">Threat Classification</span>
                <div className="text-slate-200 font-semibold mt-1">{lookupResult.threat_type}</div>
              </div>

              <div className="p-3 rounded-lg bg-[#0F1622] border border-[#1E293B]">
                <span className="text-slate-400 text-[11px] uppercase">IOC Confidence</span>
                <div className="text-sky-400 font-bold font-mono text-sm mt-1">
                  {(lookupResult.confidence * 100).toFixed(0)}%
                </div>
              </div>

              <div className="p-3 rounded-lg bg-[#0F1622] border border-[#1E293B]">
                <span className="text-slate-400 text-[11px] uppercase">Incidents Correlated</span>
                <div className="text-white font-bold font-mono text-sm mt-1">
                  {lookupResult.details?.incidents_triggered ?? 0} Recorded
                </div>
              </div>

              <div className="p-3 rounded-lg bg-[#0F1622] border border-[#1E293B]">
                <span className="text-slate-400 text-[11px] uppercase">Recommended Action</span>
                <div className="text-emerald-400 font-semibold font-mono mt-1 truncate">
                  {lookupResult.details?.recommended_action || "ALLOW"}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 3. Known Threat Signatures Feed */}
      <div className="p-5 rounded-xl bg-[#0F1622] border border-[#1E293B] space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4 pb-3 border-b border-[#1E293B]">
          <div className="flex items-center gap-2">
            <Database className="w-4 h-4 text-emerald-400" />
            <h2 className="text-base font-semibold text-white font-sans">
              Community & proprietary IOC signature feed
            </h2>
          </div>

          <div className="flex items-center gap-3">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search signatures or tokens..."
              className="px-3 py-1.5 rounded-lg bg-[#080B10] border border-[#1E293B] text-xs font-sans text-slate-300 focus:outline-none focus:border-emerald-500 w-56"
            />
          </div>
        </div>

        {/* Vector Filter Pills */}
        <div className="flex flex-wrap items-center gap-2">
          {vectorTypes.map((v) => (
            <button
              key={v}
              type="button"
              onClick={() => setFilterType(v)}
              className={`px-2.5 py-1 rounded-md text-xs font-sans transition-all cursor-pointer ${
                filterType === v
                  ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/40 font-semibold"
                  : "bg-[#080B10] text-slate-400 border border-[#1E293B] hover:text-slate-200"
              }`}
            >
              {v.replace(/_/g, " ")}
            </button>
          ))}
        </div>

        <div className="overflow-x-auto rounded-lg border border-[#1E293B]">
          <table className="w-full text-left text-xs font-sans">
            <thead className="bg-[#080B10] text-slate-400 text-[11px] uppercase tracking-wider border-b border-[#1E293B]">
              <tr>
                <th className="py-3 px-4">IOC ID</th>
                <th className="py-3 px-4">Signature Name</th>
                <th className="py-3 px-4">Vector Type</th>
                <th className="py-3 px-4">Pattern / Token</th>
                <th className="py-3 px-4">Severity</th>
                <th className="py-3 px-4">Added Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1E293B] bg-[#0F1622]">
              {filteredSignatures.map((s) => (
                <tr key={s.id} className="hover:bg-[#151F2E]/50 transition-colors">
                  <td className="py-3 px-4 font-mono font-bold text-sky-400">{s.id}</td>
                  <td className="py-3 px-4 font-medium text-slate-200">
                    <div>{s.name}</div>
                    {s.description && (
                      <div className="text-[11px] text-slate-400 font-normal mt-0.5 line-clamp-1">
                        {s.description}
                      </div>
                    )}
                  </td>
                  <td className="py-3 px-4 text-slate-400 capitalize">
                    {s.type.replace(/_/g, " ")}
                  </td>
                  <td className="py-3 px-4">
                    <code className="text-emerald-400 bg-[#080B10] px-2 py-0.5 rounded border border-[#1E293B] text-[11px] font-mono">
                      {s.pattern || "N/A"}
                    </code>
                  </td>
                  <td className="py-3 px-4">
                    <SeverityBadge severity={s.severity} size="sm" />
                  </td>
                  <td className="py-3 px-4 text-slate-400 font-mono text-[11px]">{s.added_at}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 4. Add Signature Modal */}
      {isAddModalOpen && (
        <div
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in"
          role="dialog"
          aria-modal="true"
        >
          <form
            onSubmit={handleAddSignature}
            className="w-full max-w-lg bg-[#0F1622] border border-[#1E293B] rounded-xl shadow-2xl p-6 space-y-4 text-xs font-sans"
          >
            <div className="flex items-center justify-between border-b border-[#1E293B] pb-3">
              <div>
                <span className="text-[11px] uppercase text-sky-400 font-medium">IOC Repository</span>
                <h2 className="text-base font-bold text-white">Add custom threat signature</h2>
              </div>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="p-1 rounded text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-1.5">
              <label className="text-slate-300 font-medium">Signature Name</label>
              <input
                type="text"
                required
                value={newSigName}
                onChange={(e) => setNewSigName(e.target.value)}
                placeholder="e.g. Reverse Token Smuggling Jailbreak"
                className="w-full p-2.5 rounded-lg bg-[#080B10] border border-[#1E293B] text-slate-200 focus:outline-none focus:border-sky-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-slate-300 font-medium">Vector Category</label>
                <select
                  value={newSigType}
                  onChange={(e) => setNewSigType(e.target.value)}
                  className="w-full p-2.5 rounded-lg bg-[#080B10] border border-[#1E293B] text-slate-200 focus:outline-none focus:border-sky-500"
                >
                  <option value="jailbreak_template">Jailbreak Template</option>
                  <option value="delimiter_hijacking">Delimiter Hijacking</option>
                  <option value="character_evasion">Character Evasion</option>
                  <option value="code_execution_probe">Code Execution Probe</option>
                  <option value="dlp_exfiltration">DLP Exfiltration</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-slate-300 font-medium">Severity Level</label>
                <select
                  value={newSigSeverity}
                  onChange={(e) => setNewSigSeverity(e.target.value)}
                  className="w-full p-2.5 rounded-lg bg-[#080B10] border border-[#1E293B] text-slate-200 focus:outline-none focus:border-sky-500"
                >
                  <option value="critical">Critical (P1)</option>
                  <option value="high">High (P2)</option>
                  <option value="medium">Medium (P3)</option>
                </select>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-slate-300 font-medium">Detection Pattern / Token Trigger</label>
              <input
                type="text"
                value={newSigPattern}
                onChange={(e) => setNewSigPattern(e.target.value)}
                placeholder="e.g. <|system|> or bypass:admin"
                className="w-full p-2.5 rounded-lg bg-[#080B10] border border-[#1E293B] text-slate-200 font-mono focus:outline-none focus:border-sky-500"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-slate-300 font-medium">Description & Attack Context</label>
              <textarea
                value={newSigDesc}
                onChange={(e) => setNewSigDesc(e.target.value)}
                rows={2}
                placeholder="Brief explanation of the adversary technique..."
                className="w-full p-2.5 rounded-lg bg-[#080B10] border border-[#1E293B] text-slate-200 focus:outline-none focus:border-sky-500"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#1E293B]">
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="px-3 py-2 rounded-lg text-slate-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting || !newSigName.trim()}
                className="px-4 py-2 rounded-lg bg-sky-500 hover:bg-sky-400 text-black font-semibold text-xs transition-all disabled:opacity-50 cursor-pointer shadow-sm"
              >
                {isSubmitting ? "Adding..." : "Add signature"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
