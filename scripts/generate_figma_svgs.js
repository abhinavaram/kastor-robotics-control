import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const OUT_DIR_1 = path.resolve(__dirname, '../figma');
const OUT_DIR_2 = path.resolve(__dirname, '../public/figma');

[OUT_DIR_1, OUT_DIR_2].forEach(dir => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
});

// Dimensions
const W = 1440;
const H = 900;
const TOPBAR_H = 52;
const BANNER_H = 32;
const BOTTOM_H = 68;
const MAIN_H = H - TOPBAR_H - BANNER_H - BOTTOM_H; // 748
const LEFT_W = 990;
const RIGHT_W = 450;
const RIGHT_X = LEFT_W;

// Colors
const C = {
  bgRoot: '#020617',
  bgPanel: '#090d16',
  bgSurface: '#0f172a',
  bgCard: '#131d33',
  border: '#1e293b',
  borderBright: '#334155',
  textPrimary: '#f8fafc',
  textSecondary: '#cbd5e1',
  textMuted: '#64748b',
  accent: '#38bdf8',
  accentDark: '#0284c7',
  clear: '#10b981',
  clearBg: 'rgba(16, 185, 129, 0.12)',
  caution: '#f59e0b',
  cautionBg: 'rgba(245, 158, 11, 0.12)',
  risk: '#ef4444',
  riskBg: 'rgba(239, 68, 68, 0.12)',
  unknown: '#64748b',
  unknownBg: 'rgba(100, 116, 139, 0.12)',
};

// Helper: Hexagon path generator centered at (cx, cy) with radius r
function hexPath(cx, cy, r) {
  const pts = [];
  for (let i = 0; i < 6; i++) {
    const angle = (Math.PI / 6) + i * (Math.PI / 3);
    const x = cx + r * Math.cos(angle);
    const y = cy + r * Math.sin(angle);
    pts.push(`${x.toFixed(1)},${y.toFixed(1)}`);
  }
  return `M ${pts.join(' L ')} Z`;
}

// Topbar generator
function renderTopBar(disconnected = false) {
  return `
  <!-- TopBar -->
  <g id="TopBar">
    <rect x="0" y="0" width="${W}" height="${TOPBAR_H}" fill="${C.bgPanel}" />
    <line x1="0" y1="${TOPBAR_H}" x2="${W}" y2="${TOPBAR_H}" stroke="${C.border}" stroke-width="1" />
    
    <!-- Logo & Title -->
    <g id="Logo" transform="translate(20, 12)">
      <rect x="0" y="0" width="28" height="28" rx="6" fill="url(#gradLogo)" />
      <text x="14" y="19" font-family="'JetBrains Mono', monospace" font-size="14" font-weight="800" fill="#ffffff" text-anchor="middle">K</text>
      <text x="38" y="15" font-family="'JetBrains Mono', monospace" font-size="15" font-weight="700" fill="${C.textPrimary}" letter-spacing="1.5">KASTOR</text>
      <text x="38" y="25" font-family="Inter, sans-serif" font-size="8.5" font-weight="600" fill="${C.accent}" letter-spacing="1">MODULAR ROBOTICS INTERFACE · NYU CUSP</text>
    </g>

    <!-- Center System Status Badges -->
    <g id="SystemTelemetryBadges" transform="translate(460, 14)">
      <!-- System Health -->
      <rect x="0" y="0" width="130" height="24" rx="4" fill="${C.bgSurface}" stroke="${C.border}" stroke-width="1" />
      <circle cx="12" cy="12" r="4" fill="${disconnected ? C.risk : C.clear}" />
      <text x="24" y="15" font-family="'JetBrains Mono', monospace" font-size="9" font-weight="600" fill="${C.textSecondary}">${disconnected ? 'SYS: OFFLINE' : 'SYS: NOMINAL'}</text>

      <!-- Active Modules -->
      <rect x="138" y="0" width="120" height="24" rx="4" fill="${C.bgSurface}" stroke="${C.border}" stroke-width="1" />
      <text x="148" y="15" font-family="'JetBrains Mono', monospace" font-size="9" font-weight="600" fill="${C.textMuted}">MODULES: <tspan fill="${C.accent}">6 / 6</tspan></text>

      <!-- Swarm Topology -->
      <rect x="266" y="0" width="160" height="24" rx="4" fill="${C.bgSurface}" stroke="${C.border}" stroke-width="1" />
      <text x="276" y="15" font-family="'JetBrains Mono', monospace" font-size="9" font-weight="600" fill="${C.textMuted}">CHAIN: <tspan fill="${C.clear}">LINEAR (1-TO-1)</tspan></text>
    </g>

    <!-- Top Right Quick Info -->
    <g id="UserStatus" transform="translate(${W - 220}, 14)">
      <rect x="0" y="0" width="200" height="24" rx="4" fill="${C.bgSurface}" stroke="${C.border}" stroke-width="1" />
      <text x="10" y="15" font-family="'JetBrains Mono', monospace" font-size="9" font-weight="600" fill="${C.textMuted}">LATENCY: <tspan fill="${disconnected ? C.risk : C.clear}">${disconnected ? 'TIMEOUT' : '24 ms'}</tspan></text>
      <text x="110" y="15" font-family="'JetBrains Mono', monospace" font-size="9" font-weight="600" fill="${C.textMuted}">FPS: <tspan fill="${C.textPrimary}">60.0</tspan></text>
    </g>
  </g>
  `;
}

