import * as THREE from  'three';
import { OrbitControls } from '../build/jsm/controls/OrbitControls.js';
import KeyboardState from '../libs/util/KeyboardState.js';
import {initRenderer, 
        initCamera,
        initDefaultBasicLight,
        setDefaultMaterial,
        InfoBox,
        SecondaryBox,        
        onWindowResize, 
        createGroundPlaneXZ} from "../libs/util/util.js";

let scene, renderer, camera, material, material2, light, orbit;; // Initial variables
scene = new THREE.Scene();    // Create main scene
renderer = initRenderer();    // Init a basic renderer
camera = initCamera(new THREE.Vector3(0, 15, 30)); // Init camera in this position
material = setDefaultMaterial(); // create a basic material
material2 = setDefaultMaterial("rgb(255,200,0)");
light = initDefaultBasicLight(scene); // Create a basic light to illuminate the scene
orbit = new OrbitControls( camera, renderer.domElement ); // Enable mouse rotation, pan, zoom etc.

let shootBall = false;

// Listen window size changes
window.addEventListener( 'resize', function(){onWindowResize(camera, renderer)}, false );

// Use to scale the cube
var scale = 1.0;

// Show text information onscreen
showInformation();

// To use the keyboard
var keyboard = new KeyboardState();

// Show axes (parameter is size of each axis)
var axesHelper = new THREE.AxesHelper( 12 );
scene.add( axesHelper );

// create the ground plane
let plane = createGroundPlaneXZ(20, 20)
scene.add(plane);

// create a cube
var cubeGeometry = new THREE.BoxGeometry(4, 4, 4);
var cube = new THREE.Mesh(cubeGeometry, material);
// position the cube
cube.position.set(0.0, 2.0, 0.0);
// add the cube to the scene
scene.add(cube);

var n = 0;
const spheres = [];
var sphGeo = new THREE.SphereGeometry(1, 20, 20);
var sphere = new THREE.Mesh(sphGeo, material2);
   sphere.position.set(0, 0, 3);
cube.add(sphere);
spheres.push(sphere);

var cubeAxesHelper = new THREE.AxesHelper(9);
cube.add(cubeAxesHelper);

var positionMessage = new SecondaryBox("");
positionMessage.changeStyle("rgba(0,0,0,0)", "lightgray", "16px", "ubuntu")
render();


//-------------------------------------------------------------------------------
function render()
{
   if (shootBall) {
      spheres[n].translateZ(0.05);
      for(let i = 0; i < n; i++) {
          spheres[i].translateZ(0.05);
      }
   }
   else{
    for(let i = 0; i < n; i++) {
        spheres[i].translateZ(0.05);
    }
   }

   keyboardUpdate();
   requestAnimationFrame(render); // Show events
   renderer.render(scene, camera) // Render scene
}

//-- Aux functions --------------------------------------------------------------
function keyboardUpdate() 
{
   keyboard.update();
   let angle = THREE.MathUtils.degToRad(5); 
   if ( keyboard.pressed("left") )  cube.rotateY(  angle );
   if ( keyboard.pressed("right") )  cube.rotateY( -angle );
   if ( keyboard.pressed("up") )   cube.translateZ(  1 );
   if ( keyboard.pressed("down") ) cube.translateZ( -1 );

   if ( keyboard.down("space") ) 
   {
      if(!shootBall)
      {
         shootBall = true;
         scene.attach(spheres[n]);
      }
      else{
          shootBall = false;
          var sphere = new THREE.Mesh(sphGeo, material2);
          sphere.position.set(0, 0, 3);
          cube.add(sphere);
          spheres.push(sphere);
          n++;
      }
   }
   updatePositionMessage();
}

function updatePositionMessage()
{
   let wp = new THREE.Vector3(); 
   spheres[n].getWorldPosition( wp );

   var str =  "Sphere Position: Local Space {" + spheres[n].position.x.toFixed(1) + ", " + spheres[n].position.y.toFixed(1) + ", " + spheres[n].position.z.toFixed(1) + "} " + 
             "| World Space {" + wp.x.toFixed(1) + ", " + wp.y.toFixed(1) + ", " + wp.z.toFixed(1) + "}";
   positionMessage.changeMessage(str);
}


function showInformation()
{
  // Use this to show information onscreen
  var controls = new InfoBox();
    controls.add("Animation - Attach");
    controls.addParagraph();
    controls.add("Use keyboard arrows to rotate/move the cube.");
    controls.add("Press 'space' to shoot the ball");
    controls.show();
}


