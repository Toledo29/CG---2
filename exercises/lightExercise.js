import * as THREE from  'three';
import GUI from '../libs/util/dat.gui.module.js'
import { OrbitControls } from '../build/jsm/controls/OrbitControls.js';
import {initRenderer, 
        initDefaultBasicLight,  
        setDefaultMaterial,      
        onWindowResize, 
        createLightSphere} from "../libs/util/util.js";
import {loadLightPostScene} from "../libs/util/utilScenes.js";

let scene, camera, orbit;
scene = new THREE.Scene();    // Create main scene
var renderer = new THREE.WebGLRenderer();
// renderer = initRenderer();    // View function in util/utils
renderer.shadowMap.enabled = true;
renderer.shadowMapSoft = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap; // default THREE.PCFShadowMap

renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
document.getElementById("webgl-output").appendChild(renderer.domElement);

renderer.setClearColor("rgb(30, 30, 42)");
camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
   camera.lookAt(0, 0, 0);
   camera.position.set(5, 5, 5);
   camera.up.set( 0, 1, 0 );

orbit = new OrbitControls( camera, renderer.domElement ); // Enable mouse rotation, pan, zoom etc.

// Listen window size changes
window.addEventListener( 'resize', function(){onWindowResize(camera, renderer)}, false );

// Show axes (parameter is size of each axis)
let axesHelper = new THREE.AxesHelper( 3 );
  axesHelper.visible = false;
scene.add( axesHelper );


let ambientLight = new THREE.AmbientLight('black', 0.5);
scene.add( ambientLight );

let dirPosition = new THREE.Vector3(2, 2, 4)
const dirLight = new THREE.DirectionalLight('white', 0.3);
dirLight.position.copy(dirPosition);
// dirLight.castShadow = true;
dirLight.shadow.mapSize.width = 2048;
dirLight.shadow.mapSize.height = 2048;
scene.add(dirLight);

let spotlightPosition = new THREE.Vector3(0, 3, 0);
let lightColor = 'white';
let spotlight = new THREE.SpotLight(lightColor, 10);
spotlight.position.copy(spotlightPosition);
spotlight.castShadow = true;
spotlight.shadow.mapSize.width = 2048;
spotlight.shadow.mapSize.height = 2048;
spotlight.target.position.set(2, 0, 0);
spotlight.angle = THREE.MathUtils.degToRad(30);
spotlight.penumbra = 1; // 0 = bordas duras, 1 = bordas suaves dispersas
scene.add(spotlight);
scene.add(spotlight.target);

// Load default scene
loadLightPostScene(scene)

let material1 = setDefaultMaterial('red');
let material2 = setDefaultMaterial('purple');
let material3 = setDefaultMaterial('green');
let material4 = setDefaultMaterial('yellow');

let cylinderGeometry = new THREE.CylinderGeometry(0.2, 0.2, 0.8, 32);
let boxGeometry = new THREE.BoxGeometry(0.4, 0.8, 0.4);

let cylinder1 = new THREE.Mesh(cylinderGeometry, material2);
cylinder1.position.set(0, 0.4, 3);
cylinder1.castShadow = true;
scene.add(cylinder1);

let cylinder2 = new THREE.Mesh(cylinderGeometry, material4);
cylinder2.position.set(1, 0.4, -1);
cylinder2.castShadow = true;
scene.add(cylinder2);

let box1 = new THREE.Mesh(boxGeometry, material1);
box1.position.set(2.4, 0.4, 0);
box1.castShadow = true;
scene.add(box1);

let box2 = new THREE.Mesh(boxGeometry, material3);
box2.position.set(2.4, 0.4, 2);
box2.castShadow = true;
scene.add(box2);




// REMOVA ESTA LINHA APÓS CONFIGURAR AS LUZES DESTE EXERCÍCIO
// initDefaultBasicLight(scene);

//---------------------------------------------------------
// Load external objects
buildInterface();
render();

function buildInterface()
{
  // GUI interface
  let gui = new GUI();
}

function render()
{
  requestAnimationFrame(render);
  renderer.render(scene, camera)
}
