import * as THREE from 'three';
import { onWindowResize } from "../libs/util/util.js";
import { getWorldPointAtZPlane, getScreenBoundsAtZPlane } from './planeUpdate.js';

function lerpAtConstantSpeed(current, target, maxStep) {
  const distance = target - current;
  const absDistance = Math.abs(distance);

  if (absDistance === 0) {
    return current;
  }

  const alpha = Math.min(1, maxStep / absDistance);
  return THREE.MathUtils.lerp(current, target, alpha);
}

export function createCameraController(scene, renderer, aviao, opts = {}) {
  const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
  camera.position.set(0.0, 11, -90.0);
  camera.up.set(0.0, 1.0, 0.0);
  camera.lookAt(0.0, 11, 0.0);

  // alvo invisivel para camera (x/y fixos e z seguindo o aviao)
  const cameraTarget = new THREE.Object3D();
  cameraTarget.position.set(0, 11.5, aviao.position.z);
  scene.add(cameraTarget);

  // mouse mapping helpers
  const mouseNDC = new THREE.Vector2(0, 0);
  const raycaster = new THREE.Raycaster();
  const zPlaneNormal = new THREE.Vector3(0, 0, 1);
  const mousePlane = new THREE.Plane();
  const intersectionPoint = new THREE.Vector3();

  window.addEventListener('mousemove', function (event) {
    mouseNDC.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouseNDC.y = -((event.clientY / window.innerHeight) * 2 - 1);
  });

  window.addEventListener('resize', function () { onWindowResize(camera, renderer) }, false);

  const settings = Object.assign({
    maxRollDeg: 45,
    maxPitchDeg: 20,
    pitchResponse: 4,
    lateralResponse: 8.0,
    lateralSpeed: 35,
    verticalSpeed: 18,
    cameraXOffset: 0.6,
    cameraYOffset: 0.8,
    cameraFollowZOffset: -20,
    forwardSpeed: 0.4,
    screenMargin: 4.0
  }, opts);

  function update(delta) {
    const maxRollZ = THREE.MathUtils.degToRad(settings.maxRollDeg);

    // aviao forward
    aviao.position.z += settings.forwardSpeed;

    // camera target follows aviao
    cameraTarget.position.z = aviao.position.z;
    cameraTarget.position.x = aviao.position.x - (aviao.position.x * settings.cameraXOffset);

    camera.position.z = cameraTarget.position.z + settings.cameraFollowZOffset;
    camera.position.x = cameraTarget.position.x;
    camera.lookAt(cameraTarget.position.x, cameraTarget.position.y, cameraTarget.position.z);
    camera.updateMatrixWorld();

    const mouseWorld = getWorldPointAtZPlane(mouseNDC.x, mouseNDC.y, aviao.position.z, camera, mousePlane, raycaster, zPlaneNormal, intersectionPoint);
    const bounds = getScreenBoundsAtZPlane(aviao.position.z, camera, mousePlane, raycaster, zPlaneNormal, intersectionPoint);

    const targetX = THREE.MathUtils.clamp(mouseWorld.x, bounds.minX + settings.screenMargin, bounds.maxX - settings.screenMargin);
    const targetY = THREE.MathUtils.clamp(mouseWorld.y, bounds.minY + settings.screenMargin, bounds.maxY - settings.screenMargin);

    aviao.position.x = lerpAtConstantSpeed(aviao.position.x, targetX, settings.lateralSpeed * delta);
    aviao.position.y = lerpAtConstantSpeed(aviao.position.y, targetY, settings.verticalSpeed * delta);

    // inclina ate 45 graus com movimento lateral e estabiliza ao cessar movimento
    const lateralDelta = targetX - aviao.position.x;
    const desiredRollZ = THREE.MathUtils.clamp(
      -(lateralDelta / settings.lateralResponse) * maxRollZ,
      -maxRollZ,
      maxRollZ
    );
    aviao.rotation.z = THREE.MathUtils.lerp(aviao.rotation.z, desiredRollZ, 0.12);

    // pitch (rotation X) based on vertical movement: nose up when ascending
    const maxPitchX = THREE.MathUtils.degToRad(settings.maxPitchDeg);
    const verticalDelta = targetY - aviao.position.y;
    const desiredPitchX = THREE.MathUtils.clamp(
      -(verticalDelta / Math.max(0.0001, settings.pitchResponse)) * maxPitchX,
      -maxPitchX,
      maxPitchX
    );
    aviao.rotation.x = THREE.MathUtils.lerp(aviao.rotation.x, desiredPitchX, 0.35);
  }

  return { camera, cameraTarget, update, mouseNDC };
}
