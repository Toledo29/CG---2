import * as THREE from  'three';
import { OrbitControls } from '../build/jsm/controls/OrbitControls.js';
import Stats from '../build/jsm/libs/stats.module.js';
import {initRenderer, 
        initDefaultBasicLight,
        setDefaultMaterial,
        InfoBox,
        onWindowResize,
        createGroundPlaneWired} from "../libs/util/util.js";

import { aviao, helice } from './aviao.js';

let scene, renderer, camera, light, orbit;; // Inicializa Variáveis
scene = new THREE.Scene();    // Cria cena
renderer = initRenderer();    // Inicializa o renderizador
light = initDefaultBasicLight(scene); // Inicializa luz
const clock = new THREE.Clock();

// Cria a câmera e configura
camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
   camera.position.set(0.0, 11, -90.0);
   camera.up.set( 0.0, 1.0, 0.0 );
   camera.lookAt(0.0, 11, 0.0);

// cria os materiais padrões para os objetos
let material1 = setDefaultMaterial('rgb(139, 69, 19)');
let material2 = setDefaultMaterial('green');
let material3 = setDefaultMaterial('darkgreen');

// Cria Fog
const fogColor = 0x87ceeb; // cor da névoa (azul claro)
let fogDistance = 100; // distância onde a névoa começa a ser aplicada
scene.background = new THREE.Color(fogColor);
scene.fog = new THREE.Fog( fogColor, fogDistance, 500 );

// Listen window size changes
window.addEventListener( 'resize', function(){onWindowResize(camera, renderer)}, false );


// Configuração de FPS
const container = document.getElementById( 'container' );
const stats = new Stats();
container.appendChild( stats.dom );

// Cria constantes para plano do chão
const planeWidth = 500;
const planeDepth = 150;
const halfPlaneWidth = planeWidth / 2;
const halfPlaneDepth = planeDepth / 2;

// Cria geometria dos componentes da árvore
let logGeometry1 = new THREE.CylinderGeometry(0.3, 0.3, 4, 5);
let logGeometry2 = new THREE.CylinderGeometry(0.3, 0.3, 3, 5);
let sphereLeafGeometry1 = new THREE.SphereGeometry(1.3, 4, 5);
let coneLeafGeometry1 = new THREE.ConeGeometry(2, 2, 5);
let coneLeafGeometry2 = new THREE.ConeGeometry(1.5, 2, 5);
pontaDireita.scale.set(0.2, 1, 0.6); 
// aviao.rotation.x = Math.PI;
scene.add(aviao);

// alvo invisivel para camera (x/y fixos e z seguindo o aviao)
const cameraTarget = new THREE.Object3D();
cameraTarget.position.set(0, 11.5, aviao.position.z);
scene.add(cameraTarget);

// configura variáveis para controle de geração dos chunks
const cameraFollowZOffset = -20; // distância da camera para o alvo
const treeCountPerChunk = 400; // quantidade de árvores por chunk
const minDistance = 4.5; // distância mínima entre as árvores para evitar sobreposição
const margin = 2; // margem ao redor do chunk
const maxPlacementAttempts = 10000;

const chunks = new Map();
const chunksAhead = 4; // quantidade de chunks gerados à frente do avião
const chunksBehind = 1; // quantidade de chunks mantidos atrás do avião 

// Iniciialização de constantes para controle de mapeamento do mouse
const mouseNDC = new THREE.Vector2(0, 0); 
const raycaster = new THREE.Raycaster();
const zPlaneNormal = new THREE.Vector3(0, 0, 1);
const mousePlane = new THREE.Plane();
const intersectionPoint = new THREE.Vector3();

// Mapea o do mouse para movimentação do avião em X/Y
window.addEventListener('mousemove', function(event){
  mouseNDC.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouseNDC.y = -((event.clientY / window.innerHeight) * 2 - 1);
});

