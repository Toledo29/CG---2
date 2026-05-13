import * as THREE from  'three';
import KeyboardState from '../libs/util/KeyboardState.js'
import {TeapotGeometry} from '../build/jsm/geometries/TeapotGeometry.js';
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

let spotlightPosition = new THREE.Vector3(5, 5, 5);
let lightColor = 'white';
let spotlight = new THREE.SpotLight(lightColor, 100);
spotlight.position.copy(spotlightPosition);
spotlight.castShadow = true;
spotlight.shadow.mapSize.width = 1024;
spotlight.shadow.mapSize.height = 1024;
spotlight.target.position.set(-5, 0, -5);
spotlight.angle = THREE.MathUtils.degToRad(120);
// spotlight.penumbra = 1; // 0 = bordas duras, 1 = bordas suaves dispersas
scene.add(spotlight);
scene.add(spotlight.target);

var groundPlane = createGroundPlaneXZ(10, 10, 40, 40); // width, height, resolutionW, resolutionH
scene.add(groundPlane);

// Create objects
createTeapot(0.0,  0.4,  0, 'red');  

let sphereGeometry = new THREE.SphereGeometry(0.8, 20, 20);
let sphereMaterial = new THREE.MeshLambertMaterial({color: "lightgreen"});
let sphere = new THREE.Mesh(sphereGeometry, sphereMaterial);
sphere.position.set(-2, 0.6, -2);
sphere.castShadow = true;
sphere.receiveShadow = true;
scene.add(sphere);

let cylinderGeometry = new THREE.CylinderGeometry(0.1, 0.8, 3, 20);
let cylinderMaterial = new THREE.MeshPhongMaterial({color: "cyan", flatShading: true});
let cylinder = new THREE.Mesh(cylinderGeometry, cylinderMaterial);
cylinder.position.set(2, 1.5, 2);
cylinder.castShadow = true;
cylinder.receiveShadow = true;
scene.add(cylinder);

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

function keyboardUpdate() {

   keyboard.update();
   
   // DICA: Insira aqui seu código para mover a câmera
   keyboard.pressed("pageup") ? camPos.y += 0.1 : null;
   keyboard.pressed("pagedown") ? camPos.y -= 0.1 : null;
   keyboard.pressed("left") ? camPos.x -= 0.1 : null;
   keyboard.pressed("right") ? camPos.x += 0.1 : null;
   keyboard.pressed("up") ? camPos.z -= 0.1 : null;
   keyboard.pressed("down") ? camPos.z += 0.1 : null;

   keyboard.pressed("A") ? camLook.x -= 0.1 : null;
   keyboard.pressed("D") ? camLook.x += 0.1 : null;
   keyboard.pressed("W") ? camLook.z -= 0.1 : null;
   keyboard.pressed("S") ? camLook.z += 0.1 : null;
   keyboard.pressed("Q") ? camLook.y += 0.1 : null;
   keyboard.pressed("E") ? camLook.y -= 0.1 : null;
   
   updateCamera();
}

function createTeapot(x, y, z, color )
{
   var geometry = new TeapotGeometry(0.5);
   var material = new THREE.MeshPhongMaterial({color,specular:'white', shininess:"200"});
   var obj = new THREE.Mesh(geometry, material);
      obj.castShadow = true;
      obj.receiveShadow = true;
      obj.position.set(x, y, z);
   scene.add(obj);
}

function render()
{
   requestAnimationFrame(render);
   keyboardUpdate();
   renderer.render(scene, camera) // Render scene
}