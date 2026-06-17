import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

export function createScene(canvas) {
  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: true,
    alpha: true,
  });
  renderer.shadowMap.enabled = true;
  renderer.setPixelRatio(window.devicePixelRatio);

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0xbfd7ff);

  const camera = new THREE.PerspectiveCamera(55, 1, 0.1, 100);
  camera.position.set(6, 4, 8);

  const controls = new OrbitControls(camera, renderer.domElement);
  controls.target.set(0, 1, 0);
  controls.enableDamping = true;

  addLights(scene);
  const targets = addEnvironment(scene);

  const clock = new THREE.Clock();

  function resizeRenderer() {
    const { clientWidth, clientHeight } = canvas;
    if (canvas.width !== clientWidth || canvas.height !== clientHeight) {
      renderer.setSize(clientWidth, clientHeight, false);
      camera.aspect = clientWidth / clientHeight;
      camera.updateProjectionMatrix();
    }
  }

  function render(dog) {
    resizeRenderer();
    const delta = clock.getDelta();
    dog.update(delta);
    controls.update();
    renderer.render(scene, camera);
  }

  return {
    scene,
    camera,
    renderer,
    controls,
    targets,
    clock,
    render,
  };
}

function addLights(scene) {
  const ambient = new THREE.AmbientLight(0xffffff, 0.6);
  scene.add(ambient);

  const directional = new THREE.DirectionalLight(0xffffff, 0.9);
  directional.position.set(6, 10, 4);
  directional.castShadow = true;
  directional.shadow.mapSize.width = 2048;
  directional.shadow.mapSize.height = 2048;
  directional.shadow.camera.near = 0.5;
  directional.shadow.camera.far = 30;
  scene.add(directional);
}

function addEnvironment(scene) {
  const targets = {};

  const floorGeometry = new THREE.PlaneGeometry(30, 30);
  const floorMaterial = new THREE.MeshStandardMaterial({ color: 0xd6e6c3 });
  const floor = new THREE.Mesh(floorGeometry, floorMaterial);
  floor.rotation.x = -Math.PI / 2;
  floor.receiveShadow = true;
  scene.add(floor);

  const board = new THREE.Mesh(
    new THREE.BoxGeometry(12, 0.3, 12),
    new THREE.MeshStandardMaterial({ color: 0xf5f1e1 })
  );
  board.position.y = 0.01;
  board.receiveShadow = true;
  scene.add(board);

  const ball = new THREE.Mesh(
    new THREE.SphereGeometry(0.35, 32, 32),
    new THREE.MeshStandardMaterial({ color: 0xff5454 })
  );
  ball.position.set(4, 0.35, -2.5);
  ball.castShadow = true;
  scene.add(ball);

  const bed = new THREE.Mesh(
    new THREE.BoxGeometry(2.2, 0.4, 1.6),
    new THREE.MeshStandardMaterial({ color: 0x9f6d4c })
  );
  bed.position.set(-4, 0.2, 2.5);
  bed.castShadow = true;
  bed.receiveShadow = true;
  scene.add(bed);

  const bowl = new THREE.Mesh(
    new THREE.CylinderGeometry(0.7, 0.9, 0.35, 32, 1, true),
    new THREE.MeshStandardMaterial({ color: 0xffb347, side: THREE.DoubleSide })
  );
  bowl.position.set(2.5, 0.17, 3.2);
  bowl.rotation.x = Math.PI;
  bowl.castShadow = true;
  scene.add(bowl);

  const userMarker = new THREE.Mesh(
    new THREE.ConeGeometry(0.4, 1.2, 16),
    new THREE.MeshStandardMaterial({ color: 0x4063d8 })
  );
  userMarker.position.set(0, 0.6, 6);
  userMarker.castShadow = true;
  scene.add(userMarker);

  const labelCanvas = makeLabelCanvas('ユーザー位置');
  const labelTexture = new THREE.CanvasTexture(labelCanvas);
  labelTexture.encoding = THREE.sRGBEncoding;
  labelTexture.needsUpdate = true;

  const labelMaterial = new THREE.SpriteMaterial({ map: labelTexture, transparent: true });
  const labelSprite = new THREE.Sprite(labelMaterial);
  labelSprite.position.set(0, 1.7, 6);
  labelSprite.scale.set(2.5, 1.2, 1);
  scene.add(labelSprite);

  targets.ball = ball.position.clone();
  targets.bed = bed.position.clone();
  targets.bowl = bowl.position.clone();
  targets.user = userMarker.position.clone();

  return targets;
}

function makeLabelCanvas(text) {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  const padding = 24;
  ctx.font = '28px Noto Sans JP';
  const textWidth = ctx.measureText(text).width;
  canvas.width = textWidth + padding * 2;
  canvas.height = 64;

  ctx.font = '28px Noto Sans JP';
  ctx.fillStyle = 'rgba(36, 48, 70, 0.85)';
  ctx.strokeStyle = 'rgba(255,255,255,0.9)';
  ctx.lineWidth = 8;
  ctx.textBaseline = 'middle';
  ctx.textAlign = 'center';

  ctx.strokeText(text, canvas.width / 2, canvas.height / 2);
  ctx.fillText(text, canvas.width / 2, canvas.height / 2);

  return canvas;
}
