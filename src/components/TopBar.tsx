import { Server, Activity, Layers } from 'lucide-react';
import { useKastorStore } from '../state/store';

export function TopBar() {
  const { confirmedTiles, pendingOperation, simulationMode } = useKastorStore();
  const tileCount = Object.keys(confirmedTiles).length;
  const activeOps = pendingOperation && ['PENDING', 'ACKNOWLEDGED', 'EXECUTING'].includes(pendingOperation.status) ? 1 : 0;
  const now = new Date().toLocaleTimeString('en-US', { hour12: false });

  return (
    <header className="topbar">
      <div className="topbar-left">
        <div className="topbar-logo">
          <div className="logo-mark" />
          <div>
            <div className="logo-title">KASTOR</div>
            <div className="logo-sub">MODULAR ROBOTICS CONTROL SYSTEM</div>
          </div>
        </div>
      </div>

      <div className="topbar-center">
        <div className="telemetry-item">
          <Layers size={11} />
          <span>TILES</span>
          <strong>{tileCount} / 30 simulated</strong>
        </div>
        <div className="telemetry-divider" />
        <div className="telemetry-item">
          <Activity size={11} />
          <span>OPS</span>
          <strong>{activeOps} ACTIVE</strong>
        </div>
        <div className="telemetry-divider" />
        <div className="telemetry-item">
          <Server size={11} />
          <span>SERVER</span>
          <strong>SIMULATED</strong>
        </div>
        <div className="telemetry-divider" />
        <div className="telemetry-item">
          <span>MODE</span>
          <strong>{simulationMode}</strong>
        </div>
      </div>

      <div className="topbar-right">
        <div className="telemetry-item">
          <span className="topbar-time">{now}</span>
        </div>
        <div className="nyu-badge">NYU CUSP</div>
      </div>
    </header>
  );
}
