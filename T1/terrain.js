import * as THREE from 'three';
import { SimplexNoise } from './simplex.js';

const noise = new SimplexNoise();

// NOVO: nível de referência da água. Tudo com altura abaixo disso vai virar
// candidato a receber água quando implementarmos o shader (próxima etapa).
export const WATER_LEVEL = -2;

function getTerrainHeight(x, z) {

    // CORRIGIDO: ruído de larga escala que define REGIÕES do mapa —
    // algumas ficam baixas/planas (futuras áreas de água), outras viram
    // cadeias de montanha. Sem isso, o terreno tinha relevo "uniforme"
    // demais, sem áreas claramente baixas o suficiente pra água.
    const region = noise.noise2D(x * 0.0015, z * 0.0015); // varia de -1 a 1

    // fator 0..1: perto de 0 em regiões baixas (vira planície/vale),
    // perto de 1 em regiões altas (vira montanha)
    const mountainFactor = THREE.MathUtils.clamp((region + 0.3) * 1.1, 0, 1);

    // ruído principal das montanhas
    let mountains = noise.noise2D(x * 0.004, z * 0.004);

    // CORRIGIDO: eleva o ruído a uma potência preservando o sinal — isso
    // deixa os picos mais acentuados e os vales mais suaves/achatados,
    // em vez de um relevo ondulado genérico.
    mountains = Math.sign(mountains) * Math.pow(Math.abs(mountains), 1.6);

    // altura das montanhas (0 nas regiões baixas, até ~24 nas regiões altas)
    const large = mountains * 24 * mountainFactor;

    const medium = noise.noise2D(x * 0.015, z * 0.015) * 2.5;
    const small = noise.noise2D(x * 0.05, z * 0.05) * 0.5;

    // CORRIGIDO: desloca a base do terreno pra baixo. Isso garante que as
    // regiões de baixo mountainFactor (planícies) fiquem efetivamente
    // ABAIXO de WATER_LEVEL, criando bacias/vales reais para a água,
    // em vez de ficarem sempre próximas de 0.
    const base = -6;

    return base + large + medium + small;
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