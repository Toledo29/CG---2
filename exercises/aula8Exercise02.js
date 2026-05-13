import * as THREE from  'three';
import KeyboardState from '../libs/util/KeyboardState.js'
import {TeapotGeometry} from '../build/jsm/geometries/TeapotGeometry.js';
import { OrbitControls } from '../build/jsm/controls/OrbitControls.js';
import {GLTFLoader} from '../build/jsm/loaders/GLTFLoader.js';
import {initRenderer, 
        initDefaultSpotlight,
        createGroundPlaneXZ,
        SecondaryBox,
        setDefaultMaterial,
        onWindowResize} from "../libs/util/util.js";

let scene, light, camera, material, keyboard;
scene = new THREE.Scene();    // Create main scene
// material = setDefaultMaterial('green');
// light = initDefaultSpotlight(scene, new THREE.Vector3(5.0, 5.0, 5.0)); // Use default light    
window.addEventListener( 'resize', function(){onWindowResize(camera, renderer)}, false );
keyboard = new KeyboardState();


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
   camera.position.set(0, 5, 0);
   camera.up.set( 0, 1, 0 );

let orbit = new OrbitControls( camera, renderer.domElement ); // Enable mouse rotation, pan, zoom etc.


let ambientLight = new THREE.AmbientLight('white', 0.1);
scene.add( ambientLight );

let spotlightPosition = new THREE.Vector3(5, 5, 5);
let lightColor = 'white';
let spotlight = new THREE.SpotLight(lightColor, 100);
spotlight.position.copy(spotlightPosition);
// spotlight.castShadow = true;
spotlight.shadow.mapSize.width = 1024;
spotlight.shadow.mapSize.height = 1024;
spotlight.target.position.set(-5, 0, -5);
spotlight.angle = THREE.MathUtils.degToRad(120);
// spotlight.penumbra = 1; // 0 = bordas duras, 1 = bordas suaves dispersas
scene.add(spotlight);
scene.add(spotlight.target);

var groundPlane = createGroundPlaneXZ(10, 10, 40, 40); // width, height, resolutionW, resolutionH
scene.add(groundPlane);

let loader = new GLTFLoader();
loader.load('../assets/objects/toon_tank.glb', function(gltf){
   let obj = gltf.scene;
   obj.traverse(function(child){
      if(child.isMesh){
         child.castShadow = true;
         child.receiveShadow = true;
      }
   });
   scene.add(obj);
}, null, null);


let camPos  = new THREE.Vector3(3, 4, 8);
let camUp   = new THREE.Vector3(0.0, 1.0, 0.0);
let camLook = new THREE.Vector3(0.0, 0.0, 0.0);
var message = new SecondaryBox("");

// Main camera
camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
   camera.position.copy(camPos);
   camera.up.copy( camUp );
   camera.lookAt(camLook);

render();

function updateCamera()
{
   // DICA: Atualize a câmera aqui!

   message.changeMessage("Pos: {" + camPos.x + ", " + camPos.y + ", " + camPos.z + "} " + 
                         "/ LookAt: {" + camLook.x + ", " + camLook.y + ", " + camLook.z + "}");
   camera.position.copy(camPos);
   camera.up.copy( camUp );
   camera.lookAt(camLook);
}

function render()
{
   requestAnimationFrame(render);
   renderer.render(scene, camera) // Render scene
}