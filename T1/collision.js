import { playerBullets, enemyBullets } from './bullets.js';
import { enemies } from './enemies.js';
import { takeDamage, isInvincible, isGameOver } from './playerState.js';
import { notifyEnemyKilled } from './healthpacks.js';

export function updateCollisions(aviao, playerBoundingBox) {

    if (isGameOver()) return;

    playerBoundingBox.setFromObject(aviao);

    playerVsEnemyBullets(playerBoundingBox);

    playerBulletsVsEnemies(aviao);
}

function playerVsEnemyBullets(playerBoundingBox) {

    for (let i = enemyBullets.length - 1; i >= 0; i--) {

        const bullet = enemyBullets[i];

        if (
            bullet.boundingBox.intersectsBox(playerBoundingBox)
        ) {

            if (!isInvincible()) {
                takeDamage();
            }

            bullet.mesh.parent.remove(bullet.mesh);

            enemyBullets.splice(i, 1);
        }
    }
}

function playerBulletsVsEnemies(player) {

    for (
        let i = playerBullets.length - 1;
        i >= 0;
        i--
    ) {

        const bullet = playerBullets[i];

        for (
            let j = enemies.length - 1;
            j >= 0;
            j--
        ) {

            const enemy = enemies[j];

            if (enemy.isDead) continue;

            enemy.boundingBox.setFromObject(
                enemy.mesh
            );

            if (
                bullet.boundingBox.intersectsBox(
                    enemy.boundingBox
                )
            ) {

                enemy.isDead = true;

                // nasce um pack de energia perto do player
                notifyEnemyKilled(player);

                bullet.mesh.parent.remove(
                    bullet.mesh
                );

                playerBullets.splice(i, 1);

                break;
            }
        }
    }
}