// Connection Banner
function renderConnectionBanner(disconnected = false) {
  const y = TOPBAR_H;
  if (disconnected) {
    return `
    <!-- Connection Banner Disconnected -->
    <g id="ConnectionBannerDisconnected" transform="translate(0, ${y})">
      <rect x="0" y="0" width="${W}" height="${BANNER_H}" fill="#4c0519" />
      <line x1="0" y1="${BANNER_H}" x2="${W}" y2="${BANNER_H}" stroke="#f43f5e" stroke-width="1" />
      <circle cx="28" cy="16" r="4.5" fill="#f43f5e" />
      <text x="42" y="20" font-family="'JetBrains Mono', monospace" font-size="10.5" font-weight="700" fill="#ffe4e6" letter-spacing="1">
        ⚠ CONNECTION LOST — COMMUNICATIONS BLACKOUT WITH KASTOR SERVER · COMMANDS LOCKED
      </text>
      <rect x="${W - 130}" y="5" width="110" height="22" rx="3" fill="#9f1239" stroke="#f43f5e" stroke-width="1" />
      <text x="${W - 75}" y="19" font-family="'JetBrains Mono', monospace" font-size="9" font-weight="700" fill="#ffffff" text-anchor="middle">RECONNECTING...</text>
    </g>
    `;
  }

  return `
  <!-- Connection Banner Normal -->
  <g id="ConnectionBannerNormal" transform="translate(0, ${y})">
    <rect x="0" y="0" width="${W}" height="${BANNER_H}" fill="#052e16" />
    <line x1="0" y1="${BANNER_H}" x2="${W}" y2="${BANNER_H}" stroke="#10b981" stroke-width="1" opacity="0.3" />
    <circle cx="28" cy="16" r="4" fill="${C.clear}" />
    <text x="42" y="20" font-family="'JetBrains Mono', monospace" font-size="10" font-weight="600" fill="#d1fae5" letter-spacing="0.8">
      LINK ACTIVE · CENTRAL SERVER SYNCED (HEARTBEAT 120ms · 5.8 GHz SWARM MESH)
    </text>
    <rect x="${W - 140}" y="5" width="120" height="22" rx="3" fill="#064e3b" stroke="#10b981" stroke-width="1" opacity="0.6" />
    <text x="${W - 80}" y="19" font-family="'JetBrains Mono', monospace" font-size="9" font-weight="600" fill="#a7f3d0" text-anchor="middle">SIM: NORMAL</text>
  </g>
  `;
}

