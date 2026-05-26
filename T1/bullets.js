import * as THREE from 'three';

export const playerBullets = [];
export const enemyBullets = [];

let sceneRef;
let cameraRef;
let aviaoRef;

let isShooting = false;
let shootCooldown = 0;

const playerShootInterval = 0.12;

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

    const geometry = new THREE.PlaneGeometry(0.3, 2);

    const material = new THREE.MeshBasicMaterial({
        color: 0xffaa00,
        side: THREE.DoubleSide
    });

    const mesh = new THREE.Mesh(geometry, material);

    mesh.position.copy(aviaoRef.position);

    mesh.position.z += 4;

    const bullet = {

        mesh,

        direction: new THREE.Vector3(0, 0, 1),

        speed: 180,

        boundingBox: new THREE.Box3()
    };

    sceneRef.add(mesh);

    playerBullets.push(bullet);
}

export function createEnemyBullet(enemy, player) {

    const geometry = new THREE.ConeGeometry(0.25, 1.5, 8);

    const material = new THREE.MeshBasicMaterial({
        color: 0xff0000
    });

    const mesh = new THREE.Mesh(geometry, material);

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

        bullet.mesh.lookAt(cameraRef.position);

        bullet.boundingBox.setFromObject(bullet.mesh);

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

    bullet.mesh.geometry.dispose();
    bullet.mesh.material.dispose();

    array.splice(index, 1);
}