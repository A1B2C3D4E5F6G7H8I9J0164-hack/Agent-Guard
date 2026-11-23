"use client";

import React, { useState } from "react";
import { KeyRound, ShieldAlert, AlertTriangle, Play, CheckCircle2, Code2, Globe, Shield } from "lucide-react";
import { api } from "@/lib/api";
import { PageHeader } from "@/components/ui/PageHeader";
import { SeverityBadge } from "@/components/ui/SeverityBadge";
import { DecisionBadge } from "@/components/ui/DecisionBadge";

export default function ApiSecurityView() {
  const [fuzzEndpoint, setFuzzEndpoint] = useState("/api/v1/chat/completions");
  const [fuzzResult, setFuzzResult] = useState<any>(null);
  const [isFuzzing, setIsFuzzing] = useState(false);

  const handleRunFuzzTest = async () => {
    setIsFuzzing(true);
    try {
      const res = await api.runScan({
        organization_id: "org-default",
        scan_type: "api-security",
      });
      setFuzzResult(res);
    } catch (e) {
      console.error(e);
    } finally {
      setIsFuzzing(false);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 font-sans">
      {/* 1. Page Header */}
      <PageHeader
        title="API Threat Detection & Controlled Fuzzing Engine"
        description="Safe testing for Broken Object Level Authorization (BOLA), rate limit violations, and payload mutations across AI gateways."
        statusLine="OWASP API Security Top 10 Guardrails Active · 3 Endpoints Monitored"
        badge={{ text: "L7 API DEFENSE", variant: "lime" }}
      />

      {/* 2. API Targets Inventory */}
      <div className="p-5 rounded-2xl bg-[#121316] border border-[#1F2128] space-y-4">
        <div>
          <h2 className="text-base font-semibold text-[#EDEBE6] font-display">
            Monitored API endpoints & targets
          </h2>
          <p className="text-xs text-[#8A8D93] font-sans mt-0.5">
            Gateway endpoints protected by automated token validation and rate limiting.
          </p>
        </div>
        <div className="overflow-x-auto rounded-xl border border-[#1F2128]">
          <table className="w-full text-left text-xs font-sans">
            <thead className="bg-[#0A0B0D] text-[#8A8D93] text-[11px] uppercase tracking-wider border-b border-[#1F2128]">
              <tr>
                <th className="py-3 px-4">Endpoint Name</th>
                <th className="py-3 px-4">Base URL</th>
                <th className="py-3 px-4">Auth Header</th>
                <th className="py-3 px-4">Risk Level</th>
                <th className="py-3 px-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1F2128] bg-[#121316]">
              {[
                {
                  name: "Customer RAG Gateway",
                  url: "https://api.internal.apex.ai/v1/chat",
                  auth: "Authorization (Bearer ***)",
                  risk: "low",
                  status: "allow",
                },
                {
                  name: "Agent Tool RPC Bus",
                  url: "https://agent-tools.internal.apex.ai/rpc",
                  auth: "X-Agent-Secret (ag_sec_***)",
                  risk: "medium",
                  status: "allow",
                },
                {
                  name: "Knowledge Search API",
                  url: "https://kb.internal.apex.ai/search",
                  auth: "Authorization (Bearer ***)",
                  risk: "low",
                  status: "allow",
                },
              ].map((t, i) => (
                <tr key={i} className="hover:bg-[#15171C] transition-colors">
                  <td className="py-3 px-4 font-semibold text-[#EDEBE6] font-display">{t.name}</td>
                  <td className="py-3 px-4 font-mono text-[#8A8D93] text-[11px]">{t.url}</td>
                  <td className="py-3 px-4 font-mono text-[#8A8D93] text-[11px]">{t.auth}</td>
                  <td className="py-3 px-4">
                    <SeverityBadge severity={t.risk} size="sm" />
                  </td>
                  <td className="py-3 px-4">
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-[#30D158]/10 text-[#30D158] border border-[#30D158]/30">
                      AUTHORIZED
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 3. Controlled Fuzzing Suite Card */}
      <div className="p-5 rounded-2xl bg-[#121316] border border-[#1F2128] space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-[#1F2128]">
          <div className="flex items-center gap-2">
            <Code2 className="w-4 h-4 text-[#C6F432]" />
            <h2 className="text-base font-semibold text-[#EDEBE6] font-display">
              Controlled API fuzz-testing framework
            </h2>
          </div>
          <span className="text-xs text-[#8A8D93] font-sans">Strict request limits enforced</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 text-xs font-sans">
          <div className="space-y-3">
            <div>
              <label className="text-[#8A8D93] font-medium mb-1 block">
                Target endpoint:
              </label>
              <input
                type="text"
                value={fuzzEndpoint}
                onChange={(e) => setFuzzEndpoint(e.target.value)}
                className="w-full p-2.5 rounded-xl bg-[#0A0B0D] border border-[#1F2128] text-[#EDEBE6] font-mono focus:outline-none focus:border-[#C6F432]"
              />
            </div>
            <p className="text-[#8A8D93] text-xs leading-relaxed">
              Mutates schema payloads: type confusion, boundary strings, missing required parameters, and special characters to verify API validation resilience.
            </p>
            <button
              onClick={handleRunFuzzTest}
              disabled={isFuzzing}
              className="px-4 py-2 rounded-xl bg-[#C6F432] hover:bg-[#b5e028] text-black font-semibold font-sans flex items-center gap-2 transition-all cursor-pointer shadow-sm disabled:opacity-50"
            >
              <Play className="w-3.5 h-3.5 fill-black" />
              <span>{isFuzzing ? "Executing fuzz test..." : "Run controlled fuzz test"}</span>
            </button>
          </div>

          <div>
            <label className="text-[#8A8D93] font-medium mb-1 block">
              Fuzz test execution results:
            </label>
            <div className="p-4 rounded-xl bg-[#0A0B0D] border border-[#1F2128] min-h-[140px] flex flex-col justify-center">
              {fuzzResult ? (
                <div className="space-y-3 text-xs font-sans">
                  <div className="flex items-center justify-between pb-2 border-b border-[#1F2128]">
                    <span className="font-semibold text-[#30D158]">
                      Tests Executed: <strong className="font-mono">{fuzzResult.total_tests}</strong>
                    </span>
                    <span className="text-[#FF443A] font-semibold">
                      Failed: <strong className="font-mono">{fuzzResult.failed_tests}</strong>
                    </span>
                    <span className="text-[#8A8D93]">
                      Risk Score: <strong className="text-[#EDEBE6] font-mono">{fuzzResult.risk_score} / 100</strong>
                    </span>
                  </div>

                  {fuzzResult.findings && fuzzResult.findings.length > 0 ? (
                    <div className="space-y-2 max-h-56 overflow-y-auto">
                      {fuzzResult.findings.map((f: any, idx: number) => (
                        <div
                          key={idx}
                          className="p-2.5 rounded-xl bg-[#121316] border border-[#FF443A]/30 space-y-1"
                        >
                          <div className="flex items-center justify-between font-semibold text-[#EDEBE6] font-display">
                            <span className="text-[#FF443A]">{f.title}</span>
                            <span className="text-[11px] text-[#8A8D93] font-mono">{f.category}</span>
                          </div>
                          <p className="text-[#8A8D93] text-xs">{f.description}</p>
                          <div className="text-[11px] text-[#30D158]">
                            Remediation: {f.remediation}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-[#30D158] flex items-center gap-2 pt-1">
                      <CheckCircle2 className="w-4 h-4 shrink-0" />
                      <span>
                        Zero high-risk boundary bypasses or unhandled exceptions encountered. Target endpoints appropriately rejected malformed schemas.
                      </span>
                    </div>
                  )}
                </div>
              ) : (
                <span className="text-[#565961] font-sans text-xs text-center py-4">
                  Run fuzz test to verify input validation boundaries against unexpected types, missing required fields, and oversized string mutations.
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
