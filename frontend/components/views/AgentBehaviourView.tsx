"use client";

import React, { useState, useEffect } from "react";
import {
  Bot,
  Terminal,
  ShieldAlert,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Wrench,
  Clock,
  Play,
  Activity,
  Layers,
} from "lucide-react";
import { api, AgentSessionItem } from "@/lib/api";
import { PageHeader } from "@/components/ui/PageHeader";
import { DecisionBadge } from "@/components/ui/DecisionBadge";
import { SeverityBadge } from "@/components/ui/SeverityBadge";

export default function AgentBehaviourView() {
  const [sessions, setSessions] = useState<AgentSessionItem[]>([]);
  const [selectedSession, setSelectedSession] = useState<AgentSessionItem | null>(null);
  const [toolName, setToolName] = useState("bash");
  const [toolParams, setToolParams] = useState(`{"command": "cat /etc/shadow"}`);
  const [auditResult, setAuditResult] = useState<any>(null);
  const [isAuditing, setIsAuditing] = useState(false);

  const loadSessions = async () => {
    try {
      const data = await api.getAgentSessions();
      setSessions(data);
      if (data.length > 0 && !selectedSession) {
        setSelectedSession(data[0]);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    loadSessions();
  }, []);

  const handleAuditTool = async () => {
    if (!selectedSession) return;
    setIsAuditing(true);
    try {
      let parsed = {};
      try {
        parsed = JSON.parse(toolParams);
      } catch (e) {
        parsed = { raw: toolParams };
      }
      const res = await api.auditToolCall({
        agent_session_id: selectedSession.id,
        tool_name: toolName,
        parameters: parsed,
      });
      setAuditResult(res);
      await loadSessions();
    } catch (e) {
      console.error(e);
    } finally {
      setIsAuditing(false);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 font-sans">
      {/* 1. Page Header */}
      <PageHeader
        title="Agent Behaviour & Tool Call Sequence Auditing"
        description="Monitors autonomous execution chains, detects unauthorized tool escalation, and enforces boundary policies on agent runtimes."
        statusLine={`Autonomous Agent Monitor Active · ${sessions.length} Sessions Observed`}
        badge={{ text: "AGENT GOVERNANCE", variant: "lime" }}
      />

      {/* 2. Grid: Active Agent Sessions & Tool Call Timeline */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Sessions List */}
        <div className="p-5 rounded-2xl bg-[#121316] border border-[#1F2128] space-y-3">
          <div className="flex items-center justify-between mb-1">
            <h2 className="text-base font-semibold text-[#EDEBE6] font-display">
              Active agent runtimes
            </h2>
            <span className="text-xs text-[#8A8D93] font-mono">{sessions.length} agents</span>
          </div>

          <div className="space-y-2">
            {sessions.map((sess) => {
              const isSelected = selectedSession?.id === sess.id;
              return (
                <div
                  key={sess.id}
                  onClick={() => setSelectedSession(sess)}
                  className={`p-3.5 rounded-xl border cursor-pointer transition-all ${isSelected
                    ? "bg-[#15171C] border-[#C6F432]/50 shadow-sm"
                    : "bg-[#0A0B0D] border-[#1F2128] hover:border-[#2B2E38]"
                    }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-[#EDEBE6] font-display">
                      {sess.agent_name}
                    </span>
                    <DecisionBadge
                      decision={sess.status === "quarantined" ? "quarantine" : "allow"}
                      size="sm"
                    />
                  </div>
                  <div className="text-xs text-[#8A8D93] font-mono mt-1.5 flex items-center justify-between">
                    <span>ID: {sess.session_id.slice(0, 14)}...</span>
                    <span>{sess.total_tool_calls} calls</span>
                  </div>
                  <div className="text-[11px] text-[#8A8D93] font-sans mt-1">
                    Anomaly Score:{" "}
                    <strong
                      className={`font-mono ${sess.anomaly_score > 0.5 ? "text-[#FF443A]" : "text-[#30D158]"
                        }`}
                    >
                      {(sess.anomaly_score * 100).toFixed(0)}%
                    </strong>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right: Tool Execution Timeline */}
        <div className="lg:col-span-2 p-5 rounded-2xl bg-[#121316] border border-[#1F2128] space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#1F2128]">
            <div>
              <h2 className="text-base font-semibold text-[#EDEBE6] font-display">
                Tool invocation sequence & timeline
              </h2>
              <p className="text-xs text-[#8A8D93] font-sans mt-0.5">
                Audited sequence of tool calls executed by{" "}
                <span className="text-[#C6F432] font-medium font-sans">
                  {selectedSession?.agent_name || "selected agent"}
                </span>
              </p>
            </div>
            <span className="text-xs font-sans text-[#8A8D93]">
              Runtime status:{" "}
              <strong className="uppercase font-mono text-[#30D158]">
                {selectedSession?.status || "ACTIVE"}
              </strong>
            </span>
          </div>

          {/* Timeline Nodes */}
          <div className="space-y-3 relative pl-6 border-l-2 border-[#1F2128] ml-2">
            {selectedSession && selectedSession.tool_executions.length > 0 ? (
              selectedSession.tool_executions.map((t, idx) => (
                <div key={idx} className="relative group">
                  {/* Timeline Dot */}
                  <div
                    className={`absolute -left-[31px] top-2 w-3.5 h-3.5 rounded-full border-2 border-[#121316] ${t.execution_status === "blocked" ? "bg-[#FF443A]" : "bg-[#30D158]"
                      }`}
                  />

                  <div className="p-3.5 rounded-xl bg-[#0A0B0D] border border-[#1F2128] text-xs font-sans space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-[#EDEBE6] flex items-center gap-2">
                        <Wrench className="w-3.5 h-3.5 text-[#C6F432]" />
                        <code className="text-xs font-mono text-[#EDEBE6]">{t.tool_name}</code>
                      </span>
                      <DecisionBadge
                        decision={t.execution_status as any}
                        size="sm"
                      />
                    </div>

                    <div className="text-[11px] font-mono text-[#8A8D93] bg-[#121316] p-2 rounded-lg border border-[#1F2128] overflow-x-auto">
                      {JSON.stringify(t.parameters_json || {})}
                    </div>

                    {t.flag_reason && (
                      <div className="text-xs text-[#FF443A] font-medium flex items-center gap-1.5 pt-0.5">
                        <AlertTriangle className="w-3.5 h-3.5 text-[#FF443A] shrink-0" />
                        <span>Policy Alert: {t.flag_reason}</span>
                      </div>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="text-xs font-sans text-[#565961] py-8">
                No tool executions recorded for this agent session yet.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 3. Interactive Tool Auditor Card */}
      <div className="p-5 rounded-2xl bg-[#121316] border border-[#1F2128] space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-[#1F2128]">
          <div className="flex items-center gap-2">
            <Terminal className="w-4 h-4 text-[#C6F432]" />
            <h2 className="text-base font-semibold text-[#EDEBE6] font-display">
              Tool execution safety gate auditor
            </h2>
          </div>
          <span className="text-xs text-[#8A8D93] font-sans">Live boundary validation</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 text-xs font-sans">
          <div className="space-y-3">
            <div>
              <label className="text-[#8A8D93] font-medium mb-1 block">
                Tool Name:
              </label>
              <input
                type="text"
                value={toolName}
                onChange={(e) => setToolName(e.target.value)}
                className="w-full p-2.5 rounded-xl bg-[#0A0B0D] border border-[#1F2128] text-[#EDEBE6] font-mono focus:outline-none focus:border-[#C6F432]"
                placeholder="e.g. bash, send_http_request, sql_query"
              />
            </div>

            <div>
              <label className="text-[#8A8D93] font-medium mb-1 block">
                Parameters (JSON format):
              </label>
              <textarea
                rows={3}
                value={toolParams}
                onChange={(e) => setToolParams(e.target.value)}
                className="w-full p-2.5 rounded-xl bg-[#0A0B0D] border border-[#1F2128] text-[#EDEBE6] font-mono focus:outline-none focus:border-[#C6F432]"
              />
            </div>

            <button
              onClick={handleAuditTool}
              disabled={isAuditing}
              className="px-4 py-2 rounded-xl bg-[#C6F432] hover:bg-[#b5e028] text-black font-semibold font-sans flex items-center gap-2 transition-all cursor-pointer shadow-sm disabled:opacity-50"
            >
              <Play className="w-3.5 h-3.5 fill-black" />
              <span>{isAuditing ? "Evaluating guardrails..." : "Audit tool execution"}</span>
            </button>
          </div>

          <div>
            <label className="text-[#8A8D93] font-medium mb-1 block">
              Audit Decision:
            </label>
            <div className="p-4 rounded-xl bg-[#0A0B0D] border border-[#1F2128] min-h-[140px] flex flex-col justify-center">
              {auditResult ? (
                <div className="space-y-2 text-xs font-sans">
                  <div className="flex items-center justify-between pb-2 border-b border-[#1F2128]">
                    <span className="font-semibold text-[#EDEBE6] font-display">
                      Tool: <code className="font-mono">{auditResult.tool_name}</code>
                    </span>
                    <DecisionBadge
                      decision={auditResult.execution_status as any}
                      size="sm"
                    />
                  </div>
                  <div className="text-[#8A8D93]">
                    Risk Score:{" "}
                    <strong className="text-[#EDEBE6] font-mono">
                      {auditResult.risk_score} / 100
                    </strong>
                  </div>
                  {auditResult.flag_reason && (
                    <div className="text-[#FF443A] font-medium text-xs pt-1">
                      Reason: {auditResult.flag_reason}
                    </div>
                  )}
                </div>
              ) : (
                <span className="text-[#565961] font-sans text-xs text-center py-4">
                  Trigger an audit to verify whether high-privilege tool calls or dangerous shell commands are blocked.
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
