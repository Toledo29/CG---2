import * as THREE from 'three';

// Gerenciador único de carregamento, compartilhado entre todos os loaders do
// jogo (texturas do avião, modelo GLB dos inimigos etc). É o que permite que
// a tela de carregamento (index.html) mostre o progresso real dos assets.
export const loadingManager = new THREE.LoadingManager();