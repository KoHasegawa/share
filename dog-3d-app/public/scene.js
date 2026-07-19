import * as THREE from 'three';
import { SandField, SAND_FIELD_SIZE } from './sand.js';

export function createScene(canvas) {
  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: true,
    alpha: true,
  });
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.1;
  renderer.setPixelRatio(window.devicePixelRatio);

  const scene = new THREE.Scene();
  scene.fog = new THREE.Fog(0xe9eef2, 45, 190);

  const camera = new THREE.PerspectiveCamera(55, 1, 0.1, 400);
  camera.position.set(0, 1.6, 6);

  addSky(scene);
  addLights(scene);
  const sand = new SandField(scene);
  const targets = addEnvironment(scene, sand);
  createLookController(renderer.domElement, camera, {
    target: new THREE.Vector3(0, 0.7, 0),
    pitchMin: -1.2,
    pitchMax: 0.6,
  });

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
    renderer.render(scene, camera);
  }

  return {
    scene,
    camera,
    renderer,
    targets,
    sand,
    clock,
    render,
  };
}

function addSky(scene) {
  // 空: 天頂から地平線へのグラデーションドーム
  const geometry = new THREE.SphereGeometry(320, 32, 16);
  const position = geometry.attributes.position;
  const colors = new Float32Array(position.count * 3);
  const zenith = new THREE.Color(0x6ea7dd);
  const horizon = new THREE.Color(0xe9eef2);
  const c = new THREE.Color();
  for (let i = 0; i < position.count; i += 1) {
    const y = position.getY(i) / 320; // -1..1
    const t = Math.max(0, Math.min(1, Math.pow(Math.max(y, 0), 0.55)));
    c.copy(horizon).lerp(zenith, t);
    colors[i * 3] = c.r;
    colors[i * 3 + 1] = c.g;
    colors[i * 3 + 2] = c.b;
  }
  geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  const material = new THREE.MeshBasicMaterial({
    vertexColors: true,
    side: THREE.BackSide,
    fog: false,
    depthWrite: false,
  });
  const sky = new THREE.Mesh(geometry, material);
  sky.renderOrder = -1;
  scene.add(sky);
}

function addLights(scene) {
  // 真夏の砂浜の光: 高い太陽 + 空からの照り返し
  const hemisphere = new THREE.HemisphereLight(0xbcd8f2, 0xe4d6b4, 0.75);
  scene.add(hemisphere);

  const sun = new THREE.DirectionalLight(0xfff2dc, 2.9);
  sun.position.set(13, 11, 6);
  sun.castShadow = true;
  sun.shadow.mapSize.width = 2048;
  sun.shadow.mapSize.height = 2048;
  sun.shadow.camera.near = 1;
  sun.shadow.camera.far = 60;
  sun.shadow.camera.left = -14;
  sun.shadow.camera.right = 14;
  sun.shadow.camera.top = 14;
  sun.shadow.camera.bottom = -14;
  sun.shadow.bias = -0.0004;
  sun.shadow.normalBias = 0.02;
  scene.add(sun);
}

