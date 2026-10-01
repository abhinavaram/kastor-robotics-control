import { useRef } from 'react';
import { Grid, Stars } from '@react-three/drei';
import { useKastorStore } from '../state/store';
import { TileMesh } from './TileMesh';
import { ObstacleCurve } from './ObstacleCurve';
import { DebrisZone } from './DebrisZone';
import { ConnectionLine } from './ConnectionLine';
import type { SideId, TileSide } from '../types';

export function KastorScene() {
  const {
    confirmedTiles,
    selectedTileId,
    selectedSideId,
    selectTile,
    selectSide,
    animatingTiles,
  } = useKastorStore();

  const hoveredRef = useRef<string | null>(null);

  const tiles = Object.values(confirmedTiles);
  const selectedTile = selectedTileId ? confirmedTiles[selectedTileId] : null;
  const leadTile = confirmedTiles['T-06'] || tiles[tiles.length - 1];

  return (
    <>
      {/* Lighting tailored for aerospace deep space aesthetic */}
      <ambientLight intensity={0.35} />
      <directionalLight
        position={[8, 12, 6]}
        intensity={1.5}
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
      />
      <pointLight position={[-6, 6, -6]} intensity={0.8} color="#38bdf8" />
      <pointLight position={[0, -3, 0]} intensity={0.4} color="#0284c7" />
      <pointLight position={[0, 4, 7]} intensity={0.9} color="#fb7185" />
      <hemisphereLight args={['#0f172a', '#020617', 0.5]} />

      {/* Deep space floor grid */}
      <Grid
        args={[30, 30]}
        position={[0, -0.6, 1.5]}
        cellColor="#1e293b"
        sectionColor="#334155"
        fadeDistance={24}
        cellSize={0.8}
        sectionSize={3.2}
      />

      {/* Sequential Connection Line linking all tiles to Debris Zone */}
      <ConnectionLine tiles={tiles} />

      {/* Debris Zone / Hazard Area at top of the line */}
      <DebrisZone leadTile={leadTile} />

      {/* Hexagonal Tiles */}
      {tiles.map((tile) => {
        const anim = animatingTiles[tile.id];
        return (
          <TileMesh
            key={tile.id}
            tile={tile}
            isSelected={selectedTileId === tile.id}
            isHovered={hoveredRef.current === tile.id}
            selectedSideId={selectedTileId === tile.id ? selectedSideId : null}
            onClick={() => selectTile(selectedTileId === tile.id ? null : tile.id)}
            onHover={(h: boolean) => { hoveredRef.current = h ? tile.id : null; }}
            onSideClick={(sideId: SideId) => {
              if (selectedTileId !== tile.id) selectTile(tile.id);
              selectSide(sideId);
            }}
            animatingFrom={anim?.from}
            animationStartTime={anim?.startTime}
          />
        );
      })}

      {/* Obstacle curves for selected tile's CAUTION/RISK sides */}
      {selectedTile && selectedTile.sides
        .filter((side: TileSide) => side.state !== 'CLEAR' && side.state !== 'UNKNOWN' && side.sensor?.distance)
        .map((side: TileSide) => (
          <ObstacleCurve
            key={`${selectedTile.id}-${side.id}`}
            tile={selectedTile}
            sideId={side.id}
            sideState={side.state}
            distance={side.sensor!.distance!}
          />
        ))
      }

      {/* Atmosphere Stars */}
      <Stars radius={60} depth={30} count={500} factor={3} saturation={0.4} fade speed={0.4} />
    </>
  );
}
