import * as THREE from  'three';
import { OrbitControls } from '../build/jsm/controls/OrbitControls.js';
import Stats from '../build/jsm/libs/stats.module.js';
import {initRenderer, 
        initDefaultBasicLight,
        setDefaultMaterial,
        InfoBox,
        onWindowResize,
        createGroundPlaneWired} from "../libs/util/util.js";

let scene, renderer, camera, light, orbit;; // Inicializa Variáveis
scene = new THREE.Scene();    // Cria cena
renderer = initRenderer();    // Inicializa o renderizador
light = initDefaultBasicLight(scene); // Inicializa luz

// Cria a câmera e configura
camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
   camera.position.set(0.0, 11, -90.0);
   camera.up.set( 0.0, 1.0, 0.0 );
   camera.lookAt(0.0, 11, 0.0);

// cria os materiais padrões para os objetos
let material1 = setDefaultMaterial('rgb(139, 69, 19)');
let material2 = setDefaultMaterial('green');
let material3 = setDefaultMaterial('darkgreen');

// Cria Fog
const fogColor = 0x87ceeb; // cor da névoa (azul claro)
let fogDistance = 100; // distância onde a névoa começa a ser aplicada
scene.background = new THREE.Color(fogColor);
scene.fog = new THREE.Fog( fogColor, fogDistance, 500 );

// Listen window size changes
window.addEventListener( 'resize', function(){onWindowResize(camera, renderer)}, false );


// Configuração de FPS
const container = document.getElementById( 'container' );
const stats = new Stats();
container.appendChild( stats.dom );

// Cria constantes para plano do chão
const planeWidth = 500;
const planeDepth = 150;
const halfPlaneWidth = planeWidth / 2;
const halfPlaneDepth = planeDepth / 2;

// Cria geometria dos componentes da árvore
let logGeometry1 = new THREE.CylinderGeometry(0.3, 0.3, 4, 5);
let logGeometry2 = new THREE.CylinderGeometry(0.3, 0.3, 3, 5);
let sphereLeafGeometry1 = new THREE.SphereGeometry(1.3, 32, 5);
let coneLeafGeometry1 = new THREE.ConeGeometry(2, 2, 5);
let coneLeafGeometry2 = new THREE.ConeGeometry(1.5, 2, 5);
let coneLeafGeometry3 = new THREE.ConeGeometry(1, 2, 5);

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
corpo.rotation.x = -Math.PI / 2;
aviao.add(corpo);

// cria asa adireita do avião 
let asaGeoDireita = new THREE.CylinderGeometry( 0.3, 0.5, 4, 10 );
let asaMat = new THREE.MeshStandardMaterial({
    color: 0xffa500, 
    metalness: 0.1,  
    roughness: 0.4   
});
let asaDireita = new THREE.Mesh(asaGeoDireita, asaMat);
asaDireita.rotation.x = Math.PI / 2;
asaDireita.rotation.z = Math.PI / 2;
asaDireita.scale.set(1, 1, 0.2);
asaDireita.position.x = -2;
asaDireita.position.z = 0.5;
aviao.add(asaDireita);

let pontaGeoDIreita = new THREE.SphereGeometry(0.3, 32, 10);
let pontaDireita = new THREE.Mesh(pontaGeoDIreita, asaMat);
pontaDireita.position.set(4, 0, 0.5); 
pontaDireita.rotation.z = Math.PI / 2;
pontaDireita.rotation.y = Math.PI / 2 ; // usei para virar a ponta da asa para o outro lado
pontaDireita.scale.set(0.2, 1, 0.6); 
aviao.add(pontaDireita);

// cria asa esqueda do avião 
let asaGeoEsquerda = new THREE.CylinderGeometry( 0.5, 0.3, 4, 10 );
let asaEsquerda = new THREE.Mesh(asaGeoEsquerda, asaMat);
asaEsquerda.rotation.x = -Math.PI / 2;
asaEsquerda.rotation.z = Math.PI / 2;
asaEsquerda.scale.set(1, 1, 0.2);
asaEsquerda.position.x = 2;
asaEsquerda.position.z = 0.5;
aviao.add(asaEsquerda);

