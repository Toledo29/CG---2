import { playerBullets, enemyBullets } from './bullets.js';

import { enemies } from './enemies.js';

let damageCounter = 0;

const damageHUD = document.getElementById('damageHUD');

export function updateCollisions(aviao, playerBoundingBox) {

    playerBoundingBox.setFromObject(aviao);

    playerVsEnemyBullets(playerBoundingBox);

    playerBulletsVsEnemies();
}

function playerVsEnemyBullets(playerBoundingBox) {

    for (let i = enemyBullets.length - 1; i >= 0; i--) {

        const bullet = enemyBullets[i];

        if (
            bullet.boundingBox.intersectsBox(playerBoundingBox)
        ) {

            damageCounter++;

            damageHUD.innerText =
                `Tiros Sofridos: ${damageCounter}`;

            bullet.mesh.parent.remove(bullet.mesh);

            bullet.mesh.geometry.dispose();
            bullet.mesh.material.dispose();

            enemyBullets.splice(i, 1);
        }
    }
}

function playerBulletsVsEnemies() {

    for (let i = playerBullets.length - 1; i >= 0; i--) {

        const bullet = playerBullets[i];

        for (let j = enemies.length - 1; j >= 0; j--) {

            const enemy = enemies[j];

            if (enemy.isDead) continue;

            if (
                bullet.boundingBox.intersectsBox(
                    enemy.boundingBox
                )
            ) {

                enemy.isDead = true;

                bullet.mesh.parent.remove(bullet.mesh);

                bullet.mesh.geometry.dispose();
                bullet.mesh.material.dispose();

                playerBullets.splice(i, 1);

                break;
            }
        }
    }
}