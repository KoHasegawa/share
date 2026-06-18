import * as THREE from 'three';
import './styles.css';

import { createRenderer, RendererLike } from './scene/createRenderer';
import { createCamera } from './scene/createCamera';
import { createLights } from './scene/createLights';
import { defaultSandParams, SandParams } from './sand/sandParams';
import { SandPlane } from './sand/SandPlane';

function isAsyncRenderer(
  renderer: RendererLike
): renderer is RendererLike & { renderAsync: (scene: THREE.Scene, camera: THREE.Camera) => Promise<void> } {
  return typeof renderer.renderAsync === 'function';
}

async function boot(): Promise<void> {
  const canvas = document.getElementById('app-canvas');
  if (!(canvas instanceof HTMLCanvasElement)) {
    throw new Error('Canvas #app-canvas not found');
  }

  const { renderer } = await createRenderer(canvas);

  const scene = new THREE.Scene();
  scene.background = new THREE.Color('#9ec3df');

  const cameraController = createCamera();
  const { camera } = cameraController;

  createLights(scene);

  const sandParams: SandParams = { ...defaultSandParams };
  const sandPlane = new SandPlane(sandParams);
  scene.add(sandPlane.mesh);

  const handleResize = (): void => {
    const width = window.innerWidth;
    const height = window.innerHeight;

    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setSize(width, height, false);
    cameraController.resize(width, height);
  };

  window.addEventListener('resize', handleResize, { passive: true });
  handleResize();

  const washButton = document.getElementById('wash-button');
  if (washButton instanceof HTMLButtonElement) {
    washButton.addEventListener('click', () => {
      // Placeholder for Batch M7.
    });
  }

  let previousTime = performance.now();

  const frame = (now: number): void => {
    const dt = Math.max(0, (now - previousTime) * 0.001);
    previousTime = now;

    sandPlane.update(dt, sandParams);

    if (isAsyncRenderer(renderer)) {
      void renderer.renderAsync(scene, camera);
    } else {
      renderer.render(scene, camera);
    }

    window.requestAnimationFrame(frame);
  };

  window.requestAnimationFrame(frame);
}

void boot();
