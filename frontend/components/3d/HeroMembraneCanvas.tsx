"use client";

import React, { useRef, useMemo, useState, useEffect } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Float } from "@react-three/drei";
import * as THREE from "three";

// --- Hostile & Clean Particle Simulation ---
function PacketStreams() {
  const hostileCount = 45;
  const cleanCount = 35;

  // Initialize Hostile particles (red shards that hit the shield at x=0 and deflect)
  const hostileParticles = useMemo(() => {
    return Array.from({ length: hostileCount }, () => ({
      x: -12 - Math.random() * 8,
      y: (Math.random() - 0.5) * 5,
      z: (Math.random() - 0.5) * 4,
      speed: 0.12 + Math.random() * 0.08,
      state: "incoming" as "incoming" | "shattered",
      deflectX: 0,
      deflectY: 0,
      deflectZ: 0,
      life: 1,
    }));
  }, [hostileCount]);

  // Initialize Clean particles (acid-lime pulses that pass smoothly through)
  const cleanParticles = useMemo(() => {
    return Array.from({ length: cleanCount }, () => ({
      x: -14 - Math.random() * 8,
      y: (Math.random() - 0.5) * 4,
      z: (Math.random() - 0.5) * 3,
      speed: 0.09 + Math.random() * 0.06,
    }));
  }, [cleanCount]);

  const hostileMeshRef = useRef<THREE.InstancedMesh>(null);
  const cleanMeshRef = useRef<THREE.InstancedMesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);

  useFrame(() => {
    // 1. Update Hostile Particles
    if (hostileMeshRef.current) {
      hostileParticles.forEach((p, i) => {
        if (p.state === "incoming") {
          p.x += p.speed;
          // Collides with the shield around x = -1.8
          if (p.x >= -1.8 && Math.hypot(p.y, p.z) < 2.5) {
            p.state = "shattered";
            p.deflectX = -(0.05 + Math.random() * 0.1);
            p.deflectY = (Math.random() - 0.5) * 0.15;
            p.deflectZ = (Math.random() - 0.5) * 0.15;
            p.life = 1;
          }
        } else {
          // Shattered deflection
          p.x += p.deflectX;
          p.y += p.deflectY;
          p.z += p.deflectZ;
          p.life -= 0.04;
          if (p.life <= 0) {
            // Reset particle
            p.x = -12 - Math.random() * 6;
            p.y = (Math.random() - 0.5) * 5;
            p.z = (Math.random() - 0.5) * 4;
            p.state = "incoming";
            p.life = 1;
          }
        }

        dummy.position.set(p.x, p.y, p.z);
        const scale = p.state === "shattered" ? Math.max(0.01, p.life * 0.08) : 0.09;
        dummy.scale.set(scale, scale, scale * 1.8);
        dummy.rotation.x += 0.04;
        dummy.rotation.y += 0.04;
        dummy.updateMatrix();
        hostileMeshRef.current!.setMatrixAt(i, dummy.matrix);
      });
      hostileMeshRef.current.instanceMatrix.needsUpdate = true;
    }

    // 2. Update Clean Particles
    if (cleanMeshRef.current) {
      cleanParticles.forEach((p, i) => {
        p.x += p.speed;
        // Reset when passing well past the shield to the right
        if (p.x > 12) {
          p.x = -14 - Math.random() * 4;
          p.y = (Math.random() - 0.5) * 4;
          p.z = (Math.random() - 0.5) * 3;
        }

        dummy.position.set(p.x, p.y, p.z);
        dummy.scale.set(0.08, 0.08, 0.18);
        dummy.rotation.set(0, 0, 0);
        dummy.updateMatrix();
        cleanMeshRef.current!.setMatrixAt(i, dummy.matrix);
      });
      cleanMeshRef.current.instanceMatrix.needsUpdate = true;
    }
  });

  return (
    <>
      {/* Hostile Red Shards */}
      <instancedMesh ref={hostileMeshRef} args={[undefined, undefined, hostileCount]}>
        <octahedronGeometry args={[1, 0]} />
        <meshBasicMaterial color="#FF443A" />
      </instancedMesh>

      {/* Clean Acid Lime Stream */}
      <instancedMesh ref={cleanMeshRef} args={[undefined, undefined, cleanCount]}>
        <boxGeometry args={[1, 1, 1]} />
        <meshBasicMaterial color="#C6F432" />
      </instancedMesh>
    </>
  );
}

