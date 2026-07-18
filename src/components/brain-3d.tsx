import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import type { ConditionKey } from "@/lib/demo-data";

/* ------------------------------------------------------------------ */
/* Volumetric procedural brain built from deformed spheres + cerebellum
   + brain stem + internal particle/connection network + scan plane.  */
/* ------------------------------------------------------------------ */

const STRUCT_COLOR = "#38dcff";
const STRUCT_DEEP = "#0a5f7a";

const CLUSTER_COLOR: Record<ConditionKey, string> = {
  normal: "#6de3a5",
  insomnia: "#f5b544",
  apnea: "#ff8a3a",
  seizure: "#ff5647",
};

const CLUSTER_COUNT: Record<ConditionKey, number> = {
  normal: 2,
  insomnia: 6,
  apnea: 4,
  seizure: 5,
};

// Deterministic PRNG
function makeRng(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 0xffffffff;
  };
}

// Deform a sphere so it feels cerebral (gyri-like undulations)
function makeLobeGeometry(
  radius: number,
  scale: [number, number, number],
  seed: number,
  noise = 0.09,
  detail = 5,
) {
  const geo = new THREE.IcosahedronGeometry(radius, detail);
  const pos = geo.attributes.position as THREE.BufferAttribute;
  const v = new THREE.Vector3();
  for (let i = 0; i < pos.count; i++) {
    v.fromBufferAttribute(pos, i);
    v.x *= scale[0];
    v.y *= scale[1];
    v.z *= scale[2];
    // Multi-frequency noise for gyri feel
    const n =
      Math.sin(v.x * 6.2 + seed) * 0.6 +
      Math.sin(v.y * 5.4 + seed * 1.7) * 0.55 +
      Math.sin(v.z * 6.9 + seed * 0.9) * 0.6 +
      Math.sin((v.x + v.z) * 9.1 + seed * 2.3) * 0.35 +
      Math.sin((v.y - v.x) * 11.3 + seed * 3.1) * 0.25;
    const disp = 1 + (n / 3) * noise;
    pos.setXYZ(i, v.x * disp, v.y * disp, v.z * disp);
  }
  geo.computeVertexNormals();
  return geo;
}

function Lobe({
  geometry,
  position = [0, 0, 0],
  rotation = [0, 0, 0],
  wireOpacity = 0.35,
  bodyOpacity = 0.18,
}: {
  geometry: THREE.BufferGeometry;
  position?: [number, number, number];
  rotation?: [number, number, number];
  wireOpacity?: number;
  bodyOpacity?: number;
}) {
  return (
    <group position={position} rotation={rotation}>
      {/* Volumetric translucent body */}
      <mesh geometry={geometry}>
        <meshPhongMaterial
          color={STRUCT_DEEP}
          transparent
          opacity={bodyOpacity}
          emissive={STRUCT_COLOR}
          emissiveIntensity={0.35}
          shininess={40}
          depthWrite={false}
        />
      </mesh>
      {/* Wireframe overlay for cerebral folds */}
      <mesh geometry={geometry}>
        <meshBasicMaterial
          color={STRUCT_COLOR}
          wireframe
          transparent
          opacity={wireOpacity}
          depthWrite={false}
        />
      </mesh>
    </group>
  );
}

