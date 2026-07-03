import * as THREE from 'three';
import { SimplexNoise } from './simplex.js';

const noise = new SimplexNoise();

function getTerrainHeight(x, z) {

    const large =
        noise.noise2D(
            x * 0.003,
            z * 0.003
        ) * 8;

    const medium =
        noise.noise2D(
            x * 0.015,
            z * 0.015
        ) * 2.5;

    const small =
        noise.noise2D(
            x * 0.05,
            z * 0.05
        ) * 0.5;

    return large + medium + small;
}

function createTerrain(
    width,
    depth,
    widthSegments,
    depthSegments,
    chunkCenterZ
) {

    const geometry = new THREE.PlaneGeometry(
        width,
        depth,
        widthSegments,
        depthSegments
    );

    geometry.rotateX(-Math.PI / 2);

    const vertices = geometry.attributes.position;

    for (let i = 0; i < vertices.count; i++) {

        const x = vertices.getX(i);
        const z = vertices.getZ(i) + chunkCenterZ;

        const y = getTerrainHeight(x, z);

        vertices.setY(i, y);
    }

    vertices.needsUpdate = true;

    // CORRIGIDO: normais nunca eram recalculadas após deslocar a altura dos
    // vértices, então o terreno recebia luz como se fosse totalmente plano,
    // deixando encostas/relevo com sombreamento incorreto.
    geometry.computeVertexNormals();

    const material = new THREE.MeshLambertMaterial({
        color: 0x4f7942
    });

    const terrain = new THREE.Mesh(
        geometry,
        material
    );

    terrain.receiveShadow = true;

    return terrain;
}

export {
    createTerrain,
    getTerrainHeight
};