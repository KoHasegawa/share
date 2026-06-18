import * as THREE from 'three';

export type RendererBackend = 'webgl2';

export interface RendererLike {
  domElement: HTMLCanvasElement;
  setSize(width: number, height: number, updateStyle?: boolean): void;
  setPixelRatio(value: number): void;
  render(scene: THREE.Object3D, camera: THREE.Camera): void;
  renderAsync?: (scene: THREE.Object3D, camera: THREE.Camera) => Promise<void>;
  dispose(): void;
  toneMapping: THREE.ToneMapping;
  toneMappingExposure: number;
  outputColorSpace: string;
  shadowMap?: {
    enabled: boolean;
    type: THREE.ShadowMapType;
  };
}

export async function createRenderer(
  canvas: HTMLCanvasElement
): Promise<{ renderer: RendererLike; backend: 'webgl2' }> {
  const pixelRatio = Math.min(window.devicePixelRatio || 1, 2);

  const webgl2Context = canvas.getContext('webgl2', {
    antialias: true,
    alpha: false,
    powerPreference: 'high-performance'
  });

  if (!webgl2Context) {
    throw new Error('Failed to create WebGL2 renderer context.');
  }

  const renderer = new THREE.WebGLRenderer({
    canvas,
    context: webgl2Context,
    antialias: true,
    alpha: false,
    powerPreference: 'high-performance'
  });

  renderer.setPixelRatio(pixelRatio);
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.0;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  console.info('[Renderer] backend: webgl2');
  return { renderer, backend: 'webgl2' };
}
