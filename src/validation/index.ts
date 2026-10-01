import { z } from 'zod';
import type {
  ServerMessage,
  Tile,
  TileSide,
  SensorReading,
  SideState,
  SideId,
  MessageType,
} from '../types';

// ============================================================
// Zod schemas for runtime validation
// ============================================================

const sideStateSchema = z.enum(['CLEAR', 'CAUTION', 'RISK', 'UNKNOWN']);
const sideIdSchema = z.union([
  z.literal(0), z.literal(1), z.literal(2),
  z.literal(3), z.literal(4), z.literal(5),
]);

const sensorReadingSchema = z.object({
  distance: z.number().nullable(),
  timestamp: z.number(),
  isStale: z.boolean(),
});

const tileSideSchema = z.object({
  id: sideIdSchema,
  label: z.string(),
  state: sideStateSchema,
  sensor: sensorReadingSchema.nullable(),
});

const tilePositionSchema = z.object({
  x: z.number(),
  y: z.number(),
  z: z.number(),
});

const tileOrientationSchema = z.object({
  rotationY: z.number(),
});

const tileSchema = z.object({
  id: z.string(),
  position: tilePositionSchema,
  orientation: tileOrientationSchema,
  sides: z.array(tileSideSchema),
  label: z.string(),
  lastUpdated: z.number(),
});

const messageTypeSchema = z.enum([
  'INITIAL_STATE',
  'TILE_STATE_UPDATE',
  'SENSOR_UPDATE',
  'OPERATION_ACKNOWLEDGED',
  'OPERATION_EXECUTING',
  'OPERATION_COMPLETED',
  'OPERATION_FAILED',
  'HEARTBEAT',
]);

const serverMessageSchema = z.object({
  messageType: messageTypeSchema,
  sequenceNumber: z.number(),
  timestamp: z.number(),
  operationId: z.string().optional(),
  tileId: z.string().optional(),
  sideId: sideIdSchema.optional(),
  payload: z.unknown(),
});

// ============================================================
// Validation functions
// ============================================================

export function validateServerMessage(raw: unknown): ServerMessage | null {
  const result = serverMessageSchema.safeParse(raw);
  if (!result.success) {
    console.warn('[Validation] Invalid server message:', result.error.issues);
    return null;
  }
  return result.data as ServerMessage;
}

export function validateTile(raw: unknown): Tile | null {
  const result = tileSchema.safeParse(raw);
  if (!result.success) {
    console.warn('[Validation] Invalid tile:', result.error.issues);
    return null;
  }
  return result.data as Tile;
}

export function validateSensorReading(raw: unknown): SensorReading | null {
  const result = sensorReadingSchema.safeParse(raw);
  if (!result.success) {
    console.warn('[Validation] Invalid sensor reading:', result.error.issues);
    return null;
  }
  return result.data as SensorReading;
}

export function isSensorStale(sensor: SensorReading, staleThresholdMs = 10000): boolean {
  const age = Date.now() - sensor.timestamp;
  return age > staleThresholdMs;
}

export function getSensorFreshnessLabel(sensor: SensorReading): string {
  const age = (Date.now() - sensor.timestamp) / 1000;
  if (age < 5) return 'LIVE';
  if (age < 15) return `${age.toFixed(1)}s ago`;
  return `STALE — ${age.toFixed(1)}s ago`;
}

export function getSensorFreshnessClass(sensor: SensorReading): 'live' | 'warning' | 'stale' {
  const age = Date.now() - sensor.timestamp;
  if (age < 5000) return 'live';
  if (age < 10000) return 'warning';
  return 'stale';
}
