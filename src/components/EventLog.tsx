import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Info, AlertTriangle, CheckCircle, XCircle, Activity } from 'lucide-react';
import { useKastorStore } from '../state/store';
import type { EventLogEntry } from '../types';

const ICONS: Record<EventLogEntry['type'], React.ReactNode> = {
  INFO: <Info size={10} />,
  WARNING: <AlertTriangle size={10} />,
  ERROR: <XCircle size={10} />,
  SUCCESS: <CheckCircle size={10} />,
  OPERATION: <Activity size={10} />,
};

function formatAge(ts: number): string {
  const s = (Date.now() - ts) / 1000;
  if (s < 60) return `${s.toFixed(0)}s ago`;
  return `${(s / 60).toFixed(1)}m ago`;
}

export function EventLog() {
  const { eventLog } = useKastorStore();
  const [, forceUpdate] = useState(0);

  useEffect(() => {
    const id = setInterval(() => forceUpdate(n => n + 1), 5000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="event-log">
      <div className="event-log-header">
        <Activity size={11} />
        SYSTEM LOG
      </div>
      <div className="event-log-entries">
        <AnimatePresence initial={false}>
          {eventLog.slice(0, 8).map((entry: EventLogEntry) => (
            <motion.div
              key={entry.id}
              className={`log-entry log-${entry.type.toLowerCase()}`}
              initial={{ opacity: 0, y: -8, height: 0 }}
              animate={{ opacity: 1, y: 0, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.15 }}
            >
              <span className="log-icon">{ICONS[entry.type]}</span>
              <span className="log-msg">{entry.message}</span>
              <span className="log-time">{formatAge(entry.timestamp)}</span>
            </motion.div>
          ))}
        </AnimatePresence>
        {eventLog.length === 0 && (
          <div className="log-empty">No events yet</div>
        )}
      </div>
    </div>
  );
}