// --- The Translucent Faceted Membrane Core ---
function ShieldMembrane({ mouse }: { mouse: React.MutableRefObject<{ x: number; y: number }> }) {
  const groupRef = useRef<THREE.Group>(null);
  const coreRef = useRef<THREE.Mesh>(null);
  const wireframeRef = useRef<THREE.LineSegments>(null);

  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    if (groupRef.current) {
      // Smooth subtle mouse parallax
      groupRef.current.rotation.y = THREE.MathUtils.lerp(
        groupRef.current.rotation.y,
        mouse.current.x * 0.35 + Math.sin(t * 0.4) * 0.1,
        0.05
      );
      groupRef.current.rotation.x = THREE.MathUtils.lerp(
        groupRef.current.rotation.x,
        -mouse.current.y * 0.25 + Math.cos(t * 0.3) * 0.08,
        0.05
      );
    }

    // Inner pulsating core
    if (coreRef.current) {
      const pulse = 1 + Math.sin(t * 2) * 0.08;
      coreRef.current.scale.set(pulse, pulse, pulse);
    }
  });

  const icosahedronGeo = useMemo(() => new THREE.IcosahedronGeometry(2.3, 1), []);
  const wireframeGeo = useMemo(() => new THREE.WireframeGeometry(icosahedronGeo), [icosahedronGeo]);

  return (
    <group ref={groupRef} position={[0, 0, 0]}>
      {/* Translucent Faceted Glass Shield */}
      <mesh geometry={icosahedronGeo}>
        <meshPhysicalMaterial
          color="#0F1116"
          roughness={0.12}
          metalness={0.1}
          transmission={0.88}
          thickness={1.5}
          ior={1.45}
          reflectivity={0.6}
          transparent={true}
          opacity={0.85}
        />
      </mesh>

      {/* Thin Wireframe Structural Edges */}
      <lineSegments ref={wireframeRef} geometry={wireframeGeo}>
        <lineBasicMaterial color="#C6F432" transparent={true} opacity={0.35} />
      </lineSegments>

      {/* Floating Inner Pulsating Core */}
      <mesh ref={coreRef}>
        <sphereGeometry args={[0.9, 32, 32]} />
        <meshStandardMaterial
          color="#C6F432"
          emissive="#C6F432"
          emissiveIntensity={0.6}
          roughness={0.3}
          wireframe={true}
        />
      </mesh>

      {/* Soft Ambient Core Halo */}
      <pointLight color="#C6F432" intensity={2.5} distance={7} decay={2} />
    </group>
  );
}

// --- Main Exported Canvas with Graceful Fallback ---
export default function HeroMembraneCanvas() {
  const [hasWebGL, setHasWebGL] = useState(true);
  const mouse = useRef({ x: 0, y: 0 });

  useEffect(() => {
    try {
      const canvas = document.createElement("canvas");
      const gl = canvas.getContext("webgl") || canvas.getContext("experimental-webgl");
      if (!gl) setHasWebGL(false);
    } catch {
      setHasWebGL(false);
    }

    const handlePointerMove = (e: PointerEvent) => {
      mouse.current.x = (e.clientX / window.innerWidth) * 2 - 1;
      mouse.current.y = (e.clientY / window.innerHeight) * 2 - 1;
    };

    window.addEventListener("pointermove", handlePointerMove, { passive: true });
    return () => window.removeEventListener("pointermove", handlePointerMove);
  }, []);

  if (!hasWebGL) {
    // 2D Elegant Fallback for low-power or non-WebGL devices
    return (
      <div className="relative w-full h-full flex items-center justify-center">
        <div className="w-64 h-64 rounded-full border border-[#C6F432]/30 bg-[#121316]/80 backdrop-blur-xl flex items-center justify-center shadow-[0_0_80px_rgba(198,244,50,0.12)]">
          <div className="w-32 h-32 rounded-full border border-[#C6F432]/60 animate-ping opacity-30" />
          <div className="w-20 h-20 rounded-full bg-[#C6F432]/20 border border-[#C6F432] flex items-center justify-center">
            <div className="w-6 h-6 rounded-full bg-[#C6F432]" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-[520px] lg:h-[620px] select-none pointer-events-none">
      <Canvas
        camera={{ position: [0, 0, 8.5], fov: 42 }}
        dpr={[1, 1.5]}
        gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
        className="w-full h-full"
      >
        <ambientLight intensity={0.4} />
        <directionalLight position={[-8, 6, 5]} intensity={1.2} color="#FFFFFF" />
        <directionalLight position={[6, -4, -3]} intensity={0.8} color="#C6F432" />

        <Float speed={1.2} rotationIntensity={0.2} floatIntensity={0.3}>
          <ShieldMembrane mouse={mouse} />
        </Float>

        <PacketStreams />
      </Canvas>
    </div>
  );
}