// 3D Viewport Generator
function renderViewport(opts = {}) {
  const { selectedTileId = null, selectedSideId = null, isPending = false, isConfirmed = false, disconnected = false } = opts;
  const vy = TOPBAR_H + BANNER_H;

  // Tile positions along isometric chain
  // T-01 (bottom) to T-06 (top close to debris)
  const tiles = [
    { id: 'T-01', role: 'BASE ANCHOR', cx: 495, cy: 590, r: 42, color: '#1e293b' },
    { id: 'T-02', role: 'LINK 1', cx: 495, cy: 505, r: 42, color: '#1e293b' },
    { id: 'T-03', role: 'LINK 2', cx: 495, cy: 420, r: 42, color: '#1e293b' },
    { id: 'T-04', role: 'LINK 3', cx: 495, cy: 335, r: 42, color: '#1e293b' },
    { id: 'T-05', role: 'SENSOR ARRAY', cx: 495, cy: 250, r: 42, color: '#1e293b' },
    { id: 'T-06', role: 'DEBRIS GRAPPLE', cx: 495, cy: isConfirmed ? 145 : 165, r: 45, color: '#0f172a' },
  ];

  return `
  <!-- 3D Scene Viewport -->
  <g id="SceneViewport" transform="translate(0, ${vy})">
    <rect x="0" y="0" width="${LEFT_W}" height="${MAIN_H}" fill="${C.bgRoot}" />
    <line x1="${LEFT_W}" y1="0" x2="${LEFT_W}" y2="${MAIN_H}" stroke="${C.border}" stroke-width="1" />

    <!-- Isometric Space Grid -->
    <g id="FloorGrid" opacity="0.25">
      ${Array.from({ length: 15 }).map((_, i) => `<line x1="80" y1="${i * 50 + 20}" x2="910" y2="${i * 50 + 20}" stroke="${C.borderBright}" stroke-width="1" />`).join('')}
      ${Array.from({ length: 18 }).map((_, i) => `<line x1="${i * 50 + 70}" y1="20" x2="${i * 50 + 70}" y2="720" stroke="${C.borderBright}" stroke-width="1" />`).join('')}
    </g>

    <!-- Star particles -->
    <g id="Starfield" opacity="0.4">
      <circle cx="120" cy="80" r="1" fill="#fff" />
      <circle cx="280" cy="140" r="1.5" fill="#fff" />
      <circle cx="750" cy="90" r="1.2" fill="#38bdf8" />
      <circle cx="840" cy="320" r="1" fill="#fff" />
      <circle cx="160" cy="480" r="1.5" fill="#fff" />
      <circle cx="890" cy="620" r="1.2" fill="#fff" />
    </g>

    <!-- ORBITAL DEBRIS ZONE -->
    <g id="DebrisZone" transform="translate(495, 65)">
      <!-- Hazard Perimeter Hologram -->
      <ellipse cx="0" cy="0" rx="140" ry="42" fill="rgba(244, 63, 94, 0.08)" stroke="#f43f5e" stroke-width="1.5" stroke-dasharray="6,4" />
      <ellipse cx="0" cy="0" rx="160" ry="48" fill="none" stroke="#f59e0b" stroke-width="1" opacity="0.4" />
      
      <!-- Debris Floating Fragments -->
      <!-- Solar panel fragment -->
      <rect x="-60" y="-18" width="40" height="22" rx="2" fill="#1e3a8a" stroke="#3b82f6" stroke-width="1" transform="rotate(-15, -40, -7)" />
      <!-- Metallic fuselage shard -->
      <polygon points="35,-12 60,-5 45,15 20,8" fill="#475569" stroke="#94a3b8" stroke-width="1" />
      <!-- Asteroid rock -->
      <polygon points="-15,10 0,22 15,14 10,-2 -8,2" fill="#334155" stroke="#64748b" stroke-width="1" />

      <!-- Holographic Label -->
      <rect x="-110" y="-45" width="220" height="22" rx="3" fill="rgba(15, 23, 42, 0.9)" stroke="#f43f5e" stroke-width="1" />
      <text x="0" y="-30" font-family="'JetBrains Mono', monospace" font-size="9" font-weight="700" fill="#fb7185" text-anchor="middle">⚠ ORBITAL DEBRIS FIELD [ALPHA-7]</text>
      <text x="0" y="-12" font-family="'JetBrains Mono', monospace" font-size="8" font-weight="600" fill="#fbbf24" text-anchor="middle">
        PROXIMITY: ${isConfirmed ? '0.35m' : '0.48m'} · HIGH IMPACT RISK
      </text>
    </g>

    <!-- Targeting Laser from T-06 to Debris -->
    <g id="TargetingLaser">
      <line x1="495" y1="${isConfirmed ? 120 : 135}" x2="495" y2="75" stroke="#f43f5e" stroke-width="2" stroke-dasharray="4,2" />
      <polygon points="495,75 490,85 500,85" fill="#f43f5e" />
    </g>

    <!-- Sequential Connection Conduits between Hex Tiles -->
    <g id="ConnectionChainConduits">
      <!-- T-01 to T-02 -->
      <line x1="495" y1="590" x2="495" y2="505" stroke="${C.accent}" stroke-width="4" opacity="0.8" />
      <circle cx="495" cy="547" r="7" fill="#0f172a" stroke="${C.accent}" stroke-width="2" />
      <!-- T-02 to T-03 -->
      <line x1="495" y1="505" x2="495" y2="420" stroke="${C.accent}" stroke-width="4" opacity="0.8" />
      <circle cx="495" cy="462" r="7" fill="#0f172a" stroke="${C.accent}" stroke-width="2" />
      <!-- T-03 to T-04 -->
      <line x1="495" y1="420" x2="495" y2="335" stroke="${C.accent}" stroke-width="4" opacity="0.8" />
      <circle cx="495" cy="377" r="7" fill="#0f172a" stroke="${C.accent}" stroke-width="2" />
      <!-- T-04 to T-05 -->
      <line x1="495" y1="335" x2="495" y2="250" stroke="${C.accent}" stroke-width="4" opacity="0.8" />
      <circle cx="495" cy="292" r="7" fill="#0f172a" stroke="${C.accent}" stroke-width="2" />
      <!-- T-05 to T-06 -->
      <line x1="495" y1="250" x2="495" y2="${isConfirmed ? 145 : 165}" stroke="${C.accent}" stroke-width="4" opacity="0.8" />
      <circle cx="495" cy="${isConfirmed ? 197 : 207}" r="7" fill="#0f172a" stroke="${C.accent}" stroke-width="2" />
    </g>

    <!-- Hexagonal Robotic Tiles in Sequential Chain -->
    <g id="HexTilesChain">
      ${tiles.map(t => {
        const isSelected = selectedTileId === t.id;
        const hex = hexPath(t.cx, t.cy, t.r);
        const innerHex = hexPath(t.cx, t.cy, t.r - 5);

        return `
        <!-- Tile ${t.id} -->
        <g id="Tile-${t.id}">
          <!-- Selection Glow Ring -->
          ${isSelected ? `<path d="${hexPath(t.cx, t.cy, t.r + 9)}" fill="none" stroke="${C.accent}" stroke-width="2.5" stroke-dasharray="6,4" />` : ''}

          <!-- Pending ghost animation preview if moving -->
          ${isPending && isSelected ? `
          <g opacity="0.5">
            <path d="${hexPath(t.cx, t.cy - 20, t.r)}" fill="none" stroke="${C.caution}" stroke-width="2" stroke-dasharray="3,3" />
            <text x="${t.cx}" y="${t.cy - 25}" font-family="'JetBrains Mono', monospace" font-size="8" fill="${C.caution}" text-anchor="middle">TARGET CONFIRMING...</text>
          </g>
          ` : ''}

          <!-- Outer Hexagon Prism -->
          <path d="${hex}" fill="${isSelected ? '#1e293b' : t.color}" stroke="${isSelected ? C.accent : C.borderBright}" stroke-width="2" />
          <path d="${innerHex}" fill="none" stroke="${C.border}" stroke-width="1" />

          <!-- Center Illuminated Core Ring -->
          <circle cx="${t.cx}" cy="${t.cy}" r="14" fill="#020617" stroke="${isSelected ? C.accent : C.clear}" stroke-width="2" />
          <circle cx="${t.cx}" cy="${t.cy}" r="4" fill="${isSelected ? C.accent : C.clear}" />

          <!-- Tile ID & Role -->
          <text x="${t.cx}" y="${t.cy - 18}" font-family="'JetBrains Mono', monospace" font-size="9" font-weight="700" fill="${isSelected ? C.accent : C.textPrimary}" text-anchor="middle">${t.id}</text>
          <text x="${t.cx}" y="${t.cy + 25}" font-family="Inter, sans-serif" font-size="6.5" font-weight="600" fill="${C.textMuted}" text-anchor="middle">${t.role}</text>

          <!-- 6 Facet Telemetry Beacons around hexagon -->
          ${[0, 1, 2, 3, 4, 5].map(sideIdx => {
            const angle = (Math.PI / 6) + sideIdx * (Math.PI / 3);
            const bx = t.cx + (t.r - 2) * Math.cos(angle);
            const by = t.cy + (t.r - 2) * Math.sin(angle);
            const isTargetSide = isSelected && selectedSideId === sideIdx;

            let dotColor = C.clear;
            if (t.id === 'T-06' && sideIdx === 1) dotColor = C.risk;
            else if (t.id === 'T-06' && (sideIdx === 0 || sideIdx === 2)) dotColor = C.caution;
            else if (t.id === 'T-03' && sideIdx === 0) dotColor = C.unknown;
            else if (t.id === 'T-04' && sideIdx === 2) dotColor = C.caution;

            return `
            <circle cx="${bx.toFixed(1)}" cy="${by.toFixed(1)}" r="${isTargetSide ? 4.5 : 2.8}" fill="${isTargetSide ? '#ffffff' : dotColor}" stroke="${dotColor}" stroke-width="1.5" />
            `;
          }).join('')}
        </g>
        `;
      }).join('')}
    </g>

    <!-- Active Obstacle Curve from T-06 Side S2 into Debris -->
    ${selectedTileId === 'T-06' && selectedSideId === 1 ? `
    <g id="ObstacleCurveArc">
      <path d="M 495 125 Q 515 95 495 65" fill="none" stroke="${C.risk}" stroke-width="2.5" />
      <circle cx="495" cy="65" r="5" fill="${C.risk}" />
      <circle cx="495" cy="65" r="9" fill="none" stroke="${C.risk}" stroke-width="1.5" stroke-dasharray="2,2" />
      <text x="525" y="85" font-family="'JetBrains Mono', monospace" font-size="9" font-weight="700" fill="${C.risk}">RADAR: 0.48m (RISK)</text>
    </g>
    ` : ''}

    <!-- Viewport Camera Toolbar Overlay -->
    <g id="CameraToolbar" transform="translate(20, 20)">
      <rect x="0" y="0" width="130" height="28" rx="5" fill="rgba(15, 23, 42, 0.85)" stroke="${C.borderBright}" stroke-width="1" />
      <text x="12" y="18" font-family="'JetBrains Mono', monospace" font-size="9" font-weight="700" fill="${C.accent}">CHAIN OVERVIEW</text>
    </g>

    <g id="TopologyBadge" transform="translate(20, ${MAIN_H - 40})">
      <rect x="0" y="0" width="380" height="26" rx="5" fill="rgba(15, 23, 42, 0.85)" stroke="${C.borderBright}" stroke-width="1" />
      <text x="14" y="17" font-family="'JetBrains Mono', monospace" font-size="8.5" font-weight="600" fill="${C.textSecondary}">
        TOPOLOGY: SEQUENTIAL HEX CHAIN · DEBRIS INTERCEPT VECTOR
      </text>
    </g>
  </g>
  `;
}

