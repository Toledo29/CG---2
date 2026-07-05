import * as THREE from 'three';
import { SimplexNoise } from './simplex.js';
import { loadingManager } from './loadingManager.js';

const noise = new SimplexNoise();

export const WATER_LEVEL = -10;

function getTerrainHeight(x, z) {

    const region = noise.noise2D(x * 0.0015, z * 0.0015); 

    const mountainFactor = THREE.MathUtils.clamp((region + 0.3) * 1.1, 0, 1);

    let mountains = noise.noise2D(x * 0.004, z * 0.004);

    mountains = Math.sign(mountains) * Math.pow(Math.abs(mountains), 1.6);

    const large = mountains * 24 * mountainFactor;

    const medium = noise.noise2D(x * 0.015, z * 0.015) * 2.5;
    const small = noise.noise2D(x * 0.05, z * 0.05) * 0.5;

    const base = -6;

    return base + large + medium + small;
}


const textureLoader = new THREE.TextureLoader(loadingManager);

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