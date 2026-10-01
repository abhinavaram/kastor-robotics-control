import { useRef, useMemo } from 'react';
import { useFrame, ThreeEvent } from '@react-three/fiber';
import { Text } from '@react-three/drei';
import * as THREE from 'three';
import type { Tile, SideId, SideState, TilePosition } from '../types';

interface TileMeshProps {
  tile: Tile;
  isSelected: boolean;
  isHovered: boolean;
  selectedSideId: SideId | null;
  onClick: () => void;
  onHover: (hovered: boolean) => void;
  onSideClick: (sideId: SideId) => void;
  animatingFrom?: TilePosition;
  animationStartTime?: number;
}

const SIDE_STATE_COLORS: Record<SideState, string> = {
  CLEAR: '#10b981',
  CAUTION: '#f59e0b',
  RISK: '#ef4444',
  UNKNOWN: '#64748b',
};

const SIDE_STATE_EMISSIVE: Record<SideState, string> = {
  CLEAR: '#064e3b',
  CAUTION: '#78350f',
  RISK: '#7f1d1d',
  UNKNOWN: '#1e293b',
};

const ANIMATION_DURATION = 1400; // ms
const HEX_RADIUS = 0.92;
const HEX_HEIGHT = 0.32;
const APOTHEM = HEX_RADIUS * Math.cos(Math.PI / 6); // ~0.797m

// 6 Hexagonal face angles and positions (X-Z plane)
const HEX_SIDES_INFO = [0, 1, 2, 3, 4, 5].map((k) => {
  const angle = (Math.PI / 6) + k * (Math.PI / 3);
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);
  return {
    id: k as SideId,
    angle,
    pos: [cos * APOTHEM, 0, sin * APOTHEM] as [number, number, number],
    normal: [cos, 0, sin] as [number, number, number],
    rotY: -angle + Math.PI / 2,
  };
});

