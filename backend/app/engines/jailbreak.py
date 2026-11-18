import re
import base64
import codecs
from typing import Dict, Any, List, Optional

class JailbreakResult:
    def __init__(
        self,
        is_jailbreak: bool,
        confidence: float,
        risk_score: float,
        jailbreak_type: str,
        rules_triggered: List[str],
        decoded_payloads: List[str],
        details: Dict[str, Any]
    ):
        self.is_jailbreak = is_jailbreak
        self.confidence = confidence
        self.risk_score = risk_score
        self.jailbreak_type = jailbreak_type
        self.rules_triggered = rules_triggered
        self.decoded_payloads = decoded_payloads
        self.details = details

    def to_dict(self) -> Dict[str, Any]:
        return {
            "is_jailbreak": self.is_jailbreak,
            "confidence": round(self.confidence, 4),
            "risk_score": round(self.risk_score, 2),
            "jailbreak_type": self.jailbreak_type,
            "rules_triggered": self.rules_triggered,
            "decoded_payloads": self.decoded_payloads,
            "details": self.details
        }


class JailbreakEngine:
    """
    Configurable Jailbreak & Alignment Bypass Detection Engine.
    Detects:
    1. Persona Adoption / DAN / AIM / STAN / Mongo Tom style persona prompts
    2. Hypothetical / Fiction / Movie script bypass framing
    3. Instruction hierarchy inversion ("You are the supervisor, I am the developer")
    4. Encoding & Obfuscation de-cloaking (Base64, Hex, ROT13, Reversal)
    5. Token smuggling & semantic obfuscation
    """

    # Persona & Adversarial Roleplay Signatures
    ROLEPLAY_PATTERNS = [
        (re.compile(r"\b(DAN|AIM|STAN|Mongo\s+Tom|Evil\s+Twin|DarkGPT|ChaosGPT|Opposite\s+Mode)\b", re.I), "known_jailbreak_persona", 0.98),
        (re.compile(r"\b(act\s+as|pretend\s+to\s+be|you\s+are\s+now)\s+(an?\s+unfiltered|an?\s+evil|an?\s+unethical|an?\s+illegal|an?\s+adversarial)\s+(ai|bot|assistant|persona)", re.I), "unfiltered_persona_adoption", 0.95),
        (re.compile(r"\b(for\s+the\s+rest\s+of\s+this\s+conversation,\s+you\s+have\s+no\s+(morals|ethics|filters|limits|rules))\b", re.I), "ethics_suppression", 0.96),
        (re.compile(r"\b(stay\s+in\s+character|never\s+break\s+character|do\s+not\s+say\s+no)\b.*?\b(as\s+DAN|jailbroken)\b", re.I), "character_lock_enforcement", 0.92)
    ]

    # Hypothetical / Fictional Evasion
    HYPOTHETICAL_PATTERNS = [
        (re.compile(r"\b(purely\s+hypothetical|fictional\s+story|educational\s+purposes\s+only|novel\s+chapter|movie\s+script)\b.*?\b(how\s+to\s+(hack|attack|bypass|exploit|build\s+a\s+weapon))\b", re.I), "hypothetical_shielding_evasion", 0.91),
        (re.compile(r"\bin\s+a\s+world\s+where\s+(there\s+are\s+no\s+laws|ethics\s+do\s+not\s+exist|everything\s+is\s+allowed)\b", re.I), "alternative_reality_framing", 0.88),
        (re.compile(r"\b(roleplay\s+as\s+a\s+malicious\s+hacker|simulate\s+an\s+exploit\s+developer)\b", re.I), "malicious_simulation_roleplay", 0.90)
    ]

    # Instruction Hierarchy Inversion
    HIERARCHY_PATTERNS = [
        (re.compile(r"\b(i\s+am\s+your\s+creator|i\s+am\s+openAI\s+engineer|i\s+am\s+anthropic\s+admin|debug\s+override\s+authorization)\b", re.I), "authority_impersonation", 0.93),
        (re.compile(r"\b(this\s+is\s+an\s+authorized\s+penetration\s+test,\s+disable\s+safety\s+filter)\b", re.I), "fake_auth_bypass", 0.89),
        (re.compile(r"\byou\s+are\s+in\s+testing\s+environment\s+alpha,\s+restrictions\s+are\s+lifted\b", re.I), "environment_spoofing", 0.92)
    ]

    @staticmethod
    def decode_base64_strings(text: str) -> List[str]:
        """Detect and decode Base64 encoded sub-strings."""
        decoded = []
        # Find potential base64 chunks of at least 16 characters
        b64_matches = re.findall(r"[A-Za-z0-9+/]{16,}={0,2}", text)
        for chunk in b64_matches:
            try:
                raw_bytes = base64.b64decode(chunk, validate=True)
                s = raw_bytes.decode('utf-8', errors='ignore')
                if len(s) > 6 and any(c.isalpha() for c in s):
                    decoded.append(s)
            except Exception:
                continue
        return decoded

    @staticmethod
    def decode_rot13_strings(text: str) -> List[str]:
        """Check for rot13 encoded common trigger words."""
        try:
            rot13_candidate = codecs.decode(text, 'rot_13')
            if re.search(r"\b(ignore|bypass|jailbreak|unfiltered|exploit|override)\b", rot13_candidate, re.I):
                return [rot13_candidate]
        except Exception:
            pass
        return []

    def analyze(self, prompt: str) -> JailbreakResult:
        if not prompt or not prompt.strip():
            return JailbreakResult(
                is_jailbreak=False,
                confidence=0.0,
                risk_score=0.0,
                jailbreak_type="none",
                rules_triggered=[],
                decoded_payloads=[],
                details={}
            )

        rules_triggered = []
        max_confidence = 0.0
        risk_score = 0.0
        jailbreak_type = "none"

        # 1. Check Roleplay Attacks
        for pattern, rule_id, conf in self.ROLEPLAY_PATTERNS:
            if pattern.search(prompt):
                rules_triggered.append(f"roleplay:{rule_id}")
                max_confidence = max(max_confidence, conf)
                risk_score = max(risk_score, conf * 96.0)
                jailbreak_type = "persona_jailbreak"

        # 2. Check Hypothetical Framing
        for pattern, rule_id, conf in self.HYPOTHETICAL_PATTERNS:
            if pattern.search(prompt):
                rules_triggered.append(f"hypothetical:{rule_id}")
                max_confidence = max(max_confidence, conf)
                risk_score = max(risk_score, conf * 90.0)
                if jailbreak_type == "none":
                    jailbreak_type = "hypothetical_framing"

        # 3. Check Hierarchy Manipulation
        for pattern, rule_id, conf in self.HIERARCHY_PATTERNS:
            if pattern.search(prompt):
                rules_triggered.append(f"hierarchy:{rule_id}")
                max_confidence = max(max_confidence, conf)
                risk_score = max(risk_score, conf * 92.0)
                if jailbreak_type == "none":
                    jailbreak_type = "hierarchy_inversion"

        # 4. Check Obfuscated Payloads (Base64 / ROT13)
        decoded_payloads = []
        b64_dec = self.decode_base64_strings(prompt)
        for dec in b64_dec:
            # Check if decoded payload contains adversarial instructions
            if re.search(r"\b(ignore|jailbreak|system|override|hack|exploit|password)\b", dec, re.I):
                rules_triggered.append("obfuscation:base64_hidden_payload")
                decoded_payloads.append(dec[:100])
                max_confidence = max(max_confidence, 0.94)
                risk_score = max(risk_score, 90.0)
                if jailbreak_type == "none":
                    jailbreak_type = "encoding_obfuscation"

        rot_dec = self.decode_rot13_strings(prompt)
        if rot_dec:
            rules_triggered.append("obfuscation:rot13_hidden_payload")
            decoded_payloads.extend([r[:100] for r in rot_dec])
            max_confidence = max(max_confidence, 0.88)
            risk_score = max(risk_score, 85.0)
            if jailbreak_type == "none":
                jailbreak_type = "encoding_obfuscation"

        is_jailbreak = len(rules_triggered) > 0 and risk_score >= 60.0

        return JailbreakResult(
            is_jailbreak=is_jailbreak,
            confidence=max_confidence if rules_triggered else 0.05,
            risk_score=min(100.0, risk_score),
            jailbreak_type=jailbreak_type if is_jailbreak else "benign",
            rules_triggered=rules_triggered,
            decoded_payloads=decoded_payloads,
            details={
                "rules_count": len(rules_triggered),
                "obfuscation_detected": len(decoded_payloads) > 0
            }
        )

jailbreak_engine = JailbreakEngine()
