import * as THREE from 'three';

const loader = new THREE.TextureLoader();

function load(path) {
  return loader.load(`/textures/${path}`);
}

export function buildTextures() {
  return {
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
    moon:        load('moon.jpg'),
  };
}