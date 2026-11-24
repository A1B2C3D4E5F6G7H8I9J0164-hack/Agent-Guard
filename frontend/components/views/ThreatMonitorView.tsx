"use client";

import React, { useEffect, useState, useRef, useCallback } from "react";
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
  ChevronUp,
  Code2,
  FileDiff,
  Flame,
  Radio,
} from "lucide-react";
import { api, SecurityEventItem } from "@/lib/api";
import { PageHeader } from "@/components/ui/PageHeader";
import { DecisionBadge } from "@/components/ui/DecisionBadge";
import { SeverityBadge } from "@/components/ui/SeverityBadge";
import { EmptyState } from "@/components/ui/EmptyState";
import { useToast } from "@/components/ui/Toast";

// Syntax highlight helper for JSON display in detail drawer
function JsonSyntaxViewer({ data }: { data: any }) {
  const jsonString = JSON.stringify(data, null, 2);

  const highlightTokens = (json: string) => {
    return json.replace(
      /("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g,
      (match) => {
        let cls = "text-[#EDEBE6]"; // default
        if (/^"/.test(match)) {
          if (/:$/.test(match)) {
            cls = "text-[#64D2FF] font-semibold"; // key
          } else {
            cls = "text-[#C6F432]"; // string value
          }
        } else if (/true|false/.test(match)) {
          cls = "text-[#FF9F0A]"; // boolean
        } else if (/null/.test(match)) {
          cls = "text-[#8A8D93]"; // null
        } else {
          cls = "text-[#FF443A]"; // number
        }
        return `<span class="${cls}">${match}</span>`;
      }
    );
  };

  return (
    <pre
      className="p-4 rounded-xl bg-[#0A0B0D] border border-[#1F2128] text-xs font-mono overflow-x-auto leading-relaxed select-text"
      dangerouslySetInnerHTML={{ __html: highlightTokens(jsonString) }}
    />
  );
}

export default function ThreatMonitorView() {
  const { showToast } = useToast();
  const [events, setEvents] = useState<SecurityEventItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSeverity, setSelectedSeverity] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [isStreaming, setIsStreaming] = useState(true);
  const [selectedEvent, setSelectedEvent] = useState<SecurityEventItem | null>(null);
  const [drawerTab, setDrawerTab] = useState<"overview" | "json" | "diff">("overview");
  const [isSimulating, setIsSimulating] = useState(false);
  const [copiedPayload, setCopiedPayload] = useState(false);
  const [copiedJson, setCopiedJson] = useState(false);

  // New events tracking & floating pill
  const [newlyArrivedIds, setNewlyArrivedIds] = useState<Set<string>>(new Set());
  const [unseenCount, setUnseenCount] = useState(0);
  const [isScrolledDown, setIsScrolledDown] = useState(false);
  const tableContainerRef = useRef<HTMLDivElement>(null);
  const eventSourceRef = useRef<EventSource | null>(null);

  // Scroll listener to toggle "N new events" pill
  const handleScroll = () => {
    if (tableContainerRef.current) {
      const top = tableContainerRef.current.scrollTop;
      const scrolled = top > 80;
      setIsScrolledDown(scrolled);
      if (!scrolled) {
        setUnseenCount(0);
      }
    }
  };

  const scrollToTop = () => {
    if (tableContainerRef.current) {
      tableContainerRef.current.scrollTo({ top: 0, behavior: "smooth" });
      setUnseenCount(0);
    }
  };

  // Initial fetch
  const fetchEvents = useCallback(async () => {
    try {
      const sevParam = selectedSeverity === "all" ? undefined : selectedSeverity;
      const data = await api.getThreats(sevParam);
      setEvents(data);
    } catch (e) {
      console.warn("Failed to fetch initial threat events", e);
    } finally {
      setLoading(false);
    }
  }, [selectedSeverity]);

  // Connect to SSE Stream or fallback to polling
  useEffect(() => {
    fetchEvents();

    if (!isStreaming) {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
      return;
    }

    let sseActive = false;
    const sseUrl = api.getThreatStreamUrl();

    try {
      const es = new EventSource(sseUrl);
      eventSourceRef.current = es;

      es.onmessage = (event) => {
        sseActive = true;
        try {
          const newEvt: SecurityEventItem = JSON.parse(event.data);
          if (newEvt && newEvt.id) {
            setEvents((prev) => {
              if (prev.some((e) => e.id === newEvt.id)) return prev;
              const next = [newEvt, ...prev];
              // Mark as newly arrived for animation
              setNewlyArrivedIds((curr) => new Set(curr).add(newEvt.id));
              setTimeout(() => {
                setNewlyArrivedIds((curr) => {
                  const updated = new Set(curr);
                  updated.delete(newEvt.id);
                  return updated;
                });
              }, 2500);

              if (tableContainerRef.current && tableContainerRef.current.scrollTop > 80) {
                setUnseenCount((c) => c + 1);
              }
              return next;
            });
          }
        } catch {
          // Heartbeat or malformed comment
        }
      };

      es.onerror = () => {
        // SSE not supported or offline: graceful fallback to periodic polling
        es.close();
        eventSourceRef.current = null;
      };
    } catch {
      // EventSource failed
    }

    // Polling fallback interval (runs if SSE isn't pushing or to ensure fresh sync)
    const pollInterval = setInterval(() => {
      if (!sseActive) {
        fetchEvents();
      }
    }, 4000);

    return () => {
      clearInterval(pollInterval);
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
    };
  }, [isStreaming, fetchEvents]);

  const handleSimulate = async (type: string, severity: string) => {
    setIsSimulating(true);
    try {
      await api.simulateThreat(type, severity);
      showToast({
        title: "Threat Simulated",
        message: `Injected sample ${type.replace(/_/g, " ")} (${severity}) into the live firewall pipeline.`,
        type: "warning",
      });
      await fetchEvents();
    } catch (e) {
      console.error(e);
      showToast({
        title: "Simulation Failed",
        message: "Failed to publish simulated threat event.",
        type: "error",
      });
    } finally {
      setIsSimulating(false);
    }
  };

  const filteredEvents = events.filter((e) => {
    if (selectedSeverity !== "all" && e.severity !== selectedSeverity) return false;
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      e.event_type.toLowerCase().includes(q) ||
      e.source_ip.toLowerCase().includes(q) ||
      (e.payload_sample && e.payload_sample.toLowerCase().includes(q))
    );
  });

  const handleCopy = (text: string, type: "payload" | "json") => {
    navigator.clipboard.writeText(text);
    if (type === "payload") {
      setCopiedPayload(true);
      setTimeout(() => setCopiedPayload(false), 2000);
    } else {
      setCopiedJson(true);
      setTimeout(() => setCopiedJson(false), 2000);
    }
  };

  // Severity color mappings
  const getSeverityLeftBorder = (severity: string) => {
    switch (severity.toLowerCase()) {
      case "critical":
        return "border-l-4 border-l-[#FF443A]";
      case "high":
        return "border-l-4 border-l-[#FF9F0A]";
      case "medium":
        return "border-l-4 border-l-[#64D2FF]";
      case "low":
      default:
        return "border-l-4 border-l-[#30D158]";
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 font-sans relative">
      {/* 1. Page Header */}
      <PageHeader
        title="Live Threat Monitor & SOC Stream"
        description="Real-time adversarial prompt inspection, secret exfiltration detection, and autonomous agent security telemetry."
        statusLine={
          isStreaming
            ? "SSE Ingestion Stream Active · Sub-Millisecond Event Pipeline"
            : "Stream Paused · Displaying Cached Telemetry"
        }
        badge={{
          text: isStreaming ? "LIVE STREAM" : "PAUSED",
          variant: isStreaming ? "lime" : "amber",
        }}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => {
                const nextState = !isStreaming;
                setIsStreaming(nextState);
                showToast({
                  title: nextState ? "Stream Resumed" : "Stream Paused",
                  message: nextState
                    ? "Live real-time event pipeline connected."
                    : "Event stream paused. Displaying local cache.",
                  type: "info",
                  undoAction: () => setIsStreaming(!nextState),
                  undoLabel: "Undo",
                });
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-sans transition-colors cursor-pointer ${
                isStreaming
                  ? "bg-[#121316] border-[#1F2128] text-[#8A8D93] hover:text-[#EDEBE6]"
                  : "bg-[#C6F432]/10 border-[#C6F432]/30 text-[#C6F432] font-semibold"
              }`}
            >
              {isStreaming ? (
                <>
                  <Pause className="w-3.5 h-3.5" />
                  <span>Pause stream</span>
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5 text-[#C6F432]" />
                  <span>Resume stream</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={() => handleSimulate("prompt_injection", "critical")}
              disabled={isSimulating}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#FF443A]/10 hover:bg-[#FF443A]/20 text-[#FF443A] border border-[#FF443A]/30 text-xs font-sans font-medium transition-all cursor-pointer disabled:opacity-50"
            >
              <Zap className="w-3.5 h-3.5" />
              <span>Simulate injection</span>
            </button>

            <button
              type="button"
              onClick={() => handleSimulate("jailbreak", "high")}
              disabled={isSimulating}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#FF9F0A]/10 hover:bg-[#FF9F0A]/20 text-[#FF9F0A] border border-[#FF9F0A]/30 text-xs font-sans font-medium transition-all cursor-pointer disabled:opacity-50"
            >
              <Zap className="w-3.5 h-3.5" />
              <span>Simulate jailbreak</span>
            </button>
          </div>
        }
      />

      {/* 2. Filter and Search Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-2xl bg-[#121316] border border-[#1F2128]">
        {/* Severity Tabs */}
        <div className="flex items-center gap-1 bg-[#0A0B0D] p-1 rounded-xl border border-[#1F2128] text-xs font-sans">
          {["all", "critical", "high", "medium", "low"].map((sev) => (
            <button
              key={sev}
              type="button"
              onClick={() => setSelectedSeverity(sev)}
              className={`px-3 py-1 rounded-lg capitalize text-xs font-medium transition-all cursor-pointer ${
                selectedSeverity === sev
                  ? "bg-[#1F2128] text-[#C6F432] shadow-sm font-semibold"
                  : "text-[#8A8D93] hover:text-[#EDEBE6]"
              }`}
            >
              {sev === "all" ? "All severities" : sev}
            </button>
          ))}
        </div>

        {/* Search Input */}
        <div className="relative min-w-[280px]">
          <Search className="w-3.5 h-3.5 text-[#565961] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Filter by IP, attack type, or keyword..."
            className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-[#0A0B0D] border border-[#1F2128] text-xs text-[#EDEBE6] placeholder:text-[#565961] font-sans focus:outline-none focus:border-[#C6F432]"
          />
        </div>
      </div>

      {/* 3. Threat Events Table Container with Floating Pill */}
      <div className="relative rounded-2xl bg-[#121316] border border-[#1F2128] overflow-hidden">
        {/* Floating "N new events" pill button */}
        {unseenCount > 0 && isScrolledDown && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20">
            <button
              type="button"
              onClick={scrollToTop}
              className="flex items-center gap-2 px-4 py-2 rounded-full bg-[#C6F432] text-black font-semibold text-xs shadow-xl hover:bg-[#b5e028] transition-transform active:scale-95 cursor-pointer animate-in fade-in zoom-in duration-200"
            >
              <ChevronUp className="w-4 h-4 animate-bounce" />
              <span>{unseenCount} new threat events</span>
            </button>
          </div>
        )}

        <div
          ref={tableContainerRef}
          onScroll={handleScroll}
          className="overflow-x-auto max-h-[640px] overflow-y-auto"
        >
          <table className="w-full text-left text-xs font-sans">
            <thead className="sticky top-0 z-10 bg-[#0A0B0D] text-[#8A8D93] text-[11px] uppercase tracking-wider border-b border-[#1F2128]">
              <tr>
                <th className="py-3 px-3">Timestamp</th>
                <th className="py-3 px-3">Severity</th>
                <th className="py-3 px-3">Attack Vector</th>
                <th className="py-3 px-3">Source IP</th>
                <th className="py-3 px-3">Risk</th>
                <th className="py-3 px-3">Action</th>
                <th className="py-3 px-3">Sample Payload</th>
                <th className="py-3 px-3 text-right">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1F2128] bg-[#121316]">
              {loading && events.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-[#565961] font-sans">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <Radio className="w-5 h-5 text-[#C6F432] animate-pulse" />
                      <span>Connecting to live threat ingestion stream...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredEvents.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-[#565961] font-sans">
                    No threat events found matching current criteria.
                  </td>
                </tr>
              ) : (
                filteredEvents.map((evt) => {
                  const isNew = newlyArrivedIds.has(evt.id);
                  const leftBorder = getSeverityLeftBorder(evt.severity);

                  return (
                    <tr
                      key={evt.id}
                      onClick={() => {
                        setSelectedEvent(evt);
                        setDrawerTab("overview");
                      }}
                      className={`hover:bg-[#15171C] cursor-pointer transition-all duration-300 ${leftBorder} ${
                        isNew
                          ? "bg-[#C6F432]/10 ring-1 ring-inset ring-[#C6F432]/40"
                          : ""
                      }`}
                    >
                      <td className="py-3 px-3 font-mono text-[#8A8D93] whitespace-nowrap">
                        {new Date(evt.created_at).toLocaleTimeString()}
                      </td>
                      <td className="py-3 px-3">
                        <SeverityBadge severity={evt.severity} size="sm" />
                      </td>
                      <td className="py-3 px-3 font-medium text-[#EDEBE6] capitalize font-display">
                        {evt.event_type.replace(/_/g, " ")}
                      </td>
                      <td className="py-3 px-3 font-mono text-[#8A8D93] whitespace-nowrap">{evt.source_ip}</td>
                      <td className="py-3 px-3 font-mono font-bold">
                        <span
                          className={
                            evt.risk_score >= 80
                              ? "text-[#FF443A]"
                              : evt.risk_score >= 60
                              ? "text-[#FF9F0A]"
                              : "text-[#EDEBE6]"
                          }
                        >
                          {evt.risk_score.toFixed(1)}
                        </span>
                      </td>
                      <td className="py-3 px-3">
                        <DecisionBadge decision={evt.action_taken as any} size="sm" />
                      </td>
                      <td className="py-3 px-3 max-w-[160px] truncate font-mono text-[#8A8D93] text-[11px]">
                        {evt.payload_sample || "N/A"}
                      </td>
                      <td className="py-3 px-3 text-right whitespace-nowrap">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedEvent(evt);
                            setDrawerTab("overview");
                          }}
                          className="text-xs text-[#8A8D93] hover:text-[#C6F432] transition-colors cursor-pointer font-medium"
                        >
                          Inspect
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 4. Slide-over Event Details Drawer */}
      {selectedEvent && (
        <div
          className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex justify-end animate-in fade-in duration-150"
          role="dialog"
          aria-modal="true"
        >
          <div className="w-full max-w-xl bg-[#121316] border-l border-[#1F2128] h-full p-6 flex flex-col justify-between shadow-2xl overflow-y-auto font-sans">
            <div className="space-y-6">
              {/* Drawer Header */}
              <div className="flex items-start justify-between pb-4 border-b border-[#1F2128]">
                <div>
                  <div className="flex items-center gap-2 mb-1.5">
                    <SeverityBadge severity={selectedEvent.severity} />
                    <DecisionBadge decision={selectedEvent.action_taken as any} size="sm" />
                  </div>
                  <h3 className="text-lg font-bold text-[#EDEBE6] capitalize font-display">
                    {selectedEvent.event_type.replace(/_/g, " ")}
                  </h3>
                  <div className="text-xs font-mono text-[#565961] mt-1">
                    Event ID: {selectedEvent.id}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedEvent(null)}
                  className="p-1.5 rounded-lg text-[#8A8D93] hover:text-[#EDEBE6] hover:bg-[#15171C] transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Drawer Navigation Tabs */}
              <div className="flex items-center gap-1 p-1 rounded-xl bg-[#0A0B0D] border border-[#1F2128] text-xs">
                <button
                  type="button"
                  onClick={() => setDrawerTab("overview")}
                  className={`flex-1 py-1.5 rounded-lg font-medium transition-colors cursor-pointer ${
                    drawerTab === "overview"
                      ? "bg-[#1F2128] text-[#C6F432] font-semibold"
                      : "text-[#8A8D93] hover:text-[#EDEBE6]"
                  }`}
                >
                  Overview & Telemetry
                </button>
                <button
                  type="button"
                  onClick={() => setDrawerTab("diff")}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg font-medium transition-colors cursor-pointer ${
                    drawerTab === "diff"
                      ? "bg-[#1F2128] text-[#C6F432] font-semibold"
                      : "text-[#8A8D93] hover:text-[#EDEBE6]"
                  }`}
                >
                  <FileDiff className="w-3.5 h-3.5" />
                  <span>Redaction Diff</span>
                </button>
                <button
                  type="button"
                  onClick={() => setDrawerTab("json")}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg font-medium transition-colors cursor-pointer ${
                    drawerTab === "json"
                      ? "bg-[#1F2128] text-[#C6F432] font-semibold"
                      : "text-[#8A8D93] hover:text-[#EDEBE6]"
                  }`}
                >
                  <Code2 className="w-3.5 h-3.5" />
                  <span>Raw JSON</span>
                </button>
              </div>

              {/* TAB 1: OVERVIEW */}
              {drawerTab === "overview" && (
                <div className="space-y-5">
                  {/* Event Attributes Grid */}
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div className="p-3 rounded-xl bg-[#0A0B0D] border border-[#1F2128]">
                      <div className="text-[#8A8D93] font-sans">Source IP</div>
                      <div className="font-mono text-[#EDEBE6] mt-1 font-semibold">
                        {selectedEvent.source_ip}
                      </div>
                    </div>
                    <div className="p-3 rounded-xl bg-[#0A0B0D] border border-[#1F2128]">
                      <div className="text-[#8A8D93] font-sans">Risk Score</div>
                      <div className="font-mono text-[#EDEBE6] mt-1 font-bold text-base">
                        {selectedEvent.risk_score.toFixed(1)} / 100
                      </div>
                    </div>
                    <div className="p-3 rounded-xl bg-[#0A0B0D] border border-[#1F2128]">
                      <div className="text-[#8A8D93] font-sans">Timestamp</div>
                      <div className="font-mono text-[#8A8D93] mt-1">
                        {new Date(selectedEvent.created_at).toLocaleString()}
                      </div>
                    </div>
                    <div className="p-3 rounded-xl bg-[#0A0B0D] border border-[#1F2128]">
                      <div className="text-[#8A8D93] font-sans">Confidence</div>
                      <div className="font-mono text-[#30D158] mt-1 font-semibold">
                        {(selectedEvent.confidence * 100).toFixed(0)}%
                      </div>
                    </div>
                  </div>

                  {/* Payload Sample */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-[#EDEBE6] font-display">
                        Intercepted Payload Sample
                      </span>
                      {selectedEvent.payload_sample && (
                        <button
                          type="button"
                          onClick={() => handleCopy(selectedEvent.payload_sample || "", "payload")}
                          className="text-[11px] text-[#8A8D93] hover:text-[#EDEBE6] flex items-center gap-1 cursor-pointer"
                        >
                          {copiedPayload ? (
                            <>
                              <Check className="w-3 h-3 text-[#30D158]" />
                              <span className="text-[#30D158]">Copied</span>
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
                    <pre className="p-3 rounded-xl bg-[#0A0B0D] border border-[#1F2128] text-xs font-mono text-[#EDEBE6] overflow-x-auto whitespace-pre-wrap leading-relaxed max-h-48">
                      {selectedEvent.payload_sample || "No payload content recorded."}
                    </pre>
                  </div>

                  {/* Detections Triggered */}
                  {selectedEvent.detections && selectedEvent.detections.length > 0 && (
                    <div className="space-y-2">
                      <div className="text-xs font-semibold text-[#EDEBE6] font-display">
                        Triggered Detections
                      </div>
                      <div className="space-y-2">
                        {selectedEvent.detections.map((det) => (
                          <div
                            key={det.id}
                            className="p-3 rounded-xl bg-[#0A0B0D] border border-[#1F2128] text-xs space-y-1"
                          >
                            <div className="flex items-center justify-between">
                              <span className="font-semibold text-[#EDEBE6] font-display">
                                {det.engine_name}
                              </span>
                              <span className="font-mono text-[#30D158]">
                                {(det.confidence * 100).toFixed(0)}% confidence
                              </span>
                            </div>
                            <div className="text-[#8A8D93]">{det.attack_category}</div>
                            {det.rule_triggered && (
                              <div className="pt-1 text-[11px] font-mono text-[#64D2FF]">
                                Rule: {det.rule_triggered}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* TAB 2: REDACTION DIFF VIEW */}
              {drawerTab === "diff" && (
                <div className="space-y-4">
                  <div className="text-xs text-[#8A8D93]">
                    Side-by-side comparison between incoming raw input and sanitized/redacted payload.
                  </div>

                  <div className="space-y-3">
                    <div className="p-3 rounded-xl bg-[#FF443A]/5 border border-[#FF443A]/20">
                      <div className="text-[11px] font-mono text-[#FF443A] uppercase font-bold mb-1">
                        Original Raw Content (Pre-Inspection)
                      </div>
                      <pre className="text-xs font-mono text-[#EDEBE6] whitespace-pre-wrap leading-relaxed max-h-40 overflow-y-auto">
                        {selectedEvent.payload_sample || "No input prompt payload recorded."}
                      </pre>
                    </div>

                    <div
                      className={`p-3 rounded-xl border ${
                        selectedEvent.action_taken?.toLowerCase().startsWith("block")
                          ? "bg-[#FF443A]/10 border-[#FF443A]/30"
                          : "bg-[#30D158]/5 border-[#30D158]/20"
                      }`}
                    >
                      <div
                        className={`text-[11px] font-mono uppercase font-bold mb-1 ${
                          selectedEvent.action_taken?.toLowerCase().startsWith("block")
                            ? "text-[#FF443A]"
                            : "text-[#30D158]"
                        }`}
                      >
                        {selectedEvent.action_taken?.toLowerCase().startsWith("block")
                          ? "Gateway Blocked (Zero Bytes Forwarded)"
                          : "Sanitized Content (Post-Redaction / Allowed)"}
                      </div>
                      <pre className="text-xs font-mono text-[#EDEBE6] whitespace-pre-wrap leading-relaxed max-h-40 overflow-y-auto">
                        {selectedEvent.action_taken?.toLowerCase().startsWith("block")
                          ? "[REQUEST BLOCKED BY AGENTGUARD FIREWALL — Zero bytes transmitted to downstream model]"
                          : (selectedEvent.payload_sample || "")
                              .replace(/sk-[a-zA-Z0-9_-]{20,}/g, "[REDACTED_API_KEY]")
                              .replace(/AKIA[0-9A-Z]{16}/g, "[REDACTED_AWS_KEY]")
                              .replace(/\b\d{3}-\d{2}-\d{4}\b/g, "[REDACTED_SSN]")
                              .replace(/\b(?:\d{4}-){3}\d{4}\b/g, "[REDACTED_CARD]") ||
                            "Payload cleared without modification."}
                      </pre>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 3: SYNTAX HIGHLIGHTED JSON */}
              {drawerTab === "json" && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-[#8A8D93] font-mono">
                      Complete Event Payload Schema
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        handleCopy(JSON.stringify(selectedEvent, null, 2), "json")
                      }
                      className="text-[11px] text-[#8A8D93] hover:text-[#EDEBE6] flex items-center gap-1 cursor-pointer"
                    >
                      {copiedJson ? (
                        <>
                          <Check className="w-3 h-3 text-[#30D158]" />
                          <span className="text-[#30D158]">Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3" />
                          <span>Copy JSON</span>
                        </>
                      )}
                    </button>
                  </div>
                  <JsonSyntaxViewer data={selectedEvent} />
                </div>
              )}
            </div>

            {/* Drawer Actions */}
            <div className="pt-4 border-t border-[#1F2128] flex items-center justify-between">
              <button
                type="button"
                onClick={() => {
                  showToast({
                    title: "Incident Escalated",
                    message: `Event ${selectedEvent.id} routed to primary SOC channel.`,
                    type: "info",
                  });
                }}
                className="px-3.5 py-1.5 rounded-xl bg-[#121316] hover:bg-[#1A1C22] border border-[#1F2128] text-xs text-[#EDEBE6] font-medium transition-colors cursor-pointer"
              >
                Escalate to SOC
              </button>

              <button
                type="button"
                onClick={() => setSelectedEvent(null)}
                className="px-4 py-2 rounded-xl bg-[#C6F432] hover:bg-[#b5e028] text-black text-xs font-semibold font-sans transition-colors cursor-pointer"
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
