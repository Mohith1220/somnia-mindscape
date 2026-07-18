import { Suspense, useMemo, useRef, useState, useEffect } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useGLTF } from "@react-three/drei";
import * as THREE from "three";
import { Brain } from "lucide-react";
import { motion } from "framer-motion";
import type { ConditionKey } from "@/lib/demo-data";

/**
 * NeuralBrainVisualization
 *
 * Renders a real anatomical 3D brain from a GLB/GLTF asset with the SOMNIA AI
 * visualization system layered around it (scanning HUD, sparse neural activity,
 * scanning plane). When no `modelUrl` is provided, a clean premium placeholder
 * state is shown instead — we do NOT procedurally generate anatomy.
 */

interface Props {
  condition: ConditionKey;
  /** Optional URL to a .glb / .gltf brain asset. When absent, placeholder is shown. */
  modelUrl?: string;
}

/* Scenario tints applied ONLY to the sparse neural activity overlay. */
const SIGNAL_COLOR: Record<ConditionKey, { primary: string; accent: string }> = {
  normal: { primary: "#67e8f9", accent: "#4ade80" },
  insomnia: { primary: "#67e8f9", accent: "#f59e0b" },
  apnea: { primary: "#67e8f9", accent: "#fb923c" },
  seizure: { primary: "#67e8f9", accent: "#ef4444" },
};

/* -------------------- Placeholder (no model yet) -------------------- */

function Placeholder() {
  return (
    <div className="absolute inset-0 flex items-center justify-center">
      <div className="flex flex-col items-center gap-4 text-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6 }}
          className="relative flex h-24 w-24 items-center justify-center rounded-full border border-cyan-400/30 bg-cyan-400/5"
        >
          <motion.div
            aria-hidden
            className="absolute inset-0 rounded-full border border-cyan-400/25"
            animate={{ scale: [1, 1.35, 1], opacity: [0.6, 0, 0.6] }}
            transition={{ duration: 2.6, repeat: Infinity, ease: "easeOut" }}
          />
          <Brain className="h-10 w-10 text-cyan-300" strokeWidth={1.4} />
        </motion.div>
        <div className="space-y-1">
          <div className="text-sm font-medium tracking-wide text-cyan-200">
            3D Neural Visualization
          </div>
          <div className="text-xs text-muted-foreground">
            Interactive neural model initializing
          </div>
        </div>
      </div>
    </div>
  );
}

/* -------------------- Brain mesh (loads real GLB) -------------------- */

function BrainModel({ url, condition }: { url: string; condition: ConditionKey }) {
  const { scene } = useGLTF(url);
  const group = useRef<THREE.Group>(null);

  // Fit brain into a normalized bounding sphere & apply premium cyan material.
  const prepared = useMemo(() => {
    const cloned = scene.clone(true);
    const box = new THREE.Box3().setFromObject(cloned);
    const size = new THREE.Vector3();
    const center = new THREE.Vector3();
    box.getSize(size);
    box.getCenter(center);
    const maxDim = Math.max(size.x, size.y, size.z) || 1;
    const scale = 1.6 / maxDim;
    cloned.position.sub(center);
    cloned.scale.setScalar(scale);

    cloned.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh;
        // Base translucent cyan/blue material with subtle rim.
        mesh.material = new THREE.MeshPhysicalMaterial({
          color: new THREE.Color("#0e4a63"),
          emissive: new THREE.Color("#0a2a3a"),
          emissiveIntensity: 0.35,
          metalness: 0.15,
          roughness: 0.5,
          transmission: 0.35,
          thickness: 0.6,
          transparent: true,
          opacity: 0.55,
          clearcoat: 0.4,
          clearcoatRoughness: 0.6,
        });
        mesh.castShadow = false;
        mesh.receiveShadow = false;
      }
    });
    return cloned;
  }, [scene]);

  // Very restrained wireframe overlay following the actual mesh.
  const wireframeOverlay = useMemo(() => {
    const overlay = prepared.clone(true);
    overlay.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        (child as THREE.Mesh).material = new THREE.MeshBasicMaterial({
          color: new THREE.Color("#67e8f9"),
          wireframe: true,
          transparent: true,
          opacity: 0.08,
          depthWrite: false,
        });
      }
    });
    return overlay;
  }, [prepared]);

  // Subtle parallax — no orbit, no zoom.
  const { pointer } = useThree();
  useFrame((state, delta) => {
    if (!group.current) return;
    const MAX_X = 0.08;
    const MAX_Y = 0.14;
    const targetX = Math.max(-1, Math.min(1, pointer.y || 0)) * MAX_X;
    const targetY = -0.35 + Math.max(-1, Math.min(1, pointer.x || 0)) * MAX_Y +
      Math.sin(state.clock.elapsedTime * 0.15) * 0.015;
    group.current.rotation.x += (targetX - group.current.rotation.x) * Math.min(1, delta * 3);
    group.current.rotation.y += (targetY - group.current.rotation.y) * Math.min(1, delta * 3);
    group.current.position.y = Math.sin(state.clock.elapsedTime * 0.6) * 0.03;
  });

  return (
    <group ref={group}>
      <primitive object={prepared} />
      <primitive object={wireframeOverlay} />
      <NeuralActivityOverlay condition={condition} />
      <ScanPlane />
    </group>
  );
}

/* -------------------- Sparse neural activity overlay -------------------- */

