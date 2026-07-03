import * as THREE from 'three';

export const playerBullets = [];
export const enemyBullets = [];

let sceneRef;
let cameraRef;
let aviaoRef;

let isShooting = false;
let shootCooldown = 0;

let playerShootInterval = 0.12;
export let playerBulletSpeed = 180;

export function setPlayerShootInterval(v) {
    // v em segundos entre tiros
    playerShootInterval = v;
}

// NOVO: ponto (x, y) para onde o player está mirando (mesmo alvo do reticulo),
// atualizado a cada frame pelo cameraController.
let aimX = 0;
let aimY = 11.5;

export function setPlayerAimPoint(x, y) {
    aimX = x;
    aimY = y;
}

// NOVO: geometria/material compartilhados entre todos os tiros do player e
// entre todos os tiros dos inimigos. Antes cada tiro criava um BoxGeometry/
// ConeGeometry e um Material novos e depois os destruía (dispose) ao remover
// o tiro — isso gera criação/descarte de buffers na GPU várias vezes por
// segundo (até ~12x/s no modo rápido) e prejudica bastante o FPS.
const playerBulletGeometry = new THREE.BoxGeometry(0.25, 0.25, 3.5);
const playerBulletMaterial = new THREE.MeshBasicMaterial({ color: 0xffff00 });

const enemyBulletGeometry = new THREE.ConeGeometry(0.18, 4, 8);
const enemyBulletMaterial = new THREE.MeshBasicMaterial({ color: 0xff0000 });

export function initPlayerShooting(scene, camera, aviao) {

    sceneRef = scene;
    cameraRef = camera;
    aviaoRef = aviao;

    window.addEventListener('mousedown', (e) => {
        if (e.button === 0) {
            isShooting = true;
        }
    });

    window.addEventListener('mouseup', (e) => {
        if (e.button === 0) {
            isShooting = false;
        }
    });
}

export function updatePlayerShooting(delta) {

    if (!isShooting) return;

    shootCooldown += delta;

    if (shootCooldown >= playerShootInterval) {

        shootCooldown = 0;

        createPlayerBullet();
    }
}

export function createPlayerBullet() {

    const mesh = new THREE.Mesh(playerBulletGeometry, playerBulletMaterial);

    // posição do avião
    mesh.position.copy(aviaoRef.position);

    // sai da frente do avião
    mesh.position.z += 5;

    // CORRIGIDO: antes a direção era sempre (0,0,1), ignorando o target.
    // Agora calculamos a direção usando o ponto mirado pelo mouse (aimX, aimY),
    // projetado bem à frente no eixo Z, para o tiro seguir de fato na direção
    // do reticulo/target.
    const aimPoint = new THREE.Vector3(
        aimX,
        aimY,
        aviaoRef.position.z + 200
    );

    const direction = new THREE.Vector3()
        .subVectors(aimPoint, mesh.position)
        .normalize();

    // rotaciona o retângulo do tiro para apontar na direção do disparo
    mesh.quaternion.setFromUnitVectors(
        new THREE.Vector3(0, 0, 1),
        direction
    );

    const bullet = {

        mesh,

        direction,

        speed: playerBulletSpeed,

        boundingBox: new THREE.Box3()
    };

    sceneRef.add(mesh);

    playerBullets.push(bullet);
}

export function createEnemyBullet(enemy, player) {

    const mesh = new THREE.Mesh(enemyBulletGeometry, enemyBulletMaterial);

    // deixa o cone apontado para frente
    mesh.rotation.x = Math.PI / 2;

    mesh.position.copy(enemy.mesh.position);

    const direction = new THREE.Vector3()
        .subVectors(player.position, enemy.mesh.position)
        .normalize();

    mesh.quaternion.setFromUnitVectors(
        new THREE.Vector3(0, 1, 0),
        direction
    );

    const bullet = {

        mesh,

        direction,

        speed: 60,

        boundingBox: new THREE.Box3()
    };

    sceneRef.add(mesh);

    enemyBullets.push(bullet);
}

export function updatePlayerBullets(delta) {

    for (let i = playerBullets.length - 1; i >= 0; i--) {

        const bullet = playerBullets[i];

        bullet.mesh.position.add(
            bullet.direction.clone().multiplyScalar(
                bullet.speed * delta
            )
        );

        bullet.boundingBox.setFromCenterAndSize(

            bullet.mesh.position,

            new THREE.Vector3(
                0.4,
                0.4,
                4
            )
        );

        if (
            bullet.mesh.position.distanceTo(aviaoRef.position) > 300
        ) {

            removeBullet(playerBullets, i);
        }
    }
}

export function updateEnemyBullets(delta, player) {

    for (let i = enemyBullets.length - 1; i >= 0; i--) {

        const bullet = enemyBullets[i];

        bullet.mesh.position.add(
            bullet.direction.clone().multiplyScalar(
                bullet.speed * delta
            )
        );

        bullet.boundingBox.setFromObject(bullet.mesh);

        if (
            bullet.mesh.position.distanceTo(player.position) > 300
        ) {

            removeBullet(enemyBullets, i);
        }
    }
}

function removeBullet(array, index) {

    const bullet = array[index];

    sceneRef.remove(bullet.mesh);

    // NOTA: geometria e material agora são compartilhados entre todos os
    // tiros, então NÃO podem ser "dispose"ados aqui — isso quebraria os
    // outros tiros que ainda usam o mesmo geometry/material.

    array.splice(index, 1);
}

export function setBulletSpeed(speed) {

    playerBulletSpeed = speed;
}