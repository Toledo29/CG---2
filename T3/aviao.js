import * as THREE from 'three';
import { loadingManager } from './loadingManager.js';

// tela de carregamento 
const textureLoader = new THREE.TextureLoader(loadingManager);

// texturas do avião exigidas pelo T3.
const metalTexture = textureLoader.load('./assets/aviao_metal.jpg');
const paintedMetalTexture = textureLoader.load('./assets/aviao_pintura.jpg');
const metal2FiberTexture = textureLoader.load('./assets/aviao_metal2.jpg');

[metalTexture, paintedMetalTexture, metal2FiberTexture].forEach((tex) => {
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    if ('colorSpace' in tex) {
        tex.colorSpace = THREE.SRGBColorSpace;
    }
});

// ajusta a repetição da textura para não ficar esticada nos cilindros
metalTexture.repeat.set(3, 1);
paintedMetalTexture.repeat.set(2, 1);
metal2FiberTexture.repeat.set(2, 1);

// cria o avião
let aviao = new THREE.Group();

// cria corpo do avião
let corpoGeo = new THREE.CylinderGeometry( 0.3, 0.6, 4, 32 );
let corpoMat = new THREE.MeshStandardMaterial({
    color: 0x888888,
    map: metalTexture, // NOVO: textura de metal rebitado (fuselagem)
    metalness: 0.4,  // aspecto de alumínio
    roughness: 0.2  // superfície mais lisa  
});
let corpo = new THREE.Mesh(corpoGeo, corpoMat);
corpo.rotation.x = -Math.PI / 2;
aviao.add(corpo);

// cria asa adireita do avião 
let asaGeoDireita = new THREE.CylinderGeometry( 0.3, 0.5, 4, 10 );
let asaMat = new THREE.MeshStandardMaterial({
    color: 0xffa500, 
    map: paintedMetalTexture, // NOVO: textura de metal pintado (asas)
    metalness: 0.4,  
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
    map: metal2FiberTexture, // NOVO: textura de fibra de carbono (cauda)
    metalness: 0.4,  
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

const playerBoundingBox = new THREE.Box3();

export { aviao, helice, playerBoundingBox };