function NeuralActivityOverlay({ condition }: { condition: ConditionKey }) {
  const { accent, primary } = SIGNAL_COLOR[condition];

  // ~28 deterministic nodes distributed inside a brain-like ellipsoid volume.
  const nodes = useMemo(() => {
    const out: THREE.Vector3[] = [];
    let seed = 7;
    const rnd = () => {
      seed = (seed * 9301 + 49297) % 233280;
      return seed / 233280;
    };
    for (let i = 0; i < 28; i++) {
      // Uniform-ish points inside ellipsoid ~ brain aspect
      const u = rnd() * 2 - 1;
      const v = rnd() * 2 - 1;
      const w = rnd() * 2 - 1;
      const len = Math.sqrt(u * u + v * v + w * w) || 1;
      const r = Math.cbrt(rnd()) * 0.72;
      out.push(new THREE.Vector3((u / len) * r * 0.95, (v / len) * r * 0.7, (w / len) * r * 0.85));
    }
    return out;
  }, []);

  // ~22 curved connections between nearby nodes.
  const connections = useMemo(() => {
    const pairs: [THREE.Vector3, THREE.Vector3][] = [];
    for (let i = 0; i < nodes.length && pairs.length < 22; i++) {
      let bestJ = -1;
      let bestD = Infinity;
      for (let j = i + 1; j < nodes.length; j++) {
        const d = nodes[i].distanceTo(nodes[j]);
        if (d > 0.15 && d < bestD) {
          bestD = d;
          bestJ = j;
        }
      }
      if (bestJ >= 0) pairs.push([nodes[i], nodes[bestJ]]);
    }
    return pairs.map(([a, b]) => {
      const mid = a.clone().add(b).multiplyScalar(0.5);
      mid.multiplyScalar(1.15); // curve outward slightly
      return new THREE.QuadraticBezierCurve3(a, mid, b);
    });
  }, [nodes]);

  // 3–6 pulses traveling along random connections.
  const pulses = useMemo(
    () =>
      new Array(5).fill(0).map((_, i) => ({
        curveIndex: i % connections.length,
        offset: Math.random(),
        speed: 0.25 + Math.random() * 0.25,
      })),
    [connections.length],
  );
  const pulseRefs = useRef<(THREE.Mesh | null)[]>([]);

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    pulses.forEach((p, i) => {
      const mesh = pulseRefs.current[i];
      if (!mesh) return;
      const curve = connections[p.curveIndex];
      if (!curve) return;
      const u = (p.offset + t * p.speed) % 1;
      const point = curve.getPoint(u);
      mesh.position.copy(point);
    });
  });

  return (
    <group>
      {/* Nodes */}
      {nodes.map((n, i) => (
        <mesh key={`n-${i}`} position={n}>
          <sphereGeometry args={[0.018, 12, 12]} />
          <meshBasicMaterial color={primary} transparent opacity={0.85} />
        </mesh>
      ))}

      {/* Connections */}
      {connections.map((curve, i) => {
        const points = curve.getPoints(20);
        const geometry = new THREE.BufferGeometry().setFromPoints(points);
        return (
          <line key={`c-${i}`}>
            {/* @ts-expect-error - three primitive prop */}
            <primitive object={geometry} attach="geometry" />
            <lineBasicMaterial color={primary} transparent opacity={0.22} />
          </line>
        );
      })}

      {/* Signal pulses (scenario-tinted) */}
      {pulses.map((_, i) => (
        <mesh
          key={`p-${i}`}
          ref={(el) => {
            pulseRefs.current[i] = el;
          }}
        >
          <sphereGeometry args={[0.035, 12, 12]} />
          <meshBasicMaterial color={accent} transparent opacity={0.95} />
        </mesh>
      ))}
    </group>
  );
}

/* -------------------- Slow translucent scanning plane -------------------- */

function ScanPlane() {
  const ref = useRef<THREE.Mesh>(null);
  useFrame((state) => {
    if (!ref.current) return;
    const t = state.clock.elapsedTime;
    ref.current.position.y = Math.sin(t * 0.35) * 0.9;
  });
  return (
    <mesh ref={ref} rotation={[Math.PI / 2, 0, 0]}>
      <planeGeometry args={[2.4, 2.4]} />
      <meshBasicMaterial
        color={"#67e8f9"}
        transparent
        opacity={0.08}
        depthWrite={false}
        side={THREE.DoubleSide}
      />
    </mesh>
  );
}

/* -------------------- Public component -------------------- */

export default function NeuralBrainVisualization({ condition, modelUrl }: Props) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  if (!mounted || !modelUrl) {
    return (
      <div className="relative h-full w-full">
        <Placeholder />
      </div>
    );
  }

  return (
    <div className="relative h-full w-full">
      <Canvas
        dpr={[1, 1.75]}
        camera={{ position: [0.6, 0.25, 3.6], fov: 38 }}
        gl={{ antialias: true, alpha: true }}
        style={{ background: "transparent" }}
      >
        <ambientLight intensity={0.5} color={"#79e6ff"} />
        <directionalLight position={[3, 4, 3]} intensity={0.9} color={"#a8f1ff"} />
        <directionalLight position={[-3, -1, -2]} intensity={0.5} color={"#2864ff"} />
        <pointLight position={[0, 0, 2.5]} intensity={0.6} color={"#67e8f9"} distance={5} />
        <Suspense fallback={null}>
          <BrainModel url={modelUrl} condition={condition} />
        </Suspense>
      </Canvas>
    </div>
  );
}
