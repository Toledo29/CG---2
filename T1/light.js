import * as THREE from 'three';

function updateDirectionalShadow(directionalLight, fogDistance) {

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
    directionalLight.shadow.bias = -0.0006;
    directionalLight.shadow.radius = 2;

    directionalLight.position.set(shadowSide * 0.45, shadowSide * 0.9, shadowSide * 0.4);

    directionalLight.shadow.camera.updateProjectionMatrix();
    directionalLight.shadow.needsUpdate = true;

    return shadowSide;
}

function createLights(scene, fogDistance = 500) {
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.castShadow = true;
    scene.add(directionalLight);

    const shadowSide = updateDirectionalShadow(directionalLight, fogDistance);

    const target = new THREE.Object3D();
    target.position.set(shadowSide, 0, 0);
    scene.add(target);
    directionalLight.target = target;
    directionalLight.userData.shadowSide = shadowSide;

    return directionalLight;
}

export { createLights, updateDirectionalShadow };