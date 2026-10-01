import { create } from 'zustand';
import type {
  KastorAppState,
  Tile,
  SideId,
  Operation,
  OperationType,
  ServerMessage,
  SimulationMode,
  EventLogEntry,
  TilePosition,
  InitialStatePayload,
  TileStateUpdatePayload,
  SensorUpdatePayload,
  OperationCompletedPayload,
} from '../types';
import { MockServer } from '../mock-server/MockServer';
import { validateServerMessage } from '../validation';

// ============================================================
// Event log helpers
// ============================================================

function makeLogEntry(
  type: EventLogEntry['type'],
  message: string
): EventLogEntry {
  return {
    id: `log-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    timestamp: Date.now(),
    type,
    message,
  };
}

// ============================================================
// Zustand store
// ============================================================

interface KastorStore extends KastorAppState {
  // Actions
  initServer: () => void;
  selectTile: (tileId: string | null) => void;
  selectSide: (sideId: SideId | null) => void;
  sendOperation: (type: OperationType, tileId: string, targetPosition?: TilePosition) => Promise<void>;
  disconnect: () => void;
  reconnect: () => void;
  setSimulationMode: (mode: SimulationMode) => void;
  processServerMessage: (msg: ServerMessage) => void;
  _addLog: (type: EventLogEntry['type'], message: string) => void;
  // Animated tile positions (from → to for confirmed moves)
  animatingTiles: Record<string, { from: TilePosition; to: TilePosition; startTime: number }>;
}

export const useKastorStore = create<KastorStore>((set, get) => ({
  // ── Initial State ──────────────────────────────────────────
  confirmedTiles: {},
  pendingOperation: null,
  connectionState: 'DISCONNECTED',
  selectedTileId: null,
  selectedSideId: null,
  processedMessageSequences: new Set(),
  tileVersions: {},
  simulationMode: 'NORMAL',
  eventLog: [],
  animatingTiles: {},

  // ── Init ───────────────────────────────────────────────────
  initServer: () => {
    MockServer.subscribe((msg) => {
      get().processServerMessage(msg);
    });
    MockServer.connect();

    const initMsg = MockServer.getInitialState();
    set({ connectionState: 'CONNECTED' });
    get().processServerMessage(initMsg);
    get()._addLog('INFO', 'Connected to KASTOR server. Received initial state.');
  },

  // ── Selection ──────────────────────────────────────────────
  selectTile: (tileId) => set({ selectedTileId: tileId, selectedSideId: null }),
  selectSide: (sideId) => set({ selectedSideId: sideId }),

  // ── Operations ─────────────────────────────────────────────
  sendOperation: async (type, tileId, targetPosition) => {
    const { connectionState, confirmedTiles } = get();
    if (connectionState !== 'CONNECTED') {
      get()._addLog('ERROR', 'Cannot send operation: server disconnected.');
      return;
    }

    const tile = confirmedTiles[tileId];
    if (!tile) {
      get()._addLog('ERROR', `Cannot send operation: tile ${tileId} not found.`);
      return;
    }

    const operationId = await MockServer.sendOperation(type, tileId, targetPosition);

    const operation: Operation = {
      id: operationId,
      type,
      tileId,
      targetPosition,
      status: 'PENDING',
      requestedAt: Date.now(),
    };

    set({ pendingOperation: operation });
    get()._addLog('OPERATION', `${type} requested for ${tileId} — PENDING server confirmation.`);
  },

  // ── Disconnect ─────────────────────────────────────────────
  disconnect: () => {
    MockServer.disconnect();
    set({ connectionState: 'DISCONNECTED' });
    get()._addLog('WARNING', 'Disconnected from KASTOR server. Commands disabled.');
  },

  // ── Reconnect ──────────────────────────────────────────────
  reconnect: () => {
    set({ connectionState: 'RECONNECTING' });
    get()._addLog('INFO', 'Attempting to reconnect to KASTOR server…');

    setTimeout(() => {
      const syncMsg = MockServer.reconnect();
      set({ connectionState: 'CONNECTED' });
      get()._addLog('SUCCESS', 'Reconnected. Synchronizing server-confirmed state…');
      get().processServerMessage(syncMsg);
    }, 1200);
  },

  // ── Simulation mode ────────────────────────────────────────
  setSimulationMode: (mode) => {
    MockServer.setSimulationMode(mode);
    set({ simulationMode: mode });
    get()._addLog('INFO', `Simulation mode set to: ${mode}`);
  },

  // ── Message processor ──────────────────────────────────────
  processServerMessage: (msg: ServerMessage) => {
    const validated = validateServerMessage(msg);
    if (!validated) {
      get()._addLog('ERROR', 'Received invalid server message — ignored.');
      return;
    }

    const { processedMessageSequences, tileVersions, pendingOperation } = get();

    // Dedup: ignore already-processed sequence numbers
    if (processedMessageSequences.has(validated.sequenceNumber)) {
      get()._addLog('WARNING', `Duplicate message seq#${validated.sequenceNumber} — ignored.`);
      return;
    }

    // Update processed set (immutable copy)
    const newProcessed = new Set(processedMessageSequences);
    newProcessed.add(validated.sequenceNumber);

    switch (validated.messageType) {
      case 'INITIAL_STATE': {
        const payload = validated.payload as InitialStatePayload;
        const tilesMap: Record<string, Tile> = {};
        const newVersions: Record<string, number> = {};
        for (const t of payload.tiles) {
          tilesMap[t.id] = t;
          newVersions[t.id] = validated.sequenceNumber;
        }
        set({
          confirmedTiles: tilesMap,
          tileVersions: newVersions,
          processedMessageSequences: newProcessed,
        });
        break;
      }

      case 'TILE_STATE_UPDATE': {
        const payload = validated.payload as TileStateUpdatePayload;
        const currentVersion = tileVersions[payload.tile.id] ?? -1;
        // Out-of-order check: ignore if we have a newer version
        if (payload.version <= currentVersion) {
          get()._addLog('WARNING', `Out-of-order update for ${payload.tile.id} v${payload.version} (have v${currentVersion}) — ignored.`);
          return;
        }
        set(state => ({
          confirmedTiles: { ...state.confirmedTiles, [payload.tile.id]: payload.tile },
          tileVersions: { ...state.tileVersions, [payload.tile.id]: payload.version },
          processedMessageSequences: newProcessed,
        }));
        break;
      }

      case 'SENSOR_UPDATE': {
        const payload = validated.payload as SensorUpdatePayload;
        set(state => {
          const tile = state.confirmedTiles[payload.tileId];
          if (!tile) return { processedMessageSequences: newProcessed };
          const updatedTile: Tile = {
            ...tile,
            sides: tile.sides.map(s =>
              s.id === payload.sideId ? { ...s, sensor: payload.sensor } : s
            ),
            lastUpdated: Date.now(),
          };
          return {
            confirmedTiles: { ...state.confirmedTiles, [payload.tileId]: updatedTile },
            processedMessageSequences: newProcessed,
          };
        });
        break;
      }

      case 'OPERATION_ACKNOWLEDGED': {
        const payload = validated.payload as { operationId: string; tileId: string; status: string };
        if (pendingOperation?.id === payload.operationId) {
          set(state => ({
            pendingOperation: state.pendingOperation
              ? { ...state.pendingOperation, status: 'ACKNOWLEDGED' }
              : null,
            processedMessageSequences: newProcessed,
          }));
          get()._addLog('INFO', `Operation ${payload.operationId.slice(0, 12)} ACKNOWLEDGED by server.`);
        }
        break;
      }

      case 'OPERATION_EXECUTING': {
        const payload = validated.payload as { operationId: string; tileId: string; status: string };
        if (pendingOperation?.id === payload.operationId) {
          set(state => ({
            pendingOperation: state.pendingOperation
              ? { ...state.pendingOperation, status: 'EXECUTING' }
              : null,
            processedMessageSequences: newProcessed,
          }));
          get()._addLog('OPERATION', `Operation ${payload.operationId.slice(0, 12)} EXECUTING on tile.`);
        }
        break;
      }

      case 'OPERATION_COMPLETED': {
        const payload = validated.payload as OperationCompletedPayload;
        if (pendingOperation?.id === payload.operationId) {
          const prevTile = get().confirmedTiles[payload.tileId];
          const prevPos = prevTile?.position;
          const newPos = payload.newTile.position;

          // Record animation
          const newAnimating = { ...get().animatingTiles };
          if (prevPos && newPos) {
            newAnimating[payload.tileId] = {
              from: prevPos,
              to: newPos,
              startTime: Date.now(),
            };
          }

          set(state => ({
            confirmedTiles: { ...state.confirmedTiles, [payload.tileId]: payload.newTile },
            pendingOperation: state.pendingOperation
              ? { ...state.pendingOperation, status: 'COMPLETED', completedAt: Date.now() }
              : null,
            animatingTiles: newAnimating,
            processedMessageSequences: newProcessed,
          }));
          get()._addLog('SUCCESS', `Operation COMPLETED. ${payload.tileId} position confirmed by server.`);

          // Clear animation entry after animation is done
          setTimeout(() => {
            set(state => {
              const updated = { ...state.animatingTiles };
              delete updated[payload.tileId];
              return { animatingTiles: updated };
            });
          }, 1800);
        }
        break;
      }

      case 'OPERATION_FAILED': {
        const payload = validated.payload as { operationId: string; tileId: string; status: string; error: string };
        if (pendingOperation?.id === payload.operationId) {
          set(state => ({
            pendingOperation: state.pendingOperation
              ? { ...state.pendingOperation, status: 'FAILED', error: payload.error }
              : null,
            processedMessageSequences: newProcessed,
          }));
          get()._addLog('ERROR', `Operation FAILED: ${payload.error}`);
        }
        break;
      }

      case 'HEARTBEAT':
        set({ processedMessageSequences: newProcessed });
        break;

      default:
        set({ processedMessageSequences: newProcessed });
    }
  },

  // ── Internal log helper ────────────────────────────────────
  _addLog: (type: EventLogEntry['type'], message: string) => {
    const entry = makeLogEntry(type, message);
    set(state => ({
      eventLog: [entry, ...state.eventLog].slice(0, 50),
    }));
  },
} as KastorStore));
