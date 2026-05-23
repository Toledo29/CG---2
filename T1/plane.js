import * as THREE from 'three';
import { generateTreesForChunk } from './trees.js';
import { createGroundPlaneWired } from '../libs/util/util.js';

// Factory that returns a createChunk function bound to provided dependencies
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
        chunks
    } = deps;

    return function createChunk(chunkIndex) {
        const chunkGroup = new THREE.Group();
        const chunkCenterZ = chunkIndex * planeDepth;

        const chunkPlane = createGroundPlaneWired(planeWidth, planeDepth);
        chunkPlane.position.set(0, 0, chunkCenterZ);
        chunkGroup.add(chunkPlane);

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
                treePositions.push(new THREE.Vector3(x, 0, zLocal));
            }
            attempts++;
        }

        // after positions are generated, create tree meshes and add to chunk
        generateTreesForChunk(treePositions, chunkGroup, chunkCenterZ);

        scene.add(chunkGroup);
        chunks.set(chunkIndex, chunkGroup);
    };
}

export { makeCreateChunk };