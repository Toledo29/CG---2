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

            // CORRIGIDO: só aplica dano se o modo invencível não estiver ativo
            if (!isInvincible()) {
                takeDamage();
            }

            bullet.mesh.parent.remove(bullet.mesh);

            // CORRIGIDO: geometria/material do tiro agora são compartilhados
            // entre todos os tiros (ver bullets.js) — NÃO fazer dispose()
            // aqui, senão todos os próximos tiros ficam quebrados.

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

                // NOVO: avisa o sistema de health packs — a cada 3 abates
                // nasce um pack de energia perto do player
                notifyEnemyKilled(player);

                bullet.mesh.parent.remove(
                    bullet.mesh
                );

                // CORRIGIDO: mesmo motivo do bloco acima — não fazer
                // dispose() em geometria/material compartilhados.

                playerBullets.splice(i, 1);

                break;
            }
        }
    }
}