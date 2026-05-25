import * as THREE from 'three';
import { setDefaultMaterial } from '../libs/util/util.js';

// cria os materiais padrões para os objetos
const material1 = setDefaultMaterial('rgb(139, 69, 19)');
const material2 = setDefaultMaterial('green');
const material3 = setDefaultMaterial('darkgreen');

// Cria geometria dos componentes da árvore
const logGeometry1 = new THREE.CylinderGeometry(0.3, 0.3, 4, 5);
const logGeometry2 = new THREE.CylinderGeometry(0.3, 0.3, 3, 5);
const sphereLeafGeometry1 = new THREE.SphereGeometry(1.3, 4, 5);
const coneLeafGeometry1 = new THREE.ConeGeometry(2, 2, 5);
const coneLeafGeometry2 = new THREE.ConeGeometry(1.5, 2, 5);
const coneLeafGeometry3 = new THREE.ConeGeometry(1, 2, 5);

function generateTreesForChunk(treePositions, chunkGroup, chunkCenterZ) {
    for (const pos of treePositions) {
        let tree;
        if (Math.random() < 0.5) {
            tree = new THREE.Mesh(logGeometry1, material1);
            const sphereleaf = new THREE.Mesh(sphereLeafGeometry1, material2);
            tree.add(sphereleaf);
            sphereleaf.position.set(0, 2, 0);
            // enable shadows for leaf
            sphereleaf.castShadow = true;
            sphereleaf.receiveShadow = true;
        } else {
            tree = new THREE.Mesh(logGeometry2, material1);
            const coneleaf1 = new THREE.Mesh(coneLeafGeometry1, material3);
            const coneleaf2 = new THREE.Mesh(coneLeafGeometry2, material3);
            const coneleaf3 = new THREE.Mesh(coneLeafGeometry3, material3);
            tree.add(coneleaf1);
            tree.add(coneleaf2);
            tree.add(coneleaf3);
            coneleaf1.position.set(0, 0, 0);
            coneleaf2.position.set(0, 1, 0);
            coneleaf3.position.set(0, 2, 0);
            // enable shadows for leaves
            coneleaf1.castShadow = true;
            coneleaf1.receiveShadow = true;
            coneleaf2.castShadow = true;
            coneleaf2.receiveShadow = true;
            coneleaf3.castShadow = true;
            coneleaf3.receiveShadow = true;
        }
        if (Math.random() < 0.5) {
            tree.scale.set(0.8, 0.8, 0.8);
        }
        tree.position.set(pos.x, 1.5, chunkCenterZ + pos.z);
        if (Math.random() < 0.5) {
            tree.scale.set(0.75, 0.75, 0.75);
        }
        // enable shadows for trunk and allow trunk to receive shadows
        tree.castShadow = true;
        tree.receiveShadow = true;
        chunkGroup.add(tree);
    }
}

export { generateTreesForChunk };