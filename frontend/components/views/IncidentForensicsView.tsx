"use client";

import React, { useState, useEffect } from "react";
import {
  FileSearch,
  ShieldAlert,
  AlertTriangle,
  CheckCircle2,
  Lock,
  Ban,
  Clock,
  Layers,
  Activity,
  ArrowRight,
} from "lucide-react";
import { api, IncidentItem } from "@/lib/api";
import { PageHeader } from "@/components/ui/PageHeader";
import { SeverityBadge } from "@/components/ui/SeverityBadge";
import { DecisionBadge } from "@/components/ui/DecisionBadge";

export default function IncidentForensicsView() {
  const [incidents, setIncidents] = useState<IncidentItem[]>([]);
  const [selectedIncident, setSelectedIncident] = useState<IncidentItem | null>(null);
  const [isResponding, setIsResponding] = useState(false);
  const [actionNotice, setActionNotice] = useState<string | null>(null);

  const loadIncidents = async () => {
    try {
      const data = await api.getIncidents();
      setIncidents(data);
      if (data.length > 0 && !selectedIncident) {
        setSelectedIncident(data[0]);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    loadIncidents();
  }, []);

  const handleTriggerResponse = async (action: string) => {
    if (!selectedIncident) return;
    setIsResponding(true);
    try {
      const target = selectedIncident.affected_resource || "attacker-session";
      await api.respondIncident(selectedIncident.id, action, target);
      setActionNotice(`Automated response executed: ${action.replace(/_/g, " ")} on ${target}`);
      await loadIncidents();
      setTimeout(() => setActionNotice(null), 5000);
    } catch (e) {
      console.error(e);
    } finally {
      setIsResponding(false);
    }
  };

  const openIncidentsCount = incidents.filter((i) => i.status !== "resolved").length;

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 font-sans">
      {/* 1. Page Header */}
      <PageHeader
        title="Incident Forensics & Active Threat Remediation"
        description="Correlates multi-stage alerts into incident traces and executes automated defensive countermeasures."
        statusLine={`Alert Correlation Engine Active · ${openIncidentsCount} Open Incidents`}
        badge={{
          text: openIncidentsCount > 0 ? `${openIncidentsCount} ACTIVE INCIDENTS` : "ALL RESOLVED",
          variant: openIncidentsCount > 0 ? "red" : "emerald",
        }}
      />

      {/* Response Action Notice */}
      {actionNotice && (
        <div
          role="status"
          className="p-4 rounded-2xl bg-[#C6F432]/10 border border-[#C6F432]/30 text-xs font-sans text-[#C6F432] flex items-center gap-2.5 animate-in fade-in duration-200"
        >
          <CheckCircle2 className="w-4 h-4 text-[#C6F432] shrink-0" />
          <span>{actionNotice}</span>
        </div>
      )}

      {/* 2. Main Grid: Incidents List & Incident Deep Dive */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Incident Roster */}
        <div className="p-5 rounded-2xl bg-[#121316] border border-[#1F2128] space-y-3">
          <div className="flex items-center justify-between mb-1">
            <h2 className="text-base font-semibold text-[#EDEBE6] font-display">
              Correlated incidents
            </h2>
            <span className="text-xs text-[#8A8D93] font-mono">{incidents.length} total</span>
          </div>

          <div className="space-y-2.5">
            {incidents.map((inc) => {
              const isSelected = selectedIncident?.id === inc.id;
              return (
                <div
                  key={inc.id}
                  onClick={() => setSelectedIncident(inc)}
                  className={`p-3.5 rounded-xl border cursor-pointer transition-all space-y-1.5 ${
                    isSelected
                      ? "bg-[#15171C] border-slate-500 shadow-md"
                      : "bg-[#0A0B0D] border-[#1F2128] hover:border-slate-600"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-bold text-[#64D2FF] text-xs">{inc.id}</span>
                    <SeverityBadge severity={inc.severity} size="sm" />
                  </div>
                  <div className="font-semibold text-[#EDEBE6] text-xs font-sans">{inc.title}</div>
                  <div className="text-[11px] text-[#8A8D93] font-sans flex items-center justify-between pt-0.5">
                    <span>Events: <strong className="font-mono text-[#EDEBE6]">{inc.events_count}</strong></span>
                    <span
                      className={`uppercase text-[10px] font-bold ${
                        inc.status === "resolved" ? "text-[#C6F432]" : "text-red-400"
                      }`}
                    >
                      {inc.status}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right: Forensic Trace & Remediation Actions */}
        <div className="lg:col-span-2 p-5 rounded-2xl bg-[#121316] border border-[#1F2128] space-y-5">
          {selectedIncident ? (
            <>
              <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-[#1F2128]">
                <div>
                  <div className="text-xs font-mono text-[#8A8D93]">
                    Incident ID: {selectedIncident.id}
                  </div>
                  <h2 className="text-lg font-bold text-[#EDEBE6] font-display mt-0.5">
                    {selectedIncident.title}
                  </h2>
                </div>
                <span
                  className={`px-3 py-1 rounded-full text-xs font-sans font-bold uppercase border ${
                    selectedIncident.status === "resolved"
                      ? "bg-[#C6F432]/10 text-[#C6F432] border-[#C6F432]/30"
                      : "bg-red-500/10 text-red-400 border-red-500/30"
                  }`}
                >
                  {selectedIncident.status}
                </span>
              </div>

              {/* Forensic Details Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs font-sans">
                <div className="p-3 rounded-xl bg-[#0A0B0D] border border-[#1F2128]">
                  <div className="text-[#8A8D93]">Affected Resource</div>
                  <div className="text-white font-mono font-semibold mt-1">
                    {selectedIncident.affected_resource}
                  </div>
                </div>
                <div className="p-3 rounded-xl bg-[#0A0B0D] border border-[#1F2128]">
                  <div className="text-[#8A8D93]">Correlated Events</div>
                  <div className="text-white font-mono font-semibold mt-1">
                    {selectedIncident.events_count} Alerts
                  </div>
                </div>
                <div className="p-3 rounded-xl bg-[#0A0B0D] border border-[#1F2128]">
                  <div className="text-[#8A8D93]">Detection Time</div>
                  <div className="text-white font-mono font-semibold mt-1">
                    {new Date(selectedIncident.created_at).toLocaleTimeString()}
                  </div>
                </div>
              </div>

              {/* Root Cause Analysis */}
              <div className="p-4 rounded-xl bg-[#0A0B0D] border border-[#1F2128] space-y-1.5 text-xs font-sans">
                <div className="text-[#EDEBE6] font-semibold">
                  Root Cause Determination:
                </div>
                <p className="text-[#EDEBE6] leading-relaxed">
                  {selectedIncident.root_cause || "Analyzing correlated telemetry traces..."}
                </p>
              </div>

              {/* Attack Chain Progression */}
              <div className="space-y-2">
                <div className="text-xs font-semibold text-[#EDEBE6] font-sans">
                  Attack Progression Sequence:
                </div>
                <div className="flex flex-wrap items-center gap-2 text-xs font-sans">
                  {[
                    "1. Ingress Delimiter Override",
                    "2. System Prompt Probe",
                    "3. Privilege Escalation Tool Call",
                    "4. Blocked & Quarantined",
                  ].map((step, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <div className="px-3 py-1.5 rounded-xl bg-[#0A0B0D] border border-[#1F2128] text-[#EDEBE6]">
                        {step}
                      </div>
                      {idx < 3 && <ArrowRight className="w-3.5 h-3.5 text-[#565961]" />}
                    </div>
                  ))}
                </div>
              </div>

              {/* Automated Response Actions */}
              <div className="pt-4 border-t border-[#1F2128] space-y-3 font-sans">
                <div className="text-xs font-semibold text-[#EDEBE6]">
                  One-click automated defensive responses:
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <button
                    onClick={() => handleTriggerResponse("QUARANTINE_SESSION")}
                    disabled={isResponding}
                    className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-purple-500/10 hover:bg-purple-500/20 text-purple-400 border border-purple-500/30 text-xs font-semibold transition-all cursor-pointer disabled:opacity-50"
                  >
                    <Lock className="w-3.5 h-3.5" />
                    <span>Quarantine agent session</span>
                  </button>

                  <button
                    onClick={() => handleTriggerResponse("BLOCK_IP")}
                    disabled={isResponding}
                    className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 text-xs font-semibold transition-all cursor-pointer disabled:opacity-50"
                  >
                    <Ban className="w-3.5 h-3.5" />
                    <span>Block attacker IP</span>
                  </button>

                  <button
                    onClick={() => handleTriggerResponse("APPLY_RATE_LIMIT")}
                    disabled={isResponding}
                    className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 text-xs font-semibold transition-all cursor-pointer disabled:opacity-50"
                  >
                    <Clock className="w-3.5 h-3.5" />
                    <span>Apply strict rate limit</span>
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="py-20 text-center text-[#565961] font-sans text-xs">
              Select an incident from the roster to inspect forensics and trigger automated response.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
