import { useEffect, useState } from 'react';
import { Wifi, WifiOff, RefreshCw, AlertTriangle } from 'lucide-react';
import { useKastorStore } from '../state/store';

export function ConnectionBanner() {
  const { connectionState, reconnect } = useKastorStore();
  const [blink, setBlink] = useState(true);

  useEffect(() => {
    const id = setInterval(() => setBlink(b => !b), 800);
    return () => clearInterval(id);
  }, []);

  if (connectionState === 'CONNECTED') {
    return (
      <div className="conn-badge conn-connected">
        <Wifi size={12} />
        <span>CONNECTED TO KASTOR</span>
      </div>
    );
  }

  if (connectionState === 'RECONNECTING') {
    return (
      <div className="conn-badge conn-reconnecting">
        <RefreshCw size={12} className="spin" />
        <span>RECONNECTING…</span>
      </div>
    );
  }

  return (
    <div className="conn-warning">
      <div className="conn-badge conn-disconnected" style={{ opacity: blink ? 1 : 0.6 }}>
        <WifiOff size={12} />
        <span>DISCONNECTED</span>
      </div>
      <div className="conn-warning-detail">
        <AlertTriangle size={11} />
        <span>CONNECTION UNAVAILABLE — LIVE UPDATES TEMPORARILY UNAVAILABLE — SHOWING LAST SERVER-CONFIRMED STATE</span>
      </div>
      <button className="btn-sm btn-reconnect" onClick={reconnect}>
        <RefreshCw size={11} />
        RECONNECT
      </button>
    </div>
  );
}
