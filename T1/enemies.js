import * as THREE from 'three';

import { GLTFLoader } from '../build/jsm/loaders/GLTFLoader.js';

// CORRETO
import * as SkeletonUtils from '../build/jsm/utils/SkeletonUtils.js';

import { createEnemyBullet } from './bullets.js';

export const enemies = [];
const spawnedEnemyChunks = new Set();

let enemyModel;

let sceneRef;

export let ENEMY_SPEED_MULTIPLIER = 2;

export function setEnemySpeedMultiplier(v) {
    ENEMY_SPEED_MULTIPLIER = v;
}

export let ENEMY_SPAWN_PAIRS = 1;

export function setEnemySpawnPairs(v) {
    ENEMY_SPAWN_PAIRS = v;
}

const loader = new GLTFLoader();

export async function loadEnemyModel(scene) {

    sceneRef = scene;

    return new Promise((resolve, reject) => {

        loader.load(

            './Cargobob.glb',

            (gltf) => {

                enemyModel = gltf.scene;

                enemyModel.scale.set(2, 2, 2);

                console.log('Inimigo carregado');

                resolve();
            },

            undefined,

            (error) => {

                console.error(
                    'Erro carregando GLB:',
                    error
                );

                reject(error);
            }
        );
    });
}


export function spawnEnemiesForChunk(
    chunkIndex,
    planeDepth,
    player
) {

    if (!enemyModel) return;

    if (spawnedEnemyChunks.has(chunkIndex)) return;
    spawnedEnemyChunks.add(chunkIndex);

    const pairs = Math.max(1, Math.round(ENEMY_SPAWN_PAIRS));

    for (let p = 0; p < pairs; p++) {
        spawnEnemy(chunkIndex, planeDepth, player, -1);
        spawnEnemy(chunkIndex, planeDepth, player, 1);
    }
}

function spawnEnemy(
    chunkIndex,
    planeDepth,
    player,
    side
) {

    if (!enemyModel) return;

    const enemyMesh = SkeletonUtils.clone(enemyModel);

    enemyMesh.traverse((obj) => {
        if (obj.isMesh) obj.material = obj.material.clone();
    });

    const x = side * 260;

    // CORRIGIDO: voltei a calcular o Z em cima do chunk (mecanismo que já
    // funcionava, sem risco de "clustering"), só que com um deslocamento
    // maior dentro do chunk (1.5x em vez de 0.75x) para garantir que o
    // inimigo nasça mais longe do avião.
    const z = chunkIndex * planeDepth + planeDepth * 1.5 + THREE.MathUtils.randFloat(-20, 20);

    const y = player.position.y;

    enemyMesh.position.set(x, y, z);

    const direction = new THREE.Vector3(-side, 0, 0);
    enemyMesh.rotation.y = 0;

    sceneRef.add(enemyMesh);

    enemies.push({
        mesh: enemyMesh,
        direction,
        baseSpeed: THREE.MathUtils.randFloat(15, 25),
        boundingBox: new THREE.Box3(),
        isDead: false,
        deathTimer: 0,
        shootTimer: THREE.MathUtils.randFloat(0, 1)
    });
}

export function updateEnemies(delta, player) {
    for (let i = enemies.length - 1; i >= 0; i--) {
        const enemy = enemies[i];

        if (enemy.isDead) {
            updateDeath(enemy, delta, i);
            continue;
        }

        const currentSpeed = enemy.baseSpeed * ENEMY_SPEED_MULTIPLIER;

        enemy.mesh.position.add(enemy.direction.clone().multiplyScalar(currentSpeed * delta));

        enemy.boundingBox.setFromObject(enemy.mesh);

        enemy.shootTimer += delta;
        if (enemy.shootTimer >= 1) {
            enemy.shootTimer = 0;
            createEnemyBullet(enemy, player);
        }

        if (enemy.direction.x > 0 && enemy.mesh.position.x > player.position.x + 40) {
            removeEnemy(i);
        }

        if (enemy.direction.x < 0 && enemy.mesh.position.x < player.position.x - 40) {
            removeEnemy(i);
        }
    }
}

// convenience: spawn enemies directly in front of player by mapping Z to a chunk
export function spawnEnemiesInFront(player, planeDepth, distanceAhead = planeDepth) {
    if (!enemyModel) return;
    const targetZ = player.position.z + distanceAhead;
    const chunkIndex = Math.floor(targetZ / planeDepth);
    spawnEnemiesForChunk(chunkIndex, planeDepth, player);
}



function updateDeath(enemy, delta, index) {

    enemy.deathTimer += delta;

    enemy.mesh.scale.multiplyScalar(0.96);

    enemy.mesh.rotation.z += 0.15;

    enemy.mesh.position.y -= 12 * delta;

    enemy.mesh.traverse((obj) => {

        if (obj.material) {

            obj.material.transparent = true;

            obj.material.opacity -= 0.03;
        }
    });

    if (enemy.deathTimer >= 1.5) {

        removeEnemy(index);
    }
}

function removeEnemy(index) {

    const enemy = enemies[index];

    sceneRef.remove(enemy.mesh);

    enemy.mesh.traverse((obj) => {

        if (obj.geometry) {

            obj.geometry.dispose();
        }

        if (obj.material) {

            if (Array.isArray(obj.material)) {

                obj.material.forEach(
                    m => m.dispose()
                );

            } else {

                obj.material.dispose();
            }
        }
    });

    enemies.splice(index, 1);
}