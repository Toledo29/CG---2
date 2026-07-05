import * as THREE from 'three';
import { loadingManager } from './loadingManager.js';

function createBackgroundSound(camera) {
    const listener = new THREE.AudioListener();
    camera.add(listener);

    const sound = new THREE.Audio(listener);

    const audioLoader = new THREE.AudioLoader(loadingManager);
    audioLoader.load('./assets/sound/soundtrack.mp3', function (buffer) {
        sound.setBuffer(buffer);
        sound.setLoop(true);
        sound.setVolume(0.1);
    });
    return sound;
}

function createBulletSound(camera) {
    const listener = new THREE.AudioListener();
    camera.add(listener);

    const sound = new THREE.Audio(listener);

    const audioLoader = new THREE.AudioLoader(loadingManager);
    audioLoader.load('./assets/sound/bullet.mp3', function (buffer) {
        sound.setBuffer(buffer);
        sound.setLoop(false);
        sound.setVolume(0.01);
    });
    return sound;
}

function createHealSound(camera) {
    const listener = new THREE.AudioListener();
    camera.add(listener);

    const sound = new THREE.Audio(listener);

    const audioLoader = new THREE.AudioLoader(loadingManager);
    audioLoader.load('./assets/sound/heal.mp3', function (buffer) {
        sound.setBuffer(buffer);
        sound.setLoop(false);
        sound.setVolume(0.01);
    });
    return sound;
}

function createPlayerSound(camera) {
    const listener = new THREE.AudioListener();
    camera.add(listener);

    const sound = new THREE.Audio(listener);

    const audioLoader = new THREE.AudioLoader(loadingManager);
    audioLoader.load('./assets/sound/player.mp3', function (buffer) {
        sound.setBuffer(buffer);
        sound.setLoop(false);
        sound.setVolume(0.08);
    });
    return sound;
}

function createEnemySound(camera) {
    const listener = new THREE.AudioListener();
    camera.add(listener);

    const sound = new THREE.Audio(listener);

    const audioLoader = new THREE.AudioLoader(loadingManager);
    audioLoader.load('./assets/sound/enemy.mp3', function (buffer) {
        sound.setBuffer(buffer);
        sound.setLoop(false);
        sound.setVolume(0.03);
    });
    return sound;
}


export { createBackgroundSound, createBulletSound, createHealSound, createPlayerSound, createEnemySound };