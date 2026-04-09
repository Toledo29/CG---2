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
camera = initCamera(new THREE.Vector3(0, 5, -25)); // Init camera in this position
light = initDefaultBasicLight(scene); // Create a basic light to illuminate the scene
orbit = new OrbitControls( camera, renderer.domElement ); // Enable mouse rotation, pan, zoom etc.

// cria os materiais para os objetos
let material1 = setDefaultMaterial('rgb(139, 69, 19)');
let material2 = setDefaultMaterial('green');
let material3 = setDefaultMaterial('darkgreen');

// Listen window size changes
window.addEventListener( 'resize', function(){onWindowResize(camera, renderer)}, false );


// cria plano do chão
let plane = createGroundPlaneWired(40, 40)
scene.add(plane);

// cria geometria dos componentes da árvore
let logGeometry1 = new THREE.CylinderGeometry(0.5, 0.5, 5, 32);
let logGeometry2 = new THREE.CylinderGeometry(0.5, 0.5, 5, 32);
let sphereLeafGeometry1 = new THREE.SphereGeometry(2, 32, 32);
let coneLeafGeometry1 = new THREE.ConeGeometry(3, 2, 32);
let coneLeafGeometry2 = new THREE.ConeGeometry(2.5, 2, 32);
let coneLeafGeometry3 = new THREE.ConeGeometry(2, 2, 32);

// cria componentes da árvore e posiciona eles
for(let i = 0; i < 2; i++){
  for(let j = 0; j < 8; j++){
    if(j % 2 == 0){
      let log = new THREE.Mesh(logGeometry1, material1);
      let sphereleaf = new THREE.Mesh(sphereLeafGeometry1, material2);
      log.position.set(10-(20*i), 2.5, j*5-17);
      log.add(sphereleaf);
      sphereleaf.position.set(0, 2.5, 0);
      scene.add(log);
    }
    else{
      let log = new THREE.Mesh(logGeometry2, material1);
      let coneleaf1 = new THREE.Mesh(coneLeafGeometry1, material3);
      let coneleaf2 = new THREE.Mesh(coneLeafGeometry2, material3);
      let coneleaf3 = new THREE.Mesh(coneLeafGeometry3, material3);
      log.position.set(10-(20*i), 2.5, j*5-17);
      log.add(coneleaf1);
      log.add(coneleaf2);
      log.add(coneleaf3);
      coneleaf1.position.set(0, 0, 0);
      coneleaf2.position.set(0, 1, 0);
      coneleaf3.position.set(0, 2, 0);
      scene.add(log);
    }
  }
}



render();
function render()
{
  requestAnimationFrame(render);
  renderer.render(scene, camera) // Render scene
}