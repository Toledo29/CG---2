import * as THREE from 'three';
import { WATER_LEVEL } from './terrain.js';

// ---------------------------------------------------------------------
// NOVO (T3 - Ambiente): água nas regiões baixas do terreno, via shader.
// ---------------------------------------------------------------------
// Estratégia: um plano do tamanho do chunk é posicionado numa altura fixa
// (WATER_LEVEL). Como o terreno tem picos que ficam BEM acima dessa
// altura, o depth test do WebGL já resolve tudo sozinho: onde o terreno
// está mais alto que a água, ele fica na frente da câmera e esconde a
// água; onde o terreno é mais baixo que WATER_LEVEL (vales/planícies),
// a água aparece por cima, formando lagos/mares de forma automática.

const waterUniforms = {
    uTime: { value: 0 },
    uWaterColor: { value: new THREE.Color(0x2e86ab) },
    uWaterColorDeep: { value: new THREE.Color(0x0c2d47) },
    fogColor: { value: new THREE.Color(0x87ceeb) },
    fogNear: { value: 100 },
    fogFar: { value: 500 }
};

const waterVertexShader = `
    uniform float uTime;

    varying vec2 vUv;
    varying float vWave;
    varying vec3 vWorldPosition;

    void main() {
        vUv = uv;

        vec3 pos = position;

        // ondas simples somando dois senos em direções/frequências
        // diferentes (evita um padrão repetitivo óbvio)
        float wave =
            sin(pos.x * 0.15 + uTime * 1.2) * 0.15 +
            sin(pos.z * 0.25 + uTime * 0.8) * 0.10;

        pos.y += wave;
        vWave = wave;

        vec4 worldPosition = modelMatrix * vec4(pos, 1.0);
        vWorldPosition = worldPosition.xyz;

        gl_Position = projectionMatrix * viewMatrix * worldPosition;
    }
`;

const waterFragmentShader = `
    uniform vec3 uWaterColor;
    uniform vec3 uWaterColorDeep;
    uniform vec3 fogColor;
    uniform float fogNear;
    uniform float fogFar;

    varying vec2 vUv;
    varying float vWave;
    varying vec3 vWorldPosition;

    void main() {
        // cor mais clara nas cristas da onda, mais escura nos vales
        float waveFactor = smoothstep(-0.15, 0.15, vWave);
        vec3 color = mix(uWaterColorDeep, uWaterColor, waveFactor);

        // "espuma" simples nas cristas mais altas
        float foam = smoothstep(0.12, 0.16, vWave);
        color = mix(color, vec3(1.0), foam * 0.5);

        // integra com o fog da cena manualmente (ShaderMaterial não
        // herda o THREE.Fog automaticamente)
        float depthFromCamera = length(cameraPosition - vWorldPosition);
        float fogFactor = smoothstep(fogNear, fogFar, depthFromCamera);
        color = mix(color, fogColor, fogFactor);

        gl_FragColor = vec4(color, 0.85);
    }
`;

// material único, compartilhado por TODOS os planos de água (assim
// todos os chunks animam as ondas em sincronia com um só update de tempo)
const waterMaterial = new THREE.ShaderMaterial({
    uniforms: waterUniforms,
    vertexShader: waterVertexShader,
    fragmentShader: waterFragmentShader,
    transparent: true
});

function createWater(width, depth, chunkCenterZ) {

    const geometry = new THREE.PlaneGeometry(width, depth, 40, 40);
    geometry.rotateX(-Math.PI / 2);

    const water = new THREE.Mesh(geometry, waterMaterial);
    water.position.set(0, WATER_LEVEL, chunkCenterZ);

    // flag usada pelo planeUpdate.js para tratar esse mesh de forma
    // diferente das InstancedMesh de árvores durante a reciclagem de chunk
    water.userData.isWater = true;

    return water;
}

function updateWaterTime(delta) {
    waterUniforms.uTime.value += delta;
}

// mantém a água com a mesma cor/distância de fog configurada na cena
// (chame de novo sempre que o fog mudar, ex: no slider de fogDistance)
function syncWaterFog(scene) {
    if (scene.fog) {
        waterUniforms.fogColor.value.copy(scene.fog.color);
        waterUniforms.fogNear.value = scene.fog.near;
        waterUniforms.fogFar.value = scene.fog.far;
    }
}

export { createWater, updateWaterTime, syncWaterFog };