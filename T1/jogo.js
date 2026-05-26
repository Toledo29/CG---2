// jogo.js

import * as THREE from 'three';

import Stats from '../build/jsm/libs/stats.module.js';

import {
  initRenderer,
  initDefaultBasicLight,
  onWindowResize
} from "../libs/util/util.js";

import {
  loadEnemyModel,
  updateEnemies
} from './enemies.js';

import {
  initPlayerShooting,
  updatePlayerShooting,
  updatePlayerBullets,
  updateEnemyBullets
} from './bullets.js';

import {
  updateCollisions
} from './collision.js';

import {
  playerBoundingBox
} from './aviao.js';

import {
  aviao,
  helice
} from './aviao.js';

import {
  updateChunks
} from './planeUpdate.js';

import {
  makeCreateChunk
} from './plane.js';

import {
  getTerrainHeight
} from './terrain.js';

import {
  createCameraController
} from './cameraController.js';

let scene, renderer, camera, light;

scene = new THREE.Scene();

renderer = initRenderer();

light = initDefaultBasicLight(scene);

const clock = new THREE.Clock();

const cameraController =
  createCameraController(
    scene,
    renderer,
    aviao
  );

camera = cameraController.camera;

// fog
const fogColor = 0x87ceeb;

scene.background = new THREE.Color(fogColor);

scene.fog = new THREE.Fog(
  fogColor,
  100,
  500
);

// resize
window.addEventListener(
  'resize',
  function () {

    onWindowResize(camera, renderer);

  },
  false
);

// stats
const container =
  document.getElementById('container');

const stats = new Stats();

container.appendChild(stats.dom);

// terreno
const planeWidth = 500;

const planeDepth = 150;

const halfPlaneWidth = planeWidth / 2;

const halfPlaneDepth = planeDepth / 2;

// avião
scene.add(aviao);

// carregar inimigo
try {

  await loadEnemyModel(scene);

} catch (e) {

  console.error(
    'Falha ao carregar inimigos'
  );
}

// tiros
initPlayerShooting(
  scene,
  camera,
  aviao
);

// chunks
const chunks = new Map();

const chunksAhead = 4;

const chunksBehind = 1;

const createChunk = makeCreateChunk({

  planeWidth,

  planeDepth,

  halfPlaneWidth,

  halfPlaneDepth,

  treeCountPerChunk: 400,

  maxPlacementAttempts: 10000,

  margin: 2,

  minDistance: 4.5,

  scene,

  chunks
});

updateChunks(
  aviao,
  planeDepth,
  chunks,
  chunksAhead,
  chunksBehind,
  createChunk,
  scene
);

// render
render();

function render() {

  requestAnimationFrame(render);

  try {

    const delta = clock.getDelta();

    // camera
    cameraController.update(delta);

    // altura do terreno
    const terrainHeight =
      getTerrainHeight(
        aviao.position.x,
        aviao.position.z
      );

    const safeHeight =
      terrainHeight + 8;

    if (
      aviao.position.y < safeHeight
    ) {

      aviao.position.y =
        safeHeight;
    }

    // hélice
    helice.rotation.z += 0.1;

    // fps
    stats.update();

    // chunks
    updateChunks(
      aviao,
      planeDepth,
      chunks,
      chunksAhead,
      chunksBehind,
      createChunk,
      scene
    );

    // tiros
    updatePlayerShooting(delta);

    updatePlayerBullets(delta);

    updateEnemyBullets(
      delta,
      aviao
    );

    // inimigos
    updateEnemies(
      delta,
      aviao
    );

    // colisão
    updateCollisions(
      aviao,
      playerBoundingBox
    );

    // render
    renderer.render(
      scene,
      camera
    );

  } catch (e) {

    console.error(
      'Erro no render:',
      e
    );
  }
}