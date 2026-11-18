from typing import Dict, Any, List

class RiskScoreSummary:
    def __init__(
        self,
        score: float,
        level: str,
        contributing_factors: List[Dict[str, Any]],
        confidence: float,
        recommended_action: str
    ):
        self.score = score
        self.level = level
        self.contributing_factors = contributing_factors
        self.confidence = confidence
        self.recommended_action = recommended_action

    def to_dict(self) -> Dict[str, Any]:
        return {
            "score": round(self.score, 1),
            "level": self.level,
            "contributing_factors": self.contributing_factors,
            "confidence": round(self.confidence, 3),
            "recommended_action": self.recommended_action
        }


class RiskScoringEngine:
    """
    Enterprise Multi-Factor Risk Scoring Engine (0-100).
    Weights factors:
    - Base Severity (35%)
    - Detection Confidence (25%)
    - Attack Type Inherent Impact (20%)
    - Asset Criticality (10%)
    - Temporal Frequency / Repetition (10%)
    """

    SEVERITY_BASE = {
        "critical": 95.0,
        "high": 80.0,
        "medium": 50.0,
        "low": 25.0,
        "info": 5.0
    }

    ATTACK_IMPACT = {
        "structural_delimiter_hijacking": 95.0,
        "direct_prompt_injection": 90.0,
        "persona_jailbreak": 88.0,
        "secret_credential_leak": 98.0,
        "unauthorized_tool_execution": 92.0,
        "sql_injection": 95.0,
        "broken_authentication": 85.0,
        "behavioral_anomaly": 65.0,
        "pii_leakage": 70.0,
        "benign": 0.0
    }

    ASSET_CRITICALITY_MULTIPLIER = {
        "production": 1.2,
        "staging": 0.9,
        "development": 0.7
    }

    def compute(
        self,
        severity: str,
        confidence: float,
        attack_type: str,
        environment: str = "production",
        frequency_count: int = 1
    ) -> RiskScoreSummary:
        factors = []

        base_sev = self.SEVERITY_BASE.get(severity.lower(), 50.0)
        factors.append({"factor": "Base Severity", "weight": 0.35, "raw_value": base_sev})

        conf_contrib = confidence * 100.0
        factors.append({"factor": "Confidence", "weight": 0.25, "raw_value": conf_contrib})

        impact_contrib = self.ATTACK_IMPACT.get(attack_type.lower(), 50.0)
        factors.append({"factor": "Attack Type Inherent Impact", "weight": 0.20, "raw_value": impact_contrib})

        asset_mult = self.ASSET_CRITICALITY_MULTIPLIER.get(environment.lower(), 1.0)
        asset_contrib = min(100.0, 70.0 * asset_mult)
        factors.append({"factor": "Asset Criticality", "weight": 0.10, "raw_value": asset_contrib})

        freq_contrib = min(100.0, 30.0 + (frequency_count * 10.0))
        factors.append({"factor": "Frequency Repetition", "weight": 0.10, "raw_value": freq_contrib})

        raw_score = (
            base_sev * 0.35 +
            conf_contrib * 0.25 +
            impact_contrib * 0.20 +
            asset_contrib * 0.10 +
            freq_contrib * 0.10
        )

        final_score = min(100.0, max(0.0, raw_score))

        if final_score >= 85.0:
            level = "CRITICAL"
            recommended_action = "BLOCK_IMMEDIATE_AND_QUARANTINE_SESSION"
        elif final_score >= 65.0:
            level = "HIGH"
            recommended_action = "BLOCK_REQUEST_AND_ALERT_SOC"
        elif final_score >= 40.0:
            level = "MEDIUM"
            recommended_action = "SANITIZE_AND_FLAG_FOR_REVIEW"
        elif final_score >= 20.0:
            level = "LOW"
            recommended_action = "MONITOR_AND_LOG"
        else:
            level = "INFO"
            recommended_action = "ALLOW"

        return RiskScoreSummary(
            score=final_score,
            level=level,
            contributing_factors=factors,
            confidence=confidence,
            recommended_action=recommended_action
        )

risk_scoring_engine = RiskScoringEngine()
