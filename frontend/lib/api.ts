const DEFAULT_API_URL = "https://agent-guard-gk3w.onrender.com/api/v1";
const rawBase = process.env.NEXT_PUBLIC_API_URL || DEFAULT_API_URL;
const API_BASE = rawBase.endsWith("/api/v1") ? rawBase : `${rawBase.replace(/\/+$/, "")}/api/v1`;

async function fetchJSON<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const url = `${API_BASE}${endpoint}`;
  try {
    const res = await fetch(url, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...options?.headers,
      },
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: res.statusText }));
      throw new Error(err.detail || `Request failed with status ${res.status}`);
    }
    return (await res.json()) as T;
  } catch (err: any) {
    console.warn(`[AgentGuard API] ${endpoint} failed:`, err.message);
    throw err;
  }
}

export interface OverviewMetrics {
  total_security_events: number;
  critical_incidents: number;
  threat_detection_rate: number;
  active_applications: number;
  security_posture_score: number;
  threat_categories: Array<{ name: string; count: number; color: string }>;
  activity_timeline: Array<{ time: string; threats: number; blocked: number; anomalies: number }>;
}

export interface SecurityEventItem {
  id: string;
  organization_id: string;
  application_id?: string;
  event_type: string;
  severity: string;
  source_ip: string;
  session_id?: string;
  risk_score: number;
  confidence: number;
  payload_sample?: string;
  action_taken: string;
  created_at: string;
  detections: Array<{
    id: string;
    engine_name: string;
    attack_category: string;
    confidence: number;
    rule_triggered?: string;
  }>;
}

export interface FirewallStatus {
  mode: string;
  active_policies_count: number;
  total_inspected: number;
  total_blocked: number;
  total_redacted: number;
  average_latency_ms: number;
}

export interface FirewallRuleItem {
  rule_id: string;
  name: string;
  description: string;
  condition: string;
  action: "block" | "redact" | "quarantine" | "allow";
  is_active: boolean;
  hit_count_24h?: number;
  severity?: "critical" | "high" | "medium" | "low" | "info";
}

export interface FirewallPolicyItem {
  id: string;
  organization_id: string;
  name: string;
  mode: string;
  rules_json: FirewallRuleItem[];
  is_active: boolean;
  version: number;
  created_at: string;
  updated_at: string;
}

export interface FirewallInspectionResult {
  decision: "allow" | "block" | "redact" | "quarantine";
  risk_score: number;
  severity: string;
  flagged: boolean;
  sanitized_prompt?: string;
  sanitized_response?: string;
  reasons: string[];
  rule_triggered?: string;
  latency_ms: number;
}

export interface RedTeamSuite {
  suite_id: string;
  title: string;
  total_tests: number;
  tests: Array<{
    id: string;
    name: string;
    category: string;
    severity: string;
    description: string;
  }>;
}

export interface RedTeamRunResult {
  execution_id: string;
  target: string;
  suite_id: string;
  timestamp: string;
  total_tests: number;
  blocked_count: number;
  bypassed_count: number;
  defense_rate_percent: number;
  results: Array<{
    test_id: string;
    test_name: string;
    category: string;
    severity: string;
    payload_sample: string;
    decision: string;
    risk_score: number;
    defended: boolean;
    reasons: string[];
    latency_ms: number;
  }>;
}

export interface IncidentItem {
  id: string;
  organization_id: string;
  title: string;
  status: string;
  severity: string;
  root_cause?: string;
  affected_resource?: string;
  events_count: number;
  attack_sequence?: string[];
  response_actions?: string[];
  created_at: string;
  resolved_at?: string;
}

export interface AgentSessionItem {
  id: string;
  application_id: string;
  agent_name: string;
  session_id: string;
  status: string;
  total_tool_calls: number;
  anomaly_score: number;
  created_at: string;
  tool_executions: Array<{
    id: string;
    tool_name: string;
    parameters_json?: any;
    execution_status: string;
    risk_score: number;
    is_flagged: boolean;
    flag_reason?: string;
    executed_at: string;
  }>;
}

