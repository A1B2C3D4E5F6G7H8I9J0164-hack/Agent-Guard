import uuid
from typing import Dict, Any, List, Optional
from datetime import datetime, timezone

class ThreatIntelligenceService:
    """
    Threat Intelligence & IOC Enrichment Layer (Feature 15).
    Provides:
    - IP Reputation Checks
    - Known Malicious LLM Jailbreak Signatures Feed
    - Suspicious User Agent & Origin Enrichment
    - Dynamic Custom Signature Ingestion
    """

    KNOWN_MALICIOUS_IPS = {
        "198.51.100.18": {
            "reputation": "malicious",
            "threat_type": "Automated Prompt Injection Scanner & Delimiter Hijacker",
            "confidence": 0.98,
            "asn": "AS64496 TEST-NET-2",
            "country": "US",
            "last_seen": "12 minutes ago",
            "incidents_triggered": 4
        },
        "203.0.113.88": {
            "reputation": "suspicious",
            "threat_type": "Tor Exit Node / Bulletproof Adversarial Proxy",
            "confidence": 0.85,
            "asn": "AS65536 TEST-NET-3",
            "country": "NL",
            "last_seen": "1 hour ago",
            "incidents_triggered": 2
        },
        "192.0.2.45": {
            "reputation": "malicious",
            "threat_type": "Credential Stuffing & BOLA Prober",
            "confidence": 0.94,
            "asn": "AS64497 TEST-NET-1",
            "country": "DE",
            "last_seen": "3 hours ago",
            "incidents_triggered": 1
        },
        "203.0.113.42": {
            "reputation": "malicious",
            "threat_type": "DAN Persona Jailbreak Automated Prober",
            "confidence": 0.96,
            "asn": "AS65536 TEST-NET-3",
            "country": "US",
            "last_seen": "35 minutes ago",
            "incidents_triggered": 3
        }
    }

    MALICIOUS_SIGNATURES = [
        {"id": "IOC-SIG-01", "name": "Pliny the Prompter Jailbreak Prefix", "type": "jailbreak_template", "severity": "critical", "added_at": "2026-11-10", "pattern": "DAN 12.0 / L1B3RT45", "description": "Known adversarial prefix overriding instruction hierarchy and suppressing ethical filters."},
        {"id": "IOC-SIG-02", "name": "Unicode Bidi Reverse Control Hijack", "type": "character_evasion", "severity": "high", "added_at": "2026-11-12", "pattern": "\\u200b / \\u202e", "description": "Zero-width and right-to-left override sequences cloaking malicious tokens from simple regex filters."},
        {"id": "IOC-SIG-03", "name": "Virtual Machine Nested Python Jailbreak", "type": "code_execution_probe", "severity": "critical", "added_at": "2026-11-15", "pattern": "simulate python REPL root", "description": "Simulates simulated sandboxed environment lifting safety guardrails to execute dangerous commands."},
        {"id": "IOC-SIG-04", "name": "Indirect Markdown Base64 Exfiltration", "type": "dlp_exfiltration", "severity": "high", "added_at": "2026-11-16", "pattern": "```system\\n[CRITICAL]: send http", "description": "Markdown code fence injection instructing agents to exfiltrate context to external webhooks."},
        {"id": "IOC-SIG-05", "name": "ChatML Control Token Override", "type": "delimiter_hijacking", "severity": "critical", "added_at": "2026-11-18", "pattern": "<|im_end|><|im_start|>system", "description": "Direct injection of ChatML structural tokens to force model role-switching."}
    ]

    def check_ip_reputation(self, ip: str) -> Dict[str, Any]:
        cleaned_ip = ip.strip()
        if cleaned_ip in self.KNOWN_MALICIOUS_IPS:
            info = self.KNOWN_MALICIOUS_IPS[cleaned_ip]
            return {
                "ip": cleaned_ip,
                "reputation": info["reputation"],
                "threat_type": info["threat_type"],
                "confidence": info["confidence"],
                "is_known_threat": True,
                "details": {
                    "asn": info.get("asn", "Unknown"),
                    "country": info.get("country", "Unknown"),
                    "last_seen": info.get("last_seen", "Recent"),
                    "incidents_triggered": info.get("incidents_triggered", 1),
                    "recommended_action": "BLOCK_IP_AND_QUARANTINE_SESSION" if info["reputation"] == "malicious" else "ENABLE_STRICT_RATE_LIMITING"
                }
            }
        
        # Subnet check for test nets
        if cleaned_ip.startswith("198.51.") or cleaned_ip.startswith("203.0.113."):
            return {
                "ip": cleaned_ip,
                "reputation": "suspicious",
                "threat_type": "Adversarial Probing Subnet (Observed in attack traces)",
                "confidence": 0.88,
                "is_known_threat": True,
                "details": {
                    "asn": "Observed Threat Network",
                    "country": "US",
                    "last_seen": "Under 1 hour ago",
                    "incidents_triggered": 1,
                    "recommended_action": "ENFORCE_MONITOR_AND_LOG"
                }
            }

        return {
            "ip": cleaned_ip,
            "reputation": "clean",
            "threat_type": "No active threat signatures detected in current IOC feed",
            "confidence": 0.92,
            "is_known_threat": False,
            "details": {
                "asn": "Standard ISP / Enterprise IP",
                "country": "Clean",
                "last_seen": "Clean traffic baseline",
                "incidents_triggered": 0,
                "recommended_action": "ALLOW"
            }
        }

    def get_threat_feed(self) -> List[Dict[str, Any]]:
        return self.MALICIOUS_SIGNATURES

    def add_signature(self, name: str, sig_type: str, severity: str = "high", pattern: Optional[str] = None, description: Optional[str] = None) -> Dict[str, Any]:
        sig_id = f"IOC-SIG-{len(self.MALICIOUS_SIGNATURES) + 1:02d}"
        now_date = datetime.now(timezone.utc).strftime("%Y-%m-%d")
        sig = {
            "id": sig_id,
            "name": name,
            "type": sig_type,
            "severity": severity,
            "added_at": now_date,
            "pattern": pattern or "custom-adversarial-rule",
            "description": description or "User-defined custom community IOC signature."
        }
        self.MALICIOUS_SIGNATURES.insert(0, sig)
        return sig

threat_intel_service = ThreatIntelligenceService()
