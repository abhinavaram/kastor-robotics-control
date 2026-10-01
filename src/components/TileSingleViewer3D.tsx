import { useRef, useState } from 'react';
import { Canvas, useFrame, ThreeEvent } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera, Text } from '@react-three/drei';
import * as THREE from 'three';
import type { Tile, SideId, SideState } from '../types';
import { RotateCcw, Play, Pause, Compass, Maximize2 } from 'lucide-react';

interface TileSingleViewer3DProps {
  tile: Tile;
  selectedSideId: SideId | null;
  onSideClick: (sideId: SideId) => void;
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

const HEX_RADIUS = 1.05;
const HEX_HEIGHT = 0.38;
const APOTHEM = HEX_RADIUS * Math.cos(Math.PI / 6); // ~0.909m

// 6 Hexagonal facets
const HEX_FACETS = [0, 1, 2, 3, 4, 5].map((k) => {
  const angle = (Math.PI / 6) + k * (Math.PI / 3);
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);
  return {
    id: k as SideId,
    angle,
    pos: [cos * APOTHEM, 0, sin * APOTHEM] as [number, number, number],
    rotY: -angle + Math.PI / 2,
    normal: [cos, 0, sin] as [number, number, number],
  };
});

function SingleHexTile({
  tile,
  selectedSideId,
  onSideClick,
}: {
  tile: Tile;
  selectedSideId: SideId | null;
  onSideClick: (sideId: SideId) => void;
}) {
  const isEndEffector = tile.id === 'T-06';
  const isBase = tile.id === 'T-01';

  return (
    <group position={[0, 0, 0]}>
      {/* Hexagonal Main Body */}
      <mesh castShadow receiveShadow rotation={[0, Math.PI / 6, 0]}>
        <cylinderGeometry args={[HEX_RADIUS, HEX_RADIUS, HEX_HEIGHT, 6]} />
        <meshStandardMaterial
          color="#0f172a"
          metalness={0.9}
          roughness={0.2}
          emissive="#020617"
          emissiveIntensity={0.6}
        />
      </mesh>

      {/* Top Hexagonal Armor Bevel Plate */}
      <mesh position={[0, HEX_HEIGHT / 2 + 0.005, 0]} rotation={[0, Math.PI / 6, 0]}>
        <cylinderGeometry args={[HEX_RADIUS * 0.94, HEX_RADIUS * 0.94, 0.02, 6]} />
        <meshStandardMaterial color="#1e293b" metalness={0.8} roughness={0.3} />
      </mesh>

      {/* Center Illuminated LED Core */}
      <mesh position={[0, HEX_HEIGHT / 2 + 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.26, 0.38, 32]} />
        <meshStandardMaterial
          color="#38bdf8"
          emissive="#0284c7"
          emissiveIntensity={2.2}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Core Dark Hub */}
      <mesh position={[0, HEX_HEIGHT / 2 + 0.022, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.22, 32]} />
        <meshStandardMaterial color="#020617" roughness={0.1} metalness={0.9} />
      </mesh>

      {/* Center KASTOR Emblem / Status Icon */}
      <Text
        position={[0, HEX_HEIGHT / 2 + 0.03, -0.06]}
        rotation={[-Math.PI / 2, 0, 0]}
        fontSize={0.14}
        color="#38bdf8"
        anchorX="center"
        anchorY="middle"
      >
        {tile.id}
      </Text>

      <Text
        position={[0, HEX_HEIGHT / 2 + 0.03, 0.12]}
        rotation={[-Math.PI / 2, 0, 0]}
        fontSize={0.07}
        color="#94a3b8"
        anchorX="center"
        anchorY="middle"
      >
        {isEndEffector ? 'DEBRIS GRAPPLE' : isBase ? 'BASE ANCHOR' : 'CHAIN LINK'}
      </Text>

      {/* End-Effector Grapple Arms (if T-06) */}
      {isEndEffector && (
        <group position={[0, 0, 0]}>
          {[0, Math.PI / 3, (2 * Math.PI) / 3, Math.PI, (4 * Math.PI) / 3, (5 * Math.PI) / 3].map((rot, i) => (
            <group key={`grapple-${i}`} rotation={[0, rot + Math.PI / 6, 0]}>
              <mesh position={[0, 0.05, HEX_RADIUS + 0.15]}>
                <boxGeometry args={[0.08, 0.12, 0.32]} />
                <meshStandardMaterial color="#334155" metalness={0.9} roughness={0.2} />
              </mesh>
              <mesh position={[0, 0.08, HEX_RADIUS + 0.32]}>
                <sphereGeometry args={[0.04, 8, 8]} />
                <meshStandardMaterial color="#f59e0b" emissive="#d97706" emissiveIntensity={1.5} />
              </mesh>
            </group>
          ))}
        </group>
      )}

      {/* 6 Interactive Hexagonal Facets / Sides */}
      {HEX_FACETS.map((facet) => {
        const side = tile.sides[facet.id];
        if (!side) return null;
        const isActive = selectedSideId === side.id;
        const color = SIDE_STATE_COLORS[side.state];
        const emissive = SIDE_STATE_EMISSIVE[side.state];

        return (
          <group key={facet.id} position={facet.pos} rotation={[0, facet.rotY, 0]}>
            {/* Clickable Facet Surface */}
            <mesh
              position={[0, 0, 0.02]}
              onClick={(e: ThreeEvent<MouseEvent>) => {
                e.stopPropagation();
                onSideClick(side.id);
              }}
            >
              <planeGeometry args={[0.88, HEX_HEIGHT * 0.9]} />
              <meshStandardMaterial
                color={isActive ? '#ffffff' : color}
                emissive={color}
                emissiveIntensity={isActive ? 2.2 : 0.6}
                metalness={0.5}
                roughness={0.2}
                side={THREE.DoubleSide}
              />
            </mesh>

            {/* Facet Sensor Pod / Lens */}
            <mesh position={[0, 0.06, 0.04]}>
              <cylinderGeometry args={[0.09, 0.09, 0.04, 20]} />
              <meshStandardMaterial
                color={color}
                emissive={color}
                emissiveIntensity={isActive ? 2.8 : 1.4}
              />
            </mesh>

            {/* Facet Side Label */}
            <Text
              position={[0, -0.07, 0.045]}
              fontSize={0.085}
              color={isActive ? '#ffffff' : '#020617'}
              anchorX="center"
              anchorY="middle"
            >
              {side.label}
            </Text>

            {/* Docking Coupler Latches on Facet */}
            <mesh position={[0.3, 0, 0.025]}>
              <boxGeometry args={[0.06, 0.16, 0.04]} />
              <meshStandardMaterial color="#64748b" metalness={0.9} roughness={0.2} />
            </mesh>
            <mesh position={[-0.3, 0, 0.025]}>
              <boxGeometry args={[0.06, 0.16, 0.04]} />
              <meshStandardMaterial color="#64748b" metalness={0.9} roughness={0.2} />
            </mesh>

            {/* Active facet sensor beam projection */}
            {isActive && side.sensor?.distance && (
              <mesh position={[0, 0.06, 0.45]} rotation={[Math.PI / 2, 0, 0]}>
                <cylinderGeometry args={[0.015, 0.08, 0.8, 12, 1, true]} />
                <meshBasicMaterial
                  color={color}
                  transparent
                  opacity={0.35}
                  wireframe
                  side={THREE.DoubleSide}
                />
              </mesh>
            )}
          </group>
        );
      })}

      {/* Selected Side Glowing Bracket Ring */}
      {selectedSideId !== null && (
        <mesh position={[0, -HEX_HEIGHT / 2 - 0.04, 0]} rotation={[-Math.PI / 2, 0, Math.PI / 6]}>
          <ringGeometry args={[HEX_RADIUS + 0.08, HEX_RADIUS + 0.16, 6]} />
          <meshBasicMaterial color="#38bdf8" transparent opacity={0.6} side={THREE.DoubleSide} />
        </mesh>
      )}
    </group>
  );
}

