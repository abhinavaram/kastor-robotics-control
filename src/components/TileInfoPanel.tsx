import { useEffect, useState } from 'react';
import {
  AlertCircle, CheckCircle, AlertTriangle, HelpCircle,
  Radio, Clock, Activity, Sliders, Play, Cpu, Compass, Rotate3d
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useKastorStore } from '../state/store';
import type { SideState, TileSide, SensorReading, SideId } from '../types';
import { getSensorFreshnessLabel, getSensorFreshnessClass } from '../validation';
import { TileSingleViewer3D } from './TileSingleViewer3D';

const STATE_CONFIG: Record<SideState, { icon: React.ReactNode; label: string; cls: string; color: string }> = {
  CLEAR: { icon: <CheckCircle size={13} />, label: 'CLEAR', cls: 'state-clear', color: '#10b981' },
  CAUTION: { icon: <AlertTriangle size={13} />, label: 'CAUTION', cls: 'state-caution', color: '#f59e0b' },
  RISK: { icon: <AlertCircle size={13} />, label: 'RISK', cls: 'state-risk', color: '#ef4444' },
  UNKNOWN: { icon: <HelpCircle size={13} />, label: 'UNKNOWN', cls: 'state-unknown', color: '#64748b' },
};

function SensorDetail({ sensor, state, sideLabel }: { sensor: SensorReading | null; state: SideState; sideLabel: string }) {
  const [, forceUpdate] = useState(0);

  useEffect(() => {
    const id = setInterval(() => forceUpdate(n => n + 1), 500);
    return () => clearInterval(id);
  }, []);

  if (!sensor || sensor.distance === null || state === 'UNKNOWN') {
    return (
      <div className="sensor-missing">
        <HelpCircle size={18} className="text-slate-400" />
        <div>
          <div className="sensor-missing-title">SENSOR DATA UNAVAILABLE</div>
          <div className="sensor-missing-sub">No valid telemetry received. Do not assume clearance.</div>
        </div>
      </div>
    );
  }

  const freshnessClass = getSensorFreshnessClass(sensor);
  const freshnessLabel = getSensorFreshnessLabel(sensor);
  const isStale = freshnessClass === 'stale';

  // Distance range percentage (0m to 5m)
  const distPercent = Math.min(Math.max((sensor.distance / 4.5) * 100, 4), 100);
  const barColor = state === 'RISK' ? '#ef4444' : state === 'CAUTION' ? '#f59e0b' : '#10b981';

  return (
    <div className={`sensor-detail ${isStale ? 'sensor-stale' : ''}`}>
      <div className="sensor-main-row">
        <div>
          <div className="sensor-facet-label">LiDAR RANGEFINDER · {sideLabel}</div>
          <div className="sensor-distance">
            <span className="sensor-distance-val">{sensor.distance.toFixed(2)}</span>
            <span className="sensor-distance-unit">m</span>
          </div>
        </div>

        <div className={`sensor-freshness freshness-${freshnessClass}`}>
          <Clock size={11} />
          <span>{freshnessLabel}</span>
          {isStale && <span className="stale-badge">STALE</span>}
        </div>
      </div>

      {/* Visual Distance Gauge Bar */}
      <div className="sensor-bar-container">
        <div
          className="sensor-bar-fill"
          style={{ width: `${distPercent}%`, backgroundColor: barColor }}
        />
        <div className="sensor-bar-threshold" style={{ left: '20%' }} title="Critical Risk Threshold (0.5m)" />
        <div className="sensor-bar-threshold" style={{ left: '40%' }} title="Caution Threshold (1.5m)" />
      </div>
      <div className="sensor-bar-legend">
        <span>0m (Impact)</span>
        <span>0.5m (Risk)</span>
        <span>1.5m (Caution)</span>
        <span>4.5m+</span>
      </div>

      {isStale && (
        <div className="stale-warning">
          <AlertTriangle size={13} />
          <span>STALE SENSOR: Reading exceeds 12s timeout. Hardware ping required.</span>
        </div>
      )}
    </div>
  );
}

function SideButton({ side, isSelected, onClick }: {
  side: TileSide;
  isSelected: boolean;
  onClick: () => void;
}) {
  const cfg = STATE_CONFIG[side.state];
  return (
    <button
      className={`side-btn ${cfg.cls} ${isSelected ? 'side-btn-selected' : ''}`}
      onClick={onClick}
      title={`Side ${side.label} (${side.state}): ${side.sensor?.distance ? `${side.sensor.distance.toFixed(2)}m` : 'No reading'}`}
    >
      <span className="side-btn-label">{side.label}</span>
      <span className="side-btn-icon">{cfg.icon}</span>
      <span className="side-btn-state">{cfg.label}</span>
      {side.sensor?.distance && (
        <span className="side-btn-dist">{side.sensor.distance.toFixed(1)}m</span>
      )}
    </button>
  );
}

