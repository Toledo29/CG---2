import * as THREE from  'three';
import KeyboardState from '../libs/util/KeyboardState.js'
import {TeapotGeometry} from '../build/jsm/geometries/TeapotGeometry.js';
import { OrbitControls } from '../build/jsm/controls/OrbitControls.js';
import {CSG } from '../libs/other/CSGMesh.js';
import {initRenderer, 
        initDefaultSpotlight,
        createGroundPlaneXZ,
        SecondaryBox, 
        onWindowResize} from "../libs/util/util.js";

let scene, light, camera, keyboard;
scene = new THREE.Scene();    // Create main scene
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
   camera.position.set(5, 5, 5);
   camera.up.set( 0, 1, 0 );

let ambientLight = new THREE.AmbientLight('white', 0.1);
scene.add( ambientLight );

let spotlightPosition = new THREE.Vector3(5, 3, 5);
let lightColor = 'white';
let spotlight = new THREE.SpotLight(lightColor, 100);
spotlight.position.copy(spotlightPosition);
spotlight.castShadow = true;
spotlight.shadow.mapSize.width = 1024;
spotlight.shadow.mapSize.height = 1024;
spotlight.target.position.set(0,0, 0);
spotlight.angle = THREE.MathUtils.degToRad(120);
// spotlight.penumbra = 1; // 0 = bordas duras, 1 = bordas suaves dispersas
scene.add(spotlight);
scene.add(spotlight.target);

var groundPlane = createGroundPlaneXZ(10, 10, 40, 40); // width, height, resolutionW, resolutionH
scene.add(groundPlane);

// Create objects
let cylinderGeometry = new THREE.CylinderGeometry(0.5, 0.5, 1.4, 20);
// let cylinderMaterial = new THREE.MeshPhongMaterial({color: "Cyan", shininess: 200, specular: "white"});
// let cylinder = new THREE.Mesh(cylinderGeometry, cylinderMaterial);
let cylinder2Geometry = new THREE.CylinderGeometry(0.4, 0.4, 1.2, 20);

let cylinder1Mesh = new THREE.Mesh(cylinderGeometry);
let cylinder2Mesh = new THREE.Mesh(cylinder2Geometry);

cylinder2Mesh.position.set(0, 0.7, 0);
cylinder2Mesh.matrixAutoUpdate = false;
cylinder2Mesh.updateMatrix();

let cylinder1CSG = CSG.fromMesh(cylinder1Mesh);
let cylinder2CSG = CSG.fromMesh(cylinder2Mesh);
let csgObject = cylinder1CSG.subtract(cylinder2CSG);
let csgFinal = CSG.toMesh(csgObject, new THREE.Matrix4());
csgFinal.material = new THREE.MeshPhongMaterial({color: "Cyan", shininess: 200, specular: "white"});


let torus = new THREE.Mesh(new THREE.TorusGeometry(0.3, 0.1, 20, 20, Math.PI), new THREE.MeshPhongMaterial({color: "cyan", shininess: 200, specular: "white"}));
torus.position.set(0.5, 0, 0);
torus.rotation.z = -Math.PI/2;
csgFinal.add(torus);
csgFinal.position.set(0, 1, 0);
scene.add(csgFinal);

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


function render()
{
   requestAnimationFrame(render);
   renderer.render(scene, camera) // Render scene
}