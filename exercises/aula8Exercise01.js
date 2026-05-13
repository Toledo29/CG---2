import * as THREE from  'three';
import KeyboardState from '../libs/util/KeyboardState.js'
import {TeapotGeometry} from '../build/jsm/geometries/TeapotGeometry.js';
import {TrackballControls} from '../build/jsm/controls/TrackballControls.js';
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

function createCustomGeometry(){
   let v =[-1.0, 0 , 0, // baixo esquerda 0
            1.0, 0 , 0, // baixo direita 1
            -1.0, 1.5, 0, // cima esquerda 2
            1.0, 1.5, 0, // cima direita 3
            -1.0, 1.5, 1.0, // cima esquerda frente 4
            1.0, 1.5, 1.0, // cima direita frente 5
            -1.0, 0.0, 3.0, // baixo esquerda frente 6
            1.0, 0.0, 3.0, // baixo direita frente 7
   ]
   let f = [0, 1, 2,
            1, 2, 3,
            2, 3, 4,
            3, 4, 5,
            0, 1, 6,
            0, 2, 6,
            1, 3, 7,
            1, 6, 7,
            2, 4, 6,
            4, 6, 7,
            3, 5, 7,
            5, 7, 4,
         ]
   const n = v;

   // Set buffer attributes
     var vertices = new Float32Array( v );
     var normals = new Float32Array( n );  
     var indices = new Uint32Array( f );
   
     // Set the Buffer Geometry
     let geometry = new THREE.BufferGeometry();
   
     geometry.setAttribute( 'position', new THREE.BufferAttribute( vertices, 3 ) ); // 3 components per vertex
     geometry.setAttribute( 'normal', new THREE.BufferAttribute( normals, 3 ) );  // 3 components per normal
     geometry.setIndex( new THREE.BufferAttribute( indices, 1 ) );
     geometry.computeVertexNormals(); 
   
     material = new THREE.MeshPhongMaterial({color:"rgb(255,150,0)"});
       material.side =  THREE.DoubleSide; // Show front and back polygons
       material.flatShading = true;
     const mesh = new THREE.Mesh( geometry, material );
   
     scene.add(mesh);

     createPointSpheres(v);
}

function createPointSpheres(points)
{
  let spGroup = new THREE.Object3D();
  var spMaterial = new THREE.MeshPhongMaterial({color:"rgb(255,255,0)"});
  var spGeometry = new THREE.SphereGeometry(0.1);
  for(let i = 0; i < points.length; i+=3){
    var spMesh = new THREE.Mesh(spGeometry, spMaterial);   
    spMesh.position.set(points[i], points[i+1], points[i+2]);
    spGroup.add(spMesh);
  };
  // add the points as a group to the scene
  scene.add(spGroup);  
}

let camPos  = new THREE.Vector3(3, 4, 8);
let camUp   = new THREE.Vector3(0.0, 1.0, 0.0);
let camLook = new THREE.Vector3(0.0, 0.0, 0.0);
var message = new SecondaryBox("");

// Main camera
camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
   camera.position.copy(camPos);
   camera.up.copy( camUp );
   camera.lookAt(camLook);
let trackballControls = new TrackballControls( camera, renderer.domElement );

createCustomGeometry();

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