export function TileInfoPanel() {
  const {
    confirmedTiles,
    selectedTileId,
    selectedSideId,
    selectTile,
    selectSide,
    connectionState,
    pendingOperation,
    sendOperation,
  } = useKastorStore();

  const [panelViewMode, setPanelViewMode] = useState<'3D_360' | 'SCHEMATIC'>('3D_360');

  const tile = selectedTileId ? confirmedTiles[selectedTileId] : null;
  const side = tile && selectedSideId !== null
    ? tile.sides.find((s: TileSide) => s.id === selectedSideId)
    : null;

  const isConnected = connectionState === 'CONNECTED';
  const isPending = pendingOperation !== null &&
    ['PENDING', 'ACKNOWLEDGED', 'EXECUTING'].includes(pendingOperation.status);
  const canCommand = isConnected && !isPending;

  const handleSendOperation = async (type: 'MOVE' | 'DEPLOY') => {
    if (!tile || !canCommand) return;
    await sendOperation(type, tile.id);
  };

  if (!tile) {
    return (
      <div className="panel panel-info">
        <div className="panel-empty">
          <div className="empty-hex-icon">
            <Rotate3d size={32} />
          </div>
          <h3>NO TILE SELECTED</h3>
          <p>Select any hexagonal tile in the 3D chain to inspect in 360° detail, review telemetry, and issue commands.</p>
          <div className="empty-quick-select">
            <span>QUICK SELECT:</span>
            {Object.keys(confirmedTiles).map(id => (
              <button key={id} className="btn-quick-tile" onClick={() => selectTile(id)}>
                {id}
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const isEndEffector = tile.id === 'T-06';
  const isBaseAnchor = tile.id === 'T-01';
  const roleTitle = isEndEffector
    ? 'ORBITAL DEBRIS GRAPPLE MODULE'
    : isBaseAnchor
      ? 'BASE STATION ANCHOR MODULE'
      : 'ARTICULATED HEXAGONAL LINK';

  return (
    <AnimatePresence mode="wait">
      <motion.div
        className="panel panel-info"
        key={tile.id}
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: 20 }}
        transition={{ duration: 0.2 }}
      >
        {/* Tile header */}
        <div className="tile-header">
          <div className="tile-header-left">
            <span className="tile-id-badge">{tile.id}</span>
            <span className="tile-role-tag">{roleTitle}</span>
          </div>
          <button className="btn-icon" onClick={() => selectTile(null)} title="Deselect tile">
            ✕
          </button>
        </div>

        {/* 360° Movable 3D Tile Inspector / Schematic Switcher */}
        <div className="tile-view-card">
          <div className="tile-view-tabs">
            <button
              className={`view-tab ${panelViewMode === '3D_360' ? 'active' : ''}`}
              onClick={() => setPanelViewMode('3D_360')}
            >
              <Rotate3d size={12} />
              <span>360° 3D INSPECTOR</span>
            </button>
            <button
              className={`view-tab ${panelViewMode === 'SCHEMATIC' ? 'active' : ''}`}
              onClick={() => setPanelViewMode('SCHEMATIC')}
            >
              <Cpu size={12} />
              <span>HUD BLUEPRINT</span>
            </button>
          </div>

          <div className="tile-view-body">
            {panelViewMode === '3D_360' ? (
              <TileSingleViewer3D
                tile={tile}
                selectedSideId={selectedSideId}
                onSideClick={(sideId: SideId) => selectSide(sideId === selectedSideId ? null : sideId)}
              />
            ) : (
              <div className="schematic-view-container">
                <img
                  src="/assets/kastor_hex_blueprint.jpg"
                  alt="KASTOR Blueprint"
                  className="schematic-img"
                />
                <div className="schematic-overlay-tag">
                  TECHNICAL BLUEPRINT · SCATTER RADAR & DOCKING NODES
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Quick status telemetry row */}
        <div className="tile-stats-row">
          <div className="stat-pill">
            <span className="stat-lbl">CORE TEMP</span>
            <span className="stat-val">24.1°C</span>
          </div>
          <div className="stat-pill">
            <span className="stat-lbl">BUS VOLTAGE</span>
            <span className="stat-val">28.4 V</span>
          </div>
          <div className="stat-pill">
            <span className="stat-lbl">SWARM LINK</span>
            <span className="stat-val text-emerald-400">99.8%</span>
          </div>
        </div>

        {/* Six Hexagonal Sides Selector */}
        <div className="section-label">
          <Activity size={11} />
          SIX HEXAGONAL SIDES (FACETS)
        </div>
        <div className="sides-grid">
          {tile.sides.map((s: TileSide) => (
            <SideButton
              key={s.id}
              side={s}
              isSelected={selectedSideId === s.id}
              onClick={() => selectSide(s.id === selectedSideId ? null : s.id)}
            />
          ))}
        </div>

        {/* Selected side detail */}
        <AnimatePresence mode="wait">
          {side && (
            <motion.div
              key={`side-${side.id}`}
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.18 }}
              className="side-detail-section"
            >
              <div className="section-label">
                <Radio size={11} />
                FACET TELEMETRY — {tile.id} / SIDE {side.label}
              </div>
              <div className="side-telemetry-header">
                <div className={`state-badge ${STATE_CONFIG[side.state].cls}`}>
                  {STATE_CONFIG[side.state].icon}
                  <span>{STATE_CONFIG[side.state].label}</span>
                </div>
                <span className="side-facing-info">
                  {side.id === 1 ? '▲ FACING DEBRIS ZONE' : side.id === 4 ? '▼ DOCKED TO BASE CHAIN' : '◆ FLANKING SENSOR'}
                </span>
              </div>
              <SensorDetail sensor={side.sensor} state={side.state} sideLabel={side.label} />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Operation Controls */}
        <div className="section-label" style={{ marginTop: '14px' }}>
          <Sliders size={11} />
          OPERATIONS & CHAIN CONTROL
        </div>

        {/* Pending state banner with server confirmation flow */}
        {isPending && pendingOperation && (
          <motion.div
            className={`pending-banner pending-${pendingOperation.status.toLowerCase()}`}
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="pending-title">
              {pendingOperation.status === 'PENDING' && '⏳ PENDING SERVER CONFIRMATION'}
              {pendingOperation.status === 'ACKNOWLEDGED' && '✓ ACKNOWLEDGED BY CENTRAL SERVER'}
              {pendingOperation.status === 'EXECUTING' && '⚙️ EXECUTING ON TILE HARDWARE…'}
            </div>
            <div className="pending-sub">
              Command: {pendingOperation.type} · Target: {pendingOperation.tileId}
            </div>
            <div className="pending-note">
              Tile position will NOT update until authoritative server confirms execution.
            </div>
          </motion.div>
        )}

        {pendingOperation?.status === 'COMPLETED' && (
          <motion.div
            className="pending-banner pending-completed"
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="pending-title">✅ OPERATION CONFIRMED</div>
            <div className="pending-sub">Authoritative state broadcasted. 3D view updated.</div>
          </motion.div>
        )}

        {pendingOperation?.status === 'FAILED' && (
          <motion.div
            className="pending-banner pending-failed"
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="pending-title">❌ SAFETY ABORT / REJECTED</div>
            <div className="pending-sub">{pendingOperation.error}</div>
            <div className="pending-note">Optimistic state safely rolled back to confirmed state.</div>
          </motion.div>
        )}

        <div className="op-buttons">
          <button
            id="btn-move"
            className={`btn-op btn-move ${!canCommand ? 'btn-disabled' : ''}`}
            onClick={() => handleSendOperation('MOVE')}
            disabled={!canCommand}
            title={!isConnected ? 'Disabled: server disconnected' : isPending ? 'Operation in progress' : 'Command tile to step along chain track toward Debris Zone'}
          >
            <Play size={13} />
            <span>MOVE / ADVANCE</span>
          </button>
          <button
            id="btn-deploy"
            className={`btn-op btn-deploy ${!canCommand ? 'btn-disabled' : ''}`}
            onClick={() => handleSendOperation('DEPLOY')}
            disabled={!canCommand}
            title={!isConnected ? 'Disabled: server disconnected' : isPending ? 'Operation in progress' : 'Deploy grapple/probe or reconfigure latch'}
          >
            <Cpu size={13} />
            <span>DEPLOY / LATCH</span>
          </button>
        </div>

        {!isConnected && (
          <div className="op-disabled-reason">
            <AlertTriangle size={12} />
            Commands disabled — connection to KASTOR server lost
          </div>
        )}
      </motion.div>
    </AnimatePresence>
  );
}
