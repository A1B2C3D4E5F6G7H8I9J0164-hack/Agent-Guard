"use client";

import React, { useRef, useMemo, useState, useEffect } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import * as THREE from "three";

interface AttackNode {
  id: string;
  name: string;
  lat: number;
  lng: number;
  threatCount: number;
  type: "origin" | "target";
  ip: string;
}

const NODES: AttackNode[] = [
  { id: "1", name: "Frankfurt (DE)", lat: 50.11, lng: 8.68, threatCount: 28, type: "origin", ip: "194.26.29.112" },
  { id: "2", name: "Ashburn (US-VA)", lat: 39.04, lng: -77.48, threatCount: 64, type: "origin", ip: "45.148.10.88" },
  { id: "3", name: "Tokyo (JP)", lat: 35.67, lng: 139.65, threatCount: 19, type: "origin", ip: "103.152.220.4" },
  { id: "4", name: "Singapore (SG)", lat: 1.35, lng: 103.82, threatCount: 31, type: "origin", ip: "185.220.101.5" },
  { id: "5", name: "Silicon Valley (HQ)", lat: 37.38, lng: -122.08, threatCount: 0, type: "target", ip: "10.0.4.1" },
];

function latLngToVector3(lat: number, lng: number, radius: number): THREE.Vector3 {
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lng + 180) * (Math.PI / 180);
  const x = -(radius * Math.sin(phi) * Math.cos(theta));
  const z = radius * Math.sin(phi) * Math.sin(theta);
  const y = radius * Math.cos(phi);
  return new THREE.Vector3(x, y, z);
}

function GlobeScene({ onSelectNode }: { onSelectNode?: (node: AttackNode) => void }) {
  const globeRadius = 2.4;
  const targetNode = NODES.find((n) => n.type === "target")!;
  const targetVec = useMemo(
    () => latLngToVector3(targetNode.lat, targetNode.lng, globeRadius),
    [targetNode, globeRadius]
  );

  const groupRef = useRef<THREE.Group>(null);

  useFrame(() => {
    if (groupRef.current) {
      groupRef.current.rotation.y += 0.002;
    }
  });

  // Create Arcs from each origin to target
  const arcCurves = useMemo(() => {
    return NODES.filter((n) => n.type === "origin").map((node) => {
      const start = latLngToVector3(node.lat, node.lng, globeRadius);
      const mid = start.clone().add(targetVec).multiplyScalar(0.5);
      const dist = start.distanceTo(targetVec);
      mid.normalize().multiplyScalar(globeRadius + dist * 0.35);

      const curve = new THREE.QuadraticBezierCurve3(start, mid, targetVec);
      const points = curve.getPoints(40);
      const geometry = new THREE.BufferGeometry().setFromPoints(points);
      return { node, geometry };
    });
  }, [targetVec, globeRadius]);

  return (
    <group ref={groupRef}>
      {/* Dark Globe Sphere */}
      <mesh>
        <sphereGeometry args={[globeRadius, 48, 48]} />
        <meshStandardMaterial
          color="#0B0D11"
          roughness={0.7}
          metalness={0.2}
          wireframe={true}
        />
      </mesh>

      {/* Soft inner core glow */}
      <mesh>
        <sphereGeometry args={[globeRadius * 0.98, 32, 32]} />
        <meshBasicMaterial color="#12141A" />
      </mesh>

      {/* Nodes */}
      {NODES.map((node) => {
        const pos = latLngToVector3(node.lat, node.lng, globeRadius * 1.02);
        const isTarget = node.type === "target";

        return (
          <group key={node.id} position={pos}>
            <mesh onClick={() => onSelectNode?.(node)}>
              <sphereGeometry args={[isTarget ? 0.09 : 0.06, 16, 16]} />
              <meshBasicMaterial color={isTarget ? "#C6F432" : "#FF443A"} />
            </mesh>
          </group>
        );
      })}

      {/* Arcs */}
      {arcCurves.map(({ node, geometry }) => {
        const lineMat = new THREE.LineBasicMaterial({ color: "#FF443A", transparent: true, opacity: 0.65 });
        const lineMesh = new THREE.Line(geometry, lineMat);
        return <primitive key={node.id} object={lineMesh} />;
      })}
    </group>
  );
}

export default function AttackGlobeCanvas({ onSelectNode }: { onSelectNode?: (node: AttackNode) => void }) {
  const [hasWebGL, setHasWebGL] = useState(true);

  useEffect(() => {
    try {
      const c = document.createElement("canvas");
      const gl = c.getContext("webgl") || c.getContext("experimental-webgl");
      if (!gl) setHasWebGL(false);
    } catch {
      setHasWebGL(false);
    }
  }, []);

  if (!hasWebGL) {
    return (
      <div className="w-full h-full min-h-[300px] flex items-center justify-center bg-[#0E1014] rounded-xl text-xs text-[#8A8D93]">
        Interactive 3D Globe active (WebGL Fallback Mode)
      </div>
    );
  }

  return (
    <div className="relative w-full h-[320px] rounded-xl overflow-hidden bg-[#0A0B0D] border border-[#1F2128]">
      <div className="absolute top-3 left-3 z-10 flex items-center gap-2 pointer-events-none">
        <span className="w-2 h-2 rounded-full bg-[#FF443A] animate-pulse" />
        <span className="text-xs font-mono text-[#EDEBE6]">GLOBAL THREAT TELEMETRY</span>
      </div>

      <Canvas
        camera={{ position: [0, 1.2, 5.2], fov: 45 }}
        dpr={[1, 1.5]}
        gl={{ antialias: true, alpha: true }}
      >
        <ambientLight intensity={0.6} />
        <directionalLight position={[5, 5, 5]} intensity={1} color="#C6F432" />
        <GlobeScene onSelectNode={onSelectNode} />
        <OrbitControls enableZoom={false} enablePan={false} autoRotate={false} />
      </Canvas>

      <div className="absolute bottom-2.5 right-3 z-10 text-[11px] font-mono text-[#8A8D93] pointer-events-none">
        Drag to rotate · Click node to filter
      </div>
    </div>
  );
}
