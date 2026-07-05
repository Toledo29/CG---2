// A implementação dos shaders segue a seuinte lógica:
// Para a água é utilizado o shader do THREE.Water, que já implementa a reflexão e refração da água, além de simular o movimento das ondas.
// Para o terreno, é utilizado um shader customizado que aplica uma textura de altura (heightmap) para criar a ilusão de relevo, além de aplicar uma textura de cor (colormap) para dar cor ao terreno.
// O shader do terreno também implementa a iluminação baseada na posição do sol, que é simulada com uma luz direcional.
// Modifica o shader padrão do THREE.MeshStandardMaterial usando onBeforeCompile
import * as THREE from 'three';
import { OrbitControls } from '../build/jsm/controls/OrbitControls.js';
import Stats from '../build/jsm/libs/stats.module.js';
import { initRenderer, setDefaultMaterial, InfoBox, onWindowResize, createGroundPlaneWired } from "../libs/util/util.js";
import { aviao, helice } from './aviao.js';
import { initPlayerShooting, updatePlayerShooting, updatePlayerBullets, updateEnemyBullets } from './bullets.js';
import { loadEnemyModel, updateEnemies } from './enemies.js';
import { updateCollisions } from './collision.js';
import { updateChunks, removeChunk, recycleChunk } from './planeUpdate.js';
import { makeCreateChunk } from './plane.js';
import { getTerrainHeight } from './terrain.js';
import { createCameraController } from './cameraController.js';
import { createLights, updateDirectionalShadow } from './light.js';
import { loadingManager } from './loadingManager.js';
import { initPlayerState, isGameOver, healEnergy } from './playerState.js';
import { initHealthPacks, updateHealthPacks } from './healthpacks.js';
import { createWater, updateWater } from './water.js';
import { createBackgroundSound, createBulletSound , createHealSound, createPlayerSound, createEnemySound } from './sound.js';

let scene, renderer, camera, light, orbit;; // Inicializa Variáveis
scene = new THREE.Scene();    // Cria cena
const clock = new THREE.Clock();

renderer = new THREE.WebGLRenderer();

renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

renderer.setSize(window.innerWidth, window.innerHeight);
document.getElementById("webgl-output").appendChild(renderer.domElement);

renderer.setClearColor("rgb(255, 255, 255)");

// Cria a câmera e controlador
const cameraController = createCameraController(scene, renderer, aviao);
camera = cameraController.camera;
initPlayerShooting(scene, camera, aviao);
loadEnemyModel(scene).catch((error) => console.error(error));

const backgroundSound = createBackgroundSound(camera); // Inicializa o som de fundo
const bulletSound = createBulletSound(camera); // Inicializa o som do tiro
const healSound = createHealSound(camera); // Inicializa o som de cura
const playerSound = createPlayerSound(camera); // Inicializa o som do player
const enemySound = createEnemySound(camera); // Inicializa o som do inimigo


// Cria Fog
const fogColor = 0x87ceeb;
let fogDistance = 100;
scene.background = new THREE.Color(fogColor);
scene.fog = new THREE.Fog(fogColor, fogDistance, 500);
light = createLights(scene, fogDistance);

window.addEventListener('resize', function () { onWindowResize(camera, renderer) }, false);

const container = document.getElementById('container');
const stats = new Stats();
container.appendChild(stats.dom);

const planeWidth = 500;
const planeDepth = 150;
const halfPlaneWidth = planeWidth / 2;
const halfPlaneDepth = planeDepth / 2;

scene.add(aviao);

const cameraTarget = cameraController.cameraTarget;

const cameraFollowZOffset = -20;
const treeCountPerChunk = 400;
const minDistance = 4.5;
const margin = 2;
const maxPlacementAttempts = 10000;

const chunks = new Map();
const chunksAhead = 4;
const chunksBehind = 1;
const playerBoundingBox = new THREE.Box3();

const water = createWater(planeWidth, planeDepth * (chunksAhead + chunksBehind + 4));
scene.add(water);

