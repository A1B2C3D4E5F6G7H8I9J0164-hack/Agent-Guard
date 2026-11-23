"use client";

import React, { useEffect, useState, useMemo } from "react";
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  Handle,
  Position,
  NodeProps,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import {
  Globe,
  Webhook,
  ShieldAlert,
  Wrench,
  Bot,
  Cpu,
  Database,
  Terminal as TerminalIcon,
  Lock,
  Key,
  AlertTriangle,
  CheckCircle2,
} from "lucide-react";
import { api } from "@/lib/api";
import { PageHeader } from "@/components/ui/PageHeader";

const ICON_MAP: Record<string, any> = {
  globe: Globe,
  webhook: Webhook,
  "shield-alert": ShieldAlert,
  wrench: Wrench,
  bot: Bot,
  cpu: Cpu,
  database: Database,
  terminal: TerminalIcon,
  lock: Lock,
  key: Key,
};

function CustomThreatNode({ data }: NodeProps) {
  const IconComponent = (data.icon && ICON_MAP[data.icon as string]) || ShieldAlert;
  const statusColor =
    data.status === "critical"
      ? "border-red-500 text-red-400 bg-red-500/10"
      : data.status === "high" || data.status === "threat_detected"
      ? "border-amber-500 text-amber-400 bg-amber-500/10"
      : data.status === "quarantined"
      ? "border-purple-500 text-purple-400 bg-purple-500/10"
      : "border-emerald-500 text-emerald-400 bg-emerald-500/10";

  return (
    <div
      className={`px-4 py-3 rounded-xl bg-[#0F1622] border ${statusColor} shadow-xl min-w-[200px] transition-all hover:scale-105 font-sans`}
    >
      <Handle type="target" position={Position.Left} className="!bg-sky-400 !w-2.5 !h-2.5" />
      <div className="flex items-center gap-3">
        <div className={`p-2 rounded-lg ${statusColor}`}>
          <IconComponent className="w-4 h-4" />
        </div>
        <div>
          <div className="text-xs font-semibold text-white">{data.label as string}</div>
          <div className="text-[10px] text-slate-400 font-mono capitalize">
            {data.type as string} • {data.status as string}
          </div>
        </div>
      </div>
      <Handle type="source" position={Position.Right} className="!bg-emerald-400 !w-2.5 !h-2.5" />
    </div>
  );
}

export default function AttackGraphView() {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [loading, setLoading] = useState(true);

  const nodeTypes = useMemo(() => ({ threatNode: CustomThreatNode }), []);

  useEffect(() => {
    async function loadGraph() {
      try {
        const data = await api.getAttackGraph();
        if (data.nodes && data.edges) {
          const formattedNodes = data.nodes.map((n: any) => ({
            id: n.id,
            type: "threatNode",
            position: n.position || { x: 100, y: 100 },
            data: {
              label: n.label,
              type: n.type,
              status: n.status,
              icon: n.icon,
            },
          }));

          const formattedEdges = data.edges.map((e: any) => ({
            id: e.id,
            source: e.source,
            target: e.target,
            animated: e.animated || e.is_threat_path,
            style: {
              stroke: e.is_threat_path ? "#EF4444" : "#10B981",
              strokeWidth: e.is_threat_path ? 2.5 : 1.5,
            },
            label: e.label,
            labelStyle: { fill: "#94A3B8", fontSize: 10, fontFamily: "monospace" },
          }));

          setNodes(formattedNodes);
          setEdges(formattedEdges);
        }
      } catch (err) {
        console.error("Failed to load attack graph", err);
      } finally {
        setLoading(false);
      }
    }
    loadGraph();
  }, [setNodes, setEdges]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 font-sans">
      {/* 1. Page Header */}
      <PageHeader
        title="Agent Threat Vector Topology & Path Simulation"
        description="Interactive graph tracing ingress vectors, exploited prompt vulnerabilities, agent runtimes, and downstream critical assets."
        statusLine="Dynamic Graph Engine Active · Path Simulation Mode"
        badge={{ text: "ATTACK TOPOLOGY", variant: "sky" }}
        actions={
          <div className="flex items-center gap-4 text-xs font-sans">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500 shadow-sm shadow-red-500/50" />
              <span className="text-slate-300">Active Threat Path</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
              <span className="text-slate-300">Protected Endpoint</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-purple-500" />
              <span className="text-slate-300">Quarantined Agent</span>
            </div>
          </div>
        }
      />

      {/* 2. React Flow Canvas */}
      <div className="w-full h-[640px] bg-[#080B10] rounded-xl border border-[#1E293B] overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-full text-slate-400 font-mono text-xs">
            Loading attack graph topology...
          </div>
        ) : (
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            nodeTypes={nodeTypes}
            fitView
            className="bg-[#080B10]"
          >
            <Background color="#1E293B" gap={24} size={1.2} />
            <Controls className="!bg-[#0F1622] !border-[#1E293B] !text-slate-300" />
            <MiniMap
              nodeStrokeColor="#10B981"
              nodeColor="#0F1622"
              maskColor="rgba(8, 11, 16, 0.85)"
              className="!bg-[#0F1622] !border-[#1E293B] !rounded-lg"
            />
          </ReactFlow>
        )}
      </div>
    </div>
  );
}
