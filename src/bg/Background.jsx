import { createRoot } from "react-dom/client";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";

// Shared input state, read every frame. The canvas itself has pointer-events: none
// so the HTML layer above stays fully clickable.
const input = { x: 0, y: 0, scroll: 0, active: false };
window.addEventListener("pointermove", e => {
  input.x = (e.clientX / window.innerWidth) * 2 - 1;
  input.y = -((e.clientY / window.innerHeight) * 2 - 1);
  input.active = true;
}, { passive: true });
window.addEventListener("pointerleave", () => { input.active = false; });
window.addEventListener("scroll", () => { input.scroll = window.scrollY; }, { passive: true });

const PALETTE = { mist: "#e4e7ee", haze: "#e9ebf1", slate: "#a9b0bf", slate2: "#c4c9d6", coral: "#e0675a" };

// position, radius, color, how strongly it reacts to the cursor
const BLOBS = [
  { p: [4.2, 2.6, -3.5], r: 2.6, c: PALETTE.mist,   k: 0.25 },
  { p: [-4.8, -3.0, -4],  r: 3.0, c: PALETTE.haze,   k: 0.2 },
  { p: [-5.4, 2.9, -0.5], r: 0.5, c: PALETTE.slate2, k: 1 },
  { p: [3.0, -1.4, 0.4],  r: 0.3, c: PALETTE.coral, k: 1.2 },
  { p: [0.9, 3.0, -1.2],  r: 0.24, c: PALETTE.slate2, k: 1 },
  { p: [-1.2, -2.8, 0],   r: 0.26, c: PALETTE.slate2,  k: 1 },
  { p: [4.8, -3.4, -1.5], r: 0.8, c: PALETTE.slate2, k: 0.6 },
  { p: [-5.2, 0.6, -2],   r: 0.45, c: PALETTE.slate2, k: 0.8 },
];

function Blob({ p, r, c, k, i }) {
  const ref = useRef();
  const off = useRef(new THREE.Vector3());
  const { viewport } = useThree();
  const phase = useMemo(() => i * 1.7, [i]);

  useFrame((state, dt) => {
    const t = state.clock.elapsedTime;
    const m = ref.current;
    // cursor in world units at this blob's depth (approx.)
    const vp = viewport.getCurrentViewport(state.camera, new THREE.Vector3(0, 0, p[2]));
    const cx = (input.x * vp.width) / 2, cy = (input.y * vp.height) / 2;
    const dx = p[0] - cx, dy = p[1] - cy;
    const d = Math.hypot(dx, dy);
    const reach = r + 1.8;
    // push away from the cursor when it gets close, ease back otherwise
    const push = input.active && d < reach ? ((reach - d) / reach) * 0.9 * k : 0;
    const tx = d > 0.001 ? (dx / d) * push : 0, ty = d > 0.001 ? (dy / d) * push : 0;
    const ease = 1 - Math.pow(0.02, dt);
    off.current.x += (tx - off.current.x) * ease;
    off.current.y += (ty - off.current.y) * ease;
    m.position.set(
      p[0] + off.current.x + Math.sin(t * 0.35 + phase) * 0.12,
      p[1] + off.current.y + Math.cos(t * 0.3 + phase) * 0.18,
      p[2]
    );
    const s = 1 + push * 0.12;
    m.scale.setScalar(m.scale.x + (s - m.scale.x) * ease);
  });

  return (
    <mesh ref={ref} position={p}>
      <sphereGeometry args={[r, 64, 64]} />
      <meshStandardMaterial color={c} roughness={0.85} metalness={0} />
    </mesh>
  );
}

function Dust({ count = 140 }) {
  const ref = useRef();
  const positions = useMemo(() => {
    const a = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      a[i * 3] = (Math.random() - 0.5) * 16;
      a[i * 3 + 1] = (Math.random() - 0.5) * 12;
      a[i * 3 + 2] = (Math.random() - 0.5) * 6 - 1;
    }
    return a;
  }, [count]);
  useFrame((_, dt) => { ref.current.rotation.z += dt * 0.012; ref.current.rotation.y += dt * 0.008; });
  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial color={PALETTE.slate} size={0.045} sizeAttenuation transparent opacity={0.55} depthWrite={false} />
    </points>
  );
}

function Rig({ children }) {
  const group = useRef();
  useFrame((state, dt) => {
    const ease = 1 - Math.pow(0.05, dt);
    const cam = state.camera;
    cam.position.x += (input.x * 0.6 - cam.position.x) * ease;
    cam.position.y += (input.y * 0.4 - cam.position.y) * ease;
    cam.lookAt(0, 0, 0);
    // scrolling drifts the scene up a little and turns it slightly
    const s = input.scroll / Math.max(1, window.innerHeight);
    group.current.position.y += (s * 1.4 - group.current.position.y) * ease;
    group.current.rotation.z += (s * 0.08 - group.current.rotation.z) * ease;
  });
  return <group ref={group}>{children}</group>;
}

function Scene() {
  return (
    <>
      <ambientLight intensity={2.1} />
      <directionalLight position={[5, 6, 6]} intensity={0.9} />
      <directionalLight position={[-6, -3, 2]} intensity={0.35} color="#dfe3ff" />
      <Rig>
        {BLOBS.map((b, i) => <Blob key={i} i={i} {...b} />)}
        <Dust />
      </Rig>
    </>
  );
}

export function mount(el) {
  createRoot(el).render(
    <Canvas
      flat
      dpr={[1, 1.75]}
      camera={{ position: [0, 0, 10], fov: 40 }}
      gl={{ antialias: true, alpha: true, powerPreference: "low-power" }}
      style={{ position: "absolute", inset: 0, pointerEvents: "none" }}
    >
      <Scene />
    </Canvas>
  );
}
