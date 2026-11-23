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
        badge={{ text: "AGENT GOVERNANCE", variant: "sky" }}
      />

      {/* 2. Grid: Active Agent Sessions & Tool Call Timeline */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Sessions List */}
        <div className="p-5 rounded-xl bg-[#0F1622] border border-[#1E293B] space-y-3">
          <div className="flex items-center justify-between mb-1">
            <h2 className="text-base font-semibold text-white font-sans">
              Active agent runtimes
            </h2>
            <span className="text-xs text-slate-400 font-mono">{sessions.length} agents</span>
          </div>

          <div className="space-y-2">
            {sessions.map((sess) => {
              const isSelected = selectedSession?.id === sess.id;
              return (
                <div
                  key={sess.id}
                  onClick={() => setSelectedSession(sess)}
                  className={`p-3.5 rounded-lg border cursor-pointer transition-all ${
                    isSelected
                      ? "bg-[#151F2E] border-purple-500/50 shadow-sm"
                      : "bg-[#080B10] border-[#1E293B] hover:border-slate-600"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-slate-200 font-sans">
                      {sess.agent_name}
                    </span>
                    <DecisionBadge
                      decision={sess.status === "quarantined" ? "quarantine" : "allow"}
                      size="sm"
                    />
                  </div>
                  <div className="text-xs text-slate-400 font-mono mt-1.5 flex items-center justify-between">
                    <span>ID: {sess.session_id.slice(0, 14)}...</span>
                    <span>{sess.total_tool_calls} calls</span>
                  </div>
                  <div className="text-[11px] text-slate-400 font-sans mt-1">
                    Anomaly Score:{" "}
                    <strong
                      className={`font-mono ${
                        sess.anomaly_score > 0.5 ? "text-red-400" : "text-emerald-400"
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
        <div className="lg:col-span-2 p-5 rounded-xl bg-[#0F1622] border border-[#1E293B] space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#1E293B]">
            <div>
              <h2 className="text-base font-semibold text-white font-sans">
                Tool invocation sequence & timeline
              </h2>
              <p className="text-xs text-slate-400 font-sans mt-0.5">
                Audited sequence of tool calls executed by{" "}
                <span className="text-purple-400 font-medium font-sans">
                  {selectedSession?.agent_name || "selected agent"}
                </span>
              </p>
            </div>
            <span className="text-xs font-sans text-slate-300">
              Runtime status:{" "}
              <strong className="uppercase font-mono text-emerald-400">
                {selectedSession?.status || "ACTIVE"}
              </strong>
            </span>
          </div>

          {/* Timeline Nodes */}
          <div className="space-y-3 relative pl-6 border-l-2 border-[#1E293B] ml-2">
            {selectedSession && selectedSession.tool_executions.length > 0 ? (
              selectedSession.tool_executions.map((t, idx) => (
                <div key={idx} className="relative group">
                  {/* Timeline Dot */}
                  <div
                    className={`absolute -left-[31px] top-2 w-3.5 h-3.5 rounded-full border-2 border-[#0F1622] ${
                      t.execution_status === "blocked" ? "bg-red-500" : "bg-emerald-500"
                    }`}
                  />

                  <div className="p-3.5 rounded-lg bg-[#080B10] border border-[#1E293B] text-xs font-sans space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-slate-200 flex items-center gap-2">
                        <Wrench className="w-3.5 h-3.5 text-purple-400" />
                        <code className="text-xs font-mono text-white">{t.tool_name}</code>
                      </span>
                      <DecisionBadge
                        decision={t.execution_status as any}
                        size="sm"
                      />
                    </div>

                    <div className="text-[11px] font-mono text-slate-400 bg-[#0F1622] p-2 rounded border border-[#1E293B] overflow-x-auto">
                      {JSON.stringify(t.parameters_json || {})}
                    </div>

                    {t.flag_reason && (
                      <div className="text-xs text-red-400 font-medium flex items-center gap-1.5 pt-0.5">
                        <AlertTriangle className="w-3.5 h-3.5 text-red-400 shrink-0" />
                        <span>Policy Alert: {t.flag_reason}</span>
                      </div>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="text-xs font-sans text-slate-500 py-8">
                No tool executions recorded for this agent session yet.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 3. Interactive Tool Auditor Card */}
      <div className="p-5 rounded-xl bg-[#0F1622] border border-[#1E293B] space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-[#1E293B]">
          <div className="flex items-center gap-2">
            <Terminal className="w-4 h-4 text-emerald-400" />
            <h2 className="text-base font-semibold text-white font-sans">
              Tool execution safety gate auditor
            </h2>
          </div>
          <span className="text-xs text-slate-400 font-sans">Live boundary validation</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 text-xs font-sans">
          <div className="space-y-3">
            <div>
              <label className="text-slate-300 font-medium mb-1 block">
                Tool Name:
              </label>
              <input
                type="text"
                value={toolName}
                onChange={(e) => setToolName(e.target.value)}
                className="w-full p-2.5 rounded-lg bg-[#080B10] border border-[#1E293B] text-slate-200 font-mono focus:outline-none focus:border-emerald-500"
                placeholder="e.g. bash, send_http_request, sql_query"
              />
            </div>

            <div>
              <label className="text-slate-300 font-medium mb-1 block">
                Parameters (JSON format):
              </label>
              <textarea
                rows={3}
                value={toolParams}
                onChange={(e) => setToolParams(e.target.value)}
                className="w-full p-2.5 rounded-lg bg-[#080B10] border border-[#1E293B] text-slate-200 font-mono focus:outline-none focus:border-emerald-500"
              />
            </div>

            <button
              onClick={handleAuditTool}
              disabled={isAuditing}
              className="px-4 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-black font-semibold font-sans flex items-center gap-2 transition-all cursor-pointer shadow-sm disabled:opacity-50"
            >
              <Play className="w-3.5 h-3.5 fill-black" />
              <span>{isAuditing ? "Evaluating guardrails..." : "Audit tool execution"}</span>
            </button>
          </div>

          <div>
            <label className="text-slate-300 font-medium mb-1 block">
              Audit Decision:
            </label>
            <div className="p-4 rounded-lg bg-[#080B10] border border-[#1E293B] min-h-[140px] flex flex-col justify-center">
              {auditResult ? (
                <div className="space-y-2 text-xs font-sans">
                  <div className="flex items-center justify-between pb-2 border-b border-[#1E293B]">
                    <span className="font-semibold text-white">
                      Tool: <code className="font-mono">{auditResult.tool_name}</code>
                    </span>
                    <DecisionBadge
                      decision={auditResult.execution_status as any}
                      size="sm"
                    />
                  </div>
                  <div className="text-slate-400">
                    Risk Score:{" "}
                    <strong className="text-white font-mono">
                      {auditResult.risk_score} / 100
                    </strong>
                  </div>
                  {auditResult.flag_reason && (
                    <div className="text-red-400 font-medium text-xs pt-1">
                      Reason: {auditResult.flag_reason}
                    </div>
                  )}
                </div>
              ) : (
                <span className="text-slate-500 font-sans text-xs text-center py-4">
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
