import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import type { Tile } from '../types';

interface ConnectionLineProps {
  tiles: Tile[];
}

export function ConnectionLine({ tiles }: ConnectionLineProps) {
  const lineGroupRef = useRef<THREE.Group>(null);
  const pulseRef = useRef<THREE.Mesh>(null);
  const laserRef = useRef<THREE.Line>(null);

  // Sort tiles by position.z ascending (T-01 -> T-02 -> ... -> T-06)
  const sortedTiles = useMemo(() => {
    return [...tiles].sort((a, b) => a.position.z - b.position.z);
  }, [tiles]);

  // Points along the tile chain
  const chainPoints = useMemo(() => {
    return sortedTiles.map(t => new THREE.Vector3(t.position.x, t.position.y + 0.12, t.position.z));
  }, [sortedTiles]);

  // Lead tile and debris target
  const leadTile = sortedTiles[sortedTiles.length - 1];
  const debrisTarget = useMemo(() => new THREE.Vector3(0, 0.2, 6.8), []);

  // Geometry for the chain backbone
  const chainGeometry = useMemo(() => {
    if (chainPoints.length < 2) return null;
    const curve = new THREE.CatmullRomCurve3(chainPoints, false, 'centripetal', 0.1);
    return new THREE.TubeGeometry(curve, 64, 0.035, 8, false);
  }, [chainPoints]);

  // Laser geometry from lead tile to debris target
  const laserGeometry = useMemo(() => {
    if (!leadTile) return null;
    const start = new THREE.Vector3(leadTile.position.x, leadTile.position.y + 0.15, leadTile.position.z + 0.4);
    return new THREE.BufferGeometry().setFromPoints([start, debrisTarget]);
  }, [leadTile, debrisTarget]);

  useFrame((state) => {
    const t = state.clock.getElapsedTime();

    // Pulse moving along chain
    if (pulseRef.current && chainPoints.length >= 2) {
      const progress = (t * 0.4) % 1;
      const totalLen = chainPoints.length - 1;
      const idx = Math.min(Math.floor(progress * totalLen), totalLen - 1);
      const subT = (progress * totalLen) - idx;

      const p1 = chainPoints[idx];
      const p2 = chainPoints[idx + 1];
      if (p1 && p2) {
        pulseRef.current.position.lerpVectors(p1, p2, subT);
      }
    }

    // Laser pulsing
    if (laserRef.current) {
      const mat = laserRef.current.material as THREE.LineBasicMaterial;
      if (mat) {
        mat.opacity = 0.5 + Math.sin(t * 8) * 0.35;
      }
    }
  });

  return (
    <group ref={lineGroupRef}>
      {/* Heavy illuminated umbilical tube connecting the tiles */}
      {chainGeometry && (
        <mesh geometry={chainGeometry}>
          <meshStandardMaterial
            color="#06b6d4"
            emissive="#0891b2"
            emissiveIntensity={0.8}
            roughness={0.2}
            metalness={0.8}
          />
        </mesh>
      )}

      {/* Mechanical Docking Couplers between adjacent tiles */}
      {sortedTiles.map((tile, idx) => {
        if (idx === sortedTiles.length - 1) return null;
        const nextTile = sortedTiles[idx + 1];
        const midX = (tile.position.x + nextTile.position.x) / 2;
        const midY = (tile.position.y + nextTile.position.y) / 2;
        const midZ = (tile.position.z + nextTile.position.z) / 2;

        return (
          <group key={`dock-coupler-${tile.id}-${nextTile.id}`} position={[midX, midY + 0.1, midZ]}>
            {/* Coupler collar */}
            <mesh rotation={[Math.PI / 2, 0, 0]}>
              <cylinderGeometry args={[0.14, 0.14, 0.45, 12]} />
              <meshStandardMaterial
                color="#1e293b"
                metalness={0.9}
                roughness={0.2}
              />
            </mesh>

            {/* Glowing magnetic lock ring */}
            <mesh rotation={[Math.PI / 2, 0, 0]}>
              <torusGeometry args={[0.16, 0.03, 12, 24]} />
              <meshStandardMaterial
                color="#38bdf8"
                emissive="#0284c7"
                emissiveIntensity={1.8}
              />
            </mesh>

            {/* Latch Status Indicator LED */}
            <mesh position={[0, 0.16, 0]}>
              <sphereGeometry args={[0.03, 8, 8]} />
              <meshBasicMaterial color="#10b981" />
            </mesh>
          </group>
        );
      })}

      {/* Active Data Pulse traveling along the chain */}
      <mesh ref={pulseRef}>
        <sphereGeometry args={[0.07, 12, 12]} />
        <meshBasicMaterial color="#38bdf8" />
      </mesh>

      {/* Target Laser / Umbilical probe from Lead Tile into Debris Zone */}
      {laserGeometry && (
        <group>
          <primitive
            object={new THREE.Line(
              laserGeometry,
              new THREE.LineBasicMaterial({
                color: '#f43f5e',
                linewidth: 2,
                transparent: true,
                opacity: 0.8,
              })
            )}
            ref={laserRef}
          />

          {/* Laser targeting reticle at lead tile nose */}
          {leadTile && (
            <mesh position={[leadTile.position.x, leadTile.position.y + 0.15, leadTile.position.z + 0.55]}>
              <sphereGeometry args={[0.05, 8, 8]} />
              <meshBasicMaterial color="#f43f5e" />
            </mesh>
          )}

          {/* Scanning cone towards debris */}
          {leadTile && (
            <mesh
              position={[leadTile.position.x, leadTile.position.y + 0.15, (leadTile.position.z + debrisTarget.z) / 2]}
              rotation={[Math.PI / 2, 0, 0]}
            >
              <coneGeometry args={[0.65, debrisTarget.z - leadTile.position.z, 16, 1, true]} />
              <meshBasicMaterial
                color="#f43f5e"
                transparent
                opacity={0.06}
                side={THREE.DoubleSide}
                wireframe
              />
            </mesh>
          )}
        </group>
      )}
    </group>
  );
}
