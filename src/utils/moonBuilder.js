import * as THREE from 'three';
import { MOONS } from '../data/moons';

export function addMoons(planetMesh, planetName, textures, allClickable) {
  const moonDefs = MOONS[planetName];
  if (!moonDefs) return;

  moonDefs.forEach(m => {
    const pivot = new THREE.Object3D();
    pivot.userData.angle = Math.random() * Math.PI * 2;
    pivot.userData.speed = m.speed;

    const moonMesh = new THREE.Mesh(
      new THREE.SphereGeometry(m.radius, 24, 24),
      new THREE.MeshStandardMaterial({ map: textures[m.tex], roughness: 0.9 })
    );
    moonMesh.position.set(m.orbit, 0, 0);
    moonMesh.userData = {
      planet: { name: m.name, facts: m.facts },
      isMoon: true,
    };

    // Faint orbit ring for each moon
    const orbitPts = Array.from({ length: 65 }, (_, i) =>
      new THREE.Vector3(
        Math.cos(i / 64 * Math.PI * 2) * m.orbit,
        0,
        Math.sin(i / 64 * Math.PI * 2) * m.orbit
      )
    );
    const orbitLine = new THREE.Line(
      new THREE.BufferGeometry().setFromPoints(orbitPts),
      new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.04 })
    );
    pivot.add(orbitLine);
    pivot.add(moonMesh);
    planetMesh.add(pivot);

    // Make clickable
    allClickable.push(moonMesh);

    // Store pivot reference for animation
    if (!planetMesh.userData.moonPivots) planetMesh.userData.moonPivots = [];
    planetMesh.userData.moonPivots.push(pivot);
  });
}