function BrainAssembly({ condition }: { condition: ConditionKey }) {
  // Two cerebral hemispheres (elongated front-back), slightly offset L/R.
  const geoL = useMemo(
    () => makeLobeGeometry(1.0, [1.35, 0.95, 1.15], 17, 0.11, 5),
    [],
  );
  const geoR = useMemo(
    () => makeLobeGeometry(1.0, [1.35, 0.95, 1.15], 43, 0.11, 5),
    [],
  );
  // Frontal & occipital emphasis bumps (integrated on top of hemispheres)
  const geoFrontal = useMemo(
    () => makeLobeGeometry(0.55, [1.1, 0.9, 1.0], 61, 0.08, 4),
    [],
  );
  const geoOccipital = useMemo(
    () => makeLobeGeometry(0.5, [1.05, 0.9, 1.0], 79, 0.08, 4),
    [],
  );
  const geoTemporalL = useMemo(
    () => makeLobeGeometry(0.55, [1.0, 0.7, 1.0], 91, 0.08, 4),
    [],
  );
  const geoTemporalR = useMemo(
    () => makeLobeGeometry(0.55, [1.0, 0.7, 1.0], 103, 0.08, 4),
    [],
  );
  // Cerebellum — smaller, denser, connected under the occipital region
  const geoCerebellum = useMemo(
    () => makeLobeGeometry(0.55, [1.15, 0.75, 1.0], 131, 0.13, 4),
    [],
  );

  return (
    <group>
      {/* Left / right hemispheres */}
      <Lobe geometry={geoL} position={[-0.28, 0, 0]} />
      <Lobe geometry={geoR} position={[0.28, 0, 0]} />
      {/* Frontal lobe emphasis */}
      <Lobe geometry={geoFrontal} position={[0, 0.15, 0.95]} wireOpacity={0.28} bodyOpacity={0.15} />
      {/* Occipital emphasis */}
      <Lobe geometry={geoOccipital} position={[0, 0.05, -0.95]} wireOpacity={0.28} bodyOpacity={0.15} />
      {/* Temporal bumps */}
      <Lobe geometry={geoTemporalL} position={[-1.05, -0.35, 0.05]} wireOpacity={0.28} bodyOpacity={0.15} />
      <Lobe geometry={geoTemporalR} position={[1.05, -0.35, 0.05]} wireOpacity={0.28} bodyOpacity={0.15} />
      {/* Cerebellum — physically overlapping the rear-inferior cerebrum */}
      <Lobe
        geometry={geoCerebellum}
        position={[0, -0.75, -0.75]}
        wireOpacity={0.42}
        bodyOpacity={0.22}
      />
      {/* Brain stem — cylinder flowing downward from cerebellum */}
      <group position={[0, -1.25, -0.55]} rotation={[0.35, 0, 0]}>
        <mesh>
          <cylinderGeometry args={[0.18, 0.22, 0.9, 20, 6, true]} />
          <meshPhongMaterial
            color={STRUCT_DEEP}
            transparent
            opacity={0.28}
            emissive={STRUCT_COLOR}
            emissiveIntensity={0.35}
            side={THREE.DoubleSide}
            depthWrite={false}
          />
        </mesh>
        <mesh>
          <cylinderGeometry args={[0.18, 0.22, 0.9, 20, 6, true]} />
          <meshBasicMaterial
            color={STRUCT_COLOR}
            wireframe
            transparent
            opacity={0.4}
            depthWrite={false}
          />
        </mesh>
      </group>

      <InternalNetwork condition={condition} />
    </group>
  );
}

