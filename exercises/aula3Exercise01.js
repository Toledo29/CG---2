import * as THREE from  'three';
import { OrbitControls } from '../build/jsm/controls/OrbitControls.js';
import {initRenderer, 
        initCamera,
        initDefaultBasicLight,
        setDefaultMaterial,
        InfoBox,
        onWindowResize,
        createGroundPlaneXZ} from "../libs/util/util.js";
import GUI from '../libs/util/dat.gui.module.js'
let scene, renderer, camera, material, light, orbit;; // Initial variables
scene = new THREE.Scene();    // Create main scene
renderer = initRenderer();    // Init a basic renderer
camera = initCamera(new THREE.Vector3(0, 15, 30)); // Init camera in this position
material = setDefaultMaterial(); // create a basic material
light = initDefaultBasicLight(scene); // Create a basic light to illuminate the scene
orbit = new OrbitControls( camera, renderer.domElement ); // Enable mouse rotation, pan, zoom etc.

// Listen window size changes
window.addEventListener( 'resize', function(){onWindowResize(camera, renderer)}, false );

// Show axes (parameter is size of each axis)
let axesHelper = new THREE.AxesHelper( 12 );
scene.add( axesHelper );

const lerpConfig1 = {
  destination: new THREE.Vector3(8, 1, -4),
  alpha: 0.02,
  move:false
}
const lerpConfig2 = {
  destination: new THREE.Vector3(8, 1, 4),
  alpha: 0.01,
  move:false
};

// create the ground plane
let plane = createGroundPlaneXZ(20, 20)
scene.add(plane);

let sphereGeometry = new THREE.SphereGeometry(1, 32, 16);
let sphere1 = new THREE.Mesh(sphereGeometry, material);
sphere1.position.set(-8, 1, -4);
let sphere2 = new THREE.Mesh(sphereGeometry, material);
sphere2.position.set(-8, 1, 4);

scene.add(sphere1, sphere2);


function buildInterface(){

  var controls = new function() {
    this.moverEsfera1 = function() {
      lerpConfig1.move = true;
    }
    this.moverEsfera2 = function() {
      lerpConfig2.move = true;
    }
    this.resetPosition = function() {
      sphere1.position.set(-8, 1, -4);
      sphere2.position.set(-8, 1, 4);
      lerpConfig1.move = false;
      lerpConfig2.move = false;
    }
  }
  // GUI interface
  let gui = new GUI();
  gui.add(controls, 'moverEsfera1').name("Mover Esfera 1");
  gui.add(controls, 'moverEsfera2').name("Mover Esfera 2");
  gui.add(controls, 'resetPosition').name("Reset");
}

buildInterface();
render();

function render()
{
  if(lerpConfig1.move) sphere1.position.lerp(lerpConfig1.destination, lerpConfig1.alpha);
  if(lerpConfig2.move) sphere2.position.lerp(lerpConfig2.destination, lerpConfig2.alpha);
  requestAnimationFrame(render);
  renderer.render(scene, camera) // Render scene
}