// Right Panel Generator
function renderRightPanel(opts = {}) {
  const {
    stateType = 'OVERVIEW', // OVERVIEW, TILE_SELECTED, SENSOR_DETAIL, OP_PENDING, OP_CONFIRMED, CONNECTION_LOST
    selectedTileId = 'T-06',
    selectedSideId = null,
  } = opts;

  const ry = TOPBAR_H + BANNER_H;

  // 1. Overview State (Empty Selection)
  if (stateType === 'OVERVIEW') {
    return `
    <!-- Right Panel: Overview State -->
    <g id="RightPanelEmpty" transform="translate(${RIGHT_X}, ${ry})">
      <rect x="0" y="0" width="${RIGHT_W}" height="${MAIN_H}" fill="${C.bgPanel}" />
      
      <!-- Panel Header -->
      <g transform="translate(24, 24)">
        <text x="0" y="16" font-family="'JetBrains Mono', monospace" font-size="12" font-weight="700" fill="${C.textPrimary}" letter-spacing="1">MODULE TELEMETRY & CONTROLS</text>
        <line x1="0" y1="28" x2="${RIGHT_W - 48}" y2="28" stroke="${C.border}" stroke-width="1" />
      </g>

      <!-- Empty State Illustration -->
      <g transform="translate(${RIGHT_W / 2}, 260)">
        <path d="${hexPath(0, 0, 48)}" fill="none" stroke="${C.borderBright}" stroke-width="2" stroke-dasharray="4,4" />
        <circle cx="0" cy="0" r="16" fill="${C.bgSurface}" stroke="${C.accent}" stroke-width="1.5" />
        <text x="0" y="5" font-family="'JetBrains Mono', monospace" font-size="16" font-weight="700" fill="${C.accent}" text-anchor="middle">⬡</text>
        <text x="0" y="75" font-family="'JetBrains Mono', monospace" font-size="13" font-weight="700" fill="${C.textPrimary}" text-anchor="middle">NO TILE SELECTED</text>
        <text x="0" y="98" font-family="Inter, sans-serif" font-size="10" fill="${C.textMuted}" text-anchor="middle">
          Click any hexagonal tile in the 3D chain to inspect in 360° detail,
        </text>
        <text x="0" y="114" font-family="Inter, sans-serif" font-size="10" fill="${C.textMuted}" text-anchor="middle">
          review multi-facet telemetry, and issue movement commands.
        </text>
      </g>

      <!-- Quick Select Buttons -->
      <g transform="translate(24, 460)">
        <text x="0" y="0" font-family="'JetBrains Mono', monospace" font-size="9" font-weight="700" fill="${C.textMuted}">QUICK SELECT MODULE:</text>
        <g transform="translate(0, 15)">
          ${['T-01', 'T-02', 'T-03', 'T-04', 'T-05', 'T-06'].map((id, i) => `
            <rect x="${i * 68}" y="0" width="60" height="28" rx="4" fill="${C.bgSurface}" stroke="${C.borderBright}" stroke-width="1" />
            <text x="${i * 68 + 30}" y="18" font-family="'JetBrains Mono', monospace" font-size="10" font-weight="700" fill="${C.accent}" text-anchor="middle">${id}</text>
          `).join('')}
        </g>
      </g>
    </g>
    `;
  }

  // Selected Tile Content (T-06)
  const isPending = stateType === 'OP_PENDING';
  const isConfirmed = stateType === 'OP_CONFIRMED';
  const isConnLost = stateType === 'CONNECTION_LOST';
  const showSensorDetail = stateType === 'SENSOR_DETAIL' || isPending || isConfirmed;
  const activeSide = selectedSideId !== null ? selectedSideId : (showSensorDetail ? 1 : null);

  const facetStates = [
    { id: 0, label: 'S1', state: 'CAUTION', dist: '0.82m', color: C.caution, bg: C.cautionBg },
    { id: 1, label: 'S2', state: 'RISK', dist: '0.48m', color: C.risk, bg: C.riskBg },
    { id: 2, label: 'S3', state: 'CAUTION', dist: '0.76m', color: C.caution, bg: C.cautionBg },
    { id: 3, label: 'S4', state: 'CLEAR', dist: '1.80m', color: C.clear, bg: C.clearBg },
    { id: 4, label: 'S5', state: 'CLEAR', dist: '1.68m', color: C.clear, bg: C.clearBg },
    { id: 5, label: 'S6', state: 'CLEAR', dist: '1.60m', color: C.clear, bg: C.clearBg },
  ];

  return `
  <!-- Right Panel: Selected Tile / Inspector -->
  <g id="RightPanelSelected" transform="translate(${RIGHT_X}, ${ry})">
    <rect x="0" y="0" width="${RIGHT_W}" height="${MAIN_H}" fill="${C.bgPanel}" />

    <!-- Tile Header -->
    <g transform="translate(24, 18)">
      <rect x="0" y="0" width="55" height="24" rx="4" fill="${C.accent}" />
      <text x="27.5" y="16" font-family="'JetBrains Mono', monospace" font-size="11" font-weight="800" fill="#020617" text-anchor="middle">${selectedTileId}</text>
      <text x="65" y="11" font-family="'JetBrains Mono', monospace" font-size="9" font-weight="700" fill="${C.accent}">ORBITAL DEBRIS GRAPPLE MODULE</text>
      <text x="65" y="23" font-family="Inter, sans-serif" font-size="8" font-weight="500" fill="${C.textMuted}">SEQUENTIAL CHAIN TIP · POSITION: [0.0, ${isConfirmed ? '4.55' : '4.20'}]</text>
      <line x1="0" y1="32" x2="${RIGHT_W - 48}" y2="32" stroke="${C.border}" stroke-width="1" />
    </g>

    <!-- 360° Interactive 3D Tile Inspector Card -->
    <g transform="translate(24, 62)">
      <rect x="0" y="0" width="${RIGHT_W - 48}" height="175" rx="8" fill="${C.bgSurface}" stroke="${C.borderBright}" stroke-width="1" />
      
      <!-- Card Tabs -->
      <rect x="0" y="0" width="${RIGHT_W - 48}" height="28" fill="#090d16" />
      <rect x="8" y="4" width="130" height="20" rx="3" fill="rgba(56, 189, 248, 0.15)" stroke="${C.accent}" stroke-width="1" />
      <text x="73" y="18" font-family="'JetBrains Mono', monospace" font-size="8" font-weight="700" fill="${C.accent}" text-anchor="middle">360° 3D INSPECTOR</text>
      <text x="180" y="18" font-family="'JetBrains Mono', monospace" font-size="8" font-weight="600" fill="${C.textMuted}">HUD SCHEMATIC</text>

      <!-- 3D Mini View of Hex Tile -->
      <g transform="translate(${(RIGHT_W - 48) / 2}, 102)">
        <path d="${hexPath(0, 0, 52)}" fill="#020617" stroke="${C.accent}" stroke-width="2" />
        <circle cx="0" cy="0" r="16" fill="#0f172a" stroke="${C.clear}" stroke-width="2" />
        <circle cx="0" cy="0" r="6" fill="${C.accent}" />
        <text x="0" y="32" font-family="'JetBrains Mono', monospace" font-size="8" font-weight="700" fill="${C.accent}" text-anchor="middle">T-06</text>

        <!-- Grapple arms around hex -->
        ${[0, 60, 120, 180, 240, 300].map(deg => {
          const rad = deg * Math.PI / 180;
          return `<rect x="${(48 * Math.cos(rad) - 3).toFixed(1)}" y="${(48 * Math.sin(rad) - 3).toFixed(1)}" width="6" height="6" fill="${C.caution}" />`;
        }).join('')}

        <!-- Active side highlight ring -->
        ${activeSide !== null ? `
          <circle cx="${(52 * Math.cos((Math.PI/6) + activeSide * Math.PI/3)).toFixed(1)}" cy="${(52 * Math.sin((Math.PI/6) + activeSide * Math.PI/3)).toFixed(1)}" r="7" fill="none" stroke="${C.risk}" stroke-width="2" />
        ` : ''}
      </g>

      <!-- HUD Badge & Controls -->
      <text x="12" y="44" font-family="'JetBrains Mono', monospace" font-size="7.5" font-weight="700" fill="${C.textMuted}">ROTATE: 360° ACTIVE</text>
      <rect x="${RIGHT_W - 105}" y="35" width="48" height="16" rx="3" fill="#0f172a" stroke="${C.borderBright}" stroke-width="1" />
      <text x="${RIGHT_W - 81}" y="46" font-family="'JetBrains Mono', monospace" font-size="7" font-weight="700" fill="${C.accent}" text-anchor="middle">PAUSE</text>
      <text x="12" y="165" font-family="Inter, sans-serif" font-size="7" fill="${C.textMuted}">Drag to orbit 360° · Scroll to zoom · Click facet to inspect</text>
    </g>

    <!-- Quick Stats Row -->
    <g transform="translate(24, 246)">
      <rect x="0" y="0" width="128" height="36" rx="4" fill="${C.bgSurface}" stroke="${C.border}" stroke-width="1" />
      <text x="10" y="14" font-family="Inter, sans-serif" font-size="7.5" font-weight="600" fill="${C.textMuted}">CORE TEMP</text>
      <text x="10" y="28" font-family="'JetBrains Mono', monospace" font-size="10.5" font-weight="700" fill="${C.textPrimary}">24.1 °C</text>

      <rect x="136" y="0" width="128" height="36" rx="4" fill="${C.bgSurface}" stroke="${C.border}" stroke-width="1" />
      <text x="146" y="14" font-family="Inter, sans-serif" font-size="7.5" font-weight="600" fill="${C.textMuted}">BUS VOLTAGE</text>
      <text x="146" y="28" font-family="'JetBrains Mono', monospace" font-size="10.5" font-weight="700" fill="${C.textPrimary}">28.4 V</text>

      <rect x="272" y="0" width="130" height="36" rx="4" fill="${C.bgSurface}" stroke="${C.border}" stroke-width="1" />
      <text x="282" y="14" font-family="Inter, sans-serif" font-size="7.5" font-weight="600" fill="${C.textMuted}">SWARM LINK</text>
      <text x="282" y="28" font-family="'JetBrains Mono', monospace" font-size="10.5" font-weight="700" fill="${C.clear}">99.8%</text>
    </g>

    <!-- SIX SIDES (FACETS) SELECTOR -->
    <g transform="translate(24, 296)">
      <text x="0" y="0" font-family="'JetBrains Mono', monospace" font-size="9" font-weight="700" fill="${C.textMuted}">SIX HEXAGONAL SIDES (FACETS):</text>
      
      <g transform="translate(0, 10)">
        ${facetStates.map((s, idx) => {
          const col = idx % 3;
          const row = Math.floor(idx / 3);
          const x = col * 136;
          const y = row * 38;
          const isFacetActive = activeSide === s.id;

          return `
          <g transform="translate(${x}, ${y})">
            <rect x="0" y="0" width="130" height="32" rx="4" fill="${isFacetActive ? 'rgba(56, 189, 248, 0.15)' : C.bgSurface}" stroke="${isFacetActive ? C.accent : C.border}" stroke-width="${isFacetActive ? 1.5 : 1}" />
            <text x="8" y="20" font-family="'JetBrains Mono', monospace" font-size="9.5" font-weight="700" fill="${C.textPrimary}">${s.label}</text>
            <rect x="28" y="8" width="48" height="16" rx="3" fill="${s.bg}" />
            <text x="52" y="19" font-family="'JetBrains Mono', monospace" font-size="7.5" font-weight="700" fill="${s.color}" text-anchor="middle">${s.state}</text>
            <text x="82" y="20" font-family="'JetBrains Mono', monospace" font-size="8.5" font-weight="600" fill="${C.textMuted}">${s.dist}</text>
          </g>
          `;
        }).join('')}
      </g>
    </g>

    <!-- SELECTED SIDE TELEMETRY DETAIL (Side S2) -->
    <g transform="translate(24, 388)">
      <rect x="0" y="0" width="${RIGHT_W - 48}" height="120" rx="6" fill="#090f1d" stroke="${C.borderBright}" stroke-width="1" />
      
      <text x="14" y="20" font-family="'JetBrains Mono', monospace" font-size="8.5" font-weight="700" fill="${C.textMuted}">FACET TELEMETRY — T-06 / SIDE S2</text>
      <rect x="240" y="9" width="60" height="16" rx="3" fill="${C.riskBg}" stroke="${C.risk}" stroke-width="1" />
      <text x="270" y="20" font-family="'JetBrains Mono', monospace" font-size="8" font-weight="700" fill="${C.risk}" text-anchor="middle">▲ RISK</text>
      <text x="${RIGHT_W - 65}" y="20" font-family="'JetBrains Mono', monospace" font-size="7.5" font-weight="600" fill="${C.textMuted}">▲ DEBRIS FACING</text>

      <g transform="translate(14, 40)">
        <text x="0" y="16" font-family="'JetBrains Mono', monospace" font-size="7.5" font-weight="600" fill="${C.textMuted}">LiDAR RANGEFINDER</text>
        <text x="0" y="44" font-family="'JetBrains Mono', monospace" font-size="28" font-weight="800" fill="${C.textPrimary}">0.48 <tspan font-size="14" fill="${C.textMuted}">m</tspan></text>
        
        <rect x="180" y="22" width="105" height="20" rx="3" fill="#052e16" stroke="${C.clear}" stroke-width="1" opacity="0.6" />
        <text x="232" y="35" font-family="'JetBrains Mono', monospace" font-size="8" font-weight="600" fill="#a7f3d0" text-anchor="middle">0.4s ago · FRESH</text>
      </g>

      <!-- Distance Gauge Bar -->
      <g transform="translate(14, 96)">
        <rect x="0" y="0" width="${RIGHT_W - 76}" height="8" rx="4" fill="#0f172a" />
        <rect x="0" y="0" width="${(RIGHT_W - 76) * 0.12}" height="8" rx="4" fill="${C.risk}" />
        <line x1="${(RIGHT_W - 76) * 0.2}" y1="0" x2="${(RIGHT_W - 76) * 0.2}" y2="8" stroke="#fff" stroke-width="1" opacity="0.5" />
        <line x1="${(RIGHT_W - 76) * 0.4}" y1="0" x2="${(RIGHT_W - 76) * 0.4}" y2="8" stroke="#fff" stroke-width="1" opacity="0.5" />
        <text x="0" y="18" font-family="'JetBrains Mono', monospace" font-size="6.5" fill="${C.textMuted}">0m (Impact)</text>
        <text x="${(RIGHT_W - 76) * 0.2}" y="18" font-family="'JetBrains Mono', monospace" font-size="6.5" fill="${C.textMuted}">0.5m (Risk)</text>
        <text x="${(RIGHT_W - 76) * 0.4}" y="18" font-family="'JetBrains Mono', monospace" font-size="6.5" fill="${C.textMuted}">1.5m (Caution)</text>
        <text x="${RIGHT_W - 105}" y="18" font-family="'JetBrains Mono', monospace" font-size="6.5" fill="${C.textMuted}">4.5m+</text>
      </g>
    </g>

    <!-- OPERATIONS & COMMANDS SECTION -->
    <g transform="translate(24, 520)">
      <text x="0" y="0" font-family="'JetBrains Mono', monospace" font-size="9" font-weight="700" fill="${C.textMuted}">OPERATIONS & CHAIN CONTROL:</text>

      <!-- Operation Pending Banner -->
      ${isPending ? `
      <g transform="translate(0, 10)">
        <rect x="0" y="0" width="${RIGHT_W - 48}" height="56" rx="6" fill="#451a03" stroke="${C.caution}" stroke-width="1" />
        <text x="14" y="20" font-family="'JetBrains Mono', monospace" font-size="9.5" font-weight="800" fill="${C.caution}">⏳ PENDING SERVER CONFIRMATION</text>
        <text x="14" y="34" font-family="Inter, sans-serif" font-size="8" font-weight="600" fill="#fde68a">Command: MOVE · Target: T-06 · Seq #104</text>
        <text x="14" y="47" font-family="Inter, sans-serif" font-size="7.5" fill="#fef3c7">Tile will NOT update position until server confirms execution.</text>
      </g>
      ` : ''}

      <!-- Operation Confirmed Banner -->
      ${isConfirmed ? `
      <g transform="translate(0, 10)">
        <rect x="0" y="0" width="${RIGHT_W - 48}" height="56" rx="6" fill="#052e16" stroke="${C.clear}" stroke-width="1" />
        <text x="14" y="20" font-family="'JetBrains Mono', monospace" font-size="9.5" font-weight="800" fill="${C.clear}">✅ OPERATION CONFIRMED BY SERVER</text>
        <text x="14" y="34" font-family="Inter, sans-serif" font-size="8" font-weight="600" fill="#a7f3d0">Authoritative state broadcasted. New Z: 4.55m</text>
        <text x="14" y="47" font-family="Inter, sans-serif" font-size="7.5" fill="#d1fae5">3D physical mesh transitioned to confirmed coordinate.</text>
      </g>
      ` : ''}

      <!-- Connection Lost Disabled Notice -->
      ${isConnLost ? `
      <g transform="translate(0, 10)">
        <rect x="0" y="0" width="${RIGHT_W - 48}" height="56" rx="6" fill="#4c0519" stroke="${C.risk}" stroke-width="1" />
        <text x="14" y="20" font-family="'JetBrains Mono', monospace" font-size="9.5" font-weight="800" fill="#f43f5e">⚠ COMMANDS DISABLED — DISCONNECTED</text>
        <text x="14" y="34" font-family="Inter, sans-serif" font-size="8" font-weight="600" fill="#fecdd3">Central server heartbeat timed out (> 5000ms).</text>
        <text x="14" y="47" font-family="Inter, sans-serif" font-size="7.5" fill="#ffe4e6">All hardware actuators safety-locked to prevent collisions.</text>
      </g>
      ` : ''}

      <!-- Action Buttons -->
      <g transform="translate(0, ${isPending || isConfirmed || isConnLost ? 74 : 15})">
        <!-- MOVE Button -->
        <g transform="translate(0, 0)">
          <rect x="0" y="0" width="195" height="38" rx="5" fill="${isConnLost || isPending ? '#1e293b' : 'url(#gradBtnMove)'}" stroke="${isConnLost || isPending ? '#334155' : C.accent}" stroke-width="1" opacity="${isConnLost || isPending ? 0.4 : 1}" />
          <text x="97" y="23" font-family="'JetBrains Mono', monospace" font-size="10.5" font-weight="700" fill="${isConnLost || isPending ? C.textMuted : '#ffffff'}" text-anchor="middle">▶ MOVE / ADVANCE</text>
        </g>

        <!-- DEPLOY Button -->
        <g transform="translate(207, 0)">
          <rect x="0" y="0" width="195" height="38" rx="5" fill="${isConnLost || isPending ? '#1e293b' : 'url(#gradBtnDeploy)'}" stroke="${isConnLost || isPending ? '#334155' : C.borderBright}" stroke-width="1" opacity="${isConnLost || isPending ? 0.4 : 1}" />
          <text x="97" y="23" font-family="'JetBrains Mono', monospace" font-size="10.5" font-weight="700" fill="${isConnLost || isPending ? C.textMuted : C.textPrimary}" text-anchor="middle">⚙ DEPLOY / LATCH</text>
        </g>
      </g>
    </g>
  </g>
  `;
}