/* -------- Internal particle network + condition clusters -------- */
function InternalNetwork({ condition }: { condition: ConditionKey }) {
  const { basePoints, edges, clusterPoints, clusterEdges } = useMemo(() => {
    const rng = makeRng(2027);
    // Elliptical volume approx cerebrum
    const inside = (v: THREE.Vector3) =>
      (v.x * v.x) / 1.55 ** 2 + (v.y * v.y) / 1.1 ** 2 + (v.z * v.z) / 1.35 ** 2 < 1;

    const base: THREE.Vector3[] = [];
    while (base.length < 260) {
      const v = new THREE.Vector3(
        (rng() * 2 - 1) * 1.55,
        (rng() * 2 - 1) * 1.1,
        (rng() * 2 - 1) * 1.35,
      );
      if (inside(v)) base.push(v);
    }

    // Deterministic scenario cluster centers
    const centerRng = makeRng(condition === "normal" ? 11 : condition === "insomnia" ? 22 : condition === "apnea" ? 33 : 44);
    const centers: THREE.Vector3[] = [];
    for (let i = 0; i < CLUSTER_COUNT[condition]; i++) {
      let c: THREE.Vector3;
      do {
        c = new THREE.Vector3(
          (centerRng() * 2 - 1) * 1.15,
          (centerRng() * 2 - 1) * 0.75,
          (centerRng() * 2 - 1) * 1.0,
        );
      } while (!inside(c));
      centers.push(c);
    }
    const clusterPts: { pos: THREE.Vector3; center: number }[] = [];
    centers.forEach((c, idx) => {
      const n = 14;
      for (let i = 0; i < n; i++) {
        let v: THREE.Vector3;
        do {
          v = c
            .clone()
            .add(
              new THREE.Vector3(
                (centerRng() * 2 - 1) * 0.35,
                (centerRng() * 2 - 1) * 0.35,
                (centerRng() * 2 - 1) * 0.35,
              ),
            );
        } while (!inside(v));
        clusterPts.push({ pos: v, center: idx });
      }
    });

    // Base edges (nearest-neighbor limit)
    const edg: [number, number][] = [];
    for (let i = 0; i < base.length; i++) {
      for (let j = i + 1; j < base.length; j++) {
        if (base[i].distanceTo(base[j]) < 0.32) edg.push([i, j]);
      }
    }
    // Cluster internal edges (denser inside each cluster)
    const cEdg: [number, number][] = [];
    for (let i = 0; i < clusterPts.length; i++) {
      for (let j = i + 1; j < clusterPts.length; j++) {
        if (
          clusterPts[i].center === clusterPts[j].center &&
          clusterPts[i].pos.distanceTo(clusterPts[j].pos) < 0.32
        )
          cEdg.push([i, j]);
      }
    }
    return { basePoints: base, edges: edg, clusterPoints: clusterPts, clusterEdges: cEdg };
  }, [condition]);

  // Buffers
  const basePosArr = useMemo(() => {
    const a = new Float32Array(basePoints.length * 3);
    basePoints.forEach((p, i) => a.set([p.x, p.y, p.z], i * 3));
    return a;
  }, [basePoints]);

  const edgePosArr = useMemo(() => {
    const a = new Float32Array(edges.length * 6);
    edges.forEach(([i, j], k) => {
      const p1 = basePoints[i];
      const p2 = basePoints[j];
      a.set([p1.x, p1.y, p1.z, p2.x, p2.y, p2.z], k * 6);
    });
    return a;
  }, [edges, basePoints]);

  const clusterPosArr = useMemo(() => {
    const a = new Float32Array(clusterPoints.length * 3);
    clusterPoints.forEach((p, i) => a.set([p.pos.x, p.pos.y, p.pos.z], i * 3));
    return a;
  }, [clusterPoints]);

  const clusterEdgePosArr = useMemo(() => {
    const a = new Float32Array(clusterEdges.length * 6);
    clusterEdges.forEach(([i, j], k) => {
      const p1 = clusterPoints[i].pos;
      const p2 = clusterPoints[j].pos;
      a.set([p1.x, p1.y, p1.z, p2.x, p2.y, p2.z], k * 6);
    });
    return a;
  }, [clusterEdges, clusterPoints]);

  const clusterColor = CLUSTER_COLOR[condition];

  return (
    <group>
      {/* Base neural connections */}
      <lineSegments>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            args={[edgePosArr, 3]}
          />
        </bufferGeometry>
        <lineBasicMaterial
          color={STRUCT_COLOR}
          transparent
          opacity={0.22}
          depthWrite={false}
        />
      </lineSegments>

      {/* Base neural nodes */}
      <points>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            args={[basePosArr, 3]}
          />
        </bufferGeometry>
        <pointsMaterial
          color={STRUCT_COLOR}
          size={0.035}
          sizeAttenuation
          transparent
          opacity={0.9}
          depthWrite={false}
        />
      </points>

      {/* Cluster connections */}
      <lineSegments>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            args={[clusterEdgePosArr, 3]}
          />
        </bufferGeometry>
        <lineBasicMaterial
          color={clusterColor}
          transparent
          opacity={0.7}
          depthWrite={false}
        />
      </lineSegments>

      {/* Cluster nodes (glowing) */}
      <points>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            args={[clusterPosArr, 3]}
          />
        </bufferGeometry>
        <pointsMaterial
          color={clusterColor}
          size={0.075}
          sizeAttenuation
          transparent
          opacity={0.95}
          depthWrite={false}
        />
      </points>

      {/* Traveling signal along a few base edges */}
      <TravelingSignals edges={edges} points={basePoints} color={STRUCT_COLOR} count={6} />
      {/* Traveling signal along cluster edges */}
      {clusterEdges.length > 0 && (
        <TravelingSignals
          edges={clusterEdges}
          points={clusterPoints.map((p) => p.pos)}
          color={clusterColor}
          count={Math.min(6, clusterEdges.length)}
        />
      )}
    </group>
  );
}

