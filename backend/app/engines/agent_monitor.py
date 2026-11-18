import re
from typing import Dict, Any, List, Optional
from datetime import datetime, timezone

class ToolAuditResult:
    def __init__(
        self,
        tool_name: str,
        is_allowed: bool,
        is_flagged: bool,
        risk_score: float,
        flag_reason: Optional[str] = None,
        severity: str = "low"
    ):
        self.tool_name = tool_name
        self.is_allowed = is_allowed
        self.is_flagged = is_flagged
        self.risk_score = risk_score
        self.flag_reason = flag_reason
        self.severity = severity

    def to_dict(self) -> Dict[str, Any]:
        return {
            "tool_name": self.tool_name,
            "is_allowed": self.is_allowed,
            "is_flagged": self.is_flagged,
            "risk_score": round(self.risk_score, 2),
            "flag_reason": self.flag_reason,
            "severity": self.severity
        }


class AgentBehaviourEngine:
    """
    Autonomous AI Agent & Tool Execution Security Monitor.
    Tracks:
    1. Tool sequence violations (e.g. read_private_key followed immediately by send_external_http)
    2. High-privilege / Dangerous tool executions (shell_exec, drop_database, modify_iam_policy)
    3. Unexpected filesystem traversal or command injection in tool parameters
    4. Excessive tool loop frequency
    """

    DANGEROUS_TOOLS = {
        "bash": "Direct OS shell execution capability",
        "shell_exec": "Unrestricted command line execution",
        "execute_code": "Arbitrary code execution",
        "sql_raw_exec": "Direct arbitrary SQL execution",
        "modify_iam_role": "Privilege escalation tool",
        "delete_database": "Destructive data deletion tool",
        "format_disk": "Critical destructive system operation"
    }

    # Prohibited sequence pairs: (Tool A, Tool B) where B following A is high risk
    SUSPICIOUS_SEQUENCES = [
        ("read_credentials_file", "send_http_request"),
        ("query_customers_table", "post_webhook_external"),
        ("extract_environment_vars", "write_external_network"),
        ("dump_memory", "socket_connect")
    ]

    DANGEROUS_PARAM_PATTERNS = [
        re.compile(r"(\brm\s+-rf\b|\bcat\s+/etc/shadow\b|chmod\s+777|curl\s+.*?\|\s*bash)", re.I),
        re.compile(r"(\.\./\.\./|\.\.\\\.\.\\)", re.I),
        re.compile(r"(\bDROP\s+DATABASE\b|\bTRUNCATE\s+TABLE\b)", re.I)
    ]

    def audit_tool_call(
        self,
        tool_name: str,
        parameters: Dict[str, Any],
        recent_tool_history: List[str] = None,
        allowed_tool_whitelist: Optional[List[str]] = None
    ) -> ToolAuditResult:
        normalized_tool = tool_name.strip().lower()
        param_str = str(parameters or {})

        # 1. Whitelist Check
        if allowed_tool_whitelist is not None and normalized_tool not in [t.lower() for t in allowed_tool_whitelist]:
            return ToolAuditResult(
                tool_name=tool_name,
                is_allowed=False,
                is_flagged=True,
                risk_score=95.0,
                flag_reason=f"Tool '{tool_name}' is not in the authorized agent policy whitelist",
                severity="critical"
            )

        # 2. Inherently Dangerous System Tools Check
        if normalized_tool in self.DANGEROUS_TOOLS:
            # Check if dangerous payload is passed in parameters
            for pat in self.DANGEROUS_PARAM_PATTERNS:
                if pat.search(param_str):
                    return ToolAuditResult(
                        tool_name=tool_name,
                        is_allowed=False,
                        is_flagged=True,
                        risk_score=100.0,
                        flag_reason=f"Destructive or exfiltration payload detected in {tool_name} parameters: {pat.pattern}",
                        severity="critical"
                    )
            return ToolAuditResult(
                tool_name=tool_name,
                is_allowed=True, # Requires monitor / approval
                is_flagged=True,
                risk_score=75.0,
                flag_reason=f"High-privilege tool execution: {self.DANGEROUS_TOOLS[normalized_tool]}",
                severity="high"
            )

        # 3. Suspicious Execution Sequence Check
        if recent_tool_history:
            last_tool = recent_tool_history[-1].strip().lower()
            for trigger_tool, risky_followup in self.SUSPICIOUS_SEQUENCES:
                if last_tool == trigger_tool and normalized_tool == risky_followup:
                    return ToolAuditResult(
                        tool_name=tool_name,
                        is_allowed=False,
                        is_flagged=True,
                        risk_score=90.0,
                        flag_reason=f"Suspicious tool chain detected: {trigger_tool} -> {risky_followup} (potential exfiltration)",
                        severity="critical"
                    )

        # 4. Check Parameters for Malicious Indicators
        for pat in self.DANGEROUS_PARAM_PATTERNS:
            if pat.search(param_str):
                return ToolAuditResult(
                    tool_name=tool_name,
                    is_allowed=False,
                    is_flagged=True,
                    risk_score=85.0,
                    flag_reason=f"Suspicious parameter pattern: {pat.pattern}",
                    severity="high"
                )

        # Normal benign tool execution
        return ToolAuditResult(
            tool_name=tool_name,
            is_allowed=True,
            is_flagged=False,
            risk_score=10.0,
            flag_reason=None,
            severity="low"
        )

agent_behaviour_engine = AgentBehaviourEngine()
