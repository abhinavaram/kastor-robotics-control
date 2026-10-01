import { useState } from 'react';
import { ChevronDown, ChevronUp, Cpu, Zap, RotateCcw, AlertOctagon } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useKastorStore } from '../state/store';
import { MockServer } from '../mock-server/MockServer';
import type { SimulationMode, SideId } from '../types';

interface SimButton {
  mode: SimulationMode | 'STALE_INJECT' | 'UNKNOWN_INJECT' | 'DISCONNECT' | 'RECONNECT' | 'FAIL_NEXT' | 'RESET';
  label: string;
  desc: string;
  cls: string;
}

const BUTTONS: SimButton[] = [
  { mode: 'NORMAL', label: 'NORMAL', desc: 'Standard low-latency operation', cls: 'sim-normal' },
  { mode: 'DELAYED', label: 'DELAYED MSG (3s)', desc: 'Server replies with 3-5s network latency', cls: 'sim-delayed' },
  { mode: 'DUPLICATE', label: 'DUPLICATE MSG', desc: 'Server sends duplicate message packets to test dedup', cls: 'sim-dup' },
  { mode: 'OUT_OF_ORDER', label: 'OUT-OF-ORDER', desc: 'Messages arrive out of sequence to test reordering', cls: 'sim-oop' },
  { mode: 'FAIL_NEXT', label: 'INJECT OP FAILURE', desc: 'Next MOVE/DEPLOY will be rejected by safety supervisor to test rollback', cls: 'sim-fail' },
  { mode: 'STALE_INJECT', label: 'STALE SENSOR', desc: 'Force T-04 Side 3 to go stale (> 12s)', cls: 'sim-stale' },
  { mode: 'UNKNOWN_INJECT', label: 'UNKNOWN SENSOR', desc: 'Remove telemetry from T-03 Side 1', cls: 'sim-unknown' },
  { mode: 'DISCONNECT', label: 'DISCONNECT', desc: 'Simulate full server loss / communications blackout', cls: 'sim-disconnect' },
  { mode: 'RECONNECT', label: 'RECONNECT', desc: 'Recover connection and resync authoritative state', cls: 'sim-reconnect' },
  { mode: 'RESET', label: 'RESET CHAIN', desc: 'Reset tiles to default linear chain configuration', cls: 'sim-reset' },
];

export function SimulationControls() {
  const [open, setOpen] = useState(false);
  const [failInjected, setFailInjected] = useState(false);
  const {
    simulationMode,
    setSimulationMode,
    disconnect,
    reconnect,
    connectionState,
    confirmedTiles,
    initServer,
  } = useKastorStore();

  const handleClick = (mode: SimButton['mode']) => {
    if (mode === 'DISCONNECT') {
      disconnect();
    } else if (mode === 'RECONNECT') {
      reconnect();
    } else if (mode === 'FAIL_NEXT') {
      MockServer.injectOperationFailure(true);
      setFailInjected(true);
    } else if (mode === 'STALE_INJECT') {
      const tile = confirmedTiles['T-04'] || Object.values(confirmedTiles)[0];
      if (tile) MockServer.injectStaleSensor(tile.id, 2 as SideId);
      setSimulationMode('STALE_SENSOR');
    } else if (mode === 'UNKNOWN_INJECT') {
      const tile = confirmedTiles['T-03'] || Object.values(confirmedTiles)[0];
      if (tile) MockServer.injectUnknownSensor(tile.id, 0 as SideId);
      setSimulationMode('UNKNOWN_SENSOR');
    } else if (mode === 'RESET') {
      MockServer.resetToInitialState();
      initServer();
      setFailInjected(false);
    } else {
      setSimulationMode(mode as SimulationMode);
    }
  };

  return (
    <div className="sim-controls">
      <button
        className="sim-toggle"
        onClick={() => setOpen(o => !o)}
      >
        <Cpu size={12} />
        <span>SIMULATION & FAILURE TESTING</span>
        {failInjected && <span className="fail-flag-badge">FAIL ARMED</span>}
        {open ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            className="sim-panel"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <div className="sim-grid">
              {BUTTONS.map(btn => (
                <button
                  key={btn.mode}
                  className={`sim-btn ${btn.cls} ${simulationMode === btn.mode ? 'sim-btn-active' : ''}`}
                  onClick={() => handleClick(btn.mode)}
                  title={btn.desc}
                >
                  {btn.mode === 'RESET' ? <RotateCcw size={10} /> : btn.mode === 'FAIL_NEXT' ? <AlertOctagon size={10} /> : <Zap size={10} />}
                  <span>{btn.label}</span>
                </button>
              ))}
            </div>
            <div className="sim-note">
              Active mode: <strong>{simulationMode}</strong> · Link: <strong>{connectionState}</strong>
              {failInjected && <span className="text-rose-400 ml-2">⚠ NEXT OPERATION WILL TRIGGER SAFETY REJECTION & ROLLBACK</span>}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
