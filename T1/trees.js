import * as THREE from 'three';
import { setDefaultMaterial } from '../libs/util/util.js';

// cria os materiais padrões para os objetos
const material1 = setDefaultMaterial('rgb(139, 69, 19)'); // tronco
const material2 = setDefaultMaterial('green');             // folha esférica
const material3 = setDefaultMaterial('darkgreen');         // folhas cônicas

// Cria geometria dos componentes da árvore
const logGeometry1 = new THREE.CylinderGeometry(0.3, 0.3, 4, 5);
const logGeometry2 = new THREE.CylinderGeometry(0.3, 0.3, 3, 5);
const sphereLeafGeometry1 = new THREE.SphereGeometry(1.3, 4, 5);
const coneLeafGeometry1 = new THREE.ConeGeometry(2, 2, 5);
const coneLeafGeometry2 = new THREE.ConeGeometry(1.5, 2, 5);
const coneLeafGeometry3 = new THREE.ConeGeometry(1, 2, 5);


const _matrix = new THREE.Matrix4();
const _quat = new THREE.Quaternion(); 
const _scaleVec = new THREE.Vector3();
const _posVec = new THREE.Vector3();

function generateTreesForChunk(treePositions, chunkGroup, chunkCenterZ) {

    const typeAPositions = []; // árvore com folha esférica
    const typeBPositions = []; // árvore com folhas cônicas

    for (const pos of treePositions) {
        if (Math.random() < 0.5) {
            typeAPositions.push(pos);
        } else {
            typeBPositions.push(pos);
        }
    }

    if (typeAPositions.length > 0) {
        const trunkA = new THREE.InstancedMesh(logGeometry1, material1, typeAPositions.length);
        const leafA = new THREE.InstancedMesh(sphereLeafGeometry1, material2, typeAPositions.length);
        trunkA.castShadow = true;
        leafA.castShadow = true;

        // guarda os dados-base de cada instância (usado depois pelo
        // planeUpdate.js para recalcular a altura ao reciclar o chunk)
        trunkA.userData.xs = [];
        trunkA.userData.zLocals = [];
        trunkA.userData.scales = [];
        trunkA.userData.yOffsetFactor = 0;

        leafA.userData.xs = [];
        leafA.userData.zLocals = [];
        leafA.userData.scales = [];
        leafA.userData.yOffsetFactor = 2; // folha fica 2 unidades acima do tronco

        typeAPositions.forEach((pos, i) => {
            const scale = 0.6 + Math.random() * 0.8;
            const groundY = pos.y + 1.5;

            _scaleVec.set(scale, scale, scale);

            _posVec.set(pos.x, groundY, chunkCenterZ + pos.z);
            _matrix.compose(_posVec, _quat, _scaleVec);
            trunkA.setMatrixAt(i, _matrix);
            trunkA.userData.xs.push(pos.x);
            trunkA.userData.zLocals.push(pos.z);
            trunkA.userData.scales.push(scale);

            _posVec.y += 2 * scale;
            _matrix.compose(_posVec, _quat, _scaleVec);
            leafA.setMatrixAt(i, _matrix);
            leafA.userData.xs.push(pos.x);
            leafA.userData.zLocals.push(pos.z);
            leafA.userData.scales.push(scale);
        });

        trunkA.instanceMatrix.needsUpdate = true;
        leafA.instanceMatrix.needsUpdate = true;
        trunkA.computeBoundingSphere();
        leafA.computeBoundingSphere();

        chunkGroup.add(trunkA);
        chunkGroup.add(leafA);
    }

    if (typeBPositions.length > 0) {
        const trunkB = new THREE.InstancedMesh(logGeometry2, material1, typeBPositions.length);
        const coneB1 = new THREE.InstancedMesh(coneLeafGeometry1, material3, typeBPositions.length);
        const coneB2 = new THREE.InstancedMesh(coneLeafGeometry2, material3, typeBPositions.length);
        const coneB3 = new THREE.InstancedMesh(coneLeafGeometry3, material3, typeBPositions.length);
        trunkB.castShadow = true;
        coneB1.castShadow = true;
        coneB2.castShadow = true;
        coneB3.castShadow = true;

        [trunkB, coneB1, coneB2, coneB3].forEach((mesh, idx) => {
            mesh.userData.xs = [];
            mesh.userData.zLocals = [];
            mesh.userData.scales = [];
            mesh.userData.yOffsetFactor = idx; // 0, 1, 2 
        });

        typeBPositions.forEach((pos, i) => {
            const scale = 0.6 + Math.random() * 0.8;
            const baseY = pos.y + 1.5;

            _scaleVec.set(scale, scale, scale);

            [trunkB, coneB1, coneB2, coneB3].forEach((mesh) => {
                _posVec.set(pos.x, baseY + mesh.userData.yOffsetFactor * scale, chunkCenterZ + pos.z);
                _matrix.compose(_posVec, _quat, _scaleVec);
                mesh.setMatrixAt(i, _matrix);
                mesh.userData.xs.push(pos.x);
                mesh.userData.zLocals.push(pos.z);
                mesh.userData.scales.push(scale);
            });
        });

        [trunkB, coneB1, coneB2, coneB3].forEach((mesh) => {
            mesh.instanceMatrix.needsUpdate = true;
            mesh.computeBoundingSphere();
            chunkGroup.add(mesh);
        });
    }
}

export { generateTreesForChunk };