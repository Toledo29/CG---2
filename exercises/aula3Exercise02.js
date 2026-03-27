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

let speed1 = 0.08;
let speed2 = 0.05;

let move1 = false;
let move2 = false;

function moveSphere1() {
  if(sphere1.position.x < 8) {
    sphere1.position.x += speed1;
  }
}

function moveSphere2() {
  if(sphere2.position.x < 8) {
    sphere2.position.x += speed2;
  }
}

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
      move1 = true;
    }
    this.moverEsfera2 = function() {
      move2 = true;
    }
    this.resetPosition = function() {
      sphere1.position.set(-8, 1, -4);
      sphere2.position.set(-8, 1, 4);
      move1 = false;
      move2 = false;
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
  if(move1) moveSphere1();
  if(move2) moveSphere2();
  requestAnimationFrame(render);
  renderer.render(scene, camera) // Render scene
}