import * as THREE from 'three';
import { getTerrainHeight } from './terrain.js';

export const healthPacks = [];

let sceneRef;
let onCollectCallback = null;

let killsSinceLastPack = 0;
const KILLS_PER_PACK = 3;      // a cada 3 inimigos abatidos, nasce 1 pack

// NOTA (pedido do enunciado): a distância mínima de coleta foi testada e
// ajustada visualmente em 4 unidades — próxima o suficiente para não
// parecer "roubado", mas com folga suficiente já que o pack também é
// puxado (efeito atrator) até o avião a partir de 25 unidades.
const ATTRACT_RADIUS = 25;
const ATTRACT_SPEED = 60;
const COLLECT_RADIUS = 4;
const ENERGY_RESTORE_PERCENT = 25;

// gera uma textura simples (cruz de energia) via canvas, sem depender de
// nenhum arquivo de imagem externo
function createHealthPackTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 128;
    const ctx = canvas.getContext('2d');

    const gradient = ctx.createRadialGradient(64, 64, 8, 64, 64, 64);
    gradient.addColorStop(0, '#d9ffe0');
    gradient.addColorStop(0.55, '#33ff66');
    gradient.addColorStop(1, '#0a4d1f');
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(64, 64, 64, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(52, 20, 24, 88);
    ctx.fillRect(20, 52, 88, 24);

    return new THREE.CanvasTexture(canvas);
}

const healthPackTexture = createHealthPackTexture();

const healthPackGeometry = new THREE.SphereGeometry(1.4, 20, 20);
const healthPackMaterial = new THREE.MeshStandardMaterial({
    map: healthPackTexture,
    emissive: 0x33ff66,
    emissiveMap: healthPackTexture,
    emissiveIntensity: 0.9,
    roughness: 0.3,
    metalness: 0.1
});

export function initHealthPacks(scene, onCollect) {
    sceneRef = scene;
    onCollectCallback = onCollect;
}

// chamado pelo collision.js sempre que um inimigo é abatido
export function notifyEnemyKilled(player) {
    killsSinceLastPack++;

    if (killsSinceLastPack >= KILLS_PER_PACK) {
        killsSinceLastPack = 0;
        spawnHealthPack(player);
    }
}

function spawnHealthPack(player) {
    if (!sceneRef) return;

    const mesh = new THREE.Mesh(healthPackGeometry, healthPackMaterial);

    const x = THREE.MathUtils.randFloat(-40, 40);
    const z = player.position.z + THREE.MathUtils.randFloat(80, 160);
    const terrainY = getTerrainHeight(x, z);
    const y = terrainY + THREE.MathUtils.randFloat(6, 14);

    mesh.position.set(x, y, z);
    mesh.castShadow = true;

    sceneRef.add(mesh);

    healthPacks.push({
        mesh,
        spinSpeed: THREE.MathUtils.randFloat(1, 2)
    });
}

export function updateHealthPacks(delta, player, healSound) {

    for (let i = healthPacks.length - 1; i >= 0; i--) {

        const pack = healthPacks[i];

        // gira e flutua um pouco, para dar vida ao objeto
        pack.mesh.rotation.y += pack.spinSpeed * delta;
        pack.mesh.position.y += Math.sin(performance.now() * 0.002 + i) * 0.02;

        const distance = pack.mesh.position.distanceTo(player.position);

        // efeito atrator: dentro do raio, o pack é puxado em direção ao avião
        if (distance < ATTRACT_RADIUS) {

            const direction = new THREE.Vector3()
                .subVectors(player.position, pack.mesh.position)
                .normalize();

            const pullStrength = 1 - (distance / ATTRACT_RADIUS);

            pack.mesh.position.add(
                direction.multiplyScalar(ATTRACT_SPEED * pullStrength * delta)
            );
        }

        // coleta
        if (distance < COLLECT_RADIUS) {

            sceneRef.remove(pack.mesh);
            healthPacks.splice(i, 1);

            if (onCollectCallback) {
                onCollectCallback(ENERGY_RESTORE_PERCENT);
            }
            healSound.play(); // toca o som de cura ao coletar o pack

            continue;
        }

        // remove se ficar muito para trás (não foi coletado a tempo)
        if (pack.mesh.position.z < player.position.z - 100) {
            sceneRef.remove(pack.mesh);
            healthPacks.splice(i, 1);
        }
    }
}