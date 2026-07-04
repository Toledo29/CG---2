// Gerencia o estado de "vida" do avião do player: contagem de tiros
// sofridos, modo invencibilidade (tecla 'G'), barra de vida gráfica e a
// tela de fim de jogo com opção de reiniciar.

const MAX_HITS = 20; // avião aguenta até 20 tiros (conforme enunciado)

let currentHits = 0;
let invincible = false;
let gameOver = false;

let healthBarFill;
let healthBarText;
let invincibilityIndicator;
let gameOverOverlay;

export function initPlayerState() {

    healthBarFill = document.getElementById('healthBarFill');
    healthBarText = document.getElementById('healthBarText');
    invincibilityIndicator = document.getElementById('invincibilityIndicator');
    gameOverOverlay = document.getElementById('gameOverOverlay');

    updateHealthUI();

    // tecla 'G' liga/desliga o modo invencibilidade
    window.addEventListener('keydown', (event) => {
        if (event.key === 'g' || event.key === 'G') {
            toggleInvincibility();
        }
    });

    const restartButton = document.getElementById('restartButton');
    if (restartButton) {
        restartButton.addEventListener('click', () => {
            location.reload();
        });
    }
}

export function toggleInvincibility() {
    invincible = !invincible;

    if (invincibilityIndicator) {
        invincibilityIndicator.style.display = invincible ? 'block' : 'none';
    }
}

export function isInvincible() {
    return invincible;
}

export function isGameOver() {
    return gameOver;
}

export function takeDamage() {

    if (invincible || gameOver) return;

    currentHits++;
    updateHealthUI();

    if (currentHits >= MAX_HITS) {
        triggerGameOver();
    }
}

// percent: 0-100. Ex: healEnergy(25) recupera 25% da energia total (5 tiros)
export function healEnergy(percent) {

    const hitsRecovered = Math.round((percent / 100) * MAX_HITS);
    currentHits = Math.max(0, currentHits - hitsRecovered);
    updateHealthUI();
}

function updateHealthUI() {

    const remainingPercent = Math.max(
        0,
        Math.round(((MAX_HITS - currentHits) / MAX_HITS) * 100)
    );

    if (healthBarFill) {
        healthBarFill.style.width = remainingPercent + '%';

        // verde -> amarelo -> vermelho conforme a energia diminui
        if (remainingPercent > 50) {
            healthBarFill.style.background = '#33cc55';
        } else if (remainingPercent > 20) {
            healthBarFill.style.background = '#e6c229';
        } else {
            healthBarFill.style.background = '#e63333';
        }
    }

    if (healthBarText) {
        healthBarText.innerText =
            `Energia: ${remainingPercent}% (${currentHits}/${MAX_HITS} tiros)`;
    }
}

function triggerGameOver() {
    gameOver = true;

    if (gameOverOverlay) {
        gameOverOverlay.style.display = 'flex';
    }
}