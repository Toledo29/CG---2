import * as THREE from  'three';
import { OrbitControls } from '../build/jsm/controls/OrbitControls.js';
import {initRenderer, 
        initCamera,
        initDefaultBasicLight,
        setDefaultMaterial,
        InfoBox,
        onWindowResize,
        createGroundPlaneWired} from "../libs/util/util.js";

let scene, renderer, camera, light, orbit;; // Initial variables
scene = new THREE.Scene();    // Create main scene
renderer = initRenderer();    // Init a basic renderer
camera = initCamera(new THREE.Vector3(0, 5, -25)); // Init camera in this position
light = initDefaultBasicLight(scene); // Create a basic light to illuminate the scene
orbit = new OrbitControls( camera, renderer.domElement ); // Enable mouse rotation, pan, zoom etc.

// cria os materiais para os objetos
let material1 = setDefaultMaterial('rgb(139, 69, 19)');
let material2 = setDefaultMaterial('green');
let material3 = setDefaultMaterial('darkgreen');

// Listen window size changes
window.addEventListener( 'resize', function(){onWindowResize(camera, renderer)}, false );


// cria plano do chão
let plane = createGroundPlaneWired(40, 40)
scene.add(plane);





// cria geometria dos componentes da árvore
let logGeometry1 = new THREE.CylinderGeometry(0.5, 0.5, 5, 32);
let logGeometry2 = new THREE.CylinderGeometry(0.5, 0.5, 5, 32);
let sphereLeafGeometry1 = new THREE.SphereGeometry(2, 32, 32);
let coneLeafGeometry1 = new THREE.ConeGeometry(3, 2, 32);
let coneLeafGeometry2 = new THREE.ConeGeometry(2.5, 2, 32);
let coneLeafGeometry3 = new THREE.ConeGeometry(2, 2, 32);

// cria componentes da árvore e posiciona eles
for(let i = 0; i < 2; i++){
  for(let j = 0; j < 8; j++){
    if(j % 2 == 0){
      let log = new THREE.Mesh(logGeometry1, material1);
      let sphereleaf = new THREE.Mesh(sphereLeafGeometry1, material2);
      log.position.set(10-(20*i), 2.5, j*5-17);
      log.add(sphereleaf);
      sphereleaf.position.set(0, 2.5, 0);
      scene.add(log);
    }
    else{
      let log = new THREE.Mesh(logGeometry2, material1);
      let coneleaf1 = new THREE.Mesh(coneLeafGeometry1, material3);
      let coneleaf2 = new THREE.Mesh(coneLeafGeometry2, material3);
      let coneleaf3 = new THREE.Mesh(coneLeafGeometry3, material3);
      log.position.set(10-(20*i), 2.5, j*5-17);
      log.add(coneleaf1);
      log.add(coneleaf2);
      log.add(coneleaf3);
      coneleaf1.position.set(0, 0, 0);
      coneleaf2.position.set(0, 1, 0);
      coneleaf3.position.set(0, 2, 0);
      scene.add(log);
    }
  }
}

// cria o avião
let aviao = new THREE.Group();

// cria corpo do avião
let corpoGeo = new THREE.CylinderGeometry( 0.3, 0.6, 4, 32 );
let corpoMat = new THREE.MeshStandardMaterial({
    color: 0x888888,
    metalness: 0.8,  // aspecto de alumínio
    roughness: 0.2  // superfície mais lisa  
});
let corpo = new THREE.Mesh(corpoGeo, corpoMat);
corpo.rotation.z = Math.PI / 2;
aviao.add(corpo);

// cria asa adireita do avião 
let asaGeoDireita = new THREE.CylinderGeometry( 0.3, 0.5, 4, 32 );
let asaMat = new THREE.MeshStandardMaterial({
    color: 0xffa500, 
    metalness: 0.1,  
    roughness: 0.4   
});
let asaDireita = new THREE.Mesh(asaGeoDireita, asaMat);
asaDireita.rotation.x = Math.PI / 2;
asaDireita.scale.set(1, 1, 0.2);
asaDireita.position.z = 2;
asaDireita.position.x = 0.5;
aviao.add(asaDireita);

