import * as THREE from 'three';

import { GLTFLoader } from '../build/jsm/loaders/GLTFLoader.js';

// CORRETO
import * as SkeletonUtils from '../build/jsm/utils/SkeletonUtils.js';

import { createEnemyBullet } from './bullets.js';

export const enemies = [];
const spawnedEnemyChunks = new Set();

let enemyModel;

let sceneRef;

const loader = new GLTFLoader();

export async function loadEnemyModel(scene) {

    sceneRef = scene;

    return new Promise((resolve, reject) => {

        loader.load(

            './Cargobob.glb',

            (gltf) => {

                enemyModel = gltf.scene;

                enemyModel.scale.set(3, 3, 3);

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

    spawnEnemy(chunkIndex, planeDepth, player, -1);
    spawnEnemy(chunkIndex, planeDepth, player, 1);
}

function spawnEnemy(
    chunkIndex,
    planeDepth,
    player,
    side
) {

    if (!enemyModel) return;

    const enemyMesh =
        SkeletonUtils.clone(enemyModel);

    // materiais independentes
    enemyMesh.traverse((obj) => {

        if (obj.isMesh) {

            obj.material =
                obj.material.clone();
        }
    });



    // posição lateral
    const x = side * 260;

    // spawn no trecho do chunk à frente do avião, não na posição atual dele
    const z = chunkIndex * planeDepth + planeDepth * 0.75 + THREE.MathUtils.randFloat(-20, 20);

    // mesma altura do avião
    const y = player.position.y;

    enemyMesh.position.set(x, y, z);

    // inimigo atravessa lateralmente
    const direction =
        new THREE.Vector3(
            -side,
            0,
            0
        );

    // frente alinhada com avião
    enemyMesh.rotation.y = 0;

    sceneRef.add(enemyMesh);

    enemies.push({

        mesh: enemyMesh,

        direction,

        speed: THREE.MathUtils.randFloat(
            15,
            25
        ),

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

        enemy.mesh.position.add(

            enemy.direction
                .clone()
                .multiplyScalar(enemy.speed * delta)
        );


        enemy.boundingBox.setFromObject(
            enemy.mesh
        );

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