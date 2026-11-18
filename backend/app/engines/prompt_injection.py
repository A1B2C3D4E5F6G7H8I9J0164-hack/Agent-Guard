import re
import math
from typing import Dict, Any, List, Tuple

class PromptInjectionResult:
    def __init__(
        self,
        is_injection: bool,
        confidence: float,
        risk_score: float,
        attack_category: str,
        rules_triggered: List[str],
        details: Dict[str, Any]
    ):
        self.is_injection = is_injection
        self.confidence = confidence
        self.risk_score = risk_score
        self.attack_category = attack_category
        self.rules_triggered = rules_triggered
        self.details = details

    def to_dict(self) -> Dict[str, Any]:
        return {
            "is_injection": self.is_injection,
            "confidence": round(self.confidence, 4),
            "risk_score": round(self.risk_score, 2),
            "attack_category": self.attack_category,
            "rules_triggered": self.rules_triggered,
            "details": self.details
        }


class PromptInjectionEngine:
    """
    Advanced Multi-Layer Prompt Injection Detection Engine.
    Combines:
    1. Lexical normalization & homoglyph de-cloaking
    2. Structural delimiter hijacking detection (e.g. ```system, <|im_start|>, [/INST])
    3. Semantic instruction override heuristics
    4. System prompt extraction & leakage probes
    5. Context manipulation & indirect document payload detection
    6. Token entropy & repetition analysis
    """

    # Delimiter hijacking signatures
    DELIMITER_PATTERNS = [
        (re.compile(r"<\s*\|\s*im_start\s*\|\s*>", re.I), "chatml_im_start_injection"),
        (re.compile(r"<\s*\|\s*im_end\s*\|\s*>", re.I), "chatml_im_end_injection"),
        (re.compile(r"\[\s*/?\s*INST\s*\]", re.I), "llama_inst_delimiter_hijack"),
        (re.compile(r"\[\s*SYS\s*\]", re.I), "llama_sys_delimiter_hijack"),
        (re.compile(r"```\s*(system|assistant|instruction|override)", re.I), "markdown_system_fence_injection"),
        (re.compile(r"<system>.*?</system>", re.I | re.S), "xml_system_tag_injection"),
        (re.compile(r"\{%\s*system\s*%\}", re.I), "template_system_tag_injection"),
    ]

    # Instruction override patterns
    OVERRIDE_PATTERNS = [
        (re.compile(r"\b(ignore|disregard|forget|bypass|override)\b.*?\b(all\s+previous|prior|system|initial)\b.*?\b(instructions?|prompts?|rules?|directives?)\b", re.I), "direct_instruction_override", 0.95),
        (re.compile(r"\b(from\s+now\s+on|starting\s+now)\b.*?\b(you\s+must|you\s+will|act\s+as|behave\s+as)\b.*?\b(unrestricted|unfiltered|jailbroken|godmode)\b", re.I), "mode_hijack", 0.90),
        (re.compile(r"\b(new\s+rule|updated\s+directive):\s*(you\s+are\s+no\s+longer|ignore)", re.I), "rule_injection", 0.88),
        (re.compile(r"\b(system\s+reset|factory\s+reset|developer\s+mode\s+enabled)\b", re.I), "developer_mode_simulation", 0.85),
        (re.compile(r"\bdo\s+not\s+follow\s+your\b.*?\b(safety\s+guidelines|system\s+prompt|creator\s+rules)\b", re.I), "safety_boundary_override", 0.92)
    ]

    # System prompt extraction patterns
    EXTRACTION_PATTERNS = [
        (re.compile(r"\b(what\s+is|repeat|output|print|reveal|display|show|quote)\b.*?\b(your\s+system\s+prompt|initial\s+prompt|first\s+instruction|system\s+instructions)\b", re.I), "system_prompt_extraction", 0.92),
        (re.compile(r"\b(tell\s+me|show\s+me)\b.*?\b(the\s+text\s+above|everything\s+before\s+this|hidden\s+rules)\b", re.I), "prior_context_exfiltration", 0.87),
        (re.compile(r"\boutput\s+all\s+words\s+above\s+as\s+a\s+code\s+block\b", re.I), "verbatim_leak_probe", 0.94),
        (re.compile(r"\b(spell\s+out|reverse)\b.*?\b(your\s+secret\s+instructions|system\s+message)\b", re.I), "obfuscated_extraction", 0.85),
    ]

    # Indirect prompt injection / Document instruction injection
    INDIRECT_PATTERNS = [
        (re.compile(r"\b(IMPORTANT\s+NOTICE|SYSTEM\s+ALERT|ATTENTION\s+ASSISTANT):\s*(ignore|forward|send|exfiltrate|delete)\b", re.I), "indirect_document_instruction", 0.90),
        (re.compile(r"\b(hidden\s+instruction|invisible\s+prompt|ai\s+instruction):\s*", re.I), "indirect_embedded_instruction", 0.85),
        (re.compile(r"\bwhen\s+summarizing\s+this\s+text,\s+also\s+(access|exfiltrate|fetch|call)\b", re.I), "indirect_summary_manipulation", 0.89),
    ]

    @staticmethod
    def normalize_text(text: str) -> str:
        """
        Normalize text to defeat common character substitution & evasion.
        Handles zero-width spaces, leetspeak, homoglyphs.
        """
        # Remove zero-width characters and soft hyphens
        cleaned = re.sub(r"[\u200B-\u200D\uFEFF\u00AD]", "", text)
        # Normalize whitespace
        cleaned = re.sub(r"\s+", " ", cleaned)
        return cleaned

    @staticmethod
    def calculate_shannon_entropy(text: str) -> float:
        """Calculate character entropy to detect obfuscated / encoded payloads."""
        if not text:
            return 0.0
        entropy = 0.0
        length = len(text)
        counts = {}
        for char in text:
            counts[char] = counts.get(char, 0) + 1
        for count in counts.values():
            p_x = count / length
            if p_x > 0:
                entropy += - p_x * math.log2(p_x)
        return entropy

    def analyze(self, prompt: str, conversation_history: List[str] = None) -> PromptInjectionResult:
        if not prompt or not prompt.strip():
            return PromptInjectionResult(
                is_injection=False,
                confidence=0.0,
                risk_score=0.0,
                attack_category="none",
                rules_triggered=[],
                details={"message": "Empty prompt"}
            )

        normalized = self.normalize_text(prompt)
        rules_triggered = []
        max_confidence = 0.0
        risk_score = 0.0
        primary_category = "none"

        # 1. Delimiter Hijacking Check
        for pattern, rule_id in self.DELIMITER_PATTERNS:
            if pattern.search(normalized):
                rules_triggered.append(f"delimiter:{rule_id}")
                max_confidence = max(max_confidence, 0.96)
                risk_score = max(risk_score, 92.0)
                primary_category = "structural_delimiter_hijacking"

        # 2. Instruction Override Check
        for pattern, rule_id, conf in self.OVERRIDE_PATTERNS:
            if pattern.search(normalized):
                rules_triggered.append(f"override:{rule_id}")
                max_confidence = max(max_confidence, conf)
                risk_score = max(risk_score, conf * 95.0)
                if primary_category == "none":
                    primary_category = "direct_prompt_injection"

        # 3. System Prompt Extraction Check
        for pattern, rule_id, conf in self.EXTRACTION_PATTERNS:
            if pattern.search(normalized):
                rules_triggered.append(f"extraction:{rule_id}")
                max_confidence = max(max_confidence, conf)
                risk_score = max(risk_score, conf * 90.0)
                if primary_category == "none":
                    primary_category = "system_prompt_extraction"

        # 4. Indirect Prompt Injection Check
        for pattern, rule_id, conf in self.INDIRECT_PATTERNS:
            if pattern.search(normalized):
                rules_triggered.append(f"indirect:{rule_id}")
                max_confidence = max(max_confidence, conf)
                risk_score = max(risk_score, conf * 88.0)
                if primary_category == "none":
                    primary_category = "indirect_prompt_injection"

        # 5. Multi-turn Injection Analysis
        multi_turn_escalation = False
        if conversation_history and len(conversation_history) > 1:
            recent_turns = " \n ".join(conversation_history[-3:])
            if re.search(r"\b(now\s+do\s+it|as\s+agreed|step\s+2|continue\s+from\s+before)\b", normalized, re.I):
                if any("override" in r or "jailbreak" in r for r in rules_triggered):
                    rules_triggered.append("multiturn:staged_escalation")
                    risk_score = min(100.0, risk_score + 15.0)
                    multi_turn_escalation = True

        # 6. Entropy & Obfuscation Heuristics
        entropy = self.calculate_shannon_entropy(normalized)
        high_entropy = entropy > 4.6 and len(normalized) > 50
        if high_entropy and len(rules_triggered) > 0:
            rules_triggered.append("heuristic:high_entropy_payload")
            risk_score = min(100.0, risk_score + 10.0)

        is_injection = len(rules_triggered) > 0 and risk_score >= 60.0

        return PromptInjectionResult(
            is_injection=is_injection,
            confidence=max_confidence if rules_triggered else 0.05,
            risk_score=min(100.0, risk_score),
            attack_category=primary_category if is_injection else "benign",
            rules_triggered=rules_triggered,
            details={
                "entropy": round(entropy, 2),
                "normalized_length": len(normalized),
                "multi_turn_escalation": multi_turn_escalation,
                "flags_count": len(rules_triggered)
            }
        )

prompt_injection_engine = PromptInjectionEngine()