let pontaGeoEsquerda = new THREE.SphereGeometry(0.3, 32, 10);
let pontaEsquerda = new THREE.Mesh(pontaGeoEsquerda, asaMat);
pontaEsquerda.position.set(-4, 0, 0.5);
pontaEsquerda.rotation.z = Math.PI / 2 ; 
pontaEsquerda.rotation.y = Math.PI / 2 ; // usei para virar a ponta da asa para o outro lado
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
cauda.position.set(0, 0, -2);
cauda.rotation.x = -Math.PI / 2;
aviao.add(cauda);

// criar cauda cima
let caudaGeoCima = new THREE.CylinderGeometry( 0.05, 0.1, 0.8, 32 );
let caudaCima = new THREE.Mesh(caudaGeoCima, caudaMat);
caudaCima.scale.set(-2, 1, 0.5);
caudaCima.rotation.y = Math.PI / 2;
caudaCima.position.set(0, 0.5, -2);
aviao.add(caudaCima);

let pontaGeoCima = new THREE.SphereGeometry(0.05, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2);
let pontaCima = new THREE.Mesh(pontaGeoCima, caudaMat);
pontaCima.position.set(0, 0.9, -2);
pontaCima.rotation.y = Math.PI / 2;
pontaCima.scale.set(-2, 1, 0.5); 
aviao.add(pontaCima);

// cirar cauda direita
let caudaGeoDireita = new THREE.CylinderGeometry( 0.05, 0.1, 0.8, 32 );
let caudaDireita = new THREE.Mesh(caudaGeoDireita, caudaMat);
caudaDireita.rotation.x = Math.PI / 2;
caudaDireita.rotation.z = Math.PI / 2;
caudaDireita.scale.set(-2, 1, 0.5);
caudaDireita.position.set(-0.5, 0, -2);
aviao.add(caudaDireita);

let pontaCaudaGeoDIreita = new THREE.SphereGeometry(0.05, 32, 16);
let pontaCaudaDireita = new THREE.Mesh(pontaCaudaGeoDIreita, caudaMat);
pontaCaudaDireita.position.set(0.9, 0, -2); 
pontaCaudaDireita.scale.set(-2, 1, 0.5); 
pontaCaudaDireita.rotation.x = Math.PI / 2;  // so assim q consegui fazer
pontaCaudaDireita.rotation.z = Math.PI / 2; // usei para virar a ponta da asa para o outro lado
aviao.add(pontaCaudaDireita);

// criar cauda esquerda
let caudaGeoEsquerda = new THREE.CylinderGeometry( 0.1, 0.05, 0.8, 32 );
let caudaEsquerda = new THREE.Mesh(caudaGeoEsquerda, caudaMat);
caudaEsquerda.rotation.x = Math.PI / 2;
caudaEsquerda.rotation.z = Math.PI / 2;
caudaEsquerda.scale.set(-2, 1, 0.5);
caudaEsquerda.position.set(0.5, 0, -2);
aviao.add(caudaEsquerda);

let pontaCaudaGeoEsquerda = new THREE.SphereGeometry(0.05, 32, 16);
let pontaCaudaEsquerda = new THREE.Mesh(pontaCaudaGeoEsquerda, caudaMat);
pontaCaudaEsquerda.position.set(-0.9, 0, -2); 
pontaCaudaEsquerda.scale.set(-2, 1, 0.5); 
pontaCaudaEsquerda.rotation.x = Math.PI / 2; 
pontaCaudaEsquerda.rotation.z = Math.PI/2  ; // usei para virar a ponta da asa para o outro lado 
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
cabine.rotation.x = -Math.PI / 1.9;
cabine.position.set(0, 0.4, 0.5);

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
nariz.position.set(0, 0, 2.0);
nariz.rotation.x = Math.PI / 2;
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
    pa.rotation.z = (i * Math.PI * 2) / 3;
    
    helice.add(pa);
}

// cria o núcleo central da hélice
let nucleoGeo = new THREE.CapsuleGeometry(0.12, 0.12, 4, 8, 1);
let nucleo = new THREE.Mesh(nucleoGeo, heliceMat);
nucleo.rotation.x = Math.PI / 2;
helice.add(nucleo);

// posiciona a hélice na ponta do nariz
helice.position.set(0, 0, 2.7);
aviao.add(helice);

aviao.scale.set(1, 1, 1);
aviao.position.set(0, 11.5, -70);
// aviao.rotation.x = Math.PI;
scene.add(aviao);

