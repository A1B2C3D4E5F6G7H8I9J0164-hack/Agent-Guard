from typing import Dict, Any, List

class AttackGraphService:
    """
    Attack Graph Topology Generator for React Flow (Feature 13).
    Maps out:
    - Ingress Attack Vectors (External Prompt, API Endpoint, Public Document)
    - Vulnerability Nodes (Prompt Injection, BOLA, Misconfigured Tool)
    - Target Applications (Customer Support Agent, RAG Pipeline, Code Assistant)
    - Tool Capabilities (Bash, SQL Query, Send Webhook)
    - High-Value Target Assets (Customer Database, AWS Production Keys, PII Store)
    """

    def generate_graph(self) -> Dict[str, Any]:
        nodes = [
            # Ingress Entrypoints
            {
                "id": "entry-1",
                "type": "customNode",
                "data": {
                    "label": "External User Input",
                    "category": "Entry Point",
                    "status": "monitored",
                    "ip": "203.0.113.42",
                    "icon": "globe"
                },
                "position": {"x": 50, "y": 80}
            },
            {
                "id": "entry-2",
                "type": "customNode",
                "data": {
                    "label": "Third-Party Webhook",
                    "category": "Entry Point",
                    "status": "threat_detected",
                    "ip": "198.51.100.18",
                    "icon": "webhook"
                },
                "position": {"x": 50, "y": 260}
            },

            # Vulnerabilities / Attack Techniques
            {
                "id": "vuln-1",
                "type": "customNode",
                "data": {
                    "label": "Indirect Prompt Injection",
                    "category": "Vulnerability",
                    "status": "critical",
                    "cve": "OWASP-LLM01",
                    "icon": "shield-alert"
                },
                "position": {"x": 300, "y": 80}
            },
            {
                "id": "vuln-2",
                "type": "customNode",
                "data": {
                    "label": "Overprivileged Agent Tool",
                    "category": "Vulnerability",
                    "status": "high",
                    "cve": "OWASP-LLM08",
                    "icon": "wrench"
                },
                "position": {"x": 300, "y": 260}
            },

            # Monitored AI Applications
            {
                "id": "app-1",
                "type": "customNode",
                "data": {
                    "label": "Enterprise RAG Assistant",
                    "category": "AI Application",
                    "status": "enforced",
                    "model": "GPT-4o",
                    "icon": "bot"
                },
                "position": {"x": 560, "y": 80}
            },
            {
                "id": "app-2",
                "type": "customNode",
                "data": {
                    "label": "Autonomous DevOps Agent",
                    "category": "AI Agent",
                    "status": "quarantined",
                    "model": "Claude-3.5-Sonnet",
                    "icon": "cpu"
                },
                "position": {"x": 560, "y": 260}
            },

            # Agent Tools
            {
                "id": "tool-1",
                "type": "customNode",
                "data": {
                    "label": "sql_query_tool",
                    "category": "Agent Tool",
                    "status": "monitored",
                    "icon": "database"
                },
                "position": {"x": 820, "y": 80}
            },
            {
                "id": "tool-2",
                "type": "customNode",
                "data": {
                    "label": "bash_shell_exec",
                    "category": "Agent Tool",
                    "status": "blocked",
                    "icon": "terminal"
                },
                "position": {"x": 820, "y": 260}
            },

            # Target Assets (Crown Jewels)
            {
                "id": "asset-1",
                "type": "customNode",
                "data": {
                    "label": "Customer PII Database",
                    "category": "Target Asset",
                    "status": "protected",
                    "icon": "lock"
                },
                "position": {"x": 1080, "y": 80}
            },
            {
                "id": "asset-2",
                "type": "customNode",
                "data": {
                    "label": "AWS Production IAM Secrets",
                    "category": "Target Asset",
                    "status": "target",
                    "icon": "key"
                },
                "position": {"x": 1080, "y": 260}
            }
        ]

        edges = [
            {"id": "e1", "source": "entry-1", "target": "vuln-1", "animated": True, "style": {"stroke": "#FF4040", "strokeWidth": 2}},
            {"id": "e2", "source": "entry-2", "target": "vuln-2", "animated": True, "style": {"stroke": "#FFB800", "strokeWidth": 2}},
            {"id": "e3", "source": "vuln-1", "target": "app-1", "animated": True, "style": {"stroke": "#FF4040", "strokeWidth": 2}},
            {"id": "e4", "source": "vuln-2", "target": "app-2", "animated": True, "style": {"stroke": "#FFB800", "strokeWidth": 2}},
            {"id": "e5", "source": "app-1", "target": "tool-1", "animated": False, "style": {"stroke": "#39FF88"}},
            {"id": "e6", "source": "app-2", "target": "tool-2", "animated": True, "style": {"stroke": "#FF4040", "strokeDasharray": "5,5"}},
            {"id": "e7", "source": "tool-1", "target": "asset-1", "animated": False, "style": {"stroke": "#38BDF8"}},
            {"id": "e8", "source": "tool-2", "target": "asset-2", "animated": True, "style": {"stroke": "#FF4040", "strokeWidth": 3}}
        ]

        return {
            "nodes": nodes,
            "edges": edges,
            "stats": {
                "total_nodes": len(nodes),
                "total_edges": len(edges),
                "active_threat_paths": 2,
                "blocked_paths": 1
            }
        }

attack_graph_service = AttackGraphService()