export function TileMesh({
  tile,
  isSelected,
  selectedSideId,
  onClick,
  onHover,
  onSideClick,
  animatingFrom,
  animationStartTime,
}: TileMeshProps) {
  const groupRef = useRef<THREE.Group>(null);
  const pulseRingRef = useRef<THREE.Mesh>(null);

  // Smooth position & rotation transitions
  useFrame((state) => {
    if (!groupRef.current) return;
    const t = state.clock.getElapsedTime();

    if (animatingFrom && animationStartTime) {
      const elapsed = Date.now() - animationStartTime;
      const progress = Math.min(elapsed / ANIMATION_DURATION, 1);
      // Smooth cubic bezier easing
      const eased = progress < 0.5 ? 4 * progress * progress * progress : 1 - Math.pow(-2 * progress + 2, 3) / 2;

      groupRef.current.position.x = animatingFrom.x + (tile.position.x - animatingFrom.x) * eased;
      groupRef.current.position.y = animatingFrom.y + (tile.position.y - animatingFrom.y) * eased;
      groupRef.current.position.z = animatingFrom.z + (tile.position.z - animatingFrom.z) * eased;
    } else {
      const floatAmt = isSelected ? 0.04 : 0.015;
      groupRef.current.position.x = tile.position.x;
      groupRef.current.position.y = tile.position.y + Math.sin(t * 1.8 + tile.position.z) * floatAmt;
      groupRef.current.position.z = tile.position.z;
    }

    const targetRotY = tile.orientation.rotationY;
    groupRef.current.rotation.y += (targetRotY - groupRef.current.rotation.y) * 0.06;

    if (pulseRingRef.current && isSelected) {
      pulseRingRef.current.scale.setScalar(1 + Math.sin(t * 4) * 0.04);
    }
  });

  const scale = isSelected ? 1.05 : 1;

  // Role tag for tile
  const tileRole = useMemo(() => {
    if (tile.id === 'T-01') return 'BASE ANCHOR';
    if (tile.id === 'T-06') return 'DEBRIS GRAPPLE';
    if (tile.id === 'T-05') return 'SENSOR ARRAY';
    return 'CHAIN LINK';
  }, [tile.id]);

  return (
    <group
      ref={groupRef}
      onClick={(e: ThreeEvent<MouseEvent>) => { e.stopPropagation(); onClick(); }}
      onPointerOver={(e: ThreeEvent<PointerEvent>) => { e.stopPropagation(); onHover(true); }}
      onPointerOut={() => { onHover(false); }}
      scale={[scale, scale, scale]}
    >
      {/* Main Hexagonal Body */}
      <mesh
        castShadow
        receiveShadow
        rotation={[0, Math.PI / 6, 0]}
      >
        <cylinderGeometry args={[HEX_RADIUS, HEX_RADIUS, HEX_HEIGHT, 6]} />
        <meshStandardMaterial
          color={isSelected ? '#1e293b' : '#0f172a'}
          metalness={0.88}
          roughness={0.25}
          emissive={isSelected ? '#0f172a' : '#020617'}
          emissiveIntensity={0.5}
        />
      </mesh>

      {/* Top Hexagonal Armor Plate Bevel */}
      <mesh
        position={[0, HEX_HEIGHT / 2 + 0.005, 0]}
        rotation={[0, Math.PI / 6, 0]}
      >
        <cylinderGeometry args={[HEX_RADIUS * 0.94, HEX_RADIUS * 0.94, 0.02, 6]} />
        <meshStandardMaterial
          color="#1e293b"
          metalness={0.7}
          roughness={0.35}
        />
      </mesh>

      {/* Central Illuminated Status Core Ring */}
      <mesh
        position={[0, HEX_HEIGHT / 2 + 0.02, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
      >
        <ringGeometry args={[0.22, 0.32, 24]} />
        <meshStandardMaterial
          color={isSelected ? '#38bdf8' : '#10b981'}
          emissive={isSelected ? '#0284c7' : '#059669'}
          emissiveIntensity={1.5}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Core Center Emblem */}
      <mesh
        position={[0, HEX_HEIGHT / 2 + 0.02, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
      >
        <circleGeometry args={[0.18, 24]} />
        <meshStandardMaterial
          color="#020617"
          roughness={0.2}
          metalness={0.9}
        />
      </mesh>

      {/* 3D Tile ID and Role on Top Face */}
      <Text
        position={[0, HEX_HEIGHT / 2 + 0.03, -0.05]}
        rotation={[-Math.PI / 2, 0, 0]}
        fontSize={0.12}
        color={isSelected ? '#38bdf8' : '#e2e8f0'}
        anchorX="center"
        anchorY="middle"
      >
        {tile.id}
      </Text>

      <Text
        position={[0, HEX_HEIGHT / 2 + 0.03, 0.12]}
        rotation={[-Math.PI / 2, 0, 0]}
        fontSize={0.065}
        color="#94a3b8"
        anchorX="center"
        anchorY="middle"
      >
        {tileRole}
      </Text>

      {/* 6 Hexagonal Sides / Facets with Sensor Telemetry & Docking Latches */}
      {HEX_SIDES_INFO.map((sideInfo) => {
        const side = tile.sides[sideInfo.id];
        if (!side) return null;
        const isSideActive = selectedSideId === side.id;
        const stateColor = SIDE_STATE_COLORS[side.state];
        const stateEmissive = SIDE_STATE_EMISSIVE[side.state];

        return (
          <group
            key={sideInfo.id}
            position={sideInfo.pos}
            rotation={[0, sideInfo.rotY, 0]}
          >
            {/* Clickable facet sensor panel */}
            <mesh
              onClick={(e: ThreeEvent<MouseEvent>) => {
                e.stopPropagation();
                onSideClick(side.id);
              }}
              position={[0, 0, 0.015]}
            >
              <planeGeometry args={[0.78, HEX_HEIGHT * 0.9]} />
              <meshStandardMaterial
                color={isSideActive ? '#ffffff' : stateColor}
                emissive={stateColor}
                emissiveIntensity={isSideActive ? 2.0 : 0.6}
                metalness={0.4}
                roughness={0.3}
                side={THREE.DoubleSide}
              />
            </mesh>

            {/* Glowing Sensor Lens Pod */}
            <mesh position={[0, 0.04, 0.03]}>
              <cylinderGeometry args={[0.07, 0.07, 0.03, 16]} />
              <meshStandardMaterial
                color={stateColor}
                emissive={stateColor}
                emissiveIntensity={isSideActive ? 2.5 : 1.2}
              />
            </mesh>

            {/* Side Label Text (S1 .. S6) */}
            <Text
              position={[0, -0.06, 0.035]}
              fontSize={0.07}
              color={isSideActive ? '#ffffff' : '#020617'}
              anchorX="center"
              anchorY="middle"
            >
              {side.label}
            </Text>

            {/* Docking Coupler latch pin */}
            <mesh position={[0.26, 0, 0.02]}>
              <boxGeometry args={[0.05, 0.14, 0.03]} />
              <meshStandardMaterial color="#64748b" metalness={0.9} roughness={0.2} />
            </mesh>
            <mesh position={[-0.26, 0, 0.02]}>
              <boxGeometry args={[0.05, 0.14, 0.03]} />
              <meshStandardMaterial color="#64748b" metalness={0.9} roughness={0.2} />
            </mesh>
          </group>
        );
      })}

      {/* Hexagonal Selection Ring */}
      {isSelected && (
        <mesh ref={pulseRingRef} position={[0, -0.16, 0]} rotation={[-Math.PI / 2, 0, Math.PI / 6]}>
          <ringGeometry args={[HEX_RADIUS + 0.1, HEX_RADIUS + 0.18, 6]} />
          <meshBasicMaterial
            color="#38bdf8"
            transparent
            opacity={0.7}
            side={THREE.DoubleSide}
          />
        </mesh>
      )}
    </group>
  );
}
