import type {
  Tile,
  TileSide,
  SideId,
  SideState,
  SensorReading,
  TilePosition,
} from '../types';

const STALE_THRESHOLD_MS = 12000;

// Helper to construct a side with sensor telemetry
function makeSide(
  id: SideId,
  label: string,
  state: SideState,
  distance: number | null,
  ageMs = 0
): TileSide {
  const now = Date.now();
  const timestamp = now - ageMs;
  const isStale = ageMs > STALE_THRESHOLD_MS;
  const sensor: SensorReading | null =
    distance !== null
      ? { distance, timestamp, isStale }
      : null;

  return { id, label, state, sensor };
}

function makeTile(
  id: string,
  pos: TilePosition,
  rotY: number,
  sides: TileSide[]
): Tile {
  return {
    id,
    position: pos,
    orientation: { rotationY: rotY },
    sides,
    label: id,
    lastUpdated: Date.now(),
  };
}

/**
 * Sequential hexagonal modular tile chain extending towards the Debris Zone.
 * Each tile connects to at most 1 predecessor and 1 successor (linear chain).
 * T-01 [Base Anchor] -> T-02 -> T-03 -> T-04 -> T-05 -> T-06 [Debris Grapple] -> Debris Field
 *
 * Side Orientations for Regular Hexagon (X-Z plane):
 * Side 0 (S1): +30° (Flank NE)
 * Side 1 (S2): +90° (Forward toward +Z / Debris Zone)
 * Side 2 (S3): +150° (Flank NW)
 * Side 3 (S4): +210° (Flank SW)
 * Side 4 (S5): +270° (Aft toward -Z / Base Anchor)
 * Side 5 (S6): +330° (Flank SE)
 */
export function createInitialTiles(): Tile[] {
  return [
    // T-01: Base Station Anchor Module (docked to platform at Z = -4.2)
    makeTile('T-01', { x: 0, y: 0, z: -4.2 }, 0, [
      makeSide(0, 'S1', 'CLEAR', 3.5),
      makeSide(1, 'S2', 'CLEAR', 1.68), // Docked to T-02
      makeSide(2, 'S3', 'CLEAR', 3.8),
      makeSide(3, 'S4', 'CLEAR', 4.1),
      makeSide(4, 'S5', 'CLEAR', 0.5),  // Docked to Station Base
      makeSide(5, 'S6', 'CLEAR', 4.0),
    ]),

    // T-02: Articulated Link 1
    makeTile('T-02', { x: 0, y: 0, z: -2.52 }, 0, [
      makeSide(0, 'S1', 'CLEAR', 2.8),
      makeSide(1, 'S2', 'CLEAR', 1.68), // Docked to T-03
      makeSide(2, 'S3', 'CLEAR', 3.1),
      makeSide(3, 'S4', 'CLEAR', 3.2),
      makeSide(4, 'S5', 'CLEAR', 1.68), // Docked to T-01
      makeSide(5, 'S6', 'CLEAR', 2.9),
    ]),

    // T-03: Articulated Link 2 (has an UNKNOWN sensor on Side 0 to fulfill test requirement)
    makeTile('T-03', { x: 0, y: 0, z: -0.84 }, 0, [
      makeSide(0, 'S1', 'UNKNOWN', null), // Uncalibrated / hardware fault requirement
      makeSide(1, 'S2', 'CLEAR', 1.68),   // Docked to T-04
      makeSide(2, 'S3', 'CLEAR', 2.4),
      makeSide(3, 'S4', 'CLEAR', 2.6),
      makeSide(4, 'S5', 'CLEAR', 1.68),   // Docked to T-02
      makeSide(5, 'S6', 'CLEAR', 2.7),
    ]),

    // T-04: Articulated Link 3 (has a STALE sensor on Side 2 to fulfill test requirement: age > 12s)
    makeTile('T-04', { x: 0, y: 0, z: 0.84 }, 0, [
      makeSide(0, 'S1', 'CLEAR', 2.1),
      makeSide(1, 'S2', 'CLEAR', 1.68),  // Docked to T-05
      makeSide(2, 'S3', 'CAUTION', 0.94, 25000), // Stale: 25 seconds old!
      makeSide(3, 'S4', 'CLEAR', 2.3),
      makeSide(4, 'S5', 'CLEAR', 1.68),  // Docked to T-03
      makeSide(5, 'S6', 'CLEAR', 2.0),
    ]),

    // T-05: Sensor Array Module (entering hazard proximity zone)
    makeTile('T-05', { x: 0, y: 0, z: 2.52 }, 0, [
      makeSide(0, 'S1', 'CAUTION', 1.25),
      makeSide(1, 'S2', 'CLEAR', 1.68),  // Docked to T-06
      makeSide(2, 'S3', 'CAUTION', 1.10),
      makeSide(3, 'S4', 'CLEAR', 2.2),
      makeSide(4, 'S5', 'CLEAR', 1.68),  // Docked to T-04
      makeSide(5, 'S6', 'CLEAR', 1.9),
    ]),

    // T-06: End-Effector / Debris Grapple (closest to orbital debris field at Z = 6.2)
    // Side 1 points directly into the Debris Zone with high RISK proximity reading!
    makeTile('T-06', { x: 0, y: 0, z: 4.20 }, 0, [
      makeSide(0, 'S1', 'CAUTION', 0.82),
      makeSide(1, 'S2', 'RISK', 0.48),    // Directly facing Debris Zone obstacle!
      makeSide(2, 'S3', 'CAUTION', 0.76),
      makeSide(3, 'S4', 'CLEAR', 1.8),
      makeSide(4, 'S5', 'CLEAR', 1.68),   // Docked to T-05
      makeSide(5, 'S6', 'CLEAR', 1.6),
    ]),
  ];
}
