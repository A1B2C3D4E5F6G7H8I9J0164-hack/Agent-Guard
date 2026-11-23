"use client";

import React, { useState, useEffect } from "react";
import {
  FileCheck2,
  Download,
  ShieldCheck,
  CheckCircle2,
  Clock,
  AlertCircle,
  FileText,
} from "lucide-react";
import { api } from "@/lib/api";
import { PageHeader } from "@/components/ui/PageHeader";
import { StatCard } from "@/components/ui/StatCard";

export default function ComplianceReportsView() {
  const [framework, setFramework] = useState("owasp_llm");
  const [report, setReport] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadReport() {
      setLoading(true);
      try {
        const data = await api.getComplianceReport(framework);
        setReport(data);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    loadReport();
  }, [framework]);

  const handleDownload = () => {
    if (!report) return;
    const blob = new Blob([JSON.stringify(report, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `AgentGuard_${framework.toUpperCase()}_Assessment_${new Date()
      .toISOString()
      .slice(0, 10)}.json`;
    a.click();
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 font-sans">
      {/* 1. Page Header */}
      <PageHeader
        title="Security Compliance & Standardized Assessment Reports"
        description="Continuous posture evaluation mapped to OWASP LLM Top 10, OWASP API Security, and NIST AI Risk Management Frameworks."
        statusLine="Automated Risk Assessment Engine Active · Real-Time Mapping"
        badge={{ text: "AUDIT COMPLIANCE", variant: "emerald" }}
        actions={
          <div className="flex items-center gap-3">
            <select
              value={framework}
              onChange={(e) => setFramework(e.target.value)}
              className="px-3 py-1.5 rounded-xl bg-[#121316] border border-[#1F2128] text-xs font-sans text-[#EDEBE6] focus:outline-none focus:border-[#C6F432]"
            >
              <option value="owasp_llm">OWASP Top 10 for LLM Applications</option>
              <option value="owasp_api">OWASP API Security Top 10</option>
              <option value="nist_ai_rmf">NIST AI Risk Management Framework (AI RMF)</option>
            </select>

            <button
              type="button"
              onClick={handleDownload}
              className="flex items-center gap-2 px-4 py-1.5 rounded-xl bg-[#C6F432] hover:bg-[#b5e028] text-black font-semibold text-xs font-sans transition-all cursor-pointer shadow-sm"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export report</span>
            </button>
          </div>
        }
      />

      {/* 2. Assessment Summary KPI Cards */}
      {report && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            label="Framework Posture"
            value={`${report.overall_posture_score} / 100`}
            subValue="Technical controls verified"
            variant="lime"
            trend={{ value: "+3 pts", isPositive: true }}
            sparkline={[86, 88, 90, 92, report.overall_posture_score]}
          />

          <StatCard
            label="Total Controls"
            value={report.controls_count}
            subValue="Audit criteria mapped"
            variant="lime"
            trend={{ value: "100% evaluated", isPositive: true }}
            sparkline={[10, 10, 10, 10, 10]}
          />

          <StatCard
            label="Passed / Enforced"
            value={report.passed_controls}
            subValue="Deterministic defense active"
            variant="lime"
            trend={{ value: "Optimal", isPositive: true }}
            sparkline={[7, 8, 8, 9, report.passed_controls]}
          />

          <StatCard
            label="Monitored Controls"
            value={report.monitored_controls}
            subValue="Passive telemetry collection"
            variant="amber"
            trend={{ value: "Watchlist", isNeutral: true }}
            sparkline={[3, 2, 2, 1, report.monitored_controls]}
          />
        </div>
      )}

      {/* 3. Controls Evaluation Table */}
      <div className="p-5 rounded-2xl bg-[#121316] border border-[#1F2128] space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-[#1F2128]">
          <h2 className="text-base font-semibold text-[#EDEBE6] font-display">
            {framework === "owasp_llm"
              ? "OWASP Top 10 for LLM Applications (Controls Checklist)"
              : framework === "owasp_api"
              ? "OWASP API Security Top 10 Checklist"
              : "NIST AI RMF Governance Assessment"}
          </h2>
          <span className="text-xs font-mono text-[#8A8D93]">
            Audit ID: {report?.report_id || "RPT-LIVE"}
          </span>
        </div>

        <div className="overflow-x-auto rounded-xl border border-[#1F2128]">
          <table className="w-full text-left text-xs font-sans">
            <thead className="bg-[#0A0B0D] text-[#8A8D93] text-[11px] uppercase tracking-wider border-b border-[#1F2128]">
              <tr>
                <th className="py-3 px-4">Control ID</th>
                <th className="py-3 px-4">Title / Domain</th>
                <th className="py-3 px-4">Coverage Score</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Enforcing Engine</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1F2128] bg-[#121316]">
              {report?.items.map((item: any, i: number) => {
                const score = item.coverage || item.score;
                return (
                  <tr key={i} className="hover:bg-[#15171C]/50 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-[#64D2FF]">
                      {item.id || item.category}
                    </td>
                    <td className="py-3 px-4 font-semibold text-[#EDEBE6]">
                      <div>{item.name || item.category}</div>
                      {item.details && (
                        <div className="text-[11px] text-[#8A8D93] font-normal mt-0.5 leading-relaxed">
                          {item.details}
                        </div>
                      )}
                    </td>
                    <td className="py-3 px-4 font-mono font-bold text-white">{score}%</td>
                    <td className="py-3 px-4">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${
                          item.status === "PASSED" || score >= 85
                            ? "bg-[#C6F432]/10 text-[#C6F432] border-[#C6F432]/30"
                            : "bg-amber-500/10 text-amber-400 border-amber-500/30"
                        }`}
                      >
                        {item.status || "MONITORED"}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-[#8A8D93] font-sans">
                      {item.engine || "Platform RMF"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Disclaimer */}
        <div className="p-3.5 rounded-xl bg-[#0A0B0D] border border-[#1F2128] text-xs font-sans text-[#8A8D93] leading-relaxed">
          <strong className="text-[#EDEBE6]">Compliance Notice:</strong>{" "}
          {report?.disclaimer ||
            "Assessments are calculated via continuous automated inspection and policy testing. Results demonstrate technical control effectiveness and do not constitute formal legal certification."}
        </div>
      </div>
    </div>
  );
}