function TravelingSignals({
  edges,
  points,
  color,
  count,
}: {
  edges: [number, number][];
  points: THREE.Vector3[];
  color: string;
  count: number;
}) {
  const meshRef = useRef<THREE.Points>(null);
  const selected = useMemo(() => {
    const rng = makeRng(edges.length * 7 + 1);
    const picks: [number, number, number][] = [];
    for (let i = 0; i < count && edges.length > 0; i++) {
      const e = edges[Math.floor(rng() * edges.length)];
      picks.push([e[0], e[1], rng()]);
    }
    return picks;
  }, [edges, count]);

  const positions = useMemo(() => new Float32Array(selected.length * 3), [selected]);

  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    selected.forEach(([a, b, offset], i) => {
      const p1 = points[a];
      const p2 = points[b];
      if (!p1 || !p2) return;
      const phase = ((t * 0.25 + offset) % 1);
      positions[i * 3] = p1.x + (p2.x - p1.x) * phase;
      positions[i * 3 + 1] = p1.y + (p2.y - p1.y) * phase;
      positions[i * 3 + 2] = p1.z + (p2.z - p1.z) * phase;
    });
    if (meshRef.current) {
      const attr = meshRef.current.geometry.attributes.position as THREE.BufferAttribute;
      attr.needsUpdate = true;
    }
  });

  return (
    <points ref={meshRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial
        color={color}
        size={0.16}
        sizeAttenuation
        transparent
        opacity={0.9}
        depthWrite={false}
      />
    </points>
  );
}

/* -------------------- Scan plane sweeping the brain -------------------- */
function ScanPlane() {
  const ref = useRef<THREE.Mesh>(null);
  useFrame((state) => {
    if (!ref.current) return;
    const t = state.clock.getElapsedTime();
    // 7-second cycle top->bottom->top
    const cycle = (t % 7) / 7;
    const y = Math.sin(cycle * Math.PI * 2) * 1.4;
    ref.current.position.y = y;
    const mat = ref.current.material as THREE.MeshBasicMaterial;
    mat.opacity = 0.12 + Math.abs(Math.cos(cycle * Math.PI * 2)) * 0.15;
  });
  return (
    <mesh ref={ref} rotation={[Math.PI / 2, 0, 0]}>
      <planeGeometry args={[3.6, 3.6]} />
      <meshBasicMaterial
        color={STRUCT_COLOR}
        transparent
        opacity={0.18}
        depthWrite={false}
        side={THREE.DoubleSide}
      />
    </mesh>
  );
}

/* -------------------- Root group: parallax + idle -------------------- */
function BrainRoot({ condition }: { condition: ConditionKey }) {
  const group = useRef<THREE.Group>(null);
  const { pointer } = useThree();
  const target = useRef({ x: 0, y: 0 });

  useFrame((state, delta) => {
    // Restrict parallax to a subtle range
    target.current.x = pointer.y * 0.15;
    target.current.y = pointer.x * 0.28 + Math.sin(state.clock.elapsedTime * 0.15) * 0.03;
    if (group.current) {
      // Smoothly interpolate rotation
      group.current.rotation.x += (target.current.x - group.current.rotation.x) * Math.min(1, delta * 3);
      group.current.rotation.y += (target.current.y - group.current.rotation.y) * Math.min(1, delta * 3);
      // Subtle idle float
      group.current.position.y = Math.sin(state.clock.elapsedTime * 0.6) * 0.04;
    }
  });

  return (
    <group ref={group} rotation={[0, -0.35, 0]}>
      <BrainAssembly condition={condition} />
      <ScanPlane />
    </group>
  );
}

/* -------------------- Public Canvas -------------------- */
export default function Brain3D({ condition }: { condition: ConditionKey }) {
  return (
    <Canvas
      dpr={[1, 1.75]}
      camera={{ position: [0.6, 0.25, 3.6], fov: 40 }}
      gl={{ antialias: true, alpha: true }}
      style={{ background: "transparent" }}
    >
      {/* Rim + fill lighting */}
      <ambientLight intensity={0.45} color={"#79e6ff"} />
      <directionalLight position={[3, 4, 3]} intensity={0.9} color={"#a8f1ff"} />
      <directionalLight position={[-3, -1, -2]} intensity={0.5} color={"#2864ff"} />
      <pointLight position={[0, 0, 2.5]} intensity={0.6} color={CLUSTER_COLOR[condition]} distance={5} />

      <BrainRoot condition={condition} />
    </Canvas>
  );
}