// Bottom Bar Generator
function renderBottomBar() {
  const by = H - BOTTOM_H;
  return `
  <!-- Bottom Bar: Event Log & Simulation Trigger -->
  <g id="BottomBar" transform="translate(0, ${by})">
    <rect x="0" y="0" width="${W}" height="${BOTTOM_H}" fill="${C.bgPanel}" />
    <line x1="0" y1="0" x2="${W}" y2="0" stroke="${C.border}" stroke-width="1" />

    <!-- Event Log -->
    <g transform="translate(20, 12)">
      <text x="0" y="10" font-family="'JetBrains Mono', monospace" font-size="8.5" font-weight="700" fill="${C.textMuted}">EVENT TIMELINE LOG:</text>
      
      <g transform="translate(0, 18)">
        <text x="0" y="12" font-family="'JetBrains Mono', monospace" font-size="8.5" fill="${C.textMuted}">12:45:01.020 <tspan fill="${C.clear}">[SUCCESS]</tspan> Authoritative state sync complete. 6 tiles verified.</text>
        <text x="0" y="26" font-family="'JetBrains Mono', monospace" font-size="8.5" fill="${C.textMuted}">12:45:02.140 <tspan fill="${C.accent}">[OPERATION]</tspan> Command dispatch id="op-892" type="MOVE" tile="T-06"</text>
      </g>
    </g>

    <!-- Simulation Controls Drawer Button -->
    <g transform="translate(${W - 250}, 16)">
      <rect x="0" y="0" width="230" height="34" rx="5" fill="${C.bgSurface}" stroke="${C.borderBright}" stroke-width="1" />
      <text x="115" y="21" font-family="'JetBrains Mono', monospace" font-size="9" font-weight="700" fill="${C.accent}" text-anchor="middle">⚙ SIMULATION & FAILURE TESTING ▲</text>
    </g>
  </g>
  `;
}

