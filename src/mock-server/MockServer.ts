import type {
  Tile,
  SideId,
  SideState,
  SensorReading,
  OperationType,
  ServerMessage,
  SimulationMode,
  TilePosition,
  InitialStatePayload,
  SensorUpdatePayload,
  OperationAcknowledgedPayload,
  OperationExecutingPayload,
  OperationCompletedPayload,
} from '../types';
import { createInitialTiles } from './initialState';
import { validateServerMessage } from '../validation';

// ============================================================
// Mock Server — simulates a central KASTOR server
// Exposes: getInitialState, sendOperation, subscribeToUpdates,
//          disconnect, reconnect, setSimulationMode
// ============================================================

type UpdateCallback = (message: ServerMessage) => void;

let _tiles: Tile[] = createInitialTiles();
let _seqNum = 0;
let _connected = false;
let _simulationMode: SimulationMode = 'NORMAL';
let _failNextOperation = false;
let _subscriber: UpdateCallback | null = null;
let _sensorIntervalId: ReturnType<typeof setInterval> | null = null;
let _heartbeatIntervalId: ReturnType<typeof setInterval> | null = null;

// ============================================================
// Helpers
// ============================================================

function nextSeq(): number {
  return ++_seqNum;
}

function buildMessage(
  type: ServerMessage['messageType'],
  payload: unknown,
  extra: Partial<ServerMessage> = {}
): ServerMessage {
  return {
    messageType: type,
    sequenceNumber: nextSeq(),
    timestamp: Date.now(),
    payload,
    ...extra,
  };
}

function emit(msg: ServerMessage): void {
  if (!_connected || !_subscriber) return;
  const validated = validateServerMessage(msg);
  if (!validated) return;

  const delay = resolveDelay();

  if (_simulationMode === 'DUPLICATE') {
    // Send twice with a small gap
    setTimeout(() => _subscriber?.(validated), delay);
    setTimeout(() => _subscriber?.(validated), delay + 200);
  } else if (_simulationMode === 'OUT_OF_ORDER') {
    // Emit two messages out of order
    const msg2 = buildMessage('HEARTBEAT', {});
    setTimeout(() => _subscriber?.(msg2), delay);
    setTimeout(() => _subscriber?.(validated), delay + 50);
  } else {
    setTimeout(() => _subscriber?.(validated), delay);
  }
}

function resolveDelay(): number {
  switch (_simulationMode) {
    case 'DELAYED': return 3000 + Math.random() * 2000;
    case 'NORMAL':
    default:
      return 50 + Math.random() * 100;
  }
}

function cloneTiles(): Tile[] {
  return JSON.parse(JSON.stringify(_tiles));
}

function getTileById(id: string): Tile | undefined {
  return _tiles.find(t => t.id === id);
}

function updateTileInState(updated: Tile): void {
  _tiles = _tiles.map(t => t.id === updated.id ? updated : t);
}

// ============================================================
// Sensor simulation — periodically update sensor readings
// ============================================================

function startSensorSimulation(): void {
  if (_sensorIntervalId) clearInterval(_sensorIntervalId);

  _sensorIntervalId = setInterval(() => {
    if (!_connected) return;

    // Pick a random tile + side with a non-null sensor
    const tilesSnapshot = cloneTiles();
    for (const tile of tilesSnapshot) {
      for (const side of tile.sides) {
        if (side.sensor !== null && Math.random() < 0.3) {
          // Update reading slightly
          let newDist = side.sensor.distance;
          if (newDist !== null) {
            newDist = Math.max(0.1, newDist + (Math.random() - 0.5) * 0.2);
            newDist = parseFloat(newDist.toFixed(2));
          }

          const isStale = _simulationMode === 'STALE_SENSOR';
          const ageOffset = isStale ? 20000 : 0;

          const newSensor: SensorReading = {
            distance: _simulationMode === 'UNKNOWN_SENSOR' ? null : newDist,
            timestamp: Date.now() - ageOffset,
            isStale,
          };

          // Update internal state
          _tiles = _tiles.map(t => {
            if (t.id !== tile.id) return t;
            return {
              ...t,
              sides: t.sides.map(s => {
                if (s.id !== side.id) return s;
                return { ...s, sensor: newSensor };
              }),
              lastUpdated: Date.now(),
            };
          });

          const payload: SensorUpdatePayload = {
            tileId: tile.id,
            sideId: side.id as SideId,
            sensor: newSensor,
          };

          emit(buildMessage('SENSOR_UPDATE', payload, {
            tileId: tile.id,
            sideId: side.id as SideId,
          }));
        }
      }
    }
  }, 2500);
}

function startHeartbeat(): void {
  if (_heartbeatIntervalId) clearInterval(_heartbeatIntervalId);
  _heartbeatIntervalId = setInterval(() => {
    if (_connected) {
      emit(buildMessage('HEARTBEAT', { serverTime: Date.now() }));
    }
  }, 5000);
}

function stopIntervals(): void {
  if (_sensorIntervalId) clearInterval(_sensorIntervalId);
  if (_heartbeatIntervalId) clearInterval(_heartbeatIntervalId);
  _sensorIntervalId = null;
  _heartbeatIntervalId = null;
}

