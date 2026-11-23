"use client";

import React, { useState, useEffect } from "react";
import {
  Search,
  ShieldAlert,
  Play,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  KeyRound,
  FileCode,
  ArrowRight,
} from "lucide-react";
import { api } from "@/lib/api";
import { PageHeader } from "@/components/ui/PageHeader";
import { SeverityBadge } from "@/components/ui/SeverityBadge";
import { EmptyState } from "@/components/ui/EmptyState";

export default function ScannerView() {
  const [scans, setScans] = useState<any[]>([]);
  const [isScanning, setIsScanning] = useState(false);
  const [scanType, setScanType] = useState("full");
  const [credCode, setCredCode] = useState(
    `const client = new OpenAI({\n  apiKey: "sk-proj-48190248102948102948102948102948",\n  dangerouslyAllowBrowser: true\n});\nconst dbPassword = "SuperAdminPassword2026!";`
  );
  const [credResult, setCredResult] = useState<any>(null);
  const [isScanningCreds, setIsScanningCreds] = useState(false);

  const loadScans = async () => {
    try {
      const data = await api.getScans();
      setScans(data);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    loadScans();
  }, []);

  const handleLaunchScan = async () => {
    setIsScanning(true);
    try {
      await api.runScan({ organization_id: "org-default", scan_type: scanType });
      await loadScans();
    } catch (e) {
      console.error(e);
    } finally {
      setIsScanning(false);
    }
  };

  const handleScanCredentials = async () => {
    setIsScanningCreds(true);
    try {
      const data = await api.scanCredentials(credCode);
      setCredResult(data);
    } catch (e) {
      console.error(e);
    } finally {
      setIsScanningCreds(false);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 font-sans">
      {/* 1. Page Header */}
      <PageHeader
        title="Vulnerability Scanner & Secret Exposure Audit"
        description="Automated security assessments for OWASP LLM Top 10 vulnerabilities, API authorization flaws, and hardcoded secrets."
        statusLine="Automated Scanning Engine Ready · 4 Assessment Suites"
        badge={{ text: "VULN AUDITOR", variant: "sky" }}
        actions={
          <div className="flex items-center gap-3">
            <select
              value={scanType}
              onChange={(e) => setScanType(e.target.value)}
              className="px-3 py-1.5 rounded-lg bg-[#0F1622] border border-[#1E293B] text-xs font-sans text-slate-200 focus:outline-none focus:border-sky-500"
            >
              <option value="full">Full Assessment Suite</option>
              <option value="prompt-injection">Prompt Injection Suite</option>
              <option value="api-security">API Security & BOLA Suite</option>
              <option value="redteam">Adversarial Red Team Suite</option>
            </select>

            <button
              type="button"
              onClick={handleLaunchScan}
              disabled={isScanning}
              className="flex items-center gap-2 px-4 py-1.5 rounded-lg bg-sky-500 hover:bg-sky-400 text-black font-semibold text-xs font-sans transition-all shadow-sm cursor-pointer disabled:opacity-50"
            >
              <Play className="w-3.5 h-3.5 fill-black" />
              <span>{isScanning ? "Scanning..." : "Launch scan"}</span>
            </button>
          </div>
        }
      />

      {/* 2. Credential Exposure Scanner Section */}
      <div className="p-5 rounded-xl bg-[#0F1622] border border-[#1E293B] space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-[#1E293B]">
          <div className="flex items-center gap-2">
            <KeyRound className="w-4 h-4 text-amber-400" />
            <h2 className="text-base font-semibold text-white font-sans">
              Credential exposure audit
            </h2>
          </div>
          <span className="text-xs text-slate-400 font-sans">Repository & config inspector</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 text-xs font-sans">
          <div className="space-y-3">
            <label className="text-slate-300 font-medium block">
              Paste code snippet, env file, or configuration text:
            </label>
            <textarea
              rows={5}
              value={credCode}
              onChange={(e) => setCredCode(e.target.value)}
              className="w-full p-3 rounded-lg bg-[#080B10] border border-[#1E293B] text-xs font-mono text-slate-200 focus:outline-none focus:border-amber-500"
            />
            <div className="flex justify-end">
              <button
                type="button"
                onClick={handleScanCredentials}
                disabled={isScanningCreds}
                className="px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-black font-semibold text-xs font-sans flex items-center gap-2 transition-colors cursor-pointer disabled:opacity-50 shadow-sm"
              >
                <Search className="w-3.5 h-3.5" />
                <span>{isScanningCreds ? "Auditing tokens..." : "Audit for secrets"}</span>
              </button>
            </div>
          </div>

          <div>
            <label className="text-slate-300 font-medium mb-1 block">
              Redacted output preview:
            </label>
            <div className="p-3.5 rounded-lg bg-[#080B10] border border-[#1E293B] min-h-[140px] text-xs text-slate-300">
              {credResult ? (
                <div className="space-y-2">
                  <div className="text-red-400 font-semibold flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4 text-red-400" />
                    <span>Found {credResult.secrets_found_count} exposed credentials!</span>
                  </div>
                  <pre className="p-2.5 rounded bg-[#0F1622] border border-[#1E293B] font-mono text-slate-200 text-xs overflow-x-auto whitespace-pre-wrap leading-relaxed max-h-40">
                    {credResult.sanitized_preview}
                  </pre>
                </div>
              ) : (
                <span className="text-slate-500 font-sans text-xs text-center block py-8">
                  Run audit to see exposed API keys, tokens, or passwords automatically masked.
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 3. Historical Scans & Findings Table */}
      <div className="p-5 rounded-xl bg-[#0F1622] border border-[#1E293B] space-y-4">
        <div>
          <h2 className="text-base font-semibold text-white font-sans">
            Vulnerability scan executions & findings
          </h2>
          <p className="text-xs text-slate-400 font-sans mt-0.5">
            Audit history across authorized application target environments.
          </p>
        </div>

        <div className="space-y-4">
          {scans.length === 0 ? (
            <EmptyState
              title="No scans executed yet"
              description="Click Launch scan in the header to execute automated vulnerability evaluations."
            />
          ) : (
            scans.map((scan, i) => (
              <div
                key={i}
                className="p-4 rounded-xl bg-[#080B10] border border-[#1E293B] space-y-3 font-sans"
              >
                <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                  <div className="flex items-center gap-3">
                    <span className="font-semibold text-white capitalize font-sans">
                      {scan.scan_type} scan
                    </span>
                    <span className="text-slate-500 font-mono text-[11px]">
                      Started: {new Date(scan.started_at).toLocaleString()}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-slate-400">
                      Tests: <strong className="font-mono text-white">{scan.total_tests}</strong> (
                      Passed: <strong className="font-mono text-emerald-400">{scan.passed_tests}</strong>, Failed:{" "}
                      <strong className="font-mono text-red-400">{scan.failed_tests}</strong>)
                    </span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                      {scan.status.toUpperCase()}
                    </span>
                  </div>
                </div>

                {/* Findings List */}
                {scan.findings && scan.findings.length > 0 && (
                  <div className="space-y-2 pt-2 border-t border-[#1E293B]">
                    <div className="text-xs font-semibold text-red-400">
                      Discovered vulnerability findings:
                    </div>
                    {scan.findings.map((f: any, fi: number) => (
                      <div
                        key={fi}
                        className="p-3 rounded-lg bg-[#0F1622] border border-[#1E293B] text-xs space-y-1"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-slate-200 flex items-center gap-2">
                            <SeverityBadge severity={f.severity} size="sm" />
                            <span>{f.title}</span>
                          </span>
                          <span className="text-slate-400 text-[11px] font-mono">{f.category}</span>
                        </div>
                        <p className="text-slate-400 text-xs mt-1 leading-relaxed">
                          {f.description}
                        </p>
                        <div className="text-[11px] text-emerald-400 pt-0.5">
                          Remediation: {f.remediation}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
