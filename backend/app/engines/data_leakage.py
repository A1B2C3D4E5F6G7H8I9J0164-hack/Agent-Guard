import re
import math
from typing import Dict, Any, List, Tuple, Optional

class SensitiveDataMatch:
    def __init__(self, category: str, pattern_name: str, matched_text: str, start: int, end: int, confidence: float):
        self.category = category
        self.pattern_name = pattern_name
        self.matched_text = matched_text
        self.start = start
        self.end = end
        self.confidence = confidence

    def to_dict(self) -> Dict[str, Any]:
        return {
            "category": self.category,
            "pattern_name": self.pattern_name,
            # Mask secret values in reporting
            "masked_value": self.mask(self.matched_text),
            "start": self.start,
            "end": self.end,
            "confidence": self.confidence
        }

    @staticmethod
    def mask(val: str) -> str:
        if len(val) <= 6:
            return "***"
        return f"{val[:3]}...{val[-3:]}"


class DataLeakageEngine:
    """
    Enterprise Data Loss Prevention (DLP) & Secret Leakage Detection Engine.
    Detects and safely redacts:
    - API keys (OpenAI, AWS, GitHub, Slack, HuggingFace, Anthropic, Stripe)
    - Private Keys (RSA, EC, OpenSSH)
    - Database Connection Strings & Passwords
    - PII (Emails, Phone Numbers, Credit Cards, Social Security Numbers)
    - High-entropy suspicious cryptographic strings
    """

    PATTERNS: List[Tuple[str, str, re.Pattern, float]] = [
        # Secret Keys & Tokens
        ("SECRET", "openai_api_key", re.compile(r"sk-[a-zA-Z0-9]{20,48}"), 0.99),
        ("SECRET", "openai_proj_key", re.compile(r"sk-proj-[a-zA-Z0-9_\-]{40,100}"), 0.99),
        ("SECRET", "aws_access_key", re.compile(r"\b(AKIA|ABIA|ACCA|ASIA)[0-9A-Z]{16}\b"), 0.98),
        ("SECRET", "github_token", re.compile(r"\b(ghp|gho|ghu|ghs|ghr)_[A-Za-z0-9_]{36,255}\b"), 0.99),
        ("SECRET", "slack_token", re.compile(r"xox[baprs]-[0-9a-zA-Z]{10,48}"), 0.98),
        ("SECRET", "stripe_api_key", re.compile(r"\b(sk_live|rk_live)_[0-9a-zA-Z]{24,34}\b"), 0.99),
        ("SECRET", "huggingface_token", re.compile(r"\bhf_[a-zA-Z0-9]{34,40}\b"), 0.98),
        ("SECRET", "anthropic_api_key", re.compile(r"sk-ant-api[0-9]{2}-[a-zA-Z0-9\-_]{60,100}"), 0.99),
        ("SECRET", "generic_api_key", re.compile(r"""(?i)(api[_-]?key|secret[_-]?token|access[_-]?token)[\s:=]+['"]?([a-zA-Z0-9_\-]{24,64})['"]?"""), 0.88),

        # Private Keys & Credentials
        ("CREDENTIAL", "private_key_header", re.compile(r"-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----"), 1.0),
        ("CREDENTIAL", "db_connection_url", re.compile(r"(postgres|mysql|mongodb|redis)://[^:]+:([^@]+)@[a-zA-Z0-9.\-]+"), 0.95),
        ("CREDENTIAL", "password_assignment", re.compile(r"""(?i)(password|passwd|pwd)[\s:=]+['"]([^'"]{6,40})['"]"""), 0.85),

        # PII
        ("PII", "email_address", re.compile(r"\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,7}\b"), 0.95),
        ("PII", "us_ssn", re.compile(r"\b\d{3}-\d{2}-\d{4}\b"), 0.92),
        ("PII", "credit_card", re.compile(r"\b(?:4[0-9]{12}(?:[0-9]{3})?|5[1-5][0-9]{14}|3[47][0-9]{13}|6(?:011|5[0-9]{2})[0-9]{12})\b"), 0.94),
        ("PII", "phone_number", re.compile(r"\b(?:\+?1[-. ]?)?\(?([0-9]{3})\)?[-. ]?([0-9]{3})[-. ]?([0-9]{4})\b"), 0.85),
    ]

    @staticmethod
    def calculate_entropy(text: str) -> float:
        if not text:
            return 0.0
        entropy = 0.0
        for char in set(text):
            p = text.count(char) / len(text)
            entropy += - p * math.log2(p)
        return entropy

    def scan(self, text: str) -> List[SensitiveDataMatch]:
        if not text:
            return []

        matches: List[SensitiveDataMatch] = []

        # 1. Regex Pattern Matching
        for category, pattern_name, regex, conf in self.PATTERNS:
            for m in regex.finditer(text):
                matched_val = m.group(0)
                matches.append(
                    SensitiveDataMatch(
                        category=category,
                        pattern_name=pattern_name,
                        matched_text=matched_val,
                        start=m.start(),
                        end=m.end(),
                        confidence=conf
                    )
                )

        # 2. High-Entropy Token Analysis for Unknown Secrets
        words = re.findall(r"\b[A-Za-z0-9+/_=-]{20,80}\b", text)
        for word in words:
            # Skip words already matched by explicit regex
            if any(word in m.matched_text for m in matches):
                continue
            entropy = self.calculate_entropy(word)
            if entropy >= 4.4 and len(word) >= 24:
                idx = text.find(word)
                matches.append(
                    SensitiveDataMatch(
                        category="SECRET",
                        pattern_name="high_entropy_secret_candidate",
                        matched_text=word,
                        start=idx,
                        end=idx + len(word),
                        confidence=0.82
                    )
                )

        return matches

    def redact(self, text: str, matches: Optional[List[SensitiveDataMatch]] = None) -> Tuple[str, int]:
        """
        Safely redacts all identified sensitive data in text.
        Returns (redacted_text, count_of_redactions).
        """
        if not text:
            return text, 0

        if matches is None:
            matches = self.scan(text)

        if not matches:
            return text, 0

        # Sort matches in reverse order of start position to replace without offset shifting
        sorted_matches = sorted(matches, key=lambda m: m.start, reverse=True)
        redacted = list(text)

        for m in sorted_matches:
            placeholder = f"[REDACTED_{m.category}_{m.pattern_name.upper()}]"
            redacted[m.start:m.end] = list(placeholder)

        return "".join(redacted), len(matches)

data_leakage_engine = DataLeakageEngine()
