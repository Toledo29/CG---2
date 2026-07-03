import * as THREE from 'three';
import { onWindowResize } from "../libs/util/util.js";
import { getWorldPointAtZPlane, getScreenBoundsAtZPlane } from './planeUpdate.js';
import { setBulletSpeed, setPlayerShootInterval, setPlayerAimPoint } from './bullets.js';
import { setEnemySpeedMultiplier, setEnemySpawnPairs } from './enemies.js';

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

  const targetCanvas = document.createElement('canvas');
  targetCanvas.width = 128;
  targetCanvas.height = 128;
  const targetContext = targetCanvas.getContext('2d');
  targetContext.clearRect(0, 0, targetCanvas.width, targetCanvas.height);
  targetContext.strokeStyle = '#ffb000';
  targetContext.lineWidth = 8;
  targetContext.beginPath();
  targetContext.arc(64, 64, 34, 0, Math.PI * 2);
  targetContext.stroke();
  targetContext.beginPath();
  targetContext.moveTo(64, 18);
  targetContext.lineTo(64, 42);
  targetContext.moveTo(64, 86);
  targetContext.lineTo(64, 110);
  targetContext.moveTo(18, 64);
  targetContext.lineTo(42, 64);
  targetContext.moveTo(86, 64);
  targetContext.lineTo(110, 64);
  targetContext.stroke();

  const targetTexture = new THREE.CanvasTexture(targetCanvas);
  const targetMaterial = new THREE.SpriteMaterial({
    map: targetTexture,
    transparent: true,
    depthTest: false,
    depthWrite: false,
    color: 0xffffff
  });
  const targetMarker = new THREE.Sprite(targetMaterial);
  targetMarker.scale.set(1, 1, 1);
  targetMarker.renderOrder = 999;
  scene.add(targetMarker);

  window.addEventListener('mousemove', function (event) {
    mouseNDC.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouseNDC.y = -((event.clientY / window.innerHeight) * 2 - 1);
  });

  window.addEventListener('resize', function () { onWindowResize(camera, renderer) }, false);

  window.addEventListener('keydown', (event) => {

     // velocidade lenta
    if (event.key === '1') {
      currentSpeed = 0.08;
      speedMultiplier = 0.6;
      setEnemySpeedMultiplier(0.6);
      setEnemySpawnPairs(1);   // <- 1 par (2 inimigos) por chunk
      setBulletSpeed(120);
      setPlayerShootInterval(0.18);
    }

    // velocidade normal
    if (event.key === '2') {
      currentSpeed = 0.45;
      speedMultiplier = 1;
      setEnemySpeedMultiplier(1);
      setEnemySpawnPairs(1);   // <- 1 par (2 inimigos) por chunk
      setBulletSpeed(180);
      setPlayerShootInterval(0.12);
    }

    // velocidade rápida
    if (event.key === '3') {
      currentSpeed = 1.4;
      speedMultiplier = 1.8;
      setEnemySpeedMultiplier(5);
      setEnemySpawnPairs(2);   // <- 2 pares (4 inimigos) por chunk
      setBulletSpeed(320);
      setPlayerShootInterval(0.08);
    }
  });

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
    forwardSpeed: 1,
    screenMargin: 4.0
  }, opts);

  let currentSpeed = settings.forwardSpeed;

  // multiplicador geral de velocidade
  let speedMultiplier = 1;

  function update(delta) {
    const maxRollZ = THREE.MathUtils.degToRad(settings.maxRollDeg);

    // CORRIGIDO: antes o avanço em Z era por FRAME (não por tempo real),
    // então em máquinas com FPS alto o avião "teleportava" vários chunks
    // de uma vez no modo 3, fazendo chunks/inimigos nascerem já atrás da
    // câmera (nunca chegavam a ser vistos). Agora o avanço é escalado por
    // delta (multiplicado por 60 para manter a mesma sensação de
    // velocidade que já existia a ~60fps).
    aviao.position.z += currentSpeed * speedMultiplier * 60 * delta;

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

    targetMarker.position.set(targetX, targetY, aviao.position.z - 1);

    // NOVO: informa ao módulo de tiros para onde o player está mirando,
    // para que os tiros saiam na direção do target (ver bullets.js).
    setPlayerAimPoint(targetX, targetY);

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

  return { camera, cameraTarget, targetMarker, update, mouseNDC };
}