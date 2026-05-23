import * as THREE from 'three';
import { OrbitControls } from '../build/jsm/controls/OrbitControls.js';
import Stats from '../build/jsm/libs/stats.module.js';
import {
  initRenderer,
  initDefaultBasicLight,
  setDefaultMaterial,
  InfoBox,
  onWindowResize,
  createGroundPlaneWired
} from "../libs/util/util.js";

import { aviao, helice } from './aviao.js';
import { updateChunks, removeChunk, recycleChunk } from './planeUpdate.js';
import { makeCreateChunk } from './plane.js';
import { createCameraController } from './cameraController.js';

let scene, renderer, camera, light, orbit;; // Inicializa Variáveis
scene = new THREE.Scene();    // Cria cena
renderer = initRenderer();    // Inicializa o renderizador
light = initDefaultBasicLight(scene); // Inicializa luz
const clock = new THREE.Clock();

// Cria a câmera e controlador
const cameraController = createCameraController(scene, renderer, aviao);
camera = cameraController.camera;
// Cria Fog
const fogColor = 0x87ceeb; // cor da névoa (azul claro)
let fogDistance = 100; // distância onde a névoa começa a ser aplicada
scene.background = new THREE.Color(fogColor);
scene.fog = new THREE.Fog(fogColor, fogDistance, 500);

// Listen window size changes
window.addEventListener('resize', function () { onWindowResize(camera, renderer) }, false);


// Configuração de FPS
const container = document.getElementById('container');
const stats = new Stats();
container.appendChild(stats.dom);

// Cria constantes para plano do chão
const planeWidth = 500;
const planeDepth = 150;
const halfPlaneWidth = planeWidth / 2;
const halfPlaneDepth = planeDepth / 2;


scene.add(aviao);

// cameraTarget é gerenciada pelo controller
const cameraTarget = cameraController.cameraTarget;

// configura variáveis para controle de geração dos chunks
const cameraFollowZOffset = -20; // distância da camera para o alvo
const treeCountPerChunk = 400; // quantidade de árvores por chunk
const minDistance = 4.5; // distância mínima entre as árvores para evitar sobreposição
const margin = 2; // margem ao redor do chunk
const maxPlacementAttempts = 10000;

const chunks = new Map();
const chunksAhead = 4; // quantidade de chunks gerados à frente do avião
const chunksBehind = 1; // quantidade de chunks mantidos atrás do avião 

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
  chunks
});

// Camera, mouse mapping and movement are handled by cameraController
// Configuração do slider de controle da névoa
const fogSlider = document.getElementById('fogSlider');
const fogValue = document.getElementById('fogValue');
if (fogSlider) {
  fogSlider.addEventListener('input', function (event) {
    fogDistance = parseFloat(event.target.value);
    scene.fog.far = fogDistance;
    fogValue.textContent = fogDistance;
  });
}



updateChunks(aviao, planeDepth, chunks, chunksAhead, chunksBehind, createChunk);

render();
function render() {
  requestAnimationFrame(render);
  const delta = (clock.getDelta() * 0.6);

  // delegate movement and camera updates to controller
  cameraController.update(delta);


  helice.rotation.z += 0.1;
  stats.update();
  updateChunks(aviao, planeDepth, chunks, chunksAhead, chunksBehind, createChunk);
  renderer.render(scene, camera) // Render scene
}