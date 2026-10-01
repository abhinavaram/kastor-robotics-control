# KASTOR 3D Robotics Control Prototype
### Modular Hexagonal Space Robotics Control System · NYU CUSP Take-Home Assignment

An interactive 3D robotics control interface for the **KASTOR** modular space robotics platform. The system operates a sequential linear chain of hexagonal robotic tiles navigating toward an active orbital debris hazard zone, featuring real-time sensor telemetry, optimistic operation lifecycle management, and communication failure simulations.

---

## Key Features

### 1. Hexagonal Modular Robotics & Topology
- **3D Hexagonal Modules**: Modeled with 6 perimeter facets (Sides S1 to S6), sensor beacons, docking collars, and telemetry lens pods.
- **1-to-1 Sequential Chain**: Linked in a single contiguous chain:
  `T-01 [Base Anchor] -> T-02 -> T-03 -> T-04 -> T-05 -> T-06 [Debris Grapple]`.
- **Docking Conduits**: Interlocking magnetic latches and glowing power/data umbilicals connecting adjacent modules.

### 2. Orbital Debris Zone
- **Floating Orbital Debris Field**: Zero-G floating satellite solar panels, fuselage shards, and asteroid fragments.
- **Volumetric Hazard Perimeter**: Pulsing cylindrical barrier with real-time target proximity tracking.
- **Targeting Probe**: Continuous LiDAR laser beam and scanning cone projecting from the lead tile directly into the debris field.

### 3. Interactive 360° 3D Tile Inspector
- Dedicated side-panel 3D viewport allowing full 360° rotation and zoom of the selected tile.
- Interactive facet raycasting: click any of the 6 sides in 3D to inspect telemetry.
- Switchable view between real-time 3D module view and technical HUD LiDAR blueprint.

### 4. Authoritative Server State & Telemetry
- **Four-State Side Classification**: `CLEAR`, `CAUTION`, `RISK`, `UNKNOWN`.
- **Sensor Freshness & Stale Detection**: Live millisecond freshness counter; automatically flags readings older than 12s as `STALE SENSOR — DO NOT TRUST`.
- **Uncalibrated Sensor Handling**: Gracefully handles missing telemetry (`UNKNOWN`) without assuming safe passage.

### 5. Optimistic Operations & Error Rollback
- Operations (`MOVE / ADVANCE`, `DEPLOY / LATCH`) immediately enter `PENDING SERVER CONFIRMATION`.
- Authoritative execution transitions through `ACKNOWLEDGED` -> `EXECUTING` -> `COMPLETED`.
- Failure injection mode simulates safety supervisor aborts (e.g., clearance violations) with automatic rollback to confirmed state.

### 6. Simulation & Failure Testing Suite
- Test network delay (3-5s latency), duplicate packets, out-of-order delivery, sensor staleness, communication blackout, and operation rejection.

---

## Tech Stack

- **React 18** with **TypeScript**
- **Three.js** & **@react-three/fiber** / **@react-three/drei** for 3D graphics
- **Zustand** for state management
- **Framer Motion** for micro-animations
- **Lucide React** for aerospace interface iconography
- **Vite** bundler

---

## Getting Started

### Prerequisites
- Node.js (v18 or higher recommended)
- npm or yarn

### Installation & Local Run
```bash
# Clone the repository
git clone <YOUR_GITHUB_REPO_URL>
cd kastor

# Install dependencies
npm install

# Run the development server
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

### Production Build
```bash
npm run build
```
The optimized bundle will be generated in the `dist/` directory, ready for static deployment (Netlify, Vercel, or GitHub Pages).