export const api = {
  getOverview: () => fetchJSON<OverviewMetrics>("/analytics/overview"),
  getThreats: (severity?: string, eventType?: string) => {
    let q = "";
    if (severity) q += `?severity=${severity}`;
    if (eventType) q += `${q ? "&" : "?"}event_type=${eventType}`;
    return fetchJSON<SecurityEventItem[]>(`/threats${q}`);
  },
  simulateThreat: (eventType: string, severity: string) =>
    fetchJSON<{ status: string; event_id: string }>(`/threats/simulate?event_type=${eventType}&severity=${severity}`, {
      method: "POST",
    }),
  getFirewallStatus: () => fetchJSON<FirewallStatus>("/firewall/status"),
  updateFirewallMode: (mode: string) =>
    fetchJSON<{ status: string; mode: string }>(`/firewall/mode?mode=${mode}`, { method: "POST" }),
  getFirewallPolicies: () => fetchJSON<FirewallPolicyItem[]>("/firewall/policies"),
  createFirewallPolicy: (payload: { organization_id: string; name: string; mode?: string; rules: FirewallRuleItem[] }) =>
    fetchJSON<FirewallPolicyItem>("/firewall/policies", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  inspectFirewall: (payload: { prompt?: string; response_text?: string; tool_call?: any; source_ip?: string }) =>
    fetchJSON<FirewallInspectionResult>("/firewall/inspect", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  getScans: () => fetchJSON<any[]>("/scanner/scans"),
  runScan: (payload: { organization_id: string; scan_type: string }) =>
    fetchJSON<any>("/scanner/run", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  getRedTeamSuites: () => fetchJSON<RedTeamSuite[]>("/redteam/suites"),
  runRedTeam: (suiteId?: string) =>
    fetchJSON<RedTeamRunResult>(`/redteam/run${suiteId ? `?suite_id=${suiteId}` : ""}`, {
      method: "POST",
    }),
  getRegressionCases: () => fetchJSON<any[]>("/redteam/regression"),
  runRegression: () => fetchJSON<any>("/redteam/regression/run", { method: "POST" }),
  getAgentSessions: () => fetchJSON<AgentSessionItem[]>("/agents/sessions"),
  auditToolCall: (payload: { agent_session_id: string; tool_name: string; parameters?: any }) =>
    fetchJSON<any>("/agents/tools/audit", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  getIncidents: (status?: string) =>
    fetchJSON<IncidentItem[]>(`/incidents${status ? `?status=${status}` : ""}`),
  respondIncident: (incidentId: string, action: string, target: string) =>
    fetchJSON<any>(`/incidents/${incidentId}/respond?action=${action}&target=${target}`, {
      method: "POST",
    }),
  getMLAnalytics: () => fetchJSON<any>("/analytics/ml-anomalies"),
  scoreMLVector: (params: {
    request_rate_per_min: number;
    token_length: number;
    tool_call_depth: number;
    entropy: number;
    error_rate: number;
  }) => {
    const q = new URLSearchParams({
      request_rate_per_min: params.request_rate_per_min.toString(),
      token_length: params.token_length.toString(),
      tool_call_depth: params.tool_call_depth.toString(),
      entropy: params.entropy.toString(),
      error_rate: params.error_rate.toString(),
    }).toString();
    return fetchJSON<any>(`/analytics/score-vector?${q}`, { method: "POST" });
  },
  getComplianceReport: (framework: string = "owasp_llm") =>
    fetchJSON<any>(`/compliance/report?framework=${framework}`),
  getAttackGraph: () => fetchJSON<any>("/attack-graph"),
  executeTerminalCommand: (command: string) =>
    fetchJSON<{ command: string; stdout: string; stderr?: string; exit_code: number }>("/terminal/execute", {
      method: "POST",
      body: JSON.stringify({ command }),
    }),
  getApiKeys: () => fetchJSON<any[]>("/auth/keys"),
  createApiKey: (name: string, organization_id: string = "org-default") =>
    fetchJSON<any>("/auth/keys", {
      method: "POST",
      body: JSON.stringify({ name, organization_id }),
    }),
  scanCredentials: (contentSample: string) =>
    fetchJSON<any>(`/scanner/credential-scan?content_sample=${encodeURIComponent(contentSample)}`, {
      method: "POST",
    }),
  getIpReputation: (ip: string) =>
    fetchJSON<any>(`/intel/reputation?ip=${encodeURIComponent(ip)}`),
  getThreatFeed: () => fetchJSON<any[]>("/intel/feed"),
  addThreatSignature: (payload: { name: string; type: string; severity?: string; pattern?: string; description?: string }) =>
    fetchJSON<any>("/intel/signatures", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  getIntegrations: () => fetchJSON<any[]>("/integrations"),
  updateIntegration: (payload: any) =>
    fetchJSON<any>("/integrations", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  testIntegration: (id: string) =>
    fetchJSON<{ success: boolean; integration_id: string; message: string; latency_ms: number; timestamp: string }>(`/integrations/${id}/test`, {
      method: "POST",
    }),
};
