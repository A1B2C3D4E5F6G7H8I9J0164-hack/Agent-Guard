"use client";

import React, { useEffect, useState } from "react";
import {
  Activity,
  ShieldAlert,
  Search,
  Filter,
  Play,
  Pause,
  AlertTriangle,
  Zap,
  CheckCircle2,
  XCircle,
  Eye,
  X,
  ExternalLink,
  Copy,
  Check,
} from "lucide-react";
import { api, SecurityEventItem } from "@/lib/api";
import { PageHeader } from "@/components/ui/PageHeader";
import { DecisionBadge } from "@/components/ui/DecisionBadge";
import { SeverityBadge } from "@/components/ui/SeverityBadge";
import { EmptyState } from "@/components/ui/EmptyState";

export default function ThreatMonitorView() {
  const [events, setEvents] = useState<SecurityEventItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSeverity, setSelectedSeverity] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [isStreaming, setIsStreaming] = useState(true);
  const [selectedEvent, setSelectedEvent] = useState<SecurityEventItem | null>(null);
  const [isSimulating, setIsSimulating] = useState(false);
  const [copiedPayload, setCopiedPayload] = useState(false);

  const fetchEvents = async () => {
    try {
      const sevParam = selectedSeverity === "all" ? undefined : selectedSeverity;
      const data = await api.getThreats(sevParam);
      setEvents(data);
    } catch (e) {
      console.error("Failed to fetch threat events", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
    if (!isStreaming) return;
    const interval = setInterval(fetchEvents, 3000);
    return () => clearInterval(interval);
  }, [selectedSeverity, isStreaming]);

  const handleSimulate = async (type: string, severity: string) => {
    setIsSimulating(true);
    try {
      await api.simulateThreat(type, severity);
      await fetchEvents();
    } catch (e) {
      console.error(e);
    } finally {
      setIsSimulating(false);
    }
  };

  const filteredEvents = events.filter((e) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      e.event_type.toLowerCase().includes(q) ||
      e.source_ip.toLowerCase().includes(q) ||
      (e.payload_sample && e.payload_sample.toLowerCase().includes(q))
    );
  });

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedPayload(true);
    setTimeout(() => setCopiedPayload(false), 2000);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 font-sans">
      {/* 1. Page Header */}
      <PageHeader
        title="Live Threat Monitor & SOC Stream"
        description="Real-time adversarial prompt inspection, secret exfiltration detection, and autonomous agent security alerts."
        statusLine={
          isStreaming
            ? "Live Threat Ingestion Stream Connected · 3s Polling"
            : "Stream Paused · Displaying Cached Telemetry"
        }
        badge={{
          text: isStreaming ? "LIVE STREAM" : "PAUSED",
          variant: isStreaming ? "emerald" : "amber",
        }}
        actions={
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={() => setIsStreaming(!isStreaming)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-sans transition-colors cursor-pointer ${
                isStreaming
                  ? "bg-[#0F1622] border-[#1E293B] text-slate-300 hover:text-white"
                  : "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
              }`}
            >
              {isStreaming ? (
                <>
                  <Pause className="w-3.5 h-3.5" />
                  <span>Pause stream</span>
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5" />
                  <span>Resume stream</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={() => handleSimulate("prompt_injection", "critical")}
              disabled={isSimulating}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 text-xs font-sans font-medium transition-all cursor-pointer disabled:opacity-50"
            >
              <Zap className="w-3.5 h-3.5" />
              <span>Simulate injection</span>
            </button>

            <button
              type="button"
              onClick={() => handleSimulate("jailbreak", "high")}
              disabled={isSimulating}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 text-xs font-sans font-medium transition-all cursor-pointer disabled:opacity-50"
            >
              <Zap className="w-3.5 h-3.5" />
              <span>Simulate jailbreak</span>
            </button>
          </div>
        }
      />

      {/* 2. Filter and Search Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-xl bg-[#0F1622] border border-[#1E293B]">
        {/* Severity Tabs */}
        <div className="flex items-center gap-1 bg-[#080B10] p-1 rounded-lg border border-[#1E293B] text-xs font-sans">
          {["all", "critical", "high", "medium", "low"].map((sev) => (
            <button
              key={sev}
              type="button"
              onClick={() => setSelectedSeverity(sev)}
              className={`px-3 py-1 rounded-md capitalize text-xs font-medium transition-all cursor-pointer ${
                selectedSeverity === sev
                  ? "bg-[#1E293B] text-white shadow-sm font-semibold"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              {sev === "all" ? "All severities" : sev}
            </button>
          ))}
        </div>

        {/* Search Input */}
        <div className="relative min-w-[280px]">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Filter by IP, attack type, or keyword..."
            className="w-full pl-9 pr-3 py-1.5 rounded-lg bg-[#080B10] border border-[#1E293B] text-xs text-slate-200 placeholder:text-slate-500 font-sans focus:outline-none focus:border-emerald-500"
          />
        </div>
      </div>

      {/* 3. Threat Events Table */}
      <div className="rounded-xl bg-[#0F1622] border border-[#1E293B] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-sans">
            <thead className="bg-[#080B10] text-slate-400 text-[11px] uppercase tracking-wider border-b border-[#1E293B]">
              <tr>
                <th className="py-3 px-4">Timestamp</th>
                <th className="py-3 px-4">Severity</th>
                <th className="py-3 px-4">Attack Vector</th>
                <th className="py-3 px-4">Source IP</th>
                <th className="py-3 px-4">Risk Score</th>
                <th className="py-3 px-4">Action Taken</th>
                <th className="py-3 px-4">Sample Payload</th>
                <th className="py-3 px-4 text-right">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1E293B] bg-[#0F1622]">
              {loading && events.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-500 font-sans">
                    Listening for incoming security events...
                  </td>
                </tr>
              ) : filteredEvents.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-500 font-sans">
                    No threat events found matching current criteria.
                  </td>
                </tr>
              ) : (
                filteredEvents.map((evt) => (
                  <tr
                    key={evt.id}
                    onClick={() => setSelectedEvent(evt)}
                    className="hover:bg-[#151F2E]/60 cursor-pointer transition-colors"
                  >
                    <td className="py-3 px-4 font-mono text-slate-400 whitespace-nowrap">
                      {new Date(evt.created_at).toLocaleTimeString()}
                    </td>
                    <td className="py-3 px-4">
                      <SeverityBadge severity={evt.severity} size="sm" />
                    </td>
                    <td className="py-3 px-4 font-medium text-slate-200 capitalize">
                      {evt.event_type.replace(/_/g, " ")}
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-300">{evt.source_ip}</td>
                    <td className="py-3 px-4 font-mono font-bold text-white">
                      <span
                        className={
                          evt.risk_score >= 80
                            ? "text-red-400"
                            : evt.risk_score >= 60
                            ? "text-amber-400"
                            : "text-slate-300"
                        }
                      >
                        {evt.risk_score.toFixed(1)}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <DecisionBadge decision={evt.action_taken as any} size="sm" />
                    </td>
                    <td className="py-3 px-4 max-w-xs truncate font-mono text-slate-400 text-[11px]">
                      {evt.payload_sample || "N/A"}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedEvent(evt);
                        }}
                        className="text-xs text-slate-400 hover:text-white transition-colors cursor-pointer"
                      >
                        Inspect
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 4. Slide-over Event Details Drawer */}
      {selectedEvent && (
        <div
          className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex justify-end animate-in fade-in duration-150"
          role="dialog"
          aria-modal="true"
        >
          <div className="w-full max-w-xl bg-[#0F1622] border-l border-[#1E293B] h-full p-6 flex flex-col justify-between shadow-2xl overflow-y-auto font-sans">
            <div className="space-y-6">
              {/* Drawer Header */}
              <div className="flex items-start justify-between pb-4 border-b border-[#1E293B]">
                <div>
                  <div className="flex items-center gap-2 mb-1.5">
                    <SeverityBadge severity={selectedEvent.severity} />
                    <DecisionBadge decision={selectedEvent.action_taken as any} size="sm" />
                  </div>
                  <h3 className="text-lg font-bold text-white capitalize">
                    {selectedEvent.event_type.replace(/_/g, " ")}
                  </h3>
                  <div className="text-xs font-mono text-slate-400 mt-1">
                    Event ID: {selectedEvent.id}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedEvent(null)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-[#1E293B] transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Event Attributes Grid */}
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-3 rounded-lg bg-[#080B10] border border-[#1E293B]">
                  <div className="text-slate-400 font-sans">Source IP</div>
                  <div className="font-mono text-white mt-1 font-semibold">
                    {selectedEvent.source_ip}
                  </div>
                </div>
                <div className="p-3 rounded-lg bg-[#080B10] border border-[#1E293B]">
                  <div className="text-slate-400 font-sans">Risk Score</div>
                  <div className="font-mono text-white mt-1 font-bold text-base">
                    {selectedEvent.risk_score.toFixed(1)} / 100
                  </div>
                </div>
                <div className="p-3 rounded-lg bg-[#080B10] border border-[#1E293B]">
                  <div className="text-slate-400 font-sans">Timestamp</div>
                  <div className="font-mono text-white mt-1">
                    {new Date(selectedEvent.created_at).toLocaleString()}
                  </div>
                </div>
                <div className="p-3 rounded-lg bg-[#080B10] border border-[#1E293B]">
                  <div className="text-slate-400 font-sans">Confidence</div>
                  <div className="font-mono text-emerald-400 mt-1 font-semibold">
                    {(selectedEvent.confidence * 100).toFixed(0)}%
                  </div>
                </div>
              </div>

              {/* Payload Sample */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-300 font-sans">
                    Payload Sample
                  </span>
                  {selectedEvent.payload_sample && (
                    <button
                      type="button"
                      onClick={() => handleCopy(selectedEvent.payload_sample || "")}
                      className="text-[11px] text-slate-400 hover:text-white flex items-center gap-1"
                    >
                      {copiedPayload ? (
                        <>
                          <Check className="w-3 h-3 text-emerald-400" />
                          <span className="text-emerald-400">Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3" />
                          <span>Copy payload</span>
                        </>
                      )}
                    </button>
                  )}
                </div>
                <pre className="p-3 rounded-lg bg-[#080B10] border border-[#1E293B] text-xs font-mono text-slate-200 overflow-x-auto whitespace-pre-wrap leading-relaxed max-h-48">
                  {selectedEvent.payload_sample || "No payload content recorded."}
                </pre>
              </div>

              {/* Detections Triggered */}
              {selectedEvent.detections && selectedEvent.detections.length > 0 && (
                <div className="space-y-2">
                  <div className="text-xs font-semibold text-slate-300 font-sans">
                    Triggered Detections
                  </div>
                  <div className="space-y-2">
                    {selectedEvent.detections.map((det) => (
                      <div
                        key={det.id}
                        className="p-3 rounded-lg bg-[#080B10] border border-[#1E293B] text-xs space-y-1"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-white">{det.engine_name}</span>
                          <span className="font-mono text-emerald-400">
                            {(det.confidence * 100).toFixed(0)}% confidence
                          </span>
                        </div>
                        <div className="text-slate-400">{det.attack_category}</div>
                        {det.rule_triggered && (
                          <div className="pt-1 text-[11px] font-mono text-sky-400">
                            Rule: {det.rule_triggered}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Drawer Actions */}
            <div className="pt-4 border-t border-[#1E293B] flex items-center justify-end">
              <button
                type="button"
                onClick={() => setSelectedEvent(null)}
                className="px-4 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-semibold font-sans transition-colors cursor-pointer"
              >
                Close details
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
