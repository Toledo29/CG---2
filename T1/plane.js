import * as THREE from 'three';
import { generateTreesForChunk } from './trees.js';
import { createTerrain, getTerrainHeight, WATER_LEVEL } from './terrain.js';
import { createWater } from './water.js';

    function makeCreateChunk(deps) {
        const {
            planeWidth,
            planeDepth,
            halfPlaneWidth,
            halfPlaneDepth,
            treeCountPerChunk,
            maxPlacementAttempts,
            margin,
            minDistance,
            scene,
            chunks,
            player
        } = deps;

    return function createChunk(chunkIndex) {
        const chunkGroup = new THREE.Group();
        const chunkCenterZ = chunkIndex * planeDepth;

        const terrain = createTerrain(
            planeWidth,
            planeDepth,
            120,
            120,
            chunkCenterZ
        );

        terrain.position.z = chunkCenterZ;

        chunkGroup.add(terrain);

        const water = createWater(planeWidth, planeDepth, chunkCenterZ);
        chunkGroup.add(water);

        const treePositions = [];
        let attempts = 0;

        while (treePositions.length < treeCountPerChunk && attempts < maxPlacementAttempts) {
            let x = THREE.MathUtils.randFloat(-halfPlaneWidth + margin, halfPlaneWidth - margin);
            let zLocal = THREE.MathUtils.randFloat(-halfPlaneDepth + margin, halfPlaneDepth - margin);

            let tooClose = false;
            for (const pos of treePositions) {
                if (pos.distanceToSquared(new THREE.Vector3(x, 0, zLocal)) < minDistance * minDistance) {
                    tooClose = true;
                    break;
                }
            }

            if (!tooClose) {
                const worldZ = chunkCenterZ + zLocal;

                const y = getTerrainHeight(x, worldZ);

                if (y > WATER_LEVEL + 0.5) {
                    treePositions.push(
                        new THREE.Vector3(x, y, zLocal)
                    );
                }
            }
            attempts++;
        }

        generateTreesForChunk(treePositions, chunkGroup, chunkCenterZ);

        scene.add(chunkGroup);
        chunks.set(chunkIndex, chunkGroup);
    };
}

export { makeCreateChunk };