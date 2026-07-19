import * as THREE from 'three';
import './styles.css';

import { createRenderer, RendererLike } from './scene/createRenderer';
import { createCamera } from './scene/createCamera';
import { createLights } from './scene/createLights';
import { defaultSandParams, SandParams } from './sand/sandParams';
import { SandPlane } from './sand/SandPlane';
import { PointerTrail } from './interaction/PointerTrail';
import { FootprintSystem } from './footprints/FootprintSystem';
import { dogFootprint } from './footprints/footprintTypes';
import { createGui } from './ui/createGui';
import { WashWave } from './effects/WashWave';

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

  const footprintWorldSize = cameraController.worldHeight() * 0.2;
  const footprintSystem = new FootprintSystem(dogFootprint, sandParams, footprintWorldSize);

  const sandPlane = new SandPlane(renderer, sandParams);
  sandPlane.setFootprintSystem(footprintSystem);
  scene.add(sandPlane.mesh);

  const washWave = new WashWave(1.8);

  const triggerWash = (): void => {
    washWave.trigger();
  };

  createGui(sandParams, { onWash: triggerWash });

  const pointerTrail = new PointerTrail();
  pointerTrail.attach(renderer.domElement as HTMLElement, cameraController.screenToWorld);
  pointerTrail.onStart(() => {
    footprintSystem.resetTrail();
  });
  pointerTrail.onMove((worldPos, dir) => {
    footprintSystem.addAlongTrail(worldPos, dir);
  });

  const handleResize = (): void => {
    const width = window.innerWidth;
    const height = window.innerHeight;

    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setSize(width, height, false);
    cameraController.resize(width, height);

    footprintSystem.setFootprintWorldSize(cameraController.worldHeight() * 0.2);

    const halfSweep = cameraController.worldHeight() * 0.5 + 0.9;
    washWave.setSweepBounds(halfSweep, -halfSweep);
  };

  window.addEventListener('resize', handleResize, { passive: true });
  handleResize();

  // デバッグ・検証用フック(E2Eテストからの直接操作に使用)
  (window as unknown as { __sim?: object }).__sim = {
    footprintSystem,
    sandPlane,
    sandParams,
    cameraController,
    renderer
  };

  const washButton = document.getElementById('wash-button');
  if (washButton instanceof HTMLButtonElement) {
    washButton.addEventListener('click', triggerWash);
  }

  let previousTime = performance.now();

  const frame = (now: number): void => {
    const dt = Math.max(0, (now - previousTime) * 0.001);
    previousTime = now;

    footprintSystem.update(now * 0.001);

    if (washWave.active) {
      washWave.update(dt);
      sandPlane.setWash(washWave.front, washWave.progress);
      footprintSystem.clearPassedByWashFront(washWave.front);

      if (!washWave.active) {
        footprintSystem.clear();
        sandPlane.clearFootprintContributions(sandParams);
        sandPlane.resetWash();
      }
    }

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
