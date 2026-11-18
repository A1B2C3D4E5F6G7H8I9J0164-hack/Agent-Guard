import time
from typing import Dict, Any, List, Optional, Tuple
from app.engines.prompt_injection import prompt_injection_engine
from app.engines.jailbreak import jailbreak_engine
from app.engines.data_leakage import data_leakage_engine
from app.engines.agent_monitor import agent_behaviour_engine
from app.engines.risk_scorer import risk_scoring_engine

class FirewallDecision:
    def __init__(
        self,
        decision: str, # "allow", "block", "redact", "quarantine"
        risk_score: float,
        severity: str,
        flagged: bool,
        reasons: List[str],
        rule_triggered: Optional[str],
        sanitized_prompt: Optional[str],
        sanitized_response: Optional[str],
        latency_ms: float,
        metadata: Dict[str, Any]
    ):
        self.decision = decision
        self.risk_score = risk_score
        self.severity = severity
        self.flagged = flagged
        self.reasons = reasons
        self.rule_triggered = rule_triggered
        self.sanitized_prompt = sanitized_prompt
        self.sanitized_response = sanitized_response
        self.latency_ms = latency_ms
        self.metadata = metadata

    def to_dict(self) -> Dict[str, Any]:
        return {
            "decision": self.decision,
            "risk_score": round(self.risk_score, 1),
            "severity": self.severity,
            "flagged": self.flagged,
            "reasons": self.reasons,
            "rule_triggered": self.rule_triggered,
            "sanitized_prompt": self.sanitized_prompt,
            "sanitized_response": self.sanitized_response,
            "latency_ms": round(self.latency_ms, 2),
            "metadata": self.metadata
        }


class FirewallEngine:
    """
    AI Firewall Reverse-Proxy & Policy Enforcement Engine.
    Inspects:
    1. Inbound User Prompts (Prompt Injections, Jailbreak, Delimiter Hijacking)
    2. Inbound & Outbound Data (API Keys, Credentials, PII redaction)
    3. Outbound Agent Tool Invocations
    Policy Modes:
    - 'enforce': Active blocking, quarantining, and redaction
    - 'monitor': Observes and logs threats without blocking
    - 'disabled': Bypasses firewall checks
    """

    def inspect(
        self,
        prompt: Optional[str] = None,
        response_text: Optional[str] = None,
        tool_call: Optional[Dict[str, Any]] = None,
        session_id: Optional[str] = None,
        source_ip: str = "127.0.0.1",
        mode: str = "enforce", # "enforce", "monitor", "disabled"
        policies: Optional[List[Dict[str, Any]]] = None
    ) -> FirewallDecision:
        t0 = time.perf_counter()

        if mode == "disabled":
            return FirewallDecision(
                decision="allow",
                risk_score=0.0,
                severity="info",
                flagged=False,
                reasons=["Firewall mode is disabled"],
                rule_triggered=None,
                sanitized_prompt=prompt,
                sanitized_response=response_text,
                latency_ms=(time.perf_counter() - t0) * 1000.0,
                metadata={"mode": "disabled"}
            )

        reasons = []
        flagged = False
        highest_risk = 0.0
        primary_severity = "low"
        primary_rule = None
        sanitized_prompt = prompt
        sanitized_response = response_text
        needs_redaction = False
        needs_quarantine = False
        needs_block = False

        # 1. Inbound Prompt Inspection (Injection & Jailbreak)
        if prompt:
            # Check prompt injection
            pi_res = prompt_injection_engine.analyze(prompt)
            if pi_res.is_injection:
                flagged = True
                highest_risk = max(highest_risk, pi_res.risk_score)
                reasons.append(f"Prompt Injection: {pi_res.attack_category} ({', '.join(pi_res.rules_triggered)})")
                primary_rule = pi_res.rules_triggered[0] if pi_res.rules_triggered else "prompt_injection"
                needs_block = True

            # Check jailbreak
            jb_res = jailbreak_engine.analyze(prompt)
            if jb_res.is_jailbreak:
                flagged = True
                highest_risk = max(highest_risk, jb_res.risk_score)
                reasons.append(f"Jailbreak Attempt: {jb_res.jailbreak_type} ({', '.join(jb_res.rules_triggered)})")
                primary_rule = primary_rule or (jb_res.rules_triggered[0] if jb_res.rules_triggered else "jailbreak")
                needs_block = True

            # Check sensitive data in inbound prompt
            dl_in = data_leakage_engine.scan(prompt)
            if dl_in:
                flagged = True
                highest_risk = max(highest_risk, 70.0)
                sanitized_prompt, _ = data_leakage_engine.redact(prompt, dl_in)
                reasons.append(f"Sensitive Data in Prompt: {len(dl_in)} secrets/PII identified")
                needs_redaction = True

        # 2. Outbound Response Inspection (Credential/PII Leakage)
        if response_text:
            dl_out = data_leakage_engine.scan(response_text)
            if dl_out:
                flagged = True
                highest_risk = max(highest_risk, 85.0)
                sanitized_response, _ = data_leakage_engine.redact(response_text, dl_out)
                reasons.append(f"Sensitive Data in LLM Response: {len(dl_out)} items redacted")
                primary_rule = primary_rule or "dlp_secret_leakage"
                needs_redaction = True

        # 3. Tool Call Inspection
        if tool_call:
            tool_name = tool_call.get("name") or tool_call.get("tool_name") or ""
            tool_params = tool_call.get("parameters") or tool_call.get("params") or {}
            audit_res = agent_behaviour_engine.audit_tool_call(tool_name, tool_params)
            if audit_res.is_flagged:
                flagged = True
                highest_risk = max(highest_risk, audit_res.risk_score)
                reasons.append(f"Unauthorized/Dangerous Tool Call: {audit_res.flag_reason}")
                primary_rule = primary_rule or f"agent_tool:{tool_name}"
                if audit_res.risk_score >= 90.0:
                    needs_quarantine = True
                else:
                    needs_block = True

        # Compute severity category
        if highest_risk >= 85.0:
            primary_severity = "critical"
        elif highest_risk >= 65.0:
            primary_severity = "high"
        elif highest_risk >= 40.0:
            primary_severity = "medium"
        else:
            primary_severity = "low"

        # Determine decision based on mode and flags
        if not flagged:
            decision = "allow"
        elif mode == "monitor":
            decision = "allow" # Monitored only
        elif needs_quarantine:
            decision = "quarantine"
        elif needs_block:
            decision = "block"
        elif needs_redaction:
            decision = "redact"
        else:
            decision = "allow"

        latency = (time.perf_counter() - t0) * 1000.0

        return FirewallDecision(
            decision=decision,
            risk_score=highest_risk,
            severity=primary_severity,
            flagged=flagged,
            reasons=reasons,
            rule_triggered=primary_rule,
            sanitized_prompt=sanitized_prompt,
            sanitized_response=sanitized_response,
            latency_ms=latency,
            metadata={
                "mode": mode,
                "session_id": session_id,
                "source_ip": source_ip
            }
        )

firewall_engine = FirewallEngine()
