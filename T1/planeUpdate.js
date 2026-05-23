import * as THREE from 'three';

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

function recycleChunk(oldChunkGroup, newChunkIndex, chunkCenterZ) {
    const oldZ = oldChunkGroup.children[0].position.z;
    const offset = chunkCenterZ - oldZ;

    // Move o plano
    oldChunkGroup.children[0].position.z = chunkCenterZ;

    // Move todas as árvores junto
    for (let i = 1; i < oldChunkGroup.children.length; i++) {
        oldChunkGroup.children[i].position.z += offset;
    }
}

function updateChunks(aviao, planeDepth, chunks, chunksAhead, chunksBehind, createChunk) {
    const currentChunk = Math.floor(aviao.position.z / planeDepth);
    const minChunk = currentChunk - chunksBehind;
    const maxChunk = currentChunk + chunksAhead;

    // Inicializa chunks que não existem
    for (let i = minChunk; i <= maxChunk; i++) {
        if (!chunks.has(i)) {
            createChunk(i);
        }
    }

    // Recicla chunks: move o chunk mais de trás para a frente quando necessário
    const chunksArray = Array.from(chunks.keys()).sort((a, b) => a - b);

    for (const index of chunksArray) {
        if (index < minChunk) {
            // Encontra o novo índice necessário (maxChunk + 1)
            const newIndex = maxChunk + 1;
            if (!chunks.has(newIndex)) {
                const oldChunkGroup = chunks.get(index);
                recycleChunk(oldChunkGroup, newIndex, newIndex * planeDepth);
                chunks.delete(index);
                chunks.set(newIndex, oldChunkGroup);
            }
        }
    }
}

export { getWorldPointAtZPlane, getScreenBoundsAtZPlane, removeChunk, recycleChunk, updateChunks };

