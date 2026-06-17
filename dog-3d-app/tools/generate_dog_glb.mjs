import { Document, NodeIO, Accessor } from '@gltf-transform/core';
import * as THREE from 'three';
import path from 'node:path';
import fs from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

// 低ポリの犬GLBをNode.jsで生成するスクリプト
// Three.jsのプリミティブからジオメトリを組み立て、gltf-transformでGLBを書き出す。

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const OUTPUT_PATH = path.join(__dirname, '..', 'public', 'models', 'dog.glb');

const doc = new Document();
const buffer = doc.createBuffer('DogBuffer');
const scene = doc.createScene('DogScene');

function hexToFactor(hex) {
  const color = new THREE.Color(hex);
  return [color.r, color.g, color.b, 1];
}

function createMaterial(name, hex) {
  return doc
    .createMaterial(name)
    .setBaseColorFactor(hexToFactor(hex))
    .setMetallicFactor(0)
    .setRoughnessFactor(0.6);
}

const materials = {
  body: createMaterial('Dog_Body_Mat', 0x8a6547),
  ear: createMaterial('Dog_Ear_Mat', 0x5a3d27),
  nose: createMaterial('Dog_Nose_Mat', 0x1a1a1a),
  eye: createMaterial('Dog_Eye_Mat', 0x101010),
  paw: createMaterial('Dog_Paw_Mat', 0xd8b99b),
};

function accessorFromArray(name, array, type) {
  return doc.createAccessor(name).setType(type).setArray(array).setBuffer(buffer);
}

function geometryToPrimitive(name, geometry, material) {
  const primitive = doc.createPrimitive(name).setMaterial(material);
  const position = geometry.attributes.position;
  if (!position) {
    throw new Error(`${name} に position 属性がありません`);
  }
  primitive.setAttribute(
    'POSITION',
    accessorFromArray(`${name}_POSITION`, new Float32Array(position.array), Accessor.Type.VEC3)
  );

  if (geometry.attributes.normal) {
    primitive.setAttribute(
      'NORMAL',
      accessorFromArray(`${name}_NORMAL`, new Float32Array(geometry.attributes.normal.array), Accessor.Type.VEC3)
    );
  }

  if (geometry.attributes.uv) {
    primitive.setAttribute(
      'TEXCOORD_0',
      accessorFromArray(`${name}_UV`, new Float32Array(geometry.attributes.uv.array), Accessor.Type.VEC2)
    );
  }

  if (geometry.index) {
    const indexArray = geometry.index.array;
    const needsUint32 = geometry.attributes.position.count > 65535;
    const indices = needsUint32 ? new Uint32Array(indexArray) : new Uint16Array(indexArray);
    primitive.setIndices(accessorFromArray(`${name}_INDICES`, indices, Accessor.Type.SCALAR));
  }

  return primitive;
}

function createMesh(name, parts) {
  const mesh = doc.createMesh(name);
  parts.forEach((part, index) => {
    mesh.addPrimitive(geometryToPrimitive(`${name}_part${index}`, part.geometry, part.material));
  });
  return mesh;
}

function setNodeRotationFromEuler(node, x, y, z) {
  const quat = new THREE.Quaternion().setFromEuler(new THREE.Euler(x, y, z));
  node.setRotation([quat.x, quat.y, quat.z, quat.w]);
}

// --- ジオメトリ定義 ---
const bodyGeometry = new THREE.CapsuleGeometry(0.4, 0.9, 6, 12);
bodyGeometry.rotateX(Math.PI / 2);

const headGeometry = new THREE.SphereGeometry(0.35, 16, 12);
const snoutBox = new THREE.BoxGeometry(0.34, 0.22, 0.4);
snoutBox.translate(0, 0.02, 0.38);
const noseSphere = new THREE.SphereGeometry(0.1, 10, 8);
noseSphere.translate(0, 0.03, 0.65);

const eyeSphere = new THREE.SphereGeometry(0.06, 8, 6);
eyeSphere.translate(0, 0.02, 0.46);

const earCone = new THREE.ConeGeometry(0.14, 0.5, 4, 1);
earCone.translate(0, -0.25, 0);

const tailGeometry = new THREE.CylinderGeometry(0.08, 0.11, 0.7, 6, 1);
tailGeometry.rotateX(Math.PI / 2);
tailGeometry.translate(0, 0, -0.35);

const legRadius = 0.1;
const legLength = 0.16;
const legGeometry = new THREE.CapsuleGeometry(legRadius, legLength, 4, 8);
const legHalfHeight = legLength / 2 + legRadius;
legGeometry.translate(0, -legHalfHeight, 0);
const pawHeight = 0.12;
const pawGeometry = new THREE.CylinderGeometry(0.13, 0.16, pawHeight, 6, 1);
pawGeometry.translate(0, -legHalfHeight - pawHeight / 2, 0);

