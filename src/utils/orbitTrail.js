import * as THREE from 'three';

const TRAIL_LENGTH = 200;

export function createTrail(scene) {
  const positions = new Float32Array(TRAIL_LENGTH * 3);
  const colors    = new Float32Array(TRAIL_LENGTH * 3);

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geo.setAttribute('color',    new THREE.BufferAttribute(colors, 3));
  geo.setDrawRange(0, 0);

  const mat = new THREE.LineBasicMaterial({
    vertexColors: true,
    transparent:  true,
    opacity:      0.85,
    depthWrite:   false,
  });

  const line = new THREE.Line(geo, mat);
  line.frustumCulled = false;
  scene.add(line);

  const history = [];

  return {
    line,
    history,
    update(worldPosition) {
      history.push(worldPosition.clone());
      if (history.length > TRAIL_LENGTH) history.shift();

      const posAttr = geo.attributes.position;
      const colAttr = geo.attributes.color;
      const len     = history.length;

      for (let i = 0; i < len; i++) {
        const p = history[i];
        posAttr.setXYZ(i, p.x, p.y, p.z);

        // fade from 0 (tail) to 1 (head)
        const t = i / (len - 1);
        colAttr.setXYZ(i, t, t, t);
      }

      posAttr.needsUpdate = true;
      colAttr.needsUpdate = true;
      geo.setDrawRange(0, len);
    },
    dispose() {
      scene.remove(line);
      geo.dispose();
      mat.dispose();
    },
  };
}