const createChunk = makeCreateChunk({
  planeWidth,
  planeDepth,
  halfPlaneWidth,
  halfPlaneDepth,
  treeCountPerChunk,
  maxPlacementAttempts,
  margin,
  minDistance,
  scene,
  chunks,
  player: aviao
});

const fogSlider = document.getElementById('fogSlider');
const fogValue = document.getElementById('fogValue');
if (fogSlider) {
  fogSlider.addEventListener('input', function (event) {
    fogDistance = parseFloat(event.target.value);
    scene.fog.far = fogDistance;
    const newSide = updateDirectionalShadow(light, fogDistance);
    if (light) light.userData.shadowSide = newSide;
    fogValue.textContent = fogDistance;
  });
}

updateChunks(aviao, planeDepth, chunks, chunksAhead, chunksBehind, createChunk, scene);

initPlayerState();
initHealthPacks(scene, healEnergy);

const loadingScreen = document.getElementById('loadingScreen');
const loadingBarFill = document.getElementById('loadingBarFill');
const loadingPercentText = document.getElementById('loadingPercentText');
const startButton = document.getElementById('startButton');

let gameStarted = false;

loadingManager.onProgress = function (url, itemsLoaded, itemsTotal) {
    const percent = Math.round((itemsLoaded / itemsTotal) * 100);
    if (loadingBarFill) loadingBarFill.style.width = percent + '%';
    if (loadingPercentText) loadingPercentText.innerText = `Carregando assets... ${percent}%`;
};

loadingManager.onLoad = function () {
    if (loadingBarFill) loadingBarFill.style.width = '100%';
    if (loadingPercentText) loadingPercentText.innerText = 'Carregando assets... 100%';
    if (startButton) {
        startButton.disabled = false;
        startButton.style.cursor = 'pointer';
        startButton.style.background = '#33cc55';
        startButton.style.opacity = '1';
    }
};

loadingManager.onError = function (url) {
    console.error('Erro ao carregar asset:', url);
};

if (startButton) {
    startButton.addEventListener('click', () => {
        if (gameStarted) return;
        gameStarted = true;
        if (loadingScreen) loadingScreen.style.display = 'none';

        if (!backgroundSound.isPlaying) {
            backgroundSound.play();
        }

        render();
    });
}

function render() {
  requestAnimationFrame(render);

  const delta = Math.min(clock.getDelta() * 0.6, 0.05);

  // NOVO: quando o jogo termina, para de atualizar a lógica (mas continua
  // renderizando o último frame, já que a tela de game over fica por cima)
  if (isGameOver()) {
      updateWater(delta, aviao.position, light);
      renderer.render(scene, camera);
      return;
  }

  cameraController.update(delta);
  updatePlayerShooting(delta, bulletSound);
  updatePlayerBullets(delta);
  updateEnemyBullets(delta, aviao);
  updateEnemies(delta, aviao);
  updateCollisions(aviao, playerBoundingBox, playerSound, enemySound);
  updateHealthPacks(delta, aviao, healSound); // NOVO

  const terrainHeight = getTerrainHeight(
    aviao.position.x,
    aviao.position.z
  );

  const safeHeight = terrainHeight + 8;

  if (aviao.position.y < safeHeight) {
    aviao.position.y = safeHeight;
  }

  helice.rotation.z += 0.1;
  stats.update();
  updateChunks(aviao, planeDepth, chunks, chunksAhead, chunksBehind, createChunk, scene);

  if (light && light.target && light.userData && light.userData.shadowSide) {
    const side = light.userData.shadowSide;
    light.position.set(
      -halfPlaneWidth,
      side * 0.9,
      aviao.position.z + side * 0.4
    );
    light.target.position.set(halfPlaneWidth, 0, aviao.position.z + (side * 0.4));
    light.updateMatrixWorld();
    light.target.updateMatrixWorld();
  }

  updateWater(delta, aviao.position, light);

  renderer.render(scene, camera);
}