// Função para obter a posição no mundo a partir das coordenadas NDC do mouse, projetando um plano no eixo Z
function getWorldPointAtZPlane(ndcX, ndcY, zValue){
  mousePlane.setFromNormalAndCoplanarPoint(zPlaneNormal, new THREE.Vector3(0, 0, zValue));
  raycaster.setFromCamera(new THREE.Vector2(ndcX, ndcY), camera);

  const hasIntersection = raycaster.ray.intersectPlane(mousePlane, intersectionPoint);
  if(!hasIntersection){
    return new THREE.Vector3(0, 0, zValue);
  }

  return intersectionPoint.clone();
}

// Calcula os limites do plano visível no plano Z para limitar o movimento do avião dentro da tela
function getScreenBoundsAtZPlane(zPlane){
  const corners = [
    getWorldPointAtZPlane(-1, -1, zPlane),
    getWorldPointAtZPlane(-1, 1, zPlane),
    getWorldPointAtZPlane(1, -1, zPlane),
    getWorldPointAtZPlane(1, 1, zPlane)
  ];

  let minX = Infinity;
  let maxX = -Infinity;
  let minY = Infinity;
  let maxY = -Infinity;

  for(const p of corners){
    minX = Math.min(minX, p.x);
    maxX = Math.max(maxX, p.x);
    minY = Math.min(minY, p.y);
    maxY = Math.max(maxY, p.y);
  }

  return { minX, maxX, minY, maxY };
}

function lerpAtConstantSpeed(current, target, maxStep){
  const distance = target - current;
  const absDistance = Math.abs(distance);

  if(absDistance === 0){
    return current;
  }

  const alpha = Math.min(1, maxStep / absDistance);
  return THREE.MathUtils.lerp(current, target, alpha);
}

// Função para criar um chunk de terreno com árvores, evitando sobreposição
function createChunk(chunkIndex){
  const chunkGroup = new THREE.Group();
  const chunkCenterZ = chunkIndex * planeDepth;

  const chunkPlane = createGroundPlaneWired(planeWidth, planeDepth);
  chunkPlane.position.set(0, 0, chunkCenterZ);
  chunkGroup.add(chunkPlane);

  const treePositions = [];
  let attempts = 0;

  while(treePositions.length < treeCountPerChunk && attempts < maxPlacementAttempts){
    let x = THREE.MathUtils.randFloat(-halfPlaneWidth + margin, halfPlaneWidth - margin);
    let zLocal = THREE.MathUtils.randFloat(-halfPlaneDepth + margin, halfPlaneDepth - margin);

    let tooClose = false;
    for(const pos of treePositions){
      if(pos.distanceToSquared(new THREE.Vector3(x, 0, zLocal)) < minDistance * minDistance){
        tooClose = true;
        break;
      }
    }

    if(!tooClose){
      treePositions.push(new THREE.Vector3(x, 0, zLocal));
    }

    attempts++;
  }

  for(const pos of treePositions){
    let tree;
    if(Math.random() < 0.5){
      tree = new THREE.Mesh(logGeometry1, material1);
      let sphereleaf = new THREE.Mesh(sphereLeafGeometry1, material2);
      tree.add(sphereleaf);
      sphereleaf.position.set(0, 2, 0);
    } else {
      tree = new THREE.Mesh(logGeometry2, material1);
      let coneleaf1 = new THREE.Mesh(coneLeafGeometry1, material3);
      let coneleaf2 = new THREE.Mesh(coneLeafGeometry2, material3);
      let coneleaf3 = new THREE.Mesh(coneLeafGeometry3, material3);
      tree.add(coneleaf1);
      tree.add(coneleaf2);
      tree.add(coneleaf3);
      coneleaf1.position.set(0, 0, 0);
      coneleaf2.position.set(0, 1, 0);
      coneleaf3.position.set(0, 2, 0);
    }
    if(Math.random() < 0.5){
      tree.scale.set(0.8, 0.8, 0.8);
    }
    tree.position.set(pos.x, 1.5, chunkCenterZ + pos.z);
    if(Math.random() < 0.5){
      tree.scale.set(0.75, 0.75, 0.75);
    }
    chunkGroup.add(tree);
  }

  scene.add(chunkGroup);
  chunks.set(chunkIndex, chunkGroup);
}

function removeChunk(chunkIndex){
  const chunkGroup = chunks.get(chunkIndex);
  if(!chunkGroup) return;

  scene.remove(chunkGroup);
  chunks.delete(chunkIndex);
}