// alvo invisivel para camera (x/y fixos e z seguindo o aviao)
const cameraTarget = new THREE.Object3D();
cameraTarget.position.set(0, 11.5, aviao.position.z);
scene.add(cameraTarget);

// configura variáveis para controle de geração dos chunks
const cameraFollowZOffset = -20; // distância da camera para o alvo
const treeCountPerChunk = 400; // quantidade de árvores por chunk
const minDistance = 4.5; // distância mínima entre as árvores para evitar sobreposição
const margin = 2; // margem ao redor do chunk
const edgeBandWidth = Math.min(20, Math.min(halfPlaneWidth, halfPlaneDepth) * 0.3); //
const edgeBias = 0.45;
const maxPlacementAttempts = 10000;

const chunks = new Map();
const chunksAhead = 4; // quantidade de chunks gerados à frente do avião
const chunksBehind = 1; // quantidade de chunks mantidos atrás do avião 

// mapeamento do mouse para movimentação do avião em X/Y
const mouseNDC = new THREE.Vector2(0, 0); 
const tempVector = new THREE.Vector3();

window.addEventListener('mousemove', function(event){
  mouseNDC.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouseNDC.y = -((event.clientY / window.innerHeight) * 2 - 1);
});

function getWorldPointAtZPlane(ndcX, ndcY, zPlane){
  tempVector.set(ndcX, ndcY, 0.5).unproject(camera);
  const dir = tempVector.sub(camera.position).normalize();
  const t = (zPlane - camera.position.z) / dir.z;

  return camera.position.clone().add(dir.multiplyScalar(t));
}

function getScreenBoundsAtZPlane(zPlane){
  const corners = [
    getWorldPointAtZPlane(-1, -1, zPlane),
    getWorldPointAtZPlane(-1, 1, zPlane),
    getWorldPointAtZPlane(1, -1, zPlane),
    getWorldPointAtZPlane(1, 1, zPlane)
  ];

  let minX = Infinity;
  let maxX = -Infinity;
  let minY = Infinity;
  let maxY = -Infinity;

  for(const p of corners){
    minX = Math.min(minX, p.x);
    maxX = Math.max(maxX, p.x);
    minY = Math.min(minY, p.y);
    maxY = Math.max(maxY, p.y);
  }

  return { minX, maxX, minY, maxY };
}

function createChunk(chunkIndex){
  const chunkGroup = new THREE.Group();
  const chunkCenterZ = chunkIndex * planeDepth;

  const chunkPlane = createGroundPlaneWired(planeWidth, planeDepth);
  chunkPlane.position.set(0, 0, chunkCenterZ);
  chunkGroup.add(chunkPlane);

  const treePositions = [];
  let attempts = 0;

  while(treePositions.length < treeCountPerChunk && attempts < maxPlacementAttempts){
    let x = THREE.MathUtils.randFloat(-halfPlaneWidth + margin, halfPlaneWidth - margin);
    let zLocal = THREE.MathUtils.randFloat(-halfPlaneDepth + margin, halfPlaneDepth - margin);

    // parte das árvores é sorteada com viés para as bordas do chunk
    if(Math.random() < edgeBias){
      const nearRightOrTop = Math.random() < 0.5;
      const useXAxis = Math.random() < 0.5;

      if(useXAxis){
        x = nearRightOrTop
          ? THREE.MathUtils.randFloat(halfPlaneWidth - margin - edgeBandWidth, halfPlaneWidth - margin)
          : THREE.MathUtils.randFloat(-halfPlaneWidth + margin, -halfPlaneWidth + margin + edgeBandWidth);
      } else {
        zLocal = nearRightOrTop
          ? THREE.MathUtils.randFloat(halfPlaneDepth - margin - edgeBandWidth, halfPlaneDepth - margin)
          : THREE.MathUtils.randFloat(-halfPlaneDepth + margin, -halfPlaneDepth + margin + edgeBandWidth);
      }
    }

    let tooClose = false;
    for(const pos of treePositions){
      if(pos.distanceToSquared(new THREE.Vector3(x, 0, zLocal)) < minDistance * minDistance){
        tooClose = true;
        break;
      }
    }

    if(!tooClose){
      treePositions.push(new THREE.Vector3(x, 0, zLocal));
    }

    attempts++;
  }

  for(const pos of treePositions){
    let tree;
    if(Math.random() < 0.5){
      tree = new THREE.Mesh(logGeometry1, material1);
      let sphereleaf = new THREE.Mesh(sphereLeafGeometry1, material2);
      tree.add(sphereleaf);
      sphereleaf.position.set(0, 2, 0);
    } else {
      tree = new THREE.Mesh(logGeometry2, material1);
      let coneleaf1 = new THREE.Mesh(coneLeafGeometry1, material3);
      let coneleaf2 = new THREE.Mesh(coneLeafGeometry2, material3);
      let coneleaf3 = new THREE.Mesh(coneLeafGeometry3, material3);
      tree.add(coneleaf1);
      tree.add(coneleaf2);
      tree.add(coneleaf3);
      coneleaf1.position.set(0, 0, 0);
      coneleaf2.position.set(0, 1, 0);
      coneleaf3.position.set(0, 2, 0);
    }

    tree.position.set(pos.x, 1.5, chunkCenterZ + pos.z);
    chunkGroup.add(tree);
  }

  scene.add(chunkGroup);
  chunks.set(chunkIndex, chunkGroup);
}

