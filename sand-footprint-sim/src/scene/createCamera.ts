import * as THREE from 'three';

export interface CameraController {
  camera: THREE.OrthographicCamera;
  resize: (width: number, height: number) => void;
  worldHeight: () => number;
  screenToWorld: (px: number, py: number) => THREE.Vector2;
}

export function createCamera(): CameraController {
  const visibleWorldHeight = 12;
  let viewportWidth = Math.max(1, window.innerWidth);
  let viewportHeight = Math.max(1, window.innerHeight);

  const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.01, 100);
  camera.position.set(0, 20, 0);
  camera.up.set(0, 0, -1);
  camera.lookAt(0, 0, 0);

  const ndc = new THREE.Vector3();
  const rayOrigin = new THREE.Vector3();
  const rayDirection = new THREE.Vector3();

  const resize = (width: number, height: number): void => {
    viewportWidth = Math.max(1, width);
    viewportHeight = Math.max(1, height);

    const aspect = viewportWidth / viewportHeight;
    const halfHeight = visibleWorldHeight * 0.5;
    const halfWidth = halfHeight * aspect;

    camera.left = -halfWidth;
    camera.right = halfWidth;
    camera.top = halfHeight;
    camera.bottom = -halfHeight;
    camera.updateProjectionMatrix();
    camera.updateMatrixWorld(true);
  };

  const screenToWorld = (px: number, py: number): THREE.Vector2 => {
    const x = (px / viewportWidth) * 2 - 1;
    const y = -(py / viewportHeight) * 2 + 1;

    ndc.set(x, y, 0);
    rayOrigin.copy(ndc).unproject(camera);
    camera.getWorldDirection(rayDirection);

    const denom = rayDirection.y;
    const t = Math.abs(denom) > 1e-6 ? -rayOrigin.y / denom : 0;

    return new THREE.Vector2(rayOrigin.x + rayDirection.x * t, rayOrigin.z + rayDirection.z * t);
  };

  resize(viewportWidth, viewportHeight);

  return {
    camera,
    resize,
    worldHeight: () => visibleWorldHeight,
    screenToWorld
  };
}
