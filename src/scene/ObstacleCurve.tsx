import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import type { Tile, SideId, SideState } from '../types';

interface ObstacleCurveProps {
  tile: Tile;
  sideId: SideId;
  sideState: SideState;
  distance: number;
}

const STATE_COLORS: Record<SideState, string> = {
  CLEAR: '#10b981',
  CAUTION: '#f59e0b',
  RISK: '#ef4444',
  UNKNOWN: '#64748b',
};

// Hexagonal face outward normal angles
const HEX_FACE_ANGLES: Record<SideId, number> = {
  0: (Math.PI / 6),
  1: (Math.PI / 6) + (Math.PI / 3),
  2: (Math.PI / 6) + 2 * (Math.PI / 3),
  3: (Math.PI / 6) + 3 * (Math.PI / 3),
  4: (Math.PI / 6) + 4 * (Math.PI / 3),
  5: (Math.PI / 6) + 5 * (Math.PI / 3),
};

export function ObstacleCurve({ tile, sideId, sideState, distance }: ObstacleCurveProps) {
  const lineRef = useRef<THREE.Line>(null);
  const sphereRef = useRef<THREE.Mesh>(null);
  const color = STATE_COLORS[sideState];

  const { points, obstaclePos } = useMemo(() => {
    const origin = new THREE.Vector3(tile.position.x, tile.position.y + 0.1, tile.position.z);

    // Calculate outward direction on X-Z plane taking tile orientation into account
    const baseAngle = HEX_FACE_ANGLES[sideId] ?? 0;
    const totalAngle = baseAngle + tile.orientation.rotationY;
    const dir = new THREE.Vector3(Math.cos(totalAngle), 0, Math.sin(totalAngle)).normalize();

    const clampedDist = Math.min(Math.max(distance, 0.35), 4.5);

    // Subtle curve arc for high-tech aesthetic
    const perp = new THREE.Vector3(-dir.z, 0, dir.x).multiplyScalar(0.25);
    const mid = origin.clone().add(dir.clone().multiplyScalar(clampedDist * 0.5)).add(perp).add(new THREE.Vector3(0, 0.15, 0));
    const end = origin.clone().add(dir.clone().multiplyScalar(clampedDist));

    const curve = new THREE.QuadraticBezierCurve3(origin, mid, end);
    const pts = curve.getPoints(24);

    return { points: pts, obstaclePos: end };
  }, [tile.position, tile.orientation.rotationY, sideId, distance]);

  const lineGeometry = useMemo(() => {
    return new THREE.BufferGeometry().setFromPoints(points);
  }, [points]);

  const lineMaterial = useMemo(() => {
    return new THREE.LineBasicMaterial({
      color,
      transparent: true,
      opacity: 0.5,
      linewidth: 2,
    });
  }, [color]);

  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    if (lineRef.current) {
      const mat = lineRef.current.material as THREE.LineBasicMaterial;
      if (sideState === 'RISK') {
        mat.opacity = 0.55 + Math.sin(t * 8) * 0.3;
      } else if (sideState === 'CAUTION') {
        mat.opacity = 0.45 + Math.sin(t * 3) * 0.15;
      }
    }
    if (sphereRef.current) {
      sphereRef.current.scale.setScalar(1 + Math.sin(t * 4) * 0.12);
    }
  });

  if (sideState === 'CLEAR' || sideState === 'UNKNOWN') return null;

  return (
    <group>
      <primitive object={new THREE.Line(lineGeometry, lineMaterial)} ref={lineRef} />

      {/* Obstacle detection marker */}
      <mesh
        ref={sphereRef}
        position={[obstaclePos.x, obstaclePos.y, obstaclePos.z]}
      >
        <sphereGeometry args={[0.07, 12, 8]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={1.8}
        />
      </mesh>

      {/* Radar pulse ring at obstacle position */}
      <mesh position={[obstaclePos.x, obstaclePos.y, obstaclePos.z]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.1, 0.14, 20]} />
        <meshBasicMaterial
          color={color}
          transparent
          opacity={0.6}
          side={THREE.DoubleSide}
        />
      </mesh>
    </group>
  );
}