function StudioScene({
  tile,
  selectedSideId,
  onSideClick,
  autoRotate,
}: {
  tile: Tile;
  selectedSideId: SideId | null;
  onSideClick: (sideId: SideId) => void;
  autoRotate: boolean;
}) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const controlsRef = useRef<any>(null);

  useFrame(() => {
    if (controlsRef.current && autoRotate) {
      controlsRef.current.autoRotate = true;
      controlsRef.current.autoRotateSpeed = 2.0;
    } else if (controlsRef.current) {
      controlsRef.current.autoRotate = false;
    }
  });

  return (
    <>
      <PerspectiveCamera makeDefault position={[2.6, 2.2, 2.6]} fov={38} near={0.1} far={50} />
      <OrbitControls
        ref={controlsRef}
        enablePan={false}
        enableZoom={true}
        enableRotate={true}
        minDistance={1.8}
        maxDistance={6.0}
        dampingFactor={0.08}
        enableDamping={true}
        target={[0, 0, 0]}
      />

      {/* Studio Lighting */}
      <ambientLight intensity={0.45} />
      <directionalLight position={[4, 6, 4]} intensity={1.8} castShadow />
      <pointLight position={[-4, 3, -4]} intensity={0.8} color="#38bdf8" />
      <pointLight position={[3, -2, -3]} intensity={0.5} color="#0284c7" />

      {/* Floor reflection grid */}
      <gridHelper args={[6, 12, '#334155', '#1e293b']} position={[0, -HEX_HEIGHT / 2 - 0.05, 0]} />

      <SingleHexTile
        tile={tile}
        selectedSideId={selectedSideId}
        onSideClick={onSideClick}
      />
    </>
  );
}

export function TileSingleViewer3D({
  tile,
  selectedSideId,
  onSideClick,
}: TileSingleViewer3DProps) {
  const [autoRotate, setAutoRotate] = useState(true);

  return (
    <div className="single-tile-viewer">
      <div className="viewer-360-canvas-wrapper">
        <Canvas
          shadows
          gl={{ antialias: true, alpha: true }}
          style={{ background: 'transparent' }}
          dpr={[1, 2]}
        >
          <StudioScene
            tile={tile}
            selectedSideId={selectedSideId}
            onSideClick={onSideClick}
            autoRotate={autoRotate}
          />
        </Canvas>

        {/* 360 Interaction HUD Badge */}
        <div className="viewer-hud-badge">
          <Compass size={11} className="spin-slow text-sky-400" />
          <span>360° INTERACTIVE 3D INSPECTOR</span>
        </div>

        {/* 360 Mini Toolbar Controls */}
        <div className="viewer-hud-controls">
          <button
            className={`btn-viewer-tool ${autoRotate ? 'active' : ''}`}
            onClick={() => setAutoRotate(r => !r)}
            title={autoRotate ? 'Pause 360° auto-rotation' : 'Start 360° auto-rotation'}
          >
            {autoRotate ? <Pause size={11} /> : <Play size={11} />}
            <span>{autoRotate ? 'PAUSE' : 'ROTATE'}</span>
          </button>
        </div>

        {/* Selected facet status pill */}
        <div className="viewer-hud-bottom">
          <span className="viewer-hint-text">
            Drag to rotate 360° · Scroll to zoom · Click facet to inspect
          </span>
          {selectedSideId !== null && (
            <span className="viewer-facet-badge">
              FACET S{selectedSideId + 1} SELECTED
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
