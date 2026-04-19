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
camera = initCamera(new THREE.Vector3(0, 11, -90)); // Init camera in this position
camera.lookAt(0, 11, 0);
light = initDefaultBasicLight(scene); // Create a basic light to illuminate the scene

camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
   camera.position.set(0.0, 11, -90.0);
   camera.up.set( 0.0, 1.0, 0.0 );
   camera.lookAt(0.0, 11, 0.0);

// cria os materiais para os objetos
let material1 = setDefaultMaterial('rgb(139, 69, 19)');
let material2 = setDefaultMaterial('green');
let material3 = setDefaultMaterial('darkgreen');

// Listen window size changes
window.addEventListener( 'resize', function(){onWindowResize(camera, renderer)}, false );


// cria plano do chão - SISTEMA DE CHUNKS DINÂMICOS PARA SIMULAR INFINITO
const chunkSize = 150; // tamanho de cada chunk do plano
const renderDistance = 2; // quantos chunks renderizar ao redor do avião (3 = 7x7 chunks)
let loadedChunks = new Map(); // armazena chunks já criados: "x,z" -> objeto grupo

function createChunk(chunkX, chunkZ) {
  const key = `${chunkX},${chunkZ}`;
  
  // se chunk já existe, retorna ele
  if(loadedChunks.has(key)) {
    return loadedChunks.get(key);
  }
  
  // cria novo chunk
  let chunkGroup = new THREE.Group();
  
  // cria o plano do chunk
  let chunkPlane = createGroundPlaneWired(chunkSize, chunkSize);
  
  // muda a cor do plano para marrom
  chunkPlane.traverse((child) => {
    if(child.isMesh) {
      child.material = new THREE.MeshStandardMaterial({
        color: 0x4e3322, // marrom
        metalness: 0.1,
        roughness: 0.8
      });
    }
  });
  
  chunkPlane.position.set(chunkX * chunkSize, 0, chunkZ * chunkSize);
  chunkGroup.add(chunkPlane);
  
  // gera árvores para este chunk
  const treesInChunk = 500; // árvores por chunk - aumentado para maior densidade
  const treeMinDistance = 4.5;
  const margin = 2;
  
  for(let t = 0; t < treesInChunk; t++) {
    let x = THREE.MathUtils.randFloat(-chunkSize/2 + margin, chunkSize/2 - margin);
    let z = THREE.MathUtils.randFloat(-chunkSize/2 + margin, chunkSize/2 - margin);
    
    let num = Math.floor(Math.random() * 100);
    let log = new THREE.Mesh(
      num % 2 == 0 ? logGeometry1 : logGeometry2,
      num % 2 == 0 ? material1 : material1
    );
    log.position.set(
      chunkX * chunkSize + x,
      1.5,
      chunkZ * chunkSize + z
    );
    
    let leaf = new THREE.Mesh(
      num % 2 == 0 ? sphereLeafGeometry1 : coneLeafGeometry1,
      num % 2 == 0 ? material2 : material3
    );
    // para árvores com esfera (par): posição normal
    // para árvores com cone (ímpar): aumentar altura colocando mais para cima
    leaf.position.set(0, num % 2 == 0 ? 1.5 : 2.0, 0);
    log.add(leaf);
    
    chunkGroup.add(log);
  }
  
  scene.add(chunkGroup);
  loadedChunks.set(key, chunkGroup);
  return chunkGroup;
}

function updateChunks(aviaoX, aviaoZ) {
  // calcula em qual chunk o avião está
  const currentChunkX = Math.floor(aviaoX / chunkSize);
  const currentChunkZ = Math.floor(aviaoZ / chunkSize);
  
  // carrega chunks ao redor do avião
  for(let x = currentChunkX - renderDistance; x <= currentChunkX + renderDistance; x++) {
    for(let z = currentChunkZ - renderDistance; z <= currentChunkZ + renderDistance; z++) {
      createChunk(x, z);
    }
  }
  
  // remove chunks que ficaram muito longe
  const maxDistance = renderDistance + 2;
  for(let [key, chunk] of loadedChunks.entries()) {
    const [chunkX, chunkZ] = key.split(',').map(Number);
    const distX = Math.abs(chunkX - currentChunkX);
    const distZ = Math.abs(chunkZ - currentChunkZ);
    
    if(distX > maxDistance || distZ > maxDistance) {
      scene.remove(chunk);
      loadedChunks.delete(key);
    }
  }
}





// geometrias das árvores
let logGeometry1 = new THREE.CylinderGeometry(0.3, 0.3, 3, 32);
let logGeometry2 = new THREE.CylinderGeometry(0.3, 0.3, 3, 32);
let sphereLeafGeometry1 = new THREE.SphereGeometry(1.3, 32, 32);
let coneLeafGeometry1 = new THREE.ConeGeometry(2, 2, 32);
let coneLeafGeometry2 = new THREE.ConeGeometry(1.5, 2, 32);
let coneLeafGeometry3 = new THREE.ConeGeometry(1, 2, 32);

// Retângulo vermelho removido - substituído pelo avião 3D
const cameraFollowZOffset = -20;

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
aviao.position.set(0, 11.5, -70);
aviao.rotation.y = 3 * (Math.PI / 2);
scene.add(aviao);

render();
function render()
{
  requestAnimationFrame(render);
  aviao.position.z += 0.5;
  
  // atualiza chunks dinâmicos baseado na posição do avião
  updateChunks(aviao.position.x, aviao.position.z);
  
  camera.position.z = aviao.position.z + cameraFollowZOffset;
  camera.lookAt(aviao.position.x, aviao.position.y, aviao.position.z);
  
  // faz a hélice rodar no próprio eixo
  helice.rotation.x += 0.1;
  
  renderer.render(scene, camera) // Render scene
}