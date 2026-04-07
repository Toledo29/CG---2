import * as THREE from  'three';
import {GLTFLoader} from '../build/jsm/loaders/GLTFLoader.js';
import GUI from '../libs/util/dat.gui.module.js'
import {initRenderer, 
        initDefaultBasicLight,
        onWindowResize,
        createGroundPlaneXZ} from "../libs/util/util.js";

let scene, renderer, camera, light; // Initial variables
scene = new THREE.Scene();    
renderer = initRenderer();    
light = initDefaultBasicLight(scene, true);
window.addEventListener( 'resize', function(){onWindowResize(camera, renderer)}, false );

// Camera
camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
   camera.position.set(0.0, 0.0, 0.0);
   // Para o exercício, a câmera deve estar na posição (0, 0, 0)
   camera.up.set( 0.0, 1.0, 0.0 );
   camera.lookAt(0.0, 0.0, 0.0);
scene.add(camera)

const lerpConfig1 = {
  destination : new THREE.Vector3(0, 3, 25),
  alpha: 0.05,
  move: true,
  angle:0
}

const lerpConfig2 = {
  destination : new THREE.Vector3(15, 4, 13),
  alpha: 0.05,
  move: false,
  angle:45
}

const lerpConfig3 = {
  destination : new THREE.Vector3(20, 6, 0),
  alpha: 0.05,
  move: false,
  angle:90
}

buildScene();
buildInterface();
render();

function render()
{
  if(lerpConfig1.move){
    let rad = THREE.MathUtils.degToRad(lerpConfig1.angle);
    let quat = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), rad);
    camera.position.lerp(lerpConfig1.destination, lerpConfig1.alpha);
    camera.quaternion.slerp(quat, lerpConfig1.alpha);
  }
  if(lerpConfig2.move){
    let rad = THREE.MathUtils.degToRad(lerpConfig2.angle);
    let quat = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), rad);
    camera.position.lerp(lerpConfig2.destination, lerpConfig2.alpha);
    camera.quaternion.slerp(quat, lerpConfig2.alpha);
  }
  if(lerpConfig3.move){
    let rad = THREE.MathUtils.degToRad(lerpConfig3.angle);
    let quat = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), rad);
    camera.position.lerp(lerpConfig3.destination, lerpConfig3.alpha);
    camera.quaternion.slerp(quat, lerpConfig3.alpha);
  }
   requestAnimationFrame(render);
   renderer.render(scene, camera) // Render scene
}


function buildInterface()
{
  var controls = new function ()
  {
    this.movePosition1 = function(){
      lerpConfig1.move = true;
      lerpConfig2.move = false;
      lerpConfig3.move = false;
    };
    this.movePosition2 = function(){
      lerpConfig2.move = true;
      lerpConfig1.move = false;
      lerpConfig3.move = false;
    };
    this.movePosition3 = function(){
      lerpConfig3.move = true;
      lerpConfig1.move = false;
      lerpConfig2.move = false;
    };        
  };

  // GUI interface
  var gui = new GUI();
  gui.add(controls, 'movePosition1',true).name("Pos 1"); 
  gui.add(controls, 'movePosition2',true).name("Pos 2"); 
  gui.add(controls, 'movePosition3',true).name("Pos 3");     
}


// Aux functions
function buildScene()
{
   scene.add( createGroundPlaneXZ(30, 30) );

   // Load external objects  
   var loader = new GLTFLoader( );
   loader.load( '../assets/objects/woodenGoose.glb', function ( gltf ) {
      var obj = gltf.scene;
      obj.traverse( function ( child ) {
         if( child.isMesh ) child.castShadow = true;
         if( child.material ) child.material.side = THREE.DoubleSide;         
      });
      obj.scale.set(0.3, 0.3, 0.3);
      obj.rotateY( Math.PI / 2 );
      scene.add ( obj );
    });
}