// --- メッシュ作成 ---
const bodyMesh = createMesh('BodyMesh', [{ geometry: bodyGeometry, material: materials.body }]);
const headMesh = createMesh('HeadMesh', [{ geometry: headGeometry, material: materials.body }]);
const snoutMesh = createMesh('SnoutMesh', [
  { geometry: snoutBox, material: materials.body },
  { geometry: noseSphere, material: materials.nose },
]);
const eyeMesh = createMesh('EyeMesh', [{ geometry: eyeSphere, material: materials.eye }]);
const earMesh = createMesh('EarMesh', [{ geometry: earCone, material: materials.ear }]);
const tailMesh = createMesh('TailMesh', [{ geometry: tailGeometry, material: materials.body }]);
const legMesh = createMesh('LegMesh', [
  { geometry: legGeometry, material: materials.body },
  { geometry: pawGeometry, material: materials.paw },
]);

// --- ノード階層 ---
const rootNode = doc.createNode('DogRoot');
scene.addChild(rootNode);

doc.getRoot().setDefaultScene(scene);

const bodyNode = doc.createNode('Body').setMesh(bodyMesh).setTranslation([0, 0.58, 0]);
rootNode.addChild(bodyNode);

const headPivot = doc.createNode('HeadPivot').setTranslation([0, 0.95, 0.68]);
rootNode.addChild(headPivot);
const headNode = doc.createNode('Head').setMesh(headMesh).setTranslation([0, 0.08, 0.24]);
setNodeRotationFromEuler(headNode, -0.05, 0, 0);
const snoutNode = doc.createNode('Snout').setMesh(snoutMesh);
const eyeL = doc.createNode('Eye_L').setMesh(eyeMesh).setTranslation([-0.16, 0.05, 0]);
const eyeR = doc.createNode('Eye_R').setMesh(eyeMesh).setTranslation([0.16, 0.05, 0]);
const earL = doc.createNode('Ear_L').setMesh(earMesh).setTranslation([-0.22, 0.15, -0.12]);
const earR = doc.createNode('Ear_R').setMesh(earMesh).setTranslation([0.22, 0.15, -0.12]);
setNodeRotationFromEuler(earL, -0.4, 0, 0.35);
setNodeRotationFromEuler(earR, -0.4, 0, -0.35);
headPivot.addChild(headNode);
headPivot.addChild(snoutNode);
headPivot.addChild(eyeL);
headPivot.addChild(eyeR);
headPivot.addChild(earL);
headPivot.addChild(earR);

const tailPivot = doc.createNode('TailPivot').setTranslation([0, 0.78, -0.78]);
rootNode.addChild(tailPivot);
const tailNode = doc.createNode('Tail').setMesh(tailMesh);
setNodeRotationFromEuler(tailNode, -0.35, 0, 0);
tailPivot.addChild(tailNode);

const legPositions = {
  Leg_FL_Pivot: [0.32, 0.48, 0.42],
  Leg_FR_Pivot: [-0.32, 0.48, 0.42],
  Leg_BL_Pivot: [0.32, 0.48, -0.42],
  Leg_BR_Pivot: [-0.32, 0.48, -0.42],
};

const legPivotMap = {};

Object.entries(legPositions).forEach(([name, translation]) => {
  const pivot = doc.createNode(name).setTranslation(translation);
  legPivotMap[name] = pivot;
  const legNode = doc
    .createNode(name.replace('_Pivot', ''))
    .setMesh(legMesh)
    .setTranslation([0, -0.18, 0]);
  pivot.addChild(legNode);
  rootNode.addChild(pivot);
});

// --- アニメーション作成 ---
function addQuaternionTrack(animation, node, keyframes) {
  const times = new Float32Array(keyframes.map((k) => k.time));
  const rotations = new Float32Array(keyframes.length * 4);
  keyframes.forEach((keyframe, index) => {
    const quat = keyframe.quaternion
      ? keyframe.quaternion
      : new THREE.Quaternion().setFromEuler(
          new THREE.Euler(keyframe.rotation[0], keyframe.rotation[1], keyframe.rotation[2])
        );
    rotations.set([quat.x, quat.y, quat.z, quat.w], index * 4);
  });

  const sampler = doc
    .createAnimationSampler(`${animation.getName()}_${node.getName()}_sampler`)
    .setInput(accessorFromArray(`${animation.getName()}_${node.getName()}_time`, times, Accessor.Type.SCALAR))
    .setOutput(accessorFromArray(`${animation.getName()}_${node.getName()}_rot`, rotations, Accessor.Type.VEC4))
    .setInterpolation('LINEAR');

  const channel = doc.createAnimationChannel(`${animation.getName()}_${node.getName()}_channel`);
  channel.setTargetNode(node).setTargetPath('rotation').setSampler(sampler);
  animation.addSampler(sampler).addChannel(channel);
}

function createAnimation(name, tracks) {
  const animation = doc.createAnimation(name);
  tracks.forEach(({ node, keyframes }) => addQuaternionTrack(animation, node, keyframes));
}