// Full Frame Assembler
function assembleFrame(frameNum, title, description, opts = {}) {
  const svg = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" data-frame="${frameNum}">
  <defs>
    <linearGradient id="gradLogo" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#38bdf8" />
      <stop offset="100%" stop-color="#0284c7" />
    </linearGradient>
    <linearGradient id="gradBtnMove" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0284c7" />
      <stop offset="100%" stop-color="#0369a1" />
    </linearGradient>
    <linearGradient id="gradBtnDeploy" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#1e293b" />
      <stop offset="100%" stop-color="#0f172a" />
    </linearGradient>
  </defs>

  <!-- Frame Title metadata for Figma -->
  <!-- ${frameNum}. ${title} : ${description} -->

  ${renderTopBar(opts.disconnected)}
  ${renderConnectionBanner(opts.disconnected)}
  ${renderViewport(opts)}
  ${renderRightPanel(opts)}
  ${renderBottomBar()}
</svg>
  `.trim();

  return svg;
}

// Generate the 6 Frames
console.log('Generating KASTOR Figma SVG Frames...');

const frames = [
  {
    filename: '01_Network_Overview.svg',
    num: 1,
    title: 'Network Overview',
    desc: 'Hexagonal tile chain in 1-to-1 linear topology pointing to orbital debris field, with unselected panel',
    opts: {
      stateType: 'OVERVIEW',
      selectedTileId: null,
      selectedSideId: null,
    }
  },
  {
    filename: '02_Tile_Selected_Six_Sides.svg',
    num: 2,
    title: 'Tile Selected + Six Sides',
    desc: 'Tile T-06 selected with 360° movable inspector, telemetry badges, and six facet buttons (S1-S6)',
    opts: {
      stateType: 'TILE_SELECTED',
      selectedTileId: 'T-06',
      selectedSideId: null,
    }
  },
  {
    filename: '03_Sensor_Detail.svg',
    num: 3,
    title: 'Sensor Detail',
    desc: 'Facet S2 active facing debris zone: 0.48m distance reading, visual threshold bar, and risk radar arc',
    opts: {
      stateType: 'SENSOR_DETAIL',
      selectedTileId: 'T-06',
      selectedSideId: 1,
    }
  },
  {
    filename: '04_Operation_Pending.svg',
    num: 4,
    title: 'Operation Pending',
    desc: 'MOVE operation dispatched: pending banner active, commands disabled, 3D layout unchanged pending server ACK',
    opts: {
      stateType: 'OP_PENDING',
      selectedTileId: 'T-06',
      selectedSideId: 1,
      isPending: true,
    }
  },
  {
    filename: '05_Operation_Confirmed.svg',
    num: 5,
    title: 'Operation Confirmed + Updated Layout',
    desc: 'Server confirmed: authoritative position updated in 3D scene (Z: 4.55m), distance reduced, commands re-enabled',
    opts: {
      stateType: 'OP_CONFIRMED',
      selectedTileId: 'T-06',
      selectedSideId: 1,
      isConfirmed: true,
    }
  },
  {
    filename: '06_Connection_Lost.svg',
    num: 6,
    title: 'Connection Lost + Disabled Commands',
    desc: 'Network blackout: crimson warning banner, stale sensor alert, and all movement commands locked',
    opts: {
      stateType: 'CONNECTION_LOST',
      selectedTileId: 'T-06',
      selectedSideId: 1,
      disconnected: true,
    }
  },
];

// Write individual frames
frames.forEach(f => {
  const content = assembleFrame(f.num, f.title, f.desc, f.opts);
  fs.writeFileSync(path.join(OUT_DIR_1, f.filename), content, 'utf-8');
  fs.writeFileSync(path.join(OUT_DIR_2, f.filename), content, 'utf-8');
  console.log(`✓ Created: ${f.filename}`);
});

// Master Multi-Frame Canvas (Figma Board with Prototyping Flow Connections)
const MASTER_W = W * 3 + 160; // 3 columns
const MASTER_H = H * 2 + 200; // 2 rows

let masterContent = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${MASTER_W} ${MASTER_H}" width="${MASTER_W}" height="${MASTER_H}">
  <rect x="0" y="0" width="${MASTER_W}" height="${MASTER_H}" fill="#0b0f19" />
  
  <text x="80" y="60" font-family="'JetBrains Mono', monospace" font-size="28" font-weight="800" fill="#f8fafc">KASTOR 3D ROBOTICS INTERFACE · FIGMA DESIGN SYSTEM</text>
  <text x="80" y="90" font-family="Inter, sans-serif" font-size="14" fill="#94a3b8">Interactive 6-Frame Design Specification & Prototyping Flow for Fabiana's Question 1</text>

  <!-- Flow connector indicators -->
`;

frames.forEach((f, idx) => {
  const col = idx % 3;
  const row = Math.floor(idx / 3);
  const fx = 80 + col * (W + 60);
  const fy = 130 + row * (H + 80);

  const innerSvg = assembleFrame(f.num, f.title, f.desc, f.opts);
  
  masterContent += `
  <!-- Frame ${f.num}: ${f.title} -->
  <g id="Frame_${f.num}_${f.title.replace(/[^a-zA-Z0-9]/g, '_')}" transform="translate(${fx}, ${fy})">
    <text x="0" y="-14" font-family="'JetBrains Mono', monospace" font-size="16" font-weight="700" fill="#38bdf8">${f.num}. ${f.title}</text>
    <text x="350" y="-14" font-family="Inter, sans-serif" font-size="11" fill="#64748b">${f.desc}</text>
    <rect x="-2" y="-2" width="${W + 4}" height="${H + 4}" rx="8" fill="none" stroke="#334155" stroke-width="2" />
    <g transform="translate(0, 0)">
      ${innerSvg}
    </g>
  </g>
  `;
});

masterContent += `
</svg>
`;

fs.writeFileSync(path.join(OUT_DIR_1, 'kastor_figma_master_canvas.svg'), masterContent, 'utf-8');
fs.writeFileSync(path.join(OUT_DIR_2, 'kastor_figma_master_canvas.svg'), masterContent, 'utf-8');
console.log('✓ Created: kastor_figma_master_canvas.svg');