function addEnvironment(scene, sand) {
  const targets = {};
  const groundY = (x, z) => (sand ? sand.surfaceHeightAt(x, z) : 0);

  // 遠景の砂原(動的フィールドの外側)
  const farSandMaterial = new THREE.MeshStandardMaterial({ color: 0xe5d8ba, roughness: 1 });
  const farSand = new THREE.Mesh(new THREE.PlaneGeometry(500, 500), farSandMaterial);
  farSand.rotation.x = -Math.PI / 2;
  farSand.position.y = -0.02;
  farSand.receiveShadow = true;
  scene.add(farSand);

  // 波打ち際の湿った砂と海(遠景の雰囲気づくり)
  const wetSand = new THREE.Mesh(
    new THREE.PlaneGeometry(500, 14),
    new THREE.MeshStandardMaterial({ color: 0xcdbb97, roughness: 0.45 })
  );
  wetSand.rotation.x = -Math.PI / 2;
  wetSand.position.set(0, -0.015, -SAND_FIELD_SIZE / 2 - 18);
  scene.add(wetSand);

  const sea = new THREE.Mesh(
    new THREE.PlaneGeometry(500, 160),
    new THREE.MeshStandardMaterial({
      color: 0x3b87ae,
      roughness: 0.25,
      metalness: 0.05,
    })
  );
  sea.rotation.x = -Math.PI / 2;
  sea.position.set(0, -0.01, -SAND_FIELD_SIZE / 2 - 18 - 7 - 80);
  scene.add(sea);

  const ball = new THREE.Mesh(
    new THREE.SphereGeometry(0.35, 32, 32),
    new THREE.MeshStandardMaterial({ color: 0xe14b4b, roughness: 0.55 })
  );
  ball.position.set(4, 0.3 + groundY(4, -2.5), -2.5);
  ball.castShadow = true;
  scene.add(ball);

  // 犬用ベッドの代わりにビーチタオル(ターゲット名は据え置き)
  const towel = new THREE.Mesh(
    new THREE.BoxGeometry(2.2, 0.05, 1.6),
    new THREE.MeshStandardMaterial({ color: 0xdd6f56, roughness: 0.85 })
  );
  towel.position.set(-4, 0.06 + groundY(-4, 2.5), 2.5);
  towel.rotation.y = 0.25;
  towel.castShadow = true;
  towel.receiveShadow = true;
  scene.add(towel);

  const towelStripe = new THREE.Mesh(
    new THREE.BoxGeometry(2.2, 0.052, 0.34),
    new THREE.MeshStandardMaterial({ color: 0xf3ede0, roughness: 0.85 })
  );
  towelStripe.position.set(0, 0.002, 0);
  towel.add(towelStripe);

  const bowl = new THREE.Mesh(
    new THREE.CylinderGeometry(0.7, 0.9, 0.35, 32, 1, true),
    new THREE.MeshStandardMaterial({ color: 0x4d8fc4, roughness: 0.4, side: THREE.DoubleSide })
  );
  bowl.position.set(2.5, 0.16 + groundY(2.5, 3.2), 3.2);
  bowl.rotation.x = Math.PI;
  bowl.castShadow = true;
  scene.add(bowl);

  // 流木と貝殻(添景)
  const driftwood = new THREE.Mesh(
    new THREE.CylinderGeometry(0.09, 0.13, 2.4, 10),
    new THREE.MeshStandardMaterial({ color: 0x9a8468, roughness: 0.9 })
  );
  driftwood.position.set(-6.5, 0.08 + groundY(-6.5, -4.5), -4.5);
  driftwood.rotation.set(0, 0.7, Math.PI / 2 - 0.06);
  driftwood.castShadow = true;
  driftwood.receiveShadow = true;
  scene.add(driftwood);

  const shellMaterial = new THREE.MeshStandardMaterial({ color: 0xf6efe2, roughness: 0.5 });
  const shellPositions = [
    [1.8, -4.2],
    [-2.6, -3.1],
    [5.6, 1.4],
    [-5.2, 4.6],
    [0.6, 4.8],
  ];
  shellPositions.forEach(([sx, sz], k) => {
    const shell = new THREE.Mesh(new THREE.SphereGeometry(0.06 + (k % 3) * 0.02, 12, 10), shellMaterial);
    shell.scale.y = 0.55;
    shell.position.set(sx, 0.02 + groundY(sx, sz), sz);
    shell.castShadow = true;
    scene.add(shell);
  });

  const userMarker = new THREE.Mesh(
    new THREE.ConeGeometry(0.4, 1.2, 16),
    new THREE.MeshStandardMaterial({ color: 0x4063d8 })
  );
  userMarker.position.set(0, 0.6, 6);
  userMarker.castShadow = true;
  userMarker.visible = false;
  scene.add(userMarker);

  const labelCanvas = makeLabelCanvas('ユーザー位置');
  const labelTexture = new THREE.CanvasTexture(labelCanvas);
  labelTexture.colorSpace = THREE.SRGBColorSpace;
  labelTexture.needsUpdate = true;

  const labelMaterial = new THREE.SpriteMaterial({ map: labelTexture, transparent: true });
  const labelSprite = new THREE.Sprite(labelMaterial);
  labelSprite.position.set(0, 1.7, 6);
  labelSprite.scale.set(2.5, 1.2, 1);
  labelSprite.visible = false;
  scene.add(labelSprite);

  targets.ball = ball.position.clone();
  targets.bed = towel.position.clone();
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

function createLookController(element, camera, options = {}) {
  const {
    target = new THREE.Vector3(0, 1, 0),
    yawLimit = 2.0,
    pitchMin = -1.2,
    pitchMax = 0.6,
    sensitivity = 0.003,
  } = options;

  const toTarget = new THREE.Vector3().subVectors(target, camera.position).normalize();
  let yaw = Math.atan2(toTarget.x, toTarget.z);
  let pitch = Math.asin(THREE.MathUtils.clamp(toTarget.y, -1, 1));
  const yawMin = yaw - yawLimit;
  const yawMax = yaw + yawLimit;
  const forward = new THREE.Vector3();
  const lookAtPoint = new THREE.Vector3();

  const pointerState = {
    active: false,
    pointerId: null,
    startX: 0,
    startY: 0,
    startYaw: yaw,
    startPitch: pitch,
  };

  const preventContextMenu = (event) => event.preventDefault();

  element.style.touchAction = 'none';
  updateCameraOrientation();

  element.addEventListener('pointerdown', handlePointerDown);
  element.addEventListener('wheel', handleWheel, { passive: false });
  element.addEventListener('contextmenu', preventContextMenu);
  window.addEventListener('blur', releasePointer);

  function handlePointerDown(event) {
    element.setPointerCapture(event.pointerId);
    pointerState.active = true;
    pointerState.pointerId = event.pointerId;
    pointerState.startX = event.clientX;
    pointerState.startY = event.clientY;
    pointerState.startYaw = yaw;
    pointerState.startPitch = pitch;
    element.addEventListener('pointermove', handlePointerMove);
    element.addEventListener('pointerup', handlePointerUp);
    element.addEventListener('pointercancel', handlePointerUp);
  }

  function handlePointerMove(event) {
    if (!pointerState.active) return;
    const deltaX = event.clientX - pointerState.startX;
    const deltaY = event.clientY - pointerState.startY;
    yaw = THREE.MathUtils.clamp(pointerState.startYaw - deltaX * sensitivity, yawMin, yawMax);
    pitch = THREE.MathUtils.clamp(pointerState.startPitch - deltaY * sensitivity, pitchMin, pitchMax);
    updateCameraOrientation();
  }

  function handlePointerUp() {
    releasePointer();
  }

  function handleWheel(event) {
    event.preventDefault();
  }

  function releasePointer() {
    if (!pointerState.active) return;
    pointerState.active = false;
    if (pointerState.pointerId !== null) {
      try {
        element.releasePointerCapture(pointerState.pointerId);
      } catch (e) {
        // ignore if capture already released
      }
    }
    pointerState.pointerId = null;
    element.removeEventListener('pointermove', handlePointerMove);
    element.removeEventListener('pointerup', handlePointerUp);
    element.removeEventListener('pointercancel', handlePointerUp);
  }

  function updateCameraOrientation() {
    const cosPitch = Math.cos(pitch);
    forward.set(
      Math.sin(yaw) * cosPitch,
      Math.sin(pitch),
      Math.cos(yaw) * cosPitch
    );
    lookAtPoint.copy(camera.position).add(forward);
    camera.lookAt(lookAtPoint);
  }

  return {
    dispose() {
      element.removeEventListener('pointerdown', handlePointerDown);
      element.removeEventListener('wheel', handleWheel);
      element.removeEventListener('contextmenu', preventContextMenu);
      window.removeEventListener('blur', releasePointer);
    },
  };
}