function removeChunk(chunkIndex){
  const chunkGroup = chunks.get(chunkIndex);
  if(!chunkGroup) return;

  scene.remove(chunkGroup);
  chunks.delete(chunkIndex);
}

function updateChunks(){
  const currentChunk = Math.floor(aviao.position.z / planeDepth);
  const minChunk = currentChunk - chunksBehind;
  const maxChunk = currentChunk + chunksAhead;

  for(let i = minChunk; i <= maxChunk; i++){
    if(!chunks.has(i)){
      createChunk(i);
    }
  }

  for(const index of chunks.keys()){
    if(index < minChunk || index > maxChunk){
      removeChunk(index);
    }
  }
}

// Configuração do slider de controle da névoa
const fogSlider = document.getElementById('fogSlider');
const fogValue = document.getElementById('fogValue');
if(fogSlider) {
  fogSlider.addEventListener('input', function(event) {
    fogDistance = parseFloat(event.target.value);
    scene.fog.far = fogDistance;
    fogValue.textContent = fogDistance;
  });
}



updateChunks();

render();
function render()
{
  requestAnimationFrame(render);

  const maxRollZ = THREE.MathUtils.degToRad(45);
  const lateralResponse = 8.0;

  const cameraXOffset = 0.6;
  const cameraYOffset = 0.8;

  aviao.position.z += 0.4;
  cameraTarget.position.z = aviao.position.z;
  // cameraTarget.position.y = aviao.position.y - (aviao.position.y*cameraYOffset);
  cameraTarget.position.x = aviao.position.x - (aviao.position.x*cameraXOffset);

  camera.position.z = cameraTarget.position.z + cameraFollowZOffset;
  // camera.position.y = cameraTarget.position.y +11;
  camera.position.x = cameraTarget.position.x;
  camera.lookAt(cameraTarget.position.x, cameraTarget.position.y, cameraTarget.position.z);
  camera.updateMatrixWorld();

  const mouseWorld = getWorldPointAtZPlane(mouseNDC.x, mouseNDC.y, aviao.position.z);
  const bounds = getScreenBoundsAtZPlane(aviao.position.z);
  const screenMargin = 4.0;

  const targetX = THREE.MathUtils.clamp(mouseWorld.x, bounds.minX + screenMargin, bounds.maxX - screenMargin);
  const targetY = THREE.MathUtils.clamp(mouseWorld.y, bounds.minY + screenMargin, bounds.maxY - screenMargin);

  aviao.position.x = THREE.MathUtils.lerp(aviao.position.x, targetX, 0.12);
  aviao.position.y = THREE.MathUtils.lerp(aviao.position.y, targetY, 0.12);

  // inclina ate 45 graus com movimento lateral e estabiliza ao cessar movimento
  const lateralDelta = targetX - aviao.position.x;
  const desiredRollZ = THREE.MathUtils.clamp(
    -(lateralDelta / lateralResponse) * maxRollZ,
    -maxRollZ,
    maxRollZ
  );
  aviao.rotation.z = THREE.MathUtils.lerp(aviao.rotation.z, desiredRollZ, 0.12);

  // aviao.rotation.x += 1; // leve rotação para dar mais dinamismo

  helice.rotation.z += 0.1;
  stats.update();
  updateChunks();
  renderer.render(scene, camera) // Render scene
}