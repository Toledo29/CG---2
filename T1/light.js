import * as THREE from 'three';

function updateDirectionalShadow(directionalLight, fogDistance) {
    // CORRIGIDO: antes o volume da sombra chegava a 600+ unidades (fogDistance * 1.1,
    // mínimo 600), espalhando o mapa de sombra de 1024px sobre uma área enorme —
    // resultado: sombras com resolução muito baixa (serrilhadas/blocudas).
    // Agora o volume ainda cresce com o fog (como pede o enunciado), mas com
    // limites bem menores, aumentando bastante a densidade de texels por
    // unidade de mundo sem custo extra de GPU (mapSize continua o mesmo).
    const shadowSide = THREE.MathUtils.clamp(fogDistance, 120, 350);
    const shadowMapSize = 1024;

    directionalLight.shadow.mapSize.width = shadowMapSize;
    directionalLight.shadow.mapSize.height = shadowMapSize;
    directionalLight.shadow.camera.left = -shadowSide / 2;
    directionalLight.shadow.camera.right = shadowSide / 2;
    directionalLight.shadow.camera.top = shadowSide / 2;
    directionalLight.shadow.camera.bottom = -shadowSide / 2;
    directionalLight.shadow.camera.near = 1;
    directionalLight.shadow.camera.far = Math.max(fogDistance * 2, 500);
    // reduce acne/shimmer and soften shadows (efetivo com PCFSoftShadowMap)
    directionalLight.shadow.bias = -0.0006;
    directionalLight.shadow.radius = 2;

    // keep the light elevated, but not too vertical, so the shadow remains visible
    directionalLight.position.set(shadowSide * 0.45, shadowSide * 0.9, shadowSide * 0.4);

    directionalLight.shadow.camera.updateProjectionMatrix();
    directionalLight.shadow.needsUpdate = true;

    // expose shadowSide so callers can position the target relative to objects
    return shadowSide;
}

function createLights(scene, fogDistance = 500) {
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.castShadow = true;
    scene.add(directionalLight);

    const shadowSide = updateDirectionalShadow(directionalLight, fogDistance);

    // create a target on the opposite side of the plane and add to scene
    const target = new THREE.Object3D();
    target.position.set(shadowSide, 0, 0);
    scene.add(target);
    directionalLight.target = target;
    directionalLight.userData.shadowSide = shadowSide;

    return directionalLight;
}

export { createLights, updateDirectionalShadow };