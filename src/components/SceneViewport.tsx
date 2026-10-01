import { useRef } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera } from '@react-three/drei';
import { RotateCcw, Target, ShieldAlert, Anchor } from 'lucide-react';
import { KastorScene } from '../scene/KastorScene';

interface SceneViewportProps {
  className?: string;
}

export function SceneViewport({ className }: SceneViewportProps) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const controlsRef = useRef<any>(null);

  const setView = (posX: number, posY: number, posZ: number, targetX: number, targetY: number, targetZ: number) => {
    if (controlsRef.current) {
      controlsRef.current.target.set(targetX, targetY, targetZ);
      controlsRef.current.object.position.set(posX, posY, posZ);
      controlsRef.current.update();
    }
  };

  const viewFullChain = () => setView(9.5, 11.0, 6.0, 0, 0, 1.2);
  const viewDebrisZone = () => setView(4.2, 5.0, 9.5, 0, 0, 5.8);
  const viewBaseAnchor = () => setView(4.0, 4.5, -1.5, 0, 0, -3.8);

  return (
    <div className={`scene-viewport ${className ?? ''}`}>
      <Canvas
        shadows
        gl={{ antialias: true, alpha: false }}
        style={{ background: 'transparent' }}
        dpr={[1, 2]}
      >
        <PerspectiveCamera makeDefault position={[9.5, 11.0, 6.0]} fov={42} near={0.1} far={120} />
        <OrbitControls
          ref={controlsRef}
          enablePan={true}
          enableZoom={true}
          enableRotate={true}
          minDistance={1.8}
          maxDistance={30}
          maxPolarAngle={Math.PI * 0.85}
          dampingFactor={0.08}
          enableDamping={true}
          target={[0, 0, 1.2]}
          zoomSpeed={0.9}
          rotateSpeed={0.7}
          panSpeed={0.8}
        />
        <KastorScene />
      </Canvas>

      {/* Camera preset controls overlay */}
      <div className="camera-controls">
        <button className="cam-btn" onClick={viewFullChain} title="Full Chain & Debris View">
          <RotateCcw size={13} />
          <span>CHAIN OVERVIEW</span>
        </button>
        <button className="cam-btn" onClick={viewDebrisZone} title="Focus on Debris Zone">
          <ShieldAlert size={13} color="#fb7185" />
          <span>DEBRIS ZONE</span>
        </button>
        <button className="cam-btn" onClick={viewBaseAnchor} title="Focus on Base Anchor">
          <Anchor size={13} color="#38bdf8" />
          <span>BASE ANCHOR</span>
        </button>
      </div>

      {/* Target status badge overlay */}
      <div className="scene-overlay-badge">
        <Target size={12} className="pulse-icon text-cyan-400" />
        <span>TOPOLOGY: SEQUENTIAL HEX CHAIN · DEBRIS INTERCEPT VECTOR</span>
      </div>

      {/* Scene hint */}
      <div className="scene-hint">
        <span>Click hex tile to inspect · Click facet (S1-S6) for sensor data · Drag to orbit · Scroll to zoom</span>
      </div>
    </div>
  );
}
