import React, { useEffect } from 'react';
import { TopBar } from './components/TopBar';
import { SceneViewport } from './components/SceneViewport';
import { TileInfoPanel } from './components/TileInfoPanel';
import { ConnectionBanner } from './components/ConnectionBanner';
import { EventLog } from './components/EventLog';
import { SimulationControls } from './components/SimulationControls';
import { useKastorStore } from './state/store';
import './index.css';

export default function App() {
  const { initServer } = useKastorStore();

  useEffect(() => {
    initServer();
  }, []);

  return (
    <div className="app-root">
      <TopBar />
      <ConnectionBanner />

      <div className="main-layout">
        {/* 3D Scene — center */}
        <main className="scene-area">
          <SceneViewport />
        </main>

        {/* Right panel */}
        <aside className="right-panel">
          <TileInfoPanel />
        </aside>
      </div>

      {/* Bottom bar */}
      <footer className="bottom-bar">
        <EventLog />
        <SimulationControls />
      </footer>
    </div>
  );
}
