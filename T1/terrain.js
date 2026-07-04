import * as THREE from 'three';
import { SimplexNoise } from './simplex.js';
import { loadingManager } from './loadingManager.js';

const noise = new SimplexNoise();

// Nível de referência da água (usado também pelo water.js e pelo shader
// do terreno para decidir onde entra areia)
export const WATER_LEVEL = -10;

function getTerrainHeight(x, z) {

    // ruído de larga escala que define REGIÕES do mapa — algumas ficam
    // baixas/planas (áreas de água), outras viram cadeias de montanha
    const region = noise.noise2D(x * 0.0015, z * 0.0015); // varia de -1 a 1

    // fator 0..1: perto de 0 em regiões baixas (vira planície/vale),
    // perto de 1 em regiões altas (vira montanha)
    const mountainFactor = THREE.MathUtils.clamp((region + 0.3) * 1.1, 0, 1);

    // ruído principal das montanhas
    let mountains = noise.noise2D(x * 0.004, z * 0.004);

    // eleva o ruído a uma potência preservando o sinal — picos mais
    // acentuados e vales mais suaves/achatados
    mountains = Math.sign(mountains) * Math.pow(Math.abs(mountains), 1.6);

    // altura das montanhas (0 nas regiões baixas, até ~24 nas regiões altas)
    const large = mountains * 24 * mountainFactor;

    const medium = noise.noise2D(x * 0.015, z * 0.015) * 2.5;
    const small = noise.noise2D(x * 0.05, z * 0.05) * 0.5;

    // desloca a base do terreno pra baixo, garantindo que as regiões de
    // baixo mountainFactor (planícies) fiquem abaixo de WATER_LEVEL,
    // criando bacias/vales reais para a água
    const base = -6;

    return base + large + medium + small;
}

// ---------------------------------------------------------------------
// NOVO (T3 - Ambiente): material do terreno com blending de texturas
// ---------------------------------------------------------------------
// Em vez de aplicar UMA textura só, usamos um MeshStandardMaterial e
// injetamos, via onBeforeCompile, a lógica de mistura de 4 texturas
// (areia / grama / rocha / neve) direto no shader que o próprio Three.js
// gera. Isso é ótimo porque a gente ganha de graça tudo que o
// MeshStandardMaterial já resolve (luz, sombra recebida, fog) e só
// modifica o trecho que decide a cor final de cada pixel do terreno,
// misturando as texturas com base na ALTURA (y) e na INCLINAÇÃO (normal)
// de cada ponto da superfície.

const textureLoader = new THREE.TextureLoader(loadingManager);

// IMPORTANTE: baixe 4 texturas seamless/tileable gratuitas (CC0) em
// ambientcg.com ou polyhaven.com (busque por "Grass", "Rock"/"Cliff",
// "Sand"/"Beach", "Snow") e salve dentro de T3/assets/textures/ com
// esses nomes (ou ajuste os caminhos abaixo).
function loadTerrainTexture(path, repeat) {
    const texture = textureLoader.load(path);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(repeat, repeat);
    texture.colorSpace = THREE.SRGBColorSpace;
    return texture;
}

const grassTexture = loadTerrainTexture('./assets/grass.jpg', 40);
const rockTexture = loadTerrainTexture('./assets/rock.jpg', 30);
const sandTexture = loadTerrainTexture('./assets/sand.jpg', 40);
const snowTexture = loadTerrainTexture('./assets/snow.jpg', 40);

function createTerrainMaterial() {

    const material = new THREE.MeshStandardMaterial({
        roughness: 1,
        metalness: 0
    });

    material.onBeforeCompile = (shader) => {

        shader.uniforms.grassTexture = { value: grassTexture };
        shader.uniforms.rockTexture = { value: rockTexture };
        shader.uniforms.sandTexture = { value: sandTexture };
        shader.uniforms.snowTexture = { value: snowTexture };
        shader.uniforms.uWaterLevel = { value: WATER_LEVEL };

        // --- vertex shader: exporta posição local (altura) e normal ---
        shader.vertexShader = shader.vertexShader.replace(
            '#include <common>',
            `
            varying vec3 vTerrainPosition;
            varying vec3 vTerrainNormal;
            #include <common>
            `
        );

        shader.vertexShader = shader.vertexShader.replace(
            '#include <begin_vertex>',
            `
            #include <begin_vertex>
            vTerrainPosition = transformed;
            vTerrainNormal = normal;
            `
        );

        // --- fragment shader: mistura as 4 texturas ---
        shader.fragmentShader = shader.fragmentShader.replace(
            '#include <common>',
            `
            varying vec3 vTerrainPosition;
            varying vec3 vTerrainNormal;

            uniform sampler2D grassTexture;
            uniform sampler2D rockTexture;
            uniform sampler2D sandTexture;
            uniform sampler2D snowTexture;
            uniform float uWaterLevel;

            #include <common>
            `
        );

        shader.fragmentShader = shader.fragmentShader.replace(
            '#include <color_fragment>',
            `
            #include <color_fragment>

            // repete a textura direto no espaço do mundo (x, z) — assim
            // ela não estica/deforma conforme o número de segmentos do plano
            vec2 blendUv = vTerrainPosition.xz * 0.06;

            vec3 sandColor = texture2D(sandTexture, blendUv).rgb;
            vec3 grassColor = texture2D(grassTexture, blendUv).rgb;
            vec3 rockColor = texture2D(rockTexture, blendUv).rgb;
            vec3 snowColor = texture2D(snowTexture, blendUv).rgb;

            // inclinação: 0 = plano (chão), 1 = parede quase vertical
            float slope = 1.0 - clamp(vTerrainNormal.y, 0.0, 1.0);

            // fatores de mistura com transições suaves (smoothstep)
            float sandFactor = 1.0 - smoothstep(uWaterLevel, uWaterLevel + 2.5, vTerrainPosition.y);
            float snowFactor = smoothstep(13.0, 19.0, vTerrainPosition.y);
            float rockFactor = smoothstep(0.3, 0.6, slope);

            vec3 terrainColor = mix(grassColor, sandColor, sandFactor);
            terrainColor = mix(terrainColor, rockColor, rockFactor);
            terrainColor = mix(terrainColor, snowColor, snowFactor);

            diffuseColor.rgb = terrainColor;
            `
        );
    };

    return material;
}

// material único, compartilhado por TODOS os chunks de terreno (evita
// recompilar/duplicar o shader a cada chunk criado)
const terrainMaterial = createTerrainMaterial();

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

    const terrain = new THREE.Mesh(
        geometry,
        terrainMaterial
    );

    terrain.receiveShadow = true;

    return terrain;
}

export {
    createTerrain,
    getTerrainHeight
};