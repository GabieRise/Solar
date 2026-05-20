import { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import { PLANETS } from '../data/planets';
import { buildTextures } from '../utils/textures';
import { addStarField, addAsteroidBelt, addComet, buildPlanetMesh } from '../utils/sceneHelpers';

export default function SolarSystem() {
  const canvasRef   = useRef(null);
  const rootRef     = useRef(null);
  const labelsRef   = useRef([]);
  const [selected, setSelected]     = useState(null);
  const [showLabels, setShowLabels] = useState(true);
  const [speed, setSpeed]           = useState(1);
  const speedRef = useRef(1);

  const handleSpeed = useCallback(e => {
    speedRef.current = parseFloat(e.target.value);
    setSpeed(speedRef.current);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    const root   = rootRef.current;
    const W = () => root.clientWidth;
    const H = () => root.clientHeight;

    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(W(), H());

    const scene  = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(52, W() / H(), 0.1, 3000);
    camera.position.set(0, 70, 155);
    camera.lookAt(0, 0, 0);

    scene.add(new THREE.AmbientLight(0xffffff, 0.07));
    const sunLight = new THREE.PointLight(0xfff8e7, 2.6, 800);
    scene.add(sunLight);

    addStarField(scene);
    addAsteroidBelt(scene);
    const cometPivot = addComet(scene);

    const textures = buildTextures();

    const sunMesh = new THREE.Mesh(
      new THREE.SphereGeometry(8, 40, 40),
      new THREE.MeshStandardMaterial({ map: textures.sun, emissive: 0xffaa00, emissiveIntensity: 1.2, roughness: 1 })
    );
    sunMesh.userData = { planet: { name: 'The Sun', facts: 'Contains 99.86% of the solar system\'s mass. Core temperature reaches 15 million °C.' } };
    scene.add(sunMesh);

    const planetGroups = [];
    const labelDivs    = [];

    PLANETS.forEach(p => {
      const orbitPts = Array.from({ length: 129 }, (_, i) =>
        new THREE.Vector3(Math.cos(i / 128 * Math.PI * 2) * p.dist, 0, Math.sin(i / 128 * Math.PI * 2) * p.dist)
      );
      scene.add(new THREE.Line(
        new THREE.BufferGeometry().setFromPoints(orbitPts),
        new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.06 })
      ));

      const pivot = new THREE.Object3D();
      pivot.userData.angle = Math.random() * Math.PI * 2;
      scene.add(pivot);

      const mesh = buildPlanetMesh(p, textures);
      pivot.add(mesh);
      planetGroups.push({ pivot, mesh, p });

      const div = document.createElement('div');
      div.textContent = p.name;
      div.style.cssText = 'position:absolute;font-size:10.5px;color:rgba(255,255,255,0.45);pointer-events:none;transform:translate(-50%,-50%);white-space:nowrap;letter-spacing:.04em;';
      root.appendChild(div);
      labelDivs.push({ div, mesh });
    });

    labelsRef.current = labelDivs;

    const allMeshes = [sunMesh, ...planetGroups.map(g => g.mesh)];
    const raycaster  = new THREE.Raycaster();
    const mouse      = new THREE.Vector2();
    let isDrag = false, lastX = 0, lastY = 0;
    let azimuth = 0, polar = 0.42, camDist = 168;
    let infoTO;

    function onClick(e) {
      const rect = canvas.getBoundingClientRect();
      mouse.x =  ((e.clientX - rect.left) / rect.width)  * 2 - 1;
      mouse.y = -((e.clientY - rect.top)  / rect.height) * 2 + 1;
      raycaster.setFromCamera(mouse, camera);
      const hits = raycaster.intersectObjects(allMeshes);
      if (hits.length) setSelected(hits[0].object.userData.planet);
    }

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

    canvas.addEventListener('click', onClick);
    canvas.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mouseup', onMouseUp);
    canvas.addEventListener('mousemove', onMouseMove);
    canvas.addEventListener('wheel', onWheel, { passive: false });

    const tmpV = new THREE.Vector3();
    function updateLabels(show) {
      labelsRef.current.forEach(({ div, mesh }) => {
        if (!show) { div.style.display = 'none'; return; }
        tmpV.setFromMatrixPosition(mesh.matrixWorld);
        tmpV.project(camera);
        if (tmpV.z > 1) { div.style.display = 'none'; return; }
        div.style.display = 'block';
        div.style.left = ((tmpV.x * 0.5 + 0.5) * W()) + 'px';
        div.style.top  = ((-tmpV.y * 0.5 + 0.5) * H() - 14) + 'px';
      });
    }

    let prev = performance.now();
    let animId;
    function animate(now) {
      animId = requestAnimationFrame(animate);
      const dt  = Math.min((now - prev) / 1000, 0.05);
      prev = now;
      const spd = speedRef.current;

      planetGroups.forEach(({ pivot, mesh, p }) => {
        pivot.userData.angle += p.speed * spd * dt * 0.22;
        pivot.rotation.y = pivot.userData.angle;
        mesh.rotation.y += dt * 0.3;
        // new change: rotate planet clouds if they exist and orbiting moons
        mesh.children.forEach(child => {
        if (child.userData.isClouds) child.rotation.y += dt * 0.04;
        });
        if (mesh.userData.moonPivot) {
          mesh.userData.moonPivot.userData.angle += dt * spd * 1.8;
          mesh.userData.moonPivot.rotation.y = mesh.userData.moonPivot.userData.angle;
        }
      });

      sunMesh.rotation.y += dt * 0.08;
      cometPivot.userData.angle += 0.004 * spd * dt * 60;
      cometPivot.rotation.y = cometPivot.userData.angle;

      camera.position.x = camDist * Math.cos(polar) * Math.sin(azimuth);
      camera.position.y = camDist * Math.sin(polar);
      camera.position.z = camDist * Math.cos(polar) * Math.cos(azimuth);
      camera.lookAt(0, 0, 0);

      updateLabels(showLabelsRef.current);

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
      canvas.removeEventListener('click', onClick);
      canvas.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mouseup', onMouseUp);
      canvas.removeEventListener('mousemove', onMouseMove);
      canvas.removeEventListener('wheel', onWheel);
      labelDivs.forEach(({ div }) => div.remove());
      renderer.dispose();
      clearTimeout(infoTO);
    };
  }, []);

  const showLabelsRef = useRef(true);
  const onToggleLabels = e => {
    showLabelsRef.current = e.target.checked;
    setShowLabels(e.target.checked);
  };

  return (
    <div ref={rootRef} style={{ position: 'relative', width: '100%', height: '100vh', background: '#00000a', overflow: 'hidden' }}>
      <canvas ref={canvasRef} style={{ width: '100%', height: '100%', display: 'block' }} />

      <div style={{ position: 'absolute', top: 14, left: 16, display: 'flex', flexDirection: 'column', gap: 8 }}>
        <label style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'rgba(255,255,255,0.45)', fontSize: 12 }}>
          Speed
          <input type="range" min="0" max="5" step="0.1" defaultValue="1" onChange={handleSpeed}
            style={{ width: 90, accentColor: '#f5a623' }} />
          <span style={{ color: 'rgba(255,255,255,0.55)', minWidth: 24 }}>{speed.toFixed(1)}x</span>
        </label>
        <label style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'rgba(255,255,255,0.45)', fontSize: 12 }}>
          Labels
          <input type="checkbox" defaultChecked onChange={onToggleLabels} style={{ accentColor: '#f5a623' }} />
        </label>
      </div>

      <div style={{ position: 'absolute', top: 14, right: 16, fontSize: 11, color: 'rgba(255,255,255,0.22)', textAlign: 'right', lineHeight: 2 }}>
        drag · scroll · click
      </div>

      {selected && (
        <div onClick={() => setSelected(null)} style={{
          position: 'absolute', bottom: 20, left: '50%', transform: 'translateX(-50%)',
          background: 'rgba(4,6,24,0.92)', border: '0.5px solid rgba(255,255,255,0.13)',
          borderRadius: 12, padding: '13px 22px', minWidth: 230, maxWidth: 340,
          textAlign: 'center', cursor: 'pointer'
        }}>
          <p style={{ margin: '0 0 5px', fontSize: 17, fontWeight: 500, color: '#fff' }}>{selected.name}</p>
          <p style={{ margin: 0, fontSize: 12.5, color: 'rgba(255,255,255,0.6)', lineHeight: 1.55 }}>{selected.facts}</p>
          <p style={{ margin: '8px 0 0', fontSize: 11, color: 'rgba(255,255,255,0.25)' }}>click to dismiss</p>
        </div>
      )}
    </div>
  );
}