import * as THREE from 'three';
import { spawnEnemiesForChunk } from './enemies.js';
import { getTerrainHeight } from './terrain.js';

// Função para obter a posição no mundo a partir das coordenadas NDC do mouse, projetando um plano no eixo Z
function getWorldPointAtZPlane(ndcX, ndcY, zValue, camera, mousePlane, raycaster, zPlaneNormal, intersectionPoint) {
    mousePlane.setFromNormalAndCoplanarPoint(zPlaneNormal, new THREE.Vector3(0, 0, zValue));
    raycaster.setFromCamera(new THREE.Vector2(ndcX, ndcY), camera);

    const hasIntersection = raycaster.ray.intersectPlane(mousePlane, intersectionPoint);
    if (!hasIntersection) {
        return new THREE.Vector3(0, 0, zValue);
    }

    return intersectionPoint.clone();
}

// Calcula os limites do plano visível no plano Z para limitar o movimento do avião dentro da tela
function getScreenBoundsAtZPlane(zPlane, camera, mousePlane, raycaster, zPlaneNormal, intersectionPoint) {
    const corners = [
        getWorldPointAtZPlane(-1, -1, zPlane, camera, mousePlane, raycaster, zPlaneNormal, intersectionPoint),
        getWorldPointAtZPlane(-1, 1, zPlane, camera, mousePlane, raycaster, zPlaneNormal, intersectionPoint),
        getWorldPointAtZPlane(1, -1, zPlane, camera, mousePlane, raycaster, zPlaneNormal, intersectionPoint),
        getWorldPointAtZPlane(1, 1, zPlane, camera, mousePlane, raycaster, zPlaneNormal, intersectionPoint)
    ];

    let minX = Infinity;
    let maxX = -Infinity;
    let minY = Infinity;
    let maxY = -Infinity;

    for (const p of corners) {
        minX = Math.min(minX, p.x);
        maxX = Math.max(maxX, p.x);
        minY = Math.min(minY, p.y);
        maxY = Math.max(maxY, p.y);
    }

    return { minX, maxX, minY, maxY };
}

function removeChunk(chunkIndex, chunks, scene) {
    const chunkGroup = chunks.get(chunkIndex);
    if (!chunkGroup) return;

    scene.remove(chunkGroup);
    chunks.delete(chunkIndex);
}

// CORRIGIDO: antes só movia a posição Z do terreno/árvores e mantinha a altura (Y)
// antiga, causando descontinuidade (degraus/buracos) entre chunks reciclados.
// Agora a altura de cada vértice do terreno e de cada árvore é recalculada
// para a nova posição Z, usando a mesma função de ruído (getTerrainHeight).
function recycleChunk(oldChunkGroup, newChunkIndex, chunkCenterZ) {
    const terrain = oldChunkGroup.children[0];
    const oldZ = terrain.position.z;
    const offset = chunkCenterZ - oldZ;

    // Move o plano
    terrain.position.z = chunkCenterZ;

    // Recalcula a altura (Y) de cada vértice do terreno para a nova posição no mundo
    const vertices = terrain.geometry.attributes.position;
    for (let i = 0; i < vertices.count; i++) {
        const x = vertices.getX(i);
        const zLocal = vertices.getZ(i);
        const worldZ = zLocal + chunkCenterZ;
        const y = getTerrainHeight(x, worldZ);
        vertices.setY(i, y);
    }
    vertices.needsUpdate = true;
    terrain.geometry.computeVertexNormals();
    terrain.geometry.computeBoundingSphere();
    terrain.geometry.computeBoundingBox();

    // Move todas as árvores junto e recalcula a altura de cada uma
    // (senão elas ficam "flutuando" ou "enterradas" no novo relevo)
    for (let i = 1; i < oldChunkGroup.children.length; i++) {
        const tree = oldChunkGroup.children[i];
        tree.position.z += offset;
        tree.position.y = getTerrainHeight(tree.position.x, tree.position.z) + 1.5;
    }
}

function updateChunks(
    aviao,
    planeDepth,
    chunks,
    chunksAhead,
    chunksBehind,
    createChunk
) {

    const currentChunk =
        Math.floor(aviao.position.z / planeDepth);

    const minChunk =
        currentChunk - chunksBehind;

    const maxChunk =
        currentChunk + chunksAhead;

    // cria chunks novos
    for (let i = minChunk; i <= maxChunk; i++) {

        if (!chunks.has(i)) {

            createChunk(i);
        }

        // CORRIGIDO: janela de spawn de inimigos aumentada de +1 para +2 chunks,
        // dando margem extra em velocidade alta (modo 3) para os inimigos
        // serem criados antes de entrarem no campo de visão do jogador.
        if (i <= currentChunk + 2) {
            spawnEnemiesForChunk(i, planeDepth, aviao);
        }
    }

    // recicla chunks antigos
    const chunksArray =
        Array.from(chunks.keys())
            .sort((a, b) => a - b);

    for (const index of chunksArray) {

        if (index < minChunk) {

            const newIndex = maxChunk + 1;

            if (!chunks.has(newIndex)) {

                const oldChunkGroup =
                    chunks.get(index);

                recycleChunk(
                    oldChunkGroup,
                    newIndex,
                    newIndex * planeDepth
                );

                chunks.delete(index);

                chunks.set(newIndex, oldChunkGroup);
            }
        }
    }
}

export { getWorldPointAtZPlane, getScreenBoundsAtZPlane, removeChunk, recycleChunk, updateChunks };