// ============================================================
// Public API
// ============================================================

export const MockServer = {
  /** Connect and provide a callback for incoming messages */
  subscribe(callback: UpdateCallback): void {
    _subscriber = callback;
  },

  unsubscribe(): void {
    _subscriber = null;
  },

  /** Connect to the server and receive initial state */
  connect(): void {
    _connected = true;
    startSensorSimulation();
    startHeartbeat();
  },

  /** Get initial authoritative tile state */
  getInitialState(): ServerMessage {
    const payload: InitialStatePayload = {
      tiles: cloneTiles(),
      serverTime: Date.now(),
    };
    return buildMessage('INITIAL_STATE', payload);
  },

  /** Send a MOVE or DEPLOY operation request */
  async sendOperation(
    type: OperationType,
    tileId: string,
    targetPosition?: TilePosition
  ): Promise<string> {
    const operationId = `op-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

    // Simulate server processing lifecycle
    setTimeout(() => {
      // 1. ACKNOWLEDGED
      const ackPayload: OperationAcknowledgedPayload = {
        operationId,
        tileId,
        status: 'ACKNOWLEDGED',
      };
      emit(buildMessage('OPERATION_ACKNOWLEDGED', ackPayload, { operationId, tileId }));

      // 2. EXECUTING (after small delay)
      setTimeout(() => {
        const execPayload: OperationExecutingPayload = {
          operationId,
          tileId,
          status: 'EXECUTING',
        };
        emit(buildMessage('OPERATION_EXECUTING', execPayload, { operationId, tileId }));

        // Check if failure is simulated
        if (_failNextOperation) {
          _failNextOperation = false;
          setTimeout(() => {
            const failPayload = {
              operationId,
              tileId,
              status: 'FAILED',
              error: 'SAFETY SUPERVISOR ABORT: Orbital debris hazard proximity violates clearance envelope (< 0.50m). Motion aborted; reverted to confirmed state.',
            };
            emit(buildMessage('OPERATION_FAILED', failPayload, { operationId, tileId }));
          }, 1200);
          return;
        }

        // 3. COMPLETED — update tile state
        setTimeout(() => {
          const currentTile = getTileById(tileId);
          if (!currentTile) return;

          // For MOVE: advance slightly forward along Z toward the Debris Zone, or step sideways
          const stepZ = type === 'MOVE' ? 0.35 : 0;
          const newPos = targetPosition ?? {
            x: currentTile.position.x,
            y: currentTile.position.y,
            z: Math.min(currentTile.position.z + stepZ, 5.5),
          };

          const updatedTile: Tile = {
            ...currentTile,
            position: newPos,
            orientation: {
              rotationY: currentTile.orientation.rotationY + (type === 'DEPLOY' ? Math.PI / 3 : 0),
            },
            lastUpdated: Date.now(),
          };
          updateTileInState(updatedTile);

          const completedPayload: OperationCompletedPayload = {
            operationId,
            tileId,
            status: 'COMPLETED',
            newTile: { ...updatedTile },
          };
          emit(buildMessage('OPERATION_COMPLETED', completedPayload, { operationId, tileId }));
        }, 1500);
      }, 800);
    }, resolveDelay());

    return operationId;
  },

  /** Simulate disconnection */
  disconnect(): void {
    _connected = false;
    stopIntervals();
  },

  /** Simulate reconnection — re-sends authoritative state */
  reconnect(): ServerMessage {
    _connected = true;
    startSensorSimulation();
    startHeartbeat();
    // Sync message
    const payload: InitialStatePayload = {
      tiles: cloneTiles(),
      serverTime: Date.now(),
    };
    return buildMessage('INITIAL_STATE', payload);
  },

  /** Change simulation mode for demo purposes */
  setSimulationMode(mode: SimulationMode): void {
    _simulationMode = mode;
  },

  isConnected(): boolean {
    return _connected;
  },

  /** Force specific sensor state for demo */
  injectStaleSensor(tileId: string, sideId: SideId): void {
    _tiles = _tiles.map(t => {
      if (t.id !== tileId) return t;
      return {
        ...t,
        sides: t.sides.map(s => {
          if (s.id !== sideId) return s;
          return {
            ...s,
            sensor: s.sensor
              ? { ...s.sensor, timestamp: Date.now() - 20000, isStale: true }
              : null,
          };
        }),
      };
    });
  },

  injectUnknownSensor(tileId: string, sideId: SideId): void {
    _tiles = _tiles.map(t => {
      if (t.id !== tileId) return t;
      return {
        ...t,
        sides: t.sides.map(s => {
          if (s.id !== sideId) return s;
          return { ...s, state: 'UNKNOWN' as SideState, sensor: null };
        }),
      };
    });
  },

  injectOperationFailure(fail = true): void {
    _failNextOperation = fail;
  },

  resetToInitialState(): ServerMessage {
    _tiles = createInitialTiles();
    _failNextOperation = false;
    const payload: InitialStatePayload = {
      tiles: cloneTiles(),
      serverTime: Date.now(),
    };
    return buildMessage('INITIAL_STATE', payload);
  },
};
