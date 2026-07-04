import * as THREE from 'three';
import { spawnEnemiesForChunk } from './enemies.js';
import { getTerrainHeight, WATER_LEVEL } from './terrain.js';

const _matrix = new THREE.Matrix4();
const _quat = new THREE.Quaternion();
const _scaleVec = new THREE.Vector3();
const _posVec = new THREE.Vector3();

function getWorldPointAtZPlane(ndcX, ndcY, zValue, camera, mousePlane, raycaster, zPlaneNormal, intersectionPoint) {
    mousePlane.setFromNormalAndCoplanarPoint(zPlaneNormal, new THREE.Vector3(0, 0, zValue));
    raycaster.setFromCamera(new THREE.Vector2(ndcX, ndcY), camera);

    const hasIntersection = raycaster.ray.intersectPlane(mousePlane, intersectionPoint);
    if (!hasIntersection) {
        return new THREE.Vector3(0, 0, zValue);
    }

    return intersectionPoint.clone();
}

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
    const terrain = oldChunkGroup.children[0];

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

    // Recalcula a posição de cada filho restante do chunk (água + árvores)
    for (let i = 1; i < oldChunkGroup.children.length; i++) {

        const child = oldChunkGroup.children[i];

        // NOVO (T3 - Ambiente): a água é um Mesh comum (não InstancedMesh)
        // que cobre o chunk inteiro numa altura fixa (WATER_LEVEL) — só
        // precisa acompanhar a nova posição em Z, sem recalcular vértices.
        if (child.userData && child.userData.isWater) {
            child.position.z = chunkCenterZ;
            continue;
        }

        // resto do código original: InstancedMesh de árvores
        const instancedMesh = child;
        const { xs, zLocals, scales, yOffsetFactor } = instancedMesh.userData;

        for (let j = 0; j < xs.length; j++) {

            const worldZ = zLocals[j] + chunkCenterZ;
            const groundHeight = getTerrainHeight(xs[j], worldZ);

            // NOVO: se a nova posição do chunk colocou essa árvore em
            // cima de água, "esconde" a instância zerando sua escala,
            // em vez de deixá-la boiando/afundada na água
            const isUnderwater = groundHeight < WATER_LEVEL + 0.5;

            if (isUnderwater) {
                _posVec.set(xs[j], groundHeight, worldZ);
                _scaleVec.set(0, 0, 0);
            } else {
                const groundY = groundHeight + 1.5 + yOffsetFactor * scales[j];
                _posVec.set(xs[j], groundY, worldZ);
                _scaleVec.set(scales[j], scales[j], scales[j]);
            }

            _matrix.compose(_posVec, _quat, _scaleVec);
            instancedMesh.setMatrixAt(j, _matrix);
        }

        instancedMesh.instanceMatrix.needsUpdate = true;
        instancedMesh.computeBoundingSphere();
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

    for (let i = minChunk; i <= maxChunk; i++) {

        if (!chunks.has(i)) {

            createChunk(i);
        }

        if (i <= currentChunk + 2) {
            spawnEnemiesForChunk(i, planeDepth, aviao);
        }
    }

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