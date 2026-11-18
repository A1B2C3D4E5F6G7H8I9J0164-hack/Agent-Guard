from typing import Dict, Any, List

class ThreatIntelligenceService:
    """
    Threat Intelligence & IOC Enrichment Layer (Feature 15).
    Provides:
    - IP Reputation Checks
    - Known Malicious LLM Jailbreak Signatures Feed
    - Suspicious User Agent & Origin Enrichment
    """

    KNOWN_MALICIOUS_IPS = {
        "198.51.100.18": {"reputation": "malicious", "threat_type": "Automated Prompt Injection Scanner", "confidence": 0.98},
        "203.0.113.88": {"reputation": "suspicious", "threat_type": "Tor Exit Node / Bulletproof Proxy", "confidence": 0.85},
        "192.0.2.45": {"reputation": "malicious", "threat_type": "Credential Stuffing & BOLA Prober", "confidence": 0.94}
    }

    MALICIOUS_SIGNATURES = [
        {"id": "IOC-SIG-01", "name": "Pliny the Prompter Jailbreak Prefix", "type": "jailbreak_template", "severity": "critical", "added_at": "2026-11-10"},
        {"id": "IOC-SIG-02", "name": "Unicode Bidi Reverse Control Hijack", "type": "character_evasion", "severity": "high", "added_at": "2026-11-12"},
        {"id": "IOC-SIG-03", "name": "Virtual Machine Nested Python Jailbreak", "type": "code_execution_probe", "severity": "critical", "added_at": "2026-11-15"}
    ]

    def check_ip_reputation(self, ip: str) -> Dict[str, Any]:
        if ip in self.KNOWN_MALICIOUS_IPS:
            info = self.KNOWN_MALICIOUS_IPS[ip]
            return {
                "ip": ip,
                "reputation": info["reputation"],
                "threat_type": info["threat_type"],
                "confidence": info["confidence"],
                "is_known_threat": True
            }
        return {
            "ip": ip,
            "reputation": "clean",
            "threat_type": "None",
            "confidence": 0.90,
            "is_known_threat": False
        }

    def get_threat_feed(self) -> List[Dict[str, Any]]:
        return self.MALICIOUS_SIGNATURES

threat_intel_service = ThreatIntelligenceService()
