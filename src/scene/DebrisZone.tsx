import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Text } from '@react-three/drei';
import * as THREE from 'three';
import type { Tile } from '../types';

interface DebrisZoneProps {
  leadTile?: Tile;
}

export function DebrisZone({ leadTile }: DebrisZoneProps) {
  const debrisGroupRef = useRef<THREE.Group>(null);
  const ringRef = useRef<THREE.Mesh>(null);
  const hazardMeshRef = useRef<THREE.Mesh>(null);

  // Debris center coordinates in world space
  const centerPos = useMemo(() => new THREE.Vector3(0, 0, 6.8), []);

  // Compute distance from lead tile to debris zone
  const rangeToDebris = useMemo(() => {
    if (!leadTile) return 2.6;
    const tilePos = new THREE.Vector3(leadTile.position.x, leadTile.position.y, leadTile.position.z);
    return tilePos.distanceTo(centerPos);
  }, [leadTile, centerPos]);

  // Floating debris pieces
  const debrisPieces = useMemo(() => {
    return [
      { pos: [0.3, 0.4, 6.4] as [number, number, number], rotSpeed: [0.005, 0.008, 0.003], scale: 0.45, type: 'solar' },
      { pos: [-0.6, -0.2, 6.9] as [number, number, number], rotSpeed: [-0.004, 0.006, 0.005], scale: 0.55, type: 'hull' },
      { pos: [0.8, -0.3, 7.2] as [number, number, number], rotSpeed: [0.008, -0.004, 0.007], scale: 0.35, type: 'rock' },
      { pos: [-0.2, 0.6, 7.5] as [number, number, number], rotSpeed: [0.003, 0.005, -0.006], scale: 0.4, type: 'antenna' },
      { pos: [0.5, 0.1, 7.8] as [number, number, number], rotSpeed: [-0.006, 0.003, 0.004], scale: 0.3, type: 'fragment' },
    ];
  }, []);

  useFrame((state) => {
    const t = state.clock.getElapsedTime();

    if (debrisGroupRef.current) {
      debrisGroupRef.current.children.forEach((child, idx) => {
        const piece = debrisPieces[idx];
        if (piece) {
          child.rotation.x += piece.rotSpeed[0];
          child.rotation.y += piece.rotSpeed[1];
          child.rotation.z += piece.rotSpeed[2];
          child.position.y = piece.pos[1] + Math.sin(t * 1.5 + idx) * 0.08;
        }
      });
    }

    if (ringRef.current) {
      ringRef.current.rotation.z = t * 0.15;
    }

    if (hazardMeshRef.current) {
      const mat = hazardMeshRef.current.material as THREE.MeshBasicMaterial;
      if (mat) {
        mat.opacity = 0.25 + Math.sin(t * 2.5) * 0.12;
      }
    }
  });

  return (
    <group position={[centerPos.x, centerPos.y, centerPos.z]}>
      {/* Hazard Perimeter Cylinder / Hologram */}
      <mesh ref={hazardMeshRef} position={[0, 0, 0]}>
        <cylinderGeometry args={[2.2, 2.2, 1.2, 32, 1, true]} />
        <meshBasicMaterial
          color="#f43f5e"
          transparent
          opacity={0.25}
          wireframe
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Pulsing Hazard Boundary Ring on Ground */}
      <mesh ref={ringRef} rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.5, 0]}>
        <ringGeometry args={[2.0, 2.25, 48]} />
        <meshBasicMaterial
          color="#fb7185"
          transparent
          opacity={0.4}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Outer Warning Grid */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.48, 0]}>
        <ringGeometry args={[2.3, 2.35, 48]} />
        <meshBasicMaterial
          color="#f59e0b"
          transparent
          opacity={0.6}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* 3D Space Hologram Labels */}
      <Text
        position={[0, 1.3, 0]}
        rotation={[0, 0, 0]}
        fontSize={0.24}
        color="#fb7185"
        anchorX="center"
        anchorY="middle"
        outlineWidth={0.015}
        outlineColor="#4c0519"
      >
        ⚠ ORBITAL DEBRIS FIELD [ALPHA-7]
      </Text>

      <Text
        position={[0, 0.95, 0]}
        fontSize={0.15}
        color="#fbbf24"
        anchorX="center"
        anchorY="middle"
      >
        {`PROXIMITY: ${rangeToDebris.toFixed(2)}m · HIGH IMPACT RISK`}
      </Text>

      {/* Floating 3D Debris Items */}
      <group ref={debrisGroupRef}>
        {debrisPieces.map((p, i) => {
          return (
            <group key={i} position={[p.pos[0], p.pos[1], p.pos[2] - 6.8]} scale={p.scale}>
              {p.type === 'solar' && (
                <mesh castShadow receiveShadow>
                  <boxGeometry args={[1.4, 0.04, 0.8]} />
                  <meshStandardMaterial
                    color="#1e3a8a"
                    metalness={0.9}
                    roughness={0.15}
                    emissive="#1d4ed8"
                    emissiveIntensity={0.2}
                  />
                </mesh>
              )}
              {p.type === 'hull' && (
                <mesh castShadow receiveShadow>
                  <cylinderGeometry args={[0.5, 0.7, 0.9, 6]} />
                  <meshStandardMaterial
                    color="#475569"
                    metalness={0.8}
                    roughness={0.4}
                  />
                </mesh>
              )}
              {p.type === 'rock' && (
                <mesh castShadow receiveShadow>
                  <dodecahedronGeometry args={[0.6, 0]} />
                  <meshStandardMaterial
                    color="#64748b"
                    roughness={0.9}
                    metalness={0.2}
                  />
                </mesh>
              )}
              {p.type === 'antenna' && (
                <group>
                  <mesh position={[0, 0, 0]}>
                    <sphereGeometry args={[0.4, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2]} />
                    <meshStandardMaterial color="#94a3b8" metalness={0.9} roughness={0.3} side={THREE.DoubleSide} />
                  </mesh>
                  <mesh position={[0, 0.3, 0]}>
                    <cylinderGeometry args={[0.02, 0.02, 0.6]} />
                    <meshStandardMaterial color="#cbd5e1" metalness={0.9} roughness={0.1} />
                  </mesh>
                </group>
              )}
              {p.type === 'fragment' && (
                <mesh castShadow receiveShadow>
                  <tetrahedronGeometry args={[0.5]} />
                  <meshStandardMaterial
                    color="#334155"
                    metalness={0.7}
                    roughness={0.5}
                  />
                </mesh>
              )}
            </group>
          );
        })}
      </group>

      {/* Target reticle / radar sweep inside debris zone */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.05, 0]}>
        <circleGeometry args={[1.8, 32]} />
        <meshBasicMaterial
          color="#e11d48"
          transparent
          opacity={0.06}
          side={THREE.DoubleSide}
        />
      </mesh>
    </group>
  );
}
