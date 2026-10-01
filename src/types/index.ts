// ============================================================
// KASTOR Type Definitions
// ============================================================

export type SideState = 'CLEAR' | 'CAUTION' | 'RISK' | 'UNKNOWN';
export type ConnectionState = 'CONNECTED' | 'RECONNECTING' | 'DISCONNECTED';
export type OperationStatus = 'IDLE' | 'PENDING' | 'ACKNOWLEDGED' | 'EXECUTING' | 'COMPLETED' | 'FAILED';
export type OperationType = 'MOVE' | 'DEPLOY';
export type MessageType =
  | 'INITIAL_STATE'
  | 'TILE_STATE_UPDATE'
  | 'SENSOR_UPDATE'
  | 'OPERATION_ACKNOWLEDGED'
  | 'OPERATION_EXECUTING'
  | 'OPERATION_COMPLETED'
  | 'OPERATION_FAILED'
  | 'HEARTBEAT';

// Side ID: 0 = Top, 1 = Front, 2 = Right, 3 = Back, 4 = Left, 5 = Bottom
export type SideId = 0 | 1 | 2 | 3 | 4 | 5;

export interface SensorReading {
  distance: number | null; // meters, null = no reading
  timestamp: number; // Unix ms
  isStale: boolean;
}

export interface TileSide {
  id: SideId;
  label: string; // e.g. "S1" ... "S6"
  state: SideState;
  sensor: SensorReading | null;
}

export interface TilePosition {
  x: number;
  y: number;
  z: number;
}

export interface TileOrientation {
  rotationY: number; // radians
}

export interface Tile {
  id: string; // e.g. "T-01"
  position: TilePosition;
  orientation: TileOrientation;
  sides: TileSide[];
  label: string;
  lastUpdated: number;
}

export interface Operation {
  id: string;
  type: OperationType;
  tileId: string;
  targetPosition?: TilePosition;
  targetSideId?: SideId;
  status: OperationStatus;
  requestedAt: number;
  confirmedAt?: number;
  completedAt?: number;
  error?: string;
}

export interface ServerMessage {
  messageType: MessageType;
  sequenceNumber: number;
  timestamp: number;
  operationId?: string;
  tileId?: string;
  sideId?: SideId;
  payload: unknown;
}

export interface InitialStatePayload {
  tiles: Tile[];
  serverTime: number;
}

export interface TileStateUpdatePayload {
  tile: Tile;
  version: number;
}

export interface SensorUpdatePayload {
  tileId: string;
  sideId: SideId;
  sensor: SensorReading;
}

export interface OperationAcknowledgedPayload {
  operationId: string;
  tileId: string;
  status: 'ACKNOWLEDGED';
}

export interface OperationExecutingPayload {
  operationId: string;
  tileId: string;
  status: 'EXECUTING';
}

export interface OperationCompletedPayload {
  operationId: string;
  tileId: string;
  status: 'COMPLETED';
  newTile: Tile;
}

export interface OperationFailedPayload {
  operationId: string;
  tileId: string;
  status: 'FAILED';
  error: string;
}

// ============================================================
// Application State Interfaces
// ============================================================

export interface KastorAppState {
  // Server-confirmed tile state
  confirmedTiles: Record<string, Tile>;
  // Pending operation
  pendingOperation: Operation | null;
  // Connection
  connectionState: ConnectionState;
  // UI selection
  selectedTileId: string | null;
  selectedSideId: SideId | null;
  // Message tracking for dedup/ordering
  processedMessageSequences: Set<number>;
  tileVersions: Record<string, number>;
  // Simulation / demo
  simulationMode: SimulationMode;
  // Event log
  eventLog: EventLogEntry[];
}

export type SimulationMode =
  | 'NORMAL'
  | 'DELAYED'
  | 'DUPLICATE'
  | 'OUT_OF_ORDER'
  | 'STALE_SENSOR'
  | 'UNKNOWN_SENSOR'
  | 'DISCONNECT';

export interface EventLogEntry {
  id: string;
  timestamp: number;
  type: 'INFO' | 'WARNING' | 'ERROR' | 'SUCCESS' | 'OPERATION';
  message: string;
}
