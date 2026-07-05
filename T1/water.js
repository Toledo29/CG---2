import * as THREE from 'three';
import { Water } from '../build/jsm/objects/Water.js';
import { WATER_LEVEL } from './terrain.js';

let water = null;

function createWater(width, depthCoverage) {

    const waterGeometry = new THREE.PlaneGeometry(width, depthCoverage);

    water = new Water(waterGeometry, {
        textureWidth: 512,
        textureHeight: 512,
    
        waterNormals: new THREE.TextureLoader().load(
            '../assets/textures/NormalMapping/waternormals.jpg',
            function (texture) {
                texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
            }
        ),
        sunDirection: new THREE.Vector3(0, 1, 0),
        sunColor: 0xffffff,
        waterColor: 0x001e0f,
        distortionScale: 3.7,
        fog: true // integra automaticamente com o THREE.Fog da cena
    });

    water.rotation.x = -Math.PI / 2;
    water.position.y = WATER_LEVEL;

    return water;
}

function updateWater(delta, aviaoPosition, light) {
    if (!water) return;

    water.material.uniforms['time'].value += delta;

    // acompanha o avião em Z para sempre cobrir a área visível do
    // terreno gerado infinitamente
    water.position.z = aviaoPosition.z;

    // alinha o brilho especular do sol da água com a luz direcional
    // da cena, para ficar coerente com a iluminação do resto do jogo
    if (light) {
        water.material.uniforms['sunDirection'].value
            .copy(light.position)
            .normalize();
    }
}

export { createWater, updateWater };