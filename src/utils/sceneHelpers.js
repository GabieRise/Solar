import * as THREE from 'three';

export function addStarField(scene) {
  const geo = new THREE.BufferGeometry();
  const verts = [];
  for (let i = 0; i < 2400; i++) {
    const theta = Math.random() * Math.PI * 2;
    const phi   = Math.acos(2 * Math.random() - 1);
    const r     = 500 + Math.random() * 600;
    verts.push(
      r * Math.sin(phi) * Math.cos(theta),
      r * Math.sin(phi) * Math.sin(theta),
      r * Math.cos(phi)
    );
  }
  geo.setAttribute('position', new THREE.Float32BufferAttribute(verts, 3));
  scene.add(new THREE.Points(geo, new THREE.PointsMaterial({ color: 0xffffff, size: 0.8, sizeAttenuation: true })));
}

export function addAsteroidBelt(scene) {
  const geo = new THREE.BufferGeometry();
  const verts = [];
  for (let i = 0; i < 900; i++) {
    const a = Math.random() * Math.PI * 2;
    const r = 72 + Math.random() * 10;
    verts.push(Math.cos(a) * r, (Math.random() - 0.5) * 2, Math.sin(a) * r);
  }
  geo.setAttribute('position', new THREE.Float32BufferAttribute(verts, 3));
  scene.add(new THREE.Points(geo, new THREE.PointsMaterial({ color: 0xaaaaaa, size: 0.55, sizeAttenuation: true, transparent: true, opacity: 0.7 })));
}

export function addComet(scene) {
  const pivot = new THREE.Object3D();
  pivot.userData.angle = 0;
  scene.add(pivot);

  const head = new THREE.Mesh(
    new THREE.SphereGeometry(0.8, 12, 12),
    new THREE.MeshBasicMaterial({ color: 0xccddff })
  );
  head.position.set(190, 3, 0);
  pivot.add(head);

  const tailVerts = [];
  for (let i = 0; i < 80; i++) tailVerts.push(-i * 0.45 - 0.8, i * 0.02, 0);
  const tailGeo = new THREE.BufferGeometry();
  tailGeo.setAttribute('position', new THREE.Float32BufferAttribute(tailVerts, 3));
  head.add(new THREE.Line(tailGeo, new THREE.LineBasicMaterial({ color: 0x99ccff, transparent: true, opacity: 0.35 })));

  return pivot;
}

export function buildPlanetMesh(p, textures) {
  const mesh = new THREE.Mesh(
    new THREE.SphereGeometry(p.radius, 40, 40),
    new THREE.MeshStandardMaterial({ map: textures[p.tex], roughness: 0.75, metalness: 0.05 })
  );
  mesh.rotation.z = p.tilt || 0;
  mesh.position.set(p.dist, 0, 0);
  mesh.userData = { planet: p };

  if (p.atm) {
    mesh.add(new THREE.Mesh(
      new THREE.SphereGeometry(p.radius * 1.08, 32, 32),
      new THREE.MeshBasicMaterial({ color: p.atm, transparent: true, opacity: 0.09, side: THREE.BackSide })
    ));
  }

  if (p.rings) {
    const rGeo = new THREE.RingGeometry(p.radius * 1.4, p.radius * 2.5, 80);
    const ring = new THREE.Mesh(rGeo, new THREE.MeshBasicMaterial({ map: textures.ring, side: THREE.DoubleSide, transparent: true, opacity: 0.75 }));
    ring.rotation.x = Math.PI / 2.5;
    mesh.add(ring);

    const ring2 = new THREE.Mesh(
      new THREE.RingGeometry(p.radius * 2.55, p.radius * 2.9, 80),
      new THREE.MeshBasicMaterial({ color: 0xc8a870, transparent: true, opacity: 0.2, side: THREE.DoubleSide })
    );
    ring2.rotation.x = Math.PI / 2.5;
    mesh.add(ring2);
  }

  if (p.moon) {
    const moonPivot = new THREE.Object3D();
    moonPivot.userData.angle = Math.random() * Math.PI * 2;
    const moonMesh = new THREE.Mesh(
      new THREE.SphereGeometry(0.5, 16, 16),
      new THREE.MeshStandardMaterial({ map: textures.moon, roughness: 0.9 })
    );
    moonMesh.position.set(p.radius * 2.8, 0, 0);
    moonPivot.add(moonMesh);
    mesh.add(moonPivot);
    mesh.userData.moonPivot = moonPivot;
  }

  return mesh;
}