let pontaGeoDIreita = new THREE.SphereGeometry(0.3, 32, 16, 0, Math.PI);
let pontaDireita = new THREE.Mesh(pontaGeoDIreita, asaMat);
pontaDireita.position.set(0.5, 0, 4); 
pontaDireita.rotation.z = Math.PI / 2;  
pontaDireita.scale.set(0.2, 1, 0.6); 
aviao.add(pontaDireita);

// cria asa esqueda do avião 
let asaGeoEsquerda = new THREE.CylinderGeometry( 0.5, 0.3, 4, 32 );
let asaEsquerda = new THREE.Mesh(asaGeoEsquerda, asaMat);
asaEsquerda.rotation.x = Math.PI / 2;
asaEsquerda.scale.set(1, 1, 0.2);
asaEsquerda.position.z = -2;
asaEsquerda.position.x = 0.5;
aviao.add(asaEsquerda);

let pontaGeoEsquerda = new THREE.SphereGeometry(0.3, 32, 16, 0, Math.PI);
let pontaEsquerda = new THREE.Mesh(pontaGeoEsquerda, asaMat);
pontaEsquerda.position.set(0.5, 0, -4);
pontaEsquerda.rotation.z = Math.PI / 2 ; 
pontaEsquerda.rotation.y = Math.PI  ; // usei para virar a ponta da asa para o outro lado
pontaEsquerda.scale.set(0.2, 1, 0.6); 
aviao.add(pontaEsquerda);

// cria bundinha do avião
let caudaGeo = new THREE.SphereGeometry( 0.3, 32, 16 );
let caudaMat = new THREE.MeshStandardMaterial({
    color: 0x888888,
    metalness: 0.8,  
    roughness: 0.2   
});
let cauda = new THREE.Mesh(caudaGeo, caudaMat);
cauda.position.set(-2, 0, 0);
cauda.rotation.z = Math.PI / 2;
aviao.add(cauda);

// criar cauda cima
let caudaGeoCima = new THREE.CylinderGeometry( 0.05, 0.1, 0.8, 32 );
let caudaCima = new THREE.Mesh(caudaGeoCima, caudaMat);
caudaCima.scale.set(-2, 1, 0.5);
caudaCima.position.set(-2, 0.5, 0);
aviao.add(caudaCima);

let pontaGeoCima = new THREE.SphereGeometry(0.05, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2);
let pontaCima = new THREE.Mesh(pontaGeoCima, caudaMat);
pontaCima.position.set(-2, 0.9, 0);
pontaCima.scale.set(-2, 1, 0.5); 
aviao.add(pontaCima);

// cirar cauda direita
let caudaGeoDireita = new THREE.CylinderGeometry( 0.05, 0.1, 0.8, 32 );
let caudaDireita = new THREE.Mesh(caudaGeoDireita, caudaMat);
caudaDireita.rotation.x = Math.PI / 2;
caudaDireita.scale.set(-2, 1, 0.5);
caudaDireita.position.set(-2, 0, 0.5);
aviao.add(caudaDireita);

let pontaCaudaGeoDIreita = new THREE.SphereGeometry(0.05, 32, 16, 0, Math.PI * 2);
let pontaCaudaDireita = new THREE.Mesh(pontaCaudaGeoDIreita, caudaMat);
pontaCaudaDireita.position.set(-2, 0, 0.9); 
pontaCaudaDireita.scale.set(-2, 1, 0.5); 
pontaCaudaDireita.rotation.x = Math.PI / 2;  // so assim q consegui fazer
aviao.add(pontaCaudaDireita);

