import * as THREE from 'three';

function makeTexture(size, drawFn) {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = size;
  drawFn(canvas.getContext('2d'), size);
  return new THREE.CanvasTexture(canvas);
}

function noisy(ctx, size, colors, bands = 4) {
  const img = ctx.createImageData(size, size);
  const d = img.data;
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const n = Math.sin(x * 0.08) * Math.cos(y * 0.12)
              + Math.sin(x * 0.03 + y * 0.05) * 0.5
              + Math.random() * 0.15;
      const t = (Math.sin(y * bands * Math.PI / size * 2) + 1) / 2;
      const ci = Math.floor(((n + t) * 0.5 + 0.5) * (colors.length - 1));
      const col = colors[Math.max(0, Math.min(colors.length - 1, ci))];
      const i = (y * size + x) * 4;
      d[i]     = (col >> 16) & 255;
      d[i + 1] = (col >> 8)  & 255;
      d[i + 2] =  col        & 255;
      d[i + 3] = 255;
    }
  }
  ctx.putImageData(img, 0, 0);
}

export function buildTextures() {
  return {
    sun: makeTexture(256, (ctx, s) =>
      noisy(ctx, s, [0xffcc00, 0xff9900, 0xff6600, 0xffdd44, 0xffbb00], 6)),

    mercury: makeTexture(128, (ctx, s) =>
      noisy(ctx, s, [0x888888, 0xaaaaaa, 0x666666, 0x999999], 4)),

    venus: makeTexture(128, (ctx, s) =>
      noisy(ctx, s, [0xe8c87a, 0xd4a84b, 0xf0d890, 0xc8a050], 3)),

    earth: makeTexture(256, (ctx, s) => {
      noisy(ctx, s, [0x2255aa, 0x227733, 0x115522, 0x4499cc, 0x336644], 4);
      const img = ctx.getImageData(0, 0, s, s);
      for (let i = 0; i < img.data.length; i += 4) {
        if (Math.random() < 0.015) {
          img.data[i] = img.data[i + 1] = img.data[i + 2] = 255;
        }
      }
      ctx.putImageData(img, 0, 0);
    }),

    mars: makeTexture(128, (ctx, s) =>
      noisy(ctx, s, [0xc1440e, 0x993311, 0xe06030, 0xaa3322, 0xdd7755], 5)),

    jupiter: makeTexture(256, (ctx, s) => {
      noisy(ctx, s, [0xc88b3a, 0xe8b86a, 0xa06828, 0xd4a050, 0x886030], 8);
      const img = ctx.getImageData(0, 0, s, s);
      const d = img.data;
      for (let y = s * 0.45; y < s * 0.55; y++) {
        for (let x = s * 0.3; x < s * 0.6; x++) {
          const i = (Math.floor(y) * s + Math.floor(x)) * 4;
          d[i] = 200; d[i + 1] = 80; d[i + 2] = 50;
        }
      }
      ctx.putImageData(img, 0, 0);
    }),

    saturn: makeTexture(256, (ctx, s) =>
      noisy(ctx, s, [0xead6a0, 0xd4b870, 0xf0e8b0, 0xc8a850], 6)),

    uranus: makeTexture(128, (ctx, s) =>
      noisy(ctx, s, [0x7de8e8, 0x55cccc, 0x99f0f0, 0x44aaaa], 3)),

    neptune: makeTexture(128, (ctx, s) =>
      noisy(ctx, s, [0x3f54ba, 0x2233aa, 0x5577cc, 0x1a2288], 4)),

    moon: makeTexture(64, (ctx, s) =>
      noisy(ctx, s, [0x999999, 0x777777, 0xbbbbbb, 0x666666], 3)),

    ring: makeTexture(256, (ctx, s) => {
      for (let x = 0; x < s; x++) {
        const t = x / s;
        const a = t < 0.1 || t > 0.9 ? 0 : Math.sin(t * Math.PI) * 0.6 + Math.random() * 0.1;
        const br = Math.floor(200 + Math.sin(t * 30) * 30);
        ctx.fillStyle = `rgba(${br},${Math.floor(br * 0.85)},${Math.floor(br * 0.65)},${a})`;
        ctx.fillRect(x, 0, 1, s);
      }
    }),
  };
}