import * as THREE from  'three';
import { OrbitControls } from '../build/jsm/controls/OrbitControls.js';
import {initRenderer, 
        initCamera,
        initDefaultBasicLight,
        setDefaultMaterial,
        InfoBox,
        onWindowResize,
        createGroundPlaneWired} from "../libs/util/util.js";

let scene, renderer, camera, light, orbit;; // Initial variables
scene = new THREE.Scene();    // Create main scene
renderer = initRenderer();    // Init a basic renderer
camera = initCamera(new THREE.Vector3(0, 11, -90)); // Init camera in this position
camera.lookAt(0, 11, 0);
light = initDefaultBasicLight(scene); // Create a basic light to illuminate the scene

camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
   camera.position.set(0.0, 11, -90.0);
   camera.up.set( 0.0, 1.0, 0.0 );
   camera.lookAt(0.0, 11, 0.0);

// cria os materiais para os objetos
let material1 = setDefaultMaterial('rgb(139, 69, 19)');
let material2 = setDefaultMaterial('green');
let material3 = setDefaultMaterial('darkgreen');

// Listen window size changes
window.addEventListener( 'resize', function(){onWindowResize(camera, renderer)}, false );


// cria plano do chão
const planeWidth = 150;
const planeDepth = 150;
const halfPlaneWidth = planeWidth / 2;
const halfPlaneDepth = planeDepth / 2;
let plane = createGroundPlaneWired(planeWidth, planeDepth);
scene.add(plane);

// cria geometria dos componentes da árvore
let logGeometry1 = new THREE.CylinderGeometry(0.3, 0.3, 3, 32);
let logGeometry2 = new THREE.CylinderGeometry(0.3, 0.3, 3, 32);
let sphereLeafGeometry1 = new THREE.SphereGeometry(1.3, 32, 32);
let coneLeafGeometry1 = new THREE.ConeGeometry(2, 2, 32);
let coneLeafGeometry2 = new THREE.ConeGeometry(1.5, 2, 32);
let coneLeafGeometry3 = new THREE.ConeGeometry(1, 2, 32);

let airPlaneGeometry = new THREE.BoxGeometry(1, 0.5, 1);
let airPlaneMaterial = setDefaultMaterial('red');
let airPlane = new THREE.Mesh(airPlaneGeometry, airPlaneMaterial);
airPlane.position.set(0, 11.5, -70);
scene.add(airPlane);
const cameraFollowZOffset = -20;
let groundCurrentCenter = new THREE.Vector3(0, 0, 0);

// cria e posiciona árvores em pontos aleatórios com distância mínima entre elas
const treeCount = 400;
const minDistance = 4.5;
const margin = 2;
const edgeBandWidth = Math.min(20, Math.min(halfPlaneWidth, halfPlaneDepth) * 0.3);
const edgeBias = 0.45;
const maxPlacementAttempts = 10000;
const treePositions = [];

let attempts = 0;
while(treePositions.length < treeCount && attempts < maxPlacementAttempts){
  let x = THREE.MathUtils.randFloat(-halfPlaneWidth + margin, halfPlaneWidth - margin);
  let z = THREE.MathUtils.randFloat(-halfPlaneDepth + margin, halfPlaneDepth - margin);

  // parte das árvores é sorteada com viés para as bordas do plano
  if(Math.random() < edgeBias){
    const nearRightOrTop = Math.random() < 0.5;
    const useXAxis = Math.random() < 0.5;

    if(useXAxis){
      x = nearRightOrTop
        ? THREE.MathUtils.randFloat(halfPlaneWidth - margin - edgeBandWidth, halfPlaneWidth - margin)
        : THREE.MathUtils.randFloat(-halfPlaneWidth + margin, -halfPlaneWidth + margin + edgeBandWidth);
    } else {
      z = nearRightOrTop
        ? THREE.MathUtils.randFloat(halfPlaneDepth - margin - edgeBandWidth, halfPlaneDepth - margin)
        : THREE.MathUtils.randFloat(-halfPlaneDepth + margin, -halfPlaneDepth + margin + edgeBandWidth);
    }
  }

  let tooClose = false;
  for(const pos of treePositions){
    if(pos.distanceToSquared(new THREE.Vector3(x, 0, z)) < minDistance * minDistance){
      tooClose = true;
      break;
    }
  }

  if(!tooClose){
    treePositions.push(new THREE.Vector3(x, 0, z));
  }

  attempts++;
}

for(const pos of treePositions){
  let num = Math.floor(Math.random() * 100);
  if(num % 2 == 0){
    let log = new THREE.Mesh(logGeometry1, material1);
    let sphereleaf = new THREE.Mesh(sphereLeafGeometry1, material2);
    log.position.set(pos.x, 1.5, pos.z);
    log.add(sphereleaf);
    sphereleaf.position.set(0, 1.5, 0);
    scene.add(log);
  }
  else{
    let log = new THREE.Mesh(logGeometry2, material1);
    let coneleaf1 = new THREE.Mesh(coneLeafGeometry1, material3);
    let coneleaf2 = new THREE.Mesh(coneLeafGeometry2, material3);
    let coneleaf3 = new THREE.Mesh(coneLeafGeometry3, material3);
    log.position.set(pos.x, 1.5, pos.z);
    log.add(coneleaf1);
    log.add(coneleaf2);
    log.add(coneleaf3);
    coneleaf1.position.set(0, 0, 0);
    coneleaf2.position.set(0, 1, 0);
    coneleaf3.position.set(0, 2, 0);
    scene.add(log);
  }
}



render();
function render()
{
  requestAnimationFrame(render);
  airPlane.position.z += 0.5;
  camera.position.z = airPlane.position.z + cameraFollowZOffset;
  camera.lookAt(airPlane.position.x, airPlane.position.y, airPlane.position.z);
  renderer.render(scene, camera) // Render scene
}