function recycleChunk(oldChunkGroup, newChunkIndex){
  const chunkCenterZ = newChunkIndex * planeDepth;
  const oldZ = oldChunkGroup.children[0].position.z;
  const offset = chunkCenterZ - oldZ;
  
  // Move o plano
  oldChunkGroup.children[0].position.z = chunkCenterZ;
  
  // Move todas as árvores junto
  for(let i = 1; i < oldChunkGroup.children.length; i++){
    oldChunkGroup.children[i].position.z += offset;
  }
}

function updateChunks(){
  const currentChunk = Math.floor(aviao.position.z / planeDepth);
  const minChunk = currentChunk - chunksBehind;
  const maxChunk = currentChunk + chunksAhead;

  // Inicializa chunks que não existem
  for(let i = minChunk; i <= maxChunk; i++){
    if(!chunks.has(i)){
      createChunk(i);
    }
  }

  // Recicla chunks: move o chunk mais de trás para a frente quando necessário
  const chunksArray = Array.from(chunks.keys()).sort((a, b) => a - b);
  
  for(const index of chunksArray){
    if(index < minChunk){
      // Encontra o novo índice necessário (maxChunk + 1)
      const newIndex = maxChunk + 1;
      if(!chunks.has(newIndex)){
        const oldChunkGroup = chunks.get(index);
        recycleChunk(oldChunkGroup, newIndex);
        chunks.delete(index);
        chunks.set(newIndex, oldChunkGroup);
      }
    }
  }
}

// Configuração do slider de controle da névoa
const fogSlider = document.getElementById('fogSlider');
const fogValue = document.getElementById('fogValue');
if(fogSlider) {
  fogSlider.addEventListener('input', function(event) {
    fogDistance = parseFloat(event.target.value);
    scene.fog.far = fogDistance;
    fogValue.textContent = fogDistance;
  });
}



updateChunks();

render();
function render()
{
  requestAnimationFrame(render);
  const delta = (clock.getDelta()*0.6);

  const maxRollZ = THREE.MathUtils.degToRad(45);
  const lateralResponse = 8.0;
  const lateralSpeed = 35;
  const verticalSpeed = 18;

  const cameraXOffset = 0.6;
  const cameraYOffset = 0.8;

  aviao.position.z += 0.4;
  cameraTarget.position.z = aviao.position.z;
  cameraTarget.position.x = aviao.position.x - (aviao.position.x*cameraXOffset);

  camera.position.z = cameraTarget.position.z + cameraFollowZOffset;
  camera.position.x = cameraTarget.position.x;
  camera.lookAt(cameraTarget.position.x, cameraTarget.position.y, cameraTarget.position.z);
  camera.updateMatrixWorld();

  const mouseWorld = getWorldPointAtZPlane(mouseNDC.x, mouseNDC.y, aviao.position.z);
  const bounds = getScreenBoundsAtZPlane(aviao.position.z);
  const screenMargin = 4.0;

  const targetX = THREE.MathUtils.clamp(mouseWorld.x, bounds.minX + screenMargin, bounds.maxX - screenMargin);
  const targetY = THREE.MathUtils.clamp(mouseWorld.y, bounds.minY + screenMargin, bounds.maxY - screenMargin);

  aviao.position.x = lerpAtConstantSpeed(aviao.position.x, targetX, lateralSpeed * delta);
  aviao.position.y = lerpAtConstantSpeed(aviao.position.y, targetY, verticalSpeed * delta);

  // inclina ate 45 graus com movimento lateral e estabiliza ao cessar movimento
  const lateralDelta = targetX - aviao.position.x;
  const desiredRollZ = THREE.MathUtils.clamp(
    -(lateralDelta / lateralResponse) * maxRollZ,
    -maxRollZ,
    maxRollZ
  );
  aviao.rotation.z = THREE.MathUtils.lerp(aviao.rotation.z, desiredRollZ, 0.12);


  helice.rotation.z += 0.1;
  stats.update();
  updateChunks();
  renderer.render(scene, camera) // Render scene
}