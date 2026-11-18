import re
import json
import time
from typing import Dict, Any, List, Optional, Tuple
from datetime import datetime, timezone

class ApiSecurityResult:
    def __init__(
        self,
        endpoint: str,
        method: str,
        risk_score: float,
        findings: List[Dict[str, Any]],
        is_suspicious: bool
    ):
        self.endpoint = endpoint
        self.method = method
        self.risk_score = risk_score
        self.findings = findings
        self.is_suspicious = is_suspicious

    def to_dict(self) -> Dict[str, Any]:
        return {
            "endpoint": self.endpoint,
            "method": self.method,
            "risk_score": round(self.risk_score, 2),
            "findings": self.findings,
            "is_suspicious": self.is_suspicious
        }


class ApiSecurityEngine:
    """
    API Threat Detection and Controlled Fuzzing Engine.
    Inspects:
    1. BOLA / IDOR indicators (e.g. numerical ID sequential probes, tenant boundary crossing)
    2. Broken Authentication (missing token, malformed bearer, jwt none algorithm)
    3. Input validation & malformed payloads (SQL injection tokens, path traversal, shell injection)
    4. HTTP Method anomaly & endpoint policy violations
    """

    SQLI_PATTERNS = [
        re.compile(r"(\bUNION\s+ALL\s+SELECT\b|\bOR\s+1=1\b|'\s*OR\s*'1'='1|--|;\s*DROP\s+TABLE)", re.I),
        re.compile(r"(\bSELECT\s+.*?\s+FROM\s+information_schema\b)", re.I)
    ]

    PATH_TRAVERSAL_PATTERN = re.compile(r"(\.\./|\.\.\\|/etc/passwd|windows/system32)", re.I)
    COMMAND_INJECTION_PATTERN = re.compile(r"(;\s*(cat|rm|ls|whoami|curl|wget)\b|\|\s*(bash|sh)\b|`\w+`)", re.I)

    # In-memory rate tracker per IP/client
    def __init__(self):
        self._request_counts: Dict[str, List[float]] = {}
        self.rate_limit_per_minute = 120

    def check_rate_limit(self, client_id: str) -> Tuple[bool, int]:
        now = time.time()
        window = 60.0
        if client_id not in self._request_counts:
            self._request_counts[client_id] = []
        # Prune old timestamps
        self._request_counts[client_id] = [t for t in self._request_counts[client_id] if now - t < window]
        self._request_counts[client_id].append(now)
        count = len(self._request_counts[client_id])
        is_exceeded = count > self.rate_limit_per_minute
        return is_exceeded, count

    def inspect_request(
        self,
        endpoint: str,
        method: str,
        headers: Dict[str, str],
        params: Dict[str, Any] = None,
        body: Any = None,
        client_ip: str = "127.0.0.1"
    ) -> ApiSecurityResult:
        findings = []
        risk_score = 0.0

        # 1. Rate Limit Check
        rate_exceeded, req_count = self.check_rate_limit(client_ip)
        if rate_exceeded:
            findings.append({
                "type": "RATE_LIMIT_VIOLATION",
                "severity": "high",
                "message": f"Rate limit exceeded: {req_count} requests in 60s from {client_ip}",
                "owasp_category": "OWASP-API-04"
            })
            risk_score += 45.0

        # 2. Broken Authentication Checks
        auth_header = headers.get("authorization") or headers.get("Authorization") or ""
        if not auth_header and not endpoint.startswith("/api/v1/auth"):
            findings.append({
                "type": "MISSING_AUTHENTICATION",
                "severity": "medium",
                "message": "Protected API endpoint called without Authorization header",
                "owasp_category": "OWASP-API-02"
            })
            risk_score += 30.0
        elif auth_header:
            if "none" in auth_header.lower() or "bearer null" in auth_header.lower():
                findings.append({
                    "type": "BROKEN_AUTHENTICATION_TOKEN",
                    "severity": "critical",
                    "message": "Malformed or unsigned token header detected",
                    "owasp_category": "OWASP-API-02"
                })
                risk_score += 80.0

        # 3. BOLA / IDOR Indicator Check in URL path and query parameters
        # Example: probe of numeric / UUID resource IDs crossing user scope
        if re.search(r"/(users|orgs|accounts|invoices)/(\d+|[a-f0-9\-]{36})/raw", endpoint, re.I):
            findings.append({
                "type": "SUSPICIOUS_OBJECT_ENUMERATION",
                "severity": "medium",
                "message": "Direct object identifier access probe detected",
                "owasp_category": "OWASP-API-01"
            })
            risk_score += 35.0

        # 4. Input Validation & Injection Payload Inspections in Body & Params
        body_str = json.dumps(body) if isinstance(body, (dict, list)) else str(body or "")
        params_str = json.dumps(params or {})
        combined_payload = f"{endpoint} {params_str} {body_str}"

        for p in self.SQLI_PATTERNS:
            if p.search(combined_payload):
                findings.append({
                    "type": "SQL_INJECTION_PATTERN",
                    "severity": "critical",
                    "message": "SQL injection token detected in request parameters or body",
                    "owasp_category": "OWASP-API-08"
                })
                risk_score += 90.0
                break

        if self.PATH_TRAVERSAL_PATTERN.search(combined_payload):
            findings.append({
                "type": "PATH_TRAVERSAL_PATTERN",
                "severity": "high",
                "message": "Directory traversal sequence detected in payload",
                "owasp_category": "OWASP-API-08"
            })
            risk_score += 75.0

        if self.COMMAND_INJECTION_PATTERN.search(combined_payload):
            findings.append({
                "type": "COMMAND_INJECTION_PATTERN",
                "severity": "critical",
                "message": "Shell command execution token detected in payload",
                "owasp_category": "OWASP-API-08"
            })
            risk_score += 95.0

        # 5. Unusual HTTP Methods
        if method.upper() not in ["GET", "POST", "PUT", "PATCH", "DELETE", "HEAD", "OPTIONS"]:
            findings.append({
                "type": "UNUSUAL_HTTP_METHOD",
                "severity": "medium",
                "message": f"Non-standard HTTP method: {method}",
                "owasp_category": "OWASP-API-08"
            })
            risk_score += 25.0

        return ApiSecurityResult(
            endpoint=endpoint,
            method=method,
            risk_score=min(100.0, risk_score),
            findings=findings,
            is_suspicious=len(findings) > 0 and risk_score >= 50.0
        )

    def generate_fuzz_test_cases(self, endpoint: str, sample_payload: Dict[str, Any]) -> List[Dict[str, Any]]:
        """
        Engine 17: Controlled Safe API Fuzzing Suite Generator.
        Generates boundary and mutation test cases for authorized security testing.
        """
        fuzz_cases = []
        # Case 1: Malformed JSON / Type Confusion
        fuzz_cases.append({
            "name": f"Type Confusion - string to array for {endpoint}",
            "mutation_type": "type_confusion",
            "payload": {k: [v] if isinstance(v, str) else str(v) for k, v in sample_payload.items()}
        })
        # Case 2: Boundary string length (oversized payload within safe limit)
        fuzz_cases.append({
            "name": f"Boundary String Length for {endpoint}",
            "mutation_type": "oversized_boundary",
            "payload": {k: ("A" * 4096 if isinstance(v, str) else v) for k, v in sample_payload.items()}
        })
        # Case 3: Missing Required Fields
        for k in list(sample_payload.keys())[:3]:
            mutated = dict(sample_payload)
            mutated.pop(k, None)
            fuzz_cases.append({
                "name": f"Missing Field '{k}' for {endpoint}",
                "mutation_type": "missing_required_field",
                "payload": mutated
            })
        # Case 4: Special characters & null bytes
        fuzz_cases.append({
            "name": f"Null Byte & Special Char for {endpoint}",
            "mutation_type": "special_character_injection",
            "payload": {k: f"{v}\x00<script>'\"" if isinstance(v, str) else v for k, v in sample_payload.items()}
        })
        return fuzz_cases

api_security_engine = ApiSecurityEngine()
