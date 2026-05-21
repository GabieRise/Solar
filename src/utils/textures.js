import * as THREE from 'three';

const loader = new THREE.TextureLoader();

function load(path) {
  return loader.load(`/textures/${path}`);
}

function makeTexture(size, drawFn) {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = size;
  drawFn(canvas.getContext('2d'), size);
  return new THREE.CanvasTexture(canvas);
}

function noisy(ctx, size, colors) {
  const img = ctx.createImageData(size, size);
  const d   = img.data;
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const n  = Math.sin(x * 0.1) * Math.cos(y * 0.1) + Math.random() * 0.4;
      const ci = Math.floor(((n + 1) / 2) * (colors.length - 1));
      const c  = colors[Math.max(0, Math.min(colors.length - 1, ci))];
      const i  = (y * size + x) * 4;
      d[i]     = (c >> 16) & 255;
      d[i + 1] = (c >> 8)  & 255;
      d[i + 2] =  c        & 255;
      d[i + 3] = 255;
    }
  }
  ctx.putImageData(img, 0, 0);
}

export function buildTextures() {
  return {
    // Planets
    sun:         load('sun.jpg'),
    mercury:     load('mercury.jpg'),
    venus:       load('venus.jpg'),
    earth:       load('earth_day.jpg'),
    earthNight:  load('earth_night.jpg'),
    earthClouds: load('earth_clouds.jpg'),
    mars:        load('mars.jpg'),
    jupiter:     load('jupiter.jpg'),
    saturn:      load('saturn.jpg'),
    saturnRing:  load('saturn_ring.png'),
    uranus:      load('uranus.jpg'),
    neptune:     load('neptune.jpg'),

    // Moons — real textures
    moon:      load('moon.jpg'),
    europa:    load('europa.jpg'),
    ganymede:  load('ganymede.jpg'),
    io:        load('io.jpg'),
    titan:     load('titan.jpg'),

    // Moons — procedural textures
    callisto:  makeTexture(64, (ctx, s) => noisy(ctx, s, [0x554433, 0x776655, 0x443322, 0x887766])),
    enceladus: makeTexture(64, (ctx, s) => noisy(ctx, s, [0xddeeff, 0xffffff, 0xbbccdd, 0xeeeeff])),
    titania:   makeTexture(64, (ctx, s) => noisy(ctx, s, [0x778899, 0x556677, 0x99aabb, 0x445566])),
    oberon:    makeTexture(64, (ctx, s) => noisy(ctx, s, [0x665544, 0x887766, 0x554433, 0x776655])),
  };
}