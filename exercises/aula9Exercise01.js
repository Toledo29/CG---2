import * as THREE from  'three';
import Stats from '../build/jsm/libs/stats.module.js';
import GUI from '../libs/util/dat.gui.module.js'
import {TrackballControls} from '../build/jsm/controls/TrackballControls.js';
import {TeapotGeometry} from '../build/jsm/geometries/TeapotGeometry.js';
import {initRenderer, 
        createGroundPlane,
        createLightSphere,        
        onWindowResize} from "../libs/util/util.js";

var scene = new THREE.Scene();    // Create main scene
var stats = new Stats();          // To show FPS information  var renderer = initRenderer();    // View function in util/utils
var renderer = initRenderer();    // View function in util/utils
  renderer.setClearColor("rgb(30, 30, 42)");

var camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
  camera.lookAt(0, 0, 0);
  camera.position.set(2.5, 2.0, 4.5);
  camera.up.set( 0, 1, 0 );

var ambientLight = new THREE.AmbientLight("rgb(100, 100, 100)");
   ambientLight.intensity = 1;
scene.add(ambientLight);

var lightPosition = new THREE.Vector3(2.5, 1.8, 0.0);
  var light = new THREE.SpotLight(0xffffff);
  light.position.copy(lightPosition);
  light.castShadow = true;
  light.penumbra = 0.5;    
  light.intensity = 30;
scene.add(light);

var lightSphere = createLightSphere(scene, 0.1, 10, 10, lightPosition);  

// Set angles of rotation
var angle = 0;
var speed = 0.01;
var animationOn = false; // control if animation is on or of

// Enable mouse rotation, pan, zoom etc.
var trackballControls = new TrackballControls( camera, renderer.domElement );

// Listen window size changes
window.addEventListener( 'resize', function(){onWindowResize(camera, renderer)}, false );

// Show axes (parameter is size of each axis)
var axesHelper = new THREE.AxesHelper( 1.5 );
  axesHelper.visible = false;
scene.add( axesHelper );

//-- Scene Objects -----------------------------------------------------------
// Ground
var groundPlane = createGroundPlane(5.0, 5.0, 100, 100); // width and height
  groundPlane.rotateX(THREE.MathUtils.degToRad(-90));
scene.add(groundPlane);

let loader = new THREE.TextureLoader();

let cylinderMaterials = [
    setMaterial('../assets/textures/wood.png'),
    setMaterial('../assets/textures/woodtop.png'),
    setMaterial('../assets/textures/woodtop.png')
];

var cylinderGeometry = new THREE.CylinderGeometry(0.5, 0.5, 1.0, 32);
var cylinder = new THREE.Mesh(cylinderGeometry, cylinderMaterials);
cylinder.position.set(0.0, 0.5, 0.0);
scene.add(cylinder);

function setMaterial(file, repeatX = 1, repeatY = 1, color = "rgb(255,255,255)") {
    let mat = new THREE.MeshBasicMaterial({color: color, map: loader.load(file)});
    mat.map.wrapS = THREE.RepeatWrapping;
    mat.map.wrapT = THREE.RepeatWrapping;
    mat.map.repeat.set(repeatX, repeatY);
    return mat;
}

//----------------------------------------------------------------------------
//-- Use TextureLoader to load texture files
var textureLoader = new THREE.TextureLoader();
var floor  = textureLoader.load('../assets/textures/floorWood.jpg');
    floor.colorSpace = THREE.SRGBColorSpace;
var glass  = textureLoader.load('../assets/textures/glass.png');
    glass.colorSpace = THREE.SRGBColorSpace;
var stone = textureLoader.load('../assets/textures/stone.jpg');
    stone.colorSpace = THREE.SRGBColorSpace;
var sun = textureLoader.load('../assets/textures/sun.jpg');


// Apply texture to the 'map' property of the respective materials' objects
groundPlane.material.map = floor;
lightSphere.material.map = sun;

buildInterface();
render();

function rotateLight()
{
  // Set angle's animation speed
  if(animationOn)
  {
    // More info:
    light.matrixAutoUpdate = false;
    lightSphere.matrixAutoUpdate = false;      

    angle+=speed;

    var mat4 = new THREE.Matrix4();

    // Will execute T1 and then R1
    light.matrix.identity();  // reset matrix
    light.matrix.multiply(mat4.makeRotationY(angle)); // R1
    light.matrix.multiply(mat4.makeTranslation(lightPosition.x, lightPosition.y, lightPosition.z)); // T1

    lightSphere.matrix.copy(light.matrix);
  }
}

function buildInterface()
{
  //------------------------------------------------------------
  // Interface
  var controls = new function ()
  {
    this.viewAxes = false;
    this.speed = speed;
    this.animation = animationOn;

    this.onViewAxes = function(){
      axesHelper.visible = this.viewAxes;
    };
    this.onEnableAnimation = function(){
      animationOn = this.animation;
    };
    this.onUpdateSpeed = function(){
      speed = this.speed;
    };
  };

  var gui = new GUI();
  gui.add(controls, 'animation', true)
    .name("Animation")
    .onChange(function(e) { controls.onEnableAnimation() });
  gui.add(controls, 'speed', 0.01, 0.05)
    .name("Light Speed")
    .onChange(function(e) { controls.onUpdateSpeed() });
  gui.add(controls, 'viewAxes', false)
    .name("View Axes")
    .onChange(function(e) { controls.onViewAxes() });
}

function render()
{
  stats.update();
  trackballControls.update();
  rotateLight();
  requestAnimationFrame(render);
  renderer.render(scene, camera)
}
