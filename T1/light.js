
import * as THREE from 'three';

function updateDirectionalShadow(directionalLight, fogDistance) {
    // ensure shadow frustum covers terrain area — keep a sensible minimum
    const shadowSide = Math.max(fogDistance * 1.1, 600);
    const shadowMapSize = fogDistance > 300 ? 2048 : 1024;

    directionalLight.shadow.mapSize.width = shadowMapSize;
    directionalLight.shadow.mapSize.height = shadowMapSize;
    directionalLight.shadow.camera.left = -shadowSide / 2;
    directionalLight.shadow.camera.right = shadowSide / 2;
    directionalLight.shadow.camera.top = shadowSide / 2;
    directionalLight.shadow.camera.bottom = -shadowSide / 2;
    directionalLight.shadow.camera.near = 1;
    directionalLight.shadow.camera.far = Math.max(fogDistance * 2, 1200);

    // keep the light elevated, but not too vertical, so the shadow remains visible
    directionalLight.position.set(shadowSide * 0.45, shadowSide * 0.9, shadowSide * 0.2);

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