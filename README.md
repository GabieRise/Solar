# 🌍 Interactive Solar System

A 3D interactive solar system built with **React** and **Three.js**. Explore all 8 planets in real time — click any planet to learn about it, drag to rotate the view, scroll to zoom, and adjust orbit speed with a slider.

---

## Demo features

- 3D orbiting planets with accurate relative sizes and colors
- Saturn's rings rendered in 3D
- Starfield background with 1,800+ stars
- Click any planet (or the Sun) to see its name and a fun fact
- Drag to rotate the camera freely
- Scroll to zoom in and out
- Speed slider to slow down or speed up all orbits
- Point light emanating from the Sun for realistic planet shading

---

## Tech stack

| Technology | Purpose |
|---|---|
| React 18 | UI and component lifecycle |
| Three.js r128 | 3D rendering via WebGL |
| Create React App | Project scaffolding and dev server |

---

## Getting started

### Prerequisites

- [Node.js](https://nodejs.org) v18 or higher
- npm (comes with Node.js)

### Installation

```bash
# Clone the repository
git clone https://github.com/your-username/solar-system.git
cd solar-system

# Install dependencies
npm install

# Start the development server
npm start
```

The app will open at `http://localhost:3000`.

---

## Project structure

```
src/
├── components/
│   └── SolarSystem.jsx     # Three.js scene, camera, render loop, interactivity
├── data/
│   └── planets.js          # Planet data — name, size, color, orbit speed, facts
├── App.js                  # Root component
└── index.js                # React entry point
```

---

## How it works

### Three.js setup (`SolarSystem.jsx`)

The Three.js scene is initialized inside a `useEffect` hook, which runs once after the component mounts. A `useRef` holds a reference to the `<canvas>` DOM element without triggering re-renders.

```jsx
const canvasRef = useRef(null);

useEffect(() => {
  const renderer = new THREE.WebGLRenderer({ canvas: canvasRef.current });
  // ... scene setup
  return () => renderer.dispose(); // cleanup on unmount
}, []);
```

### Orbital motion

Each planet sits inside an `Object3D` pivot. Rotating the pivot each frame moves the planet along its orbit — no manual trigonometry needed.

```js
pivot.userData.angle += planet.speed * dt;
pivot.rotation.y = pivot.userData.angle;
```

### Click detection

A `Raycaster` converts the mouse click position into a 3D ray, which is tested against all planet meshes to find intersections.

```js
raycaster.setFromCamera(mouse, camera);
const hits = raycaster.intersectObjects(planetMeshes);
if (hits.length > 0) setSelected(hits[0].object.userData.planet);
```

---

## Planet data

Planets are defined in `src/data/planets.js` as an array of objects:

```js
{ name: 'Earth', radius: 1.9, dist: 40, color: 0x4a9eff, speed: 2.9, facts: '...' }
```

| Field | Description |
|---|---|
| `name` | Display name |
| `radius` | Sphere size (not to real scale) |
| `dist` | Distance from the Sun in scene units |
| `color` | Hex color for the material |
| `speed` | Orbit speed multiplier |
| `facts` | Fun fact shown on click |
| `rings` | `true` to add a ring (Saturn only) |

---

## Available scripts

| Command | Description |
|---|---|
| `npm start` | Run the development server at localhost:3000 |
| `npm run build` | Build for production into the `build/` folder |
| `npm test` | Run the test suite |

---

## Possible extensions

- Add texture maps to planets using `THREE.TextureLoader`
- Add a Moon orbiting Earth
- Add a comet with a particle trail using `THREE.Points`
- Integrate `OrbitControls` from Three.js examples for smoother camera movement
- Add tooltips on hover using a `Raycaster` on `mousemove`

---

## License

MIT