createAnimation('idle', [
  {
    node: headPivot,
    keyframes: [
      { time: 0, rotation: [0.05, 0, 0] },
      { time: 1.2, rotation: [-0.03, 0.03, 0] },
      { time: 2.4, rotation: [0.05, 0, 0] },
    ],
  },
  {
    node: tailPivot,
    keyframes: [
      { time: 0, rotation: [0, 0.15, 0] },
      { time: 1.2, rotation: [0, -0.15, 0] },
      { time: 2.4, rotation: [0, 0.15, 0] },
    ],
  },
]);

createAnimation('walk', [
  {
    node: legPivotMap.Leg_FL_Pivot,
    keyframes: [
      { time: 0, rotation: [0.45, 0, 0] },
      { time: 0.4, rotation: [-0.45, 0, 0] },
      { time: 0.8, rotation: [0.45, 0, 0] },
    ],
  },
  {
    node: legPivotMap.Leg_FR_Pivot,
    keyframes: [
      { time: 0, rotation: [-0.45, 0, 0] },
      { time: 0.4, rotation: [0.45, 0, 0] },
      { time: 0.8, rotation: [-0.45, 0, 0] },
    ],
  },
  {
    node: legPivotMap.Leg_BL_Pivot,
    keyframes: [
      { time: 0, rotation: [-0.4, 0, 0] },
      { time: 0.4, rotation: [0.4, 0, 0] },
      { time: 0.8, rotation: [-0.4, 0, 0] },
    ],
  },
  {
    node: legPivotMap.Leg_BR_Pivot,
    keyframes: [
      { time: 0, rotation: [0.4, 0, 0] },
      { time: 0.4, rotation: [-0.4, 0, 0] },
      { time: 0.8, rotation: [0.4, 0, 0] },
    ],
  },
  {
    node: headPivot,
    keyframes: [
      { time: 0, rotation: [0.1, 0.05, 0] },
      { time: 0.4, rotation: [-0.1, -0.05, 0] },
      { time: 0.8, rotation: [0.1, 0.05, 0] },
    ],
  },
  {
    node: tailPivot,
    keyframes: [
      { time: 0, rotation: [0, 0.25, 0] },
      { time: 0.4, rotation: [0, -0.25, 0] },
      { time: 0.8, rotation: [0, 0.25, 0] },
    ],
  },
]);

createAnimation('tail_wag', [
  {
    node: tailPivot,
    keyframes: [
      { time: 0, rotation: [0, 0.5, 0] },
      { time: 0.25, rotation: [0, -0.5, 0] },
      { time: 0.5, rotation: [0, 0.5, 0] },
    ],
  },
]);

createAnimation('sit', [
  {
    node: legPivotMap.Leg_BL_Pivot,
    keyframes: [
      { time: 0, rotation: [0, 0, 0] },
      { time: 1.0, rotation: [-1.1, 0, 0] },
      { time: 1.6, rotation: [-1.1, 0, 0] },
    ],
  },
  {
    node: legPivotMap.Leg_BR_Pivot,
    keyframes: [
      { time: 0, rotation: [0, 0, 0] },
      { time: 1.0, rotation: [-1.1, 0, 0] },
      { time: 1.6, rotation: [-1.1, 0, 0] },
    ],
  },
  {
    node: legPivotMap.Leg_FL_Pivot,
    keyframes: [
      { time: 0, rotation: [0, 0, 0] },
      { time: 1.0, rotation: [0.25, 0, 0] },
      { time: 1.6, rotation: [0.25, 0, 0] },
    ],
  },
  {
    node: legPivotMap.Leg_FR_Pivot,
    keyframes: [
      { time: 0, rotation: [0, 0, 0] },
      { time: 1.0, rotation: [0.25, 0, 0] },
      { time: 1.6, rotation: [0.25, 0, 0] },
    ],
  },
  {
    node: bodyNode,
    keyframes: [
      { time: 0, rotation: [0, 0, 0] },
      { time: 1.0, rotation: [-0.4, 0, 0] },
      { time: 1.6, rotation: [-0.4, 0, 0] },
    ],
  },
  {
    node: headPivot,
    keyframes: [
      { time: 0, rotation: [0, 0, 0] },
      { time: 1.0, rotation: [0.35, 0.1, 0] },
      { time: 1.6, rotation: [0.35, 0.1, 0] },
    ],
  },
]);

async function main() {
  await fs.mkdir(path.dirname(OUTPUT_PATH), { recursive: true });
  const io = new NodeIO();
  const glbData = await io.writeBinary(doc);
  await fs.writeFile(OUTPUT_PATH, glbData);
  console.log(`GLBを生成しました: ${OUTPUT_PATH}`);
}

main().catch((error) => {
  console.error('犬GLB生成中にエラーが発生しました', error);
  process.exitCode = 1;
});
