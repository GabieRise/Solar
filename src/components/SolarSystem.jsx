import { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import { PLANETS } from '../data/planets';
import { buildTextures } from '../utils/textures';
import { addStarField, addAsteroidBelt, addComet, buildPlanetMesh, addOrbitRing } from '../utils/sceneHelpers';
import { createTrail } from '../utils/orbitTrail';
import { addMoons } from '../utils/moonBuilder';
import { getAllPlanetPositions, daysSinceJ2000 } from '../utils/keplerSolver';
import { fetchAsteroids } from '../services/nasaService';
import InfoPanel from './InfoPanel';
import AsteroidPanel from './AsteroidPanel';

export default function SolarSystem() {
  const canvasRef      = useRef(null);
  const rootRef        = useRef(null);
  const labelsRef      = useRef([]);
  const trailsRef      = useRef([]);
  const planetGroupsRef= useRef([]);
  const showLabelsRef  = useRef(true);
  const showTrailsRef  = useRef(true);
  const speedRef       = useRef(1);
  const simDateRef     = useRef(new Date());   // simulation date drives Kepler

  const [selected,      setSelected]      = useState(null);
  const [speed,         setSpeed]         = useState(1);
  const [showLabels,    setShowLabels]    = useState(true);
  const [showTrails,    setShowTrails]    = useState(true);
  const [showAsteroids, setShowAsteroids] = useState(false);
  const [simDate,       setSimDate]       = useState(new Date());

  const handleSpeed = useCallback(e => {
    speedRef.current = parseFloat(e.target.value);
    setSpeed(speedRef.current);
  }, []);

  const onToggleLabels = useCallback(e => {
    showLabelsRef.current = e.target.checked;
    setShowLabels(e.target.checked);
  }, []);

  const onToggleTrails = useCallback(e => {
    showTrailsRef.current = e.target.checked;
    setShowTrails(e.target.checked);
    trailsRef.current.forEach(t => { t.line.visible = e.target.checked; });
  }, []);

  const resetToToday = useCallback(() => {
    const now = new Date();
    simDateRef.current = now;
    setSimDate(new Date(now));
    trailsRef.current.forEach(t => t.history?.splice(0));
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    const root   = rootRef.current;
    const W = () => root.clientWidth;
    const H = () => root.clientHeight;

    // ── Renderer ──────────────────────────────────────────────────────────────
    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(W(), H());

    // ── Scene & Camera ────────────────────────────────────────────────────────
    const scene  = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(52, W() / H(), 0.1, 3000);
    camera.position.set(0, 70, 155);
    camera.lookAt(0, 0, 0);

    // ── Lighting ──────────────────────────────────────────────────────────────
    scene.add(new THREE.AmbientLight(0xffffff, 0.07));
    scene.add(new THREE.PointLight(0xfff8e7, 2.6, 800));

    // ── Scene objects ─────────────────────────────────────────────────────────
    addStarField(scene);
    addAsteroidBelt(scene);
    const cometPivot = addComet(scene);

    // ── Textures ──────────────────────────────────────────────────────────────
    const textures = buildTextures();

    // ── Sun ───────────────────────────────────────────────────────────────────
    const sunMesh = new THREE.Mesh(
      new THREE.SphereGeometry(8, 40, 40),
      new THREE.MeshStandardMaterial({
        map: textures.sun, emissive: 0xffaa00, emissiveIntensity: 1.2, roughness: 1,
      })
    );
    sunMesh.userData = {
      planet: {
        name:  'The Sun',
        facts: "Contains 99.86% of the solar system's mass. Core temperature reaches 15 million °C.",
      },
    };
    scene.add(sunMesh);
    scene.add(new THREE.Mesh(
      new THREE.SphereGeometry(10, 32, 32),
      new THREE.MeshBasicMaterial({ color: 0xff7700, transparent: true, opacity: 0.06, side: THREE.BackSide })
    ));

    const sunPosition = new THREE.Vector3(0, 0, 0);

    // ── Planets with real elliptical orbits ───────────────────────────────────
    const planetGroups = [];
    const labelDivs    = [];
    const allMeshes    = [sunMesh];

    PLANETS.forEach(p => {
      // Real elliptical orbit ring
      addOrbitRing(scene, p.name);

      // Planet mesh — position set each frame via Kepler
      const mesh = buildPlanetMesh(p, textures, sunPosition);
      mesh.rotation.z = p.tilt || 0;
      scene.add(mesh);

      addMoons(mesh, p.name, textures, allMeshes);
      allMeshes.push(mesh);
      planetGroups.push({ mesh, p });

      // Floating label
      const div = document.createElement('div');
      div.textContent = p.name;
      div.style.cssText = [
        'position:absolute',
        'font-size:10.5px',
        'color:rgba(255,255,255,0.45)',
        'pointer-events:none',
        'transform:translate(-50%,-50%)',
        'white-space:nowrap',
        'letter-spacing:.04em',
      ].join(';');
      root.appendChild(div);
      labelDivs.push({ div, mesh });
    });

    labelsRef.current      = labelDivs;
    planetGroupsRef.current = planetGroups;

    // Set initial positions from today's Kepler solution
    const initPositions = getAllPlanetPositions(simDateRef.current);
    planetGroups.forEach(({ mesh, p }) => {
      const pos = initPositions[p.name];
      if (pos) mesh.position.set(pos.x, pos.y, pos.z);
    });

    // ── Trails ────────────────────────────────────────────────────────────────
    trailsRef.current = planetGroups.map(() => createTrail(scene));

    // ── Interaction ───────────────────────────────────────────────────────────
    const raycaster = new THREE.Raycaster();
    const mouse     = new THREE.Vector2();
    let isDrag = false, lastX = 0, lastY = 0;
    let azimuth = 0, polar = 0.42, camDist = 168;

    const onClick = e => {
      const rect = canvas.getBoundingClientRect();
      mouse.x =  ((e.clientX - rect.left) / rect.width)  * 2 - 1;
      mouse.y = -((e.clientY - rect.top)  / rect.height) * 2 + 1;
      raycaster.setFromCamera(mouse, camera);
      const hits = raycaster.intersectObjects(allMeshes);
      if (hits.length) setSelected(hits[0].object.userData.planet);
    };
    const onMouseDown = e => { isDrag = true; lastX = e.clientX; lastY = e.clientY; };
    const onMouseUp   = ()  => { isDrag = false; };
    const onMouseMove = e => {
      if (!isDrag) return;
      azimuth -= (e.clientX - lastX) * 0.007;
      polar   -= (e.clientY - lastY) * 0.006;
      polar = Math.max(0.05, Math.min(1.45, polar));
      lastX = e.clientX; lastY = e.clientY;
    };
    const onWheel = e => {
      camDist += e.deltaY * 0.18;
      camDist = Math.max(22, Math.min(420, camDist));
      e.preventDefault();
    };

    canvas.addEventListener('click',     onClick);
    canvas.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mouseup',   onMouseUp);
    canvas.addEventListener('mousemove', onMouseMove);
    canvas.addEventListener('wheel',     onWheel, { passive: false });

    // ── Label projection ──────────────────────────────────────────────────────
    const tmpV = new THREE.Vector3();
    function updateLabels(show) {
      labelsRef.current.forEach(({ div, mesh }) => {
        if (!show) { div.style.display = 'none'; return; }
        tmpV.setFromMatrixPosition(mesh.matrixWorld);
        tmpV.project(camera);
        if (tmpV.z > 1) { div.style.display = 'none'; return; }
        div.style.display = 'block';
        div.style.left    = ((tmpV.x * 0.5 + 0.5) * W()) + 'px';
        div.style.top     = ((-tmpV.y * 0.5 + 0.5) * H() - 14) + 'px';
      });
    }

    // ── Render loop ───────────────────────────────────────────────────────────
    let animId;
    let prev     = performance.now();
    // How many simulated days pass per real second at speed=1
    const DAYS_PER_SECOND = 5;

    function animate(now) {
      animId = requestAnimationFrame(animate);
      const dt  = Math.min((now - prev) / 1000, 0.05);
      prev = now;
      const spd = speedRef.current;

      // Advance simulation date
      const msAdvance = spd * DAYS_PER_SECOND * dt * 86400000;
      simDateRef.current = new Date(simDateRef.current.getTime() + msAdvance);

      // Recompute all planet positions via Kepler
      const positions = getAllPlanetPositions(simDateRef.current);

      planetGroups.forEach(({ mesh, p }, i) => {
        const pos = positions[p.name];
        if (pos) mesh.position.set(pos.x, pos.y, pos.z);

        // Self rotation
        mesh.rotation.y += dt * 0.3;

        // Moons
        if (mesh.userData.moonPivots) {
          mesh.userData.moonPivots.forEach(mp => {
            mp.userData.angle += mp.userData.speed * spd * dt * 0.22;
            mp.rotation.y      = mp.userData.angle;
          });
        }

        // Cloud drift
        mesh.children.forEach(child => {
          if (child.userData.isClouds) child.rotation.y += dt * 0.04;
        });

        // Earth day/night shader
        if (mesh.userData.isEarth) {
          const ep  = new THREE.Vector3();
          mesh.getWorldPosition(ep);
          const dir = new THREE.Vector3().subVectors(sunPosition, ep).normalize();
          mesh.material.uniforms.sunDirection.value.copy(dir);
        }

        // Trail
        const wp = new THREE.Vector3();
        mesh.getWorldPosition(wp);
        trailsRef.current[i].update(wp);
      });

      // Comet
      cometPivot.userData.angle += 0.004 * spd * dt * 60;
      cometPivot.rotation.y      = cometPivot.userData.angle;
      sunMesh.rotation.y        += dt * 0.08;

      // Camera
      camera.position.x = camDist * Math.cos(polar) * Math.sin(azimuth);
      camera.position.y = camDist * Math.sin(polar);
      camera.position.z = camDist * Math.cos(polar) * Math.cos(azimuth);
      camera.lookAt(0, 0, 0);

      updateLabels(showLabelsRef.current);

      // Update date display every ~30 frames
      if (Math.round(now / 33) % 30 === 0) {
        setSimDate(new Date(simDateRef.current));
      }

      if (Math.abs(W() - renderer.domElement.width) > 2) {
        renderer.setSize(W(), H());
        camera.aspect = W() / H();
        camera.updateProjectionMatrix();
      }

      renderer.render(scene, camera);
    }

    animate(performance.now());

    return () => {
      cancelAnimationFrame(animId);
      canvas.removeEventListener('click',     onClick);
      canvas.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mouseup',   onMouseUp);
      canvas.removeEventListener('mousemove', onMouseMove);
      canvas.removeEventListener('wheel',     onWheel);
      labelDivs.forEach(({ div }) => div.remove());
      trailsRef.current.forEach(t => t.dispose());
      renderer.dispose();
    };
  }, []);

  const formattedDate = simDate.toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
  });

  return (
    <div
      ref={rootRef}
      style={{ position: 'relative', width: '100%', height: '100vh', background: '#00000a', overflow: 'hidden' }}
    >
      <canvas ref={canvasRef} style={{ width: '100%', height: '100%', display: 'block' }} />

      {/* Controls */}
      <div style={{ position: 'absolute', top: 14, left: 16, display: 'flex', flexDirection: 'column', gap: 8 }}>
        <label style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'rgba(255,255,255,0.45)', fontSize: 12 }}>
          Speed
          <input
            type="range" min="0" max="10" step="0.1" defaultValue="1"
            onChange={handleSpeed}
            style={{ width: 90, accentColor: '#f5a623' }}
          />
          <span style={{ color: 'rgba(255,255,255,0.55)', minWidth: 28 }}>{speed.toFixed(1)}x</span>
        </label>

        <label style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'rgba(255,255,255,0.45)', fontSize: 12 }}>
          Labels
          <input type="checkbox" defaultChecked onChange={onToggleLabels} style={{ accentColor: '#f5a623', cursor: 'pointer' }} />
        </label>

        <label style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'rgba(255,255,255,0.45)', fontSize: 12 }}>
          Trails
          <input type="checkbox" defaultChecked onChange={onToggleTrails} style={{ accentColor: '#f5a623', cursor: 'pointer' }} />
        </label>

        <button
          onClick={() => setShowAsteroids(v => !v)}
          style={{
            marginTop:    4,
            background:   showAsteroids ? 'rgba(68,170,255,0.15)' : 'rgba(255,255,255,0.05)',
            border:       `0.5px solid ${showAsteroids ? 'rgba(68,170,255,0.4)' : 'rgba(255,255,255,0.15)'}`,
            borderRadius: 6,
            color:        showAsteroids ? '#44aaff' : 'rgba(255,255,255,0.45)',
            fontSize:     12,
            padding:      '5px 10px',
            cursor:       'pointer',
          }}
        >
          {showAsteroids ? '✕ Close Asteroids' : '☄ Live Asteroids'}
        </button>
      </div>

      {/* Simulation date + Today button */}
      <div style={{
        position:   'absolute',
        bottom:     20,
        left:       '50%',
        transform:  'translateX(-50%)',
        display:    'flex',
        alignItems: 'center',
        gap:        12,
        background: 'rgba(4,6,24,0.85)',
        border:     '0.5px solid rgba(255,255,255,0.1)',
        borderRadius: 20,
        padding:    '6px 16px',
      }}>
        <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)', letterSpacing: '.04em' }}>
          📅
        </span>
        <span style={{ fontSize: 13, color: '#fff', fontVariantNumeric: 'tabular-nums', minWidth: 120, textAlign: 'center' }}>
          {formattedDate}
        </span>
        <button
          onClick={resetToToday}
          style={{
            background:   'rgba(255,255,255,0.08)',
            border:       '0.5px solid rgba(255,255,255,0.15)',
            borderRadius: 10,
            color:        'rgba(255,255,255,0.5)',
            fontSize:     11,
            padding:      '3px 10px',
            cursor:       'pointer',
          }}
        >
          Today
        </button>
      </div>

      {/* Hint */}
      <div style={{ position: 'absolute', top: 14, right: 16, fontSize: 11, color: 'rgba(255,255,255,0.22)', textAlign: 'right', lineHeight: 2 }}>
        drag · scroll · click
      </div>

      <InfoPanel planet={selected} onDismiss={() => setSelected(null)} />
      {showAsteroids && <AsteroidPanel onClose={() => setShowAsteroids(false)} />}
    </div>
  );
}