// criar cauda esquerda
let caudaGeoEsquerda = new THREE.CylinderGeometry( 0.1, 0.05, 0.8, 32 );
let caudaEsquerda = new THREE.Mesh(caudaGeoEsquerda, caudaMat);
caudaEsquerda.rotation.x = Math.PI / 2;
caudaEsquerda.scale.set(-2, 1, 0.5);
caudaEsquerda.position.set(-2, 0, -0.5);
aviao.add(caudaEsquerda);

let pontaCaudaGeoEsquerda = new THREE.SphereGeometry(0.05, 32, 16, 0, Math.PI);
let pontaCaudaEsquerda = new THREE.Mesh(pontaCaudaGeoEsquerda, caudaMat);
pontaCaudaEsquerda.position.set(-2, 0, -0.9); 
pontaCaudaEsquerda.scale.set(-2, 1, 0.5); 
pontaCaudaEsquerda.rotation.x = Math.PI / 2; 
pontaCaudaEsquerda.rotation.y = Math.PI  ; // usei para virar a ponta da asa para o outro lado 
aviao.add(pontaCaudaEsquerda);


// cria cabine do avião
let cabineGeo = new THREE.CylinderGeometry(0.2, 0.4, 1.2, 32);
let cabineMat = new THREE.MeshPhongMaterial({
    color: 0x222222,    // cor efeito fumê
    transparent: true, 
    opacity: 0.6,     
    shininess: 100,     // efeito de brilho
    specular: 0xffffff  // cor do brilho refletido
});
let cabine = new THREE.Mesh(cabineGeo, cabineMat);
cabine.rotation.z = Math.PI / 1.9;
cabine.position.set(0.5, 0.4, 0);

// bordas da cabine arredondadas
let cabineBorda1Geo = new THREE.SphereGeometry(0.2, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2);
let cabineBorda1 = new THREE.Mesh(cabineBorda1Geo, cabineMat);

let cabineBorda2Geo = new THREE.SphereGeometry(0.4, 32, 16, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2);
let cabineBorda2 = new THREE.Mesh(cabineBorda2Geo, cabineMat);
cabineBorda1.position.set(0, 0.6, 0);
cabineBorda2.position.set(0, -0.6, 0);
cabine.add(cabineBorda1);
cabine.add(cabineBorda2);
aviao.add(cabine);


// cria nariz do avião
let narizGeo = new THREE.SphereGeometry( 0.6, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2 );
let nariz = new THREE.Mesh(narizGeo, corpoMat);
nariz.position.set(2.0, 0, 0);
nariz.rotation.z = -Math.PI / 2;
aviao.add(nariz);

// cria helice com 3 pás 
let helice = new THREE.Group();

// material da hélice
let heliceMat = new THREE.MeshStandardMaterial({
    color: 0xe65729,
    metalness: 0.7,
    roughness: 0.2
});

// cria as 3 pás da hélice
for(let i = 0; i < 3; i++) {
    let paGeo = new THREE.BoxGeometry(0.1, 1.5, 0.03);
    let pa = new THREE.Mesh(paGeo, heliceMat);
    pa.position.set(0, 0, 0);
    
    // rotaciona cada pá 120 graus (2π/3 radianos)
    pa.rotation.x = (i * Math.PI * 2) / 3;
    
    helice.add(pa);
}

// cria o núcleo central da hélice
let nucleoGeo = new THREE.CapsuleGeometry(0.12, 0.12, 4, 8, 1);
let nucleo = new THREE.Mesh(nucleoGeo, heliceMat);
nucleo.rotation.z = Math.PI / 2;
helice.add(nucleo);

// posiciona a hélice na ponta do nariz
helice.position.set(2.7, 0, 0);
aviao.add(helice);

aviao.scale.set(1, 1, 1);
aviao.position.set(0, 5, 0);
aviao.rotation.y = 3 * (Math.PI / 2);
scene.add(aviao);

render();
function render()
{
  requestAnimationFrame(render);
  renderer.render(scene, camera) // Render scene
}