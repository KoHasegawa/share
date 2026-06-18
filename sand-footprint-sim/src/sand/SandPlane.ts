import * as THREE from 'three';
import { RendererLike } from '../scene/createRenderer';
import { FootprintSystem, MAX_FOOTPRINTS } from '../footprints/FootprintSystem';
import { SandParams } from './sandParams';
import { createSandMaterial, SandMaterialBundle } from './sandShader';

interface ComposeRenderer {
  setRenderTarget: (target: THREE.WebGLRenderTarget | null) => void;
  render: (scene: THREE.Scene, camera: THREE.Camera) => void;
}

function canCompose(renderer: RendererLike): renderer is RendererLike & ComposeRenderer {
  const candidate = renderer as unknown as Partial<ComposeRenderer>;
  return typeof candidate.setRenderTarget === 'function' && typeof candidate.render === 'function';
}

export class SandPlane {
  public readonly mesh: THREE.Mesh<THREE.PlaneGeometry, THREE.MeshStandardMaterial>;
  public readonly materialBundle: SandMaterialBundle;

  public heightField: THREE.Texture | null = null;

  private readonly geometry: THREE.PlaneGeometry;
  private readonly renderer: RendererLike;
  private readonly planeSize: number;

  private footprintSystem: FootprintSystem | null = null;
  private lastFootprintRevision = -1;

  private readonly heightTarget: THREE.WebGLRenderTarget;

  private readonly composeScene = new THREE.Scene();
  private readonly composeCamera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
  private readonly composeMaterial: THREE.ShaderMaterial;
  private readonly composeQuad: THREE.Mesh<THREE.PlaneGeometry, THREE.ShaderMaterial>;

  private readonly stampA: THREE.Vector4[] = new Array<THREE.Vector4>(MAX_FOOTPRINTS);
  private readonly stampB: THREE.Vector4[] = new Array<THREE.Vector4>(MAX_FOOTPRINTS);

  private composeDirty = true;
  private lastRimHeight = Number.NaN;
  private lastCohesion = Number.NaN;
  private lastEdgeCollapse = Number.NaN;
  private lastBodyWeight = Number.NaN;
  private lastFootDepth = Number.NaN;

  constructor(renderer: RendererLike, initialParams: SandParams, size = 40, segments = 256) {
    this.renderer = renderer;
    this.planeSize = size;

    this.geometry = new THREE.PlaneGeometry(size, size, segments, segments);
    this.geometry.rotateX(-Math.PI / 2);

    this.materialBundle = createSandMaterial(initialParams);

    this.mesh = new THREE.Mesh(this.geometry, this.materialBundle.material);
    this.mesh.receiveShadow = true;
    this.mesh.castShadow = false;

    this.heightTarget = new THREE.WebGLRenderTarget(1024, 1024, {
      format: THREE.RGBAFormat,
      type: THREE.HalfFloatType,
      depthBuffer: false,
      stencilBuffer: false,
      magFilter: THREE.LinearFilter,
      minFilter: THREE.LinearFilter
    });
    this.heightTarget.texture.wrapS = THREE.ClampToEdgeWrapping;
    this.heightTarget.texture.wrapT = THREE.ClampToEdgeWrapping;
    this.heightTarget.texture.needsUpdate = true;

    for (let i = 0; i < MAX_FOOTPRINTS; i += 1) {
      this.stampA[i] = new THREE.Vector4(0, 0, 0, 1);
      this.stampB[i] = new THREE.Vector4(0, 0, 0, 0);
    }

    this.composeMaterial = new THREE.ShaderMaterial({
      uniforms: {
        uFootprintCount: { value: 0 },
        uStampMap: { value: null as THREE.Texture | null },
        uStampTexel: { value: 1 / 256 },
        uPlaneSize: { value: this.planeSize },
        uFootA: { value: this.stampA },
        uFootB: { value: this.stampB },
        uRimHeight: { value: initialParams.rimHeight * 0.7 },
        uCohesion: { value: initialParams.cohesion },
        uEdgeCollapse: { value: initialParams.edgeCollapse },
        uBodyWeight: { value: initialParams.bodyWeight },
        uFootDepth: { value: initialParams.footprintDepth }
      },
      vertexShader: `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = vec4(position.xy, 0.0, 1.0);
}`,
      fragmentShader: `
precision highp float;
uniform int uFootprintCount;
uniform sampler2D uStampMap;
uniform float uStampTexel;
uniform float uPlaneSize;
uniform vec4 uFootA[${MAX_FOOTPRINTS}];
uniform vec4 uFootB[${MAX_FOOTPRINTS}];
uniform float uRimHeight;
uniform float uCohesion;
uniform float uEdgeCollapse;
uniform float uBodyWeight;
uniform float uFootDepth;
varying vec2 vUv;

float hash12(vec2 p) {
  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
}

void main() {
  vec2 world = (vUv - 0.5) * uPlaneSize;
  float height = 0.0;
  float dark = 0.0;

  for (int i = 0; i < ${MAX_FOOTPRINTS}; i++) {
    if (i >= uFootprintCount) {
      break;
    }

    vec4 a = uFootA[i]; // x,z,yaw,ageNorm
    vec4 b = uFootB[i]; // scale,depth,side,seed

    float c = cos(a.z);
    float s = sin(a.z);

    vec2 rel = world - a.xy;
    vec2 local = vec2(c * rel.x + s * rel.y, -s * rel.x + c * rel.y) / max(1e-4, b.x);
    vec2 suv = local * 0.5 + 0.5;

    if (suv.x < 0.0 || suv.x > 1.0 || suv.y < 0.0 || suv.y > 1.0) {
      continue;
    }

    float mask = texture2D(uStampMap, suv).r;
    if (mask <= 1e-4) {
      continue;
    }

    float n = hash12(local * 7.3 + vec2(b.w * 1.31, b.w * 2.17));
    float collapse = mix(1.0, smoothstep(uEdgeCollapse, 1.0, n), uEdgeCollapse * 0.78);
    mask *= collapse;

    float blurX = texture2D(uStampMap, suv + vec2(uStampTexel, 0.0)).r;
    float blurXm = texture2D(uStampMap, suv - vec2(uStampTexel, 0.0)).r;
    float blurY = texture2D(uStampMap, suv + vec2(0.0, uStampTexel)).r;
    float blurYm = texture2D(uStampMap, suv - vec2(0.0, uStampTexel)).r;
    float outer = max(max(blurX, blurXm), max(blurY, blurYm));

    float ageFade = 1.0 - a.w;
    float depth = b.y * (0.55 + 0.45 * uBodyWeight) * (0.55 + 0.45 * uFootDepth);
    float depression = mask * depth;

    float rim = max(outer - mask, 0.0);
    rim *= uRimHeight * (0.45 + 0.55 * uCohesion) * depth * (0.6 + 0.4 * ageFade);

    height += (-depression + rim);
    dark += mask * depth * ageFade;
  }

  gl_FragColor = vec4(height, clamp(dark, 0.0, 1.0), 0.0, 1.0);
}`
    });
    this.composeMaterial.depthTest = false;
    this.composeMaterial.depthWrite = false;

    this.composeQuad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), this.composeMaterial);
    this.composeScene.add(this.composeQuad);

    this.applyFootprints(this.heightTarget.texture);
    this.resetWash();
    this.rebuildHeightField(initialParams);
  }

  setFootprintSystem(system: FootprintSystem): void {
    this.footprintSystem = system;
    this.lastFootprintRevision = -1;
    this.composeDirty = true;
  }

  update(_dt: number, params: SandParams): void {
    this.materialBundle.updateFromParams(params);

    const rim = params.rimHeight * 0.7;
    this.composeMaterial.uniforms.uRimHeight.value = rim;
    this.composeMaterial.uniforms.uCohesion.value = params.cohesion;
    this.composeMaterial.uniforms.uEdgeCollapse.value = params.edgeCollapse;
    this.composeMaterial.uniforms.uBodyWeight.value = params.bodyWeight;
    this.composeMaterial.uniforms.uFootDepth.value = params.footprintDepth;

    if (
      rim !== this.lastRimHeight ||
      params.cohesion !== this.lastCohesion ||
      params.edgeCollapse !== this.lastEdgeCollapse ||
      params.bodyWeight !== this.lastBodyWeight ||
      params.footprintDepth !== this.lastFootDepth
    ) {
      this.lastRimHeight = rim;
      this.lastCohesion = params.cohesion;
      this.lastEdgeCollapse = params.edgeCollapse;
      this.lastBodyWeight = params.bodyWeight;
      this.lastFootDepth = params.footprintDepth;
      this.composeDirty = true;
    }

    const revisionChanged = this.footprintSystem && this.footprintSystem.revision !== this.lastFootprintRevision;
    if (revisionChanged || this.composeDirty) {
      this.rebuildHeightField(params);
      if (this.footprintSystem) {
        this.lastFootprintRevision = this.footprintSystem.revision;
      }
      this.composeDirty = false;
    }
  }

  applyFootprints(heightTexture: THREE.Texture | null): void {
    this.heightField = heightTexture;
    this.materialBundle.setHeightTexture(heightTexture);
  }

  applyWash(front: number): void {
    this.setWash(front, this.materialBundle.uniforms.washProgress.value);
  }

  setWash(front: number, progress: number): void {
    this.materialBundle.uniforms.washFront.value = front;
    this.materialBundle.uniforms.washProgress.value = progress;
  }

  resetWash(): void {
    this.materialBundle.uniforms.washFront.value = 1e6;
    this.materialBundle.uniforms.washProgress.value = 0;
  }

  clearFootprintContributions(params: SandParams): void {
    this.lastFootprintRevision = -1;
    this.composeDirty = true;
    this.rebuildHeightField(params);
    if (this.footprintSystem) {
      this.lastFootprintRevision = this.footprintSystem.revision;
    }
    this.composeDirty = false;
  }

  dispose(): void {
    this.geometry.dispose();
    this.materialBundle.material.dispose();
    this.heightTarget.dispose();
    this.composeMaterial.dispose();
    this.composeQuad.geometry.dispose();
  }

  private rebuildHeightField(params: SandParams): void {
    const renderer = this.renderer;
    if (!canCompose(renderer)) {
      return;
    }

    let count = 0;
    if (this.footprintSystem) {
      const stamp = this.footprintSystem.getStampTexture(params.edgeCollapse);
      this.composeMaterial.uniforms.uStampMap.value = stamp;
      const stampImage = stamp.image as { width?: number } | undefined;
      const width = stampImage && typeof stampImage.width === 'number' ? Math.max(1, stampImage.width) : 256;
      this.composeMaterial.uniforms.uStampTexel.value = 1 / width;

      const data = this.footprintSystem.getCompositeData();
      count = data.count;
      this.composeMaterial.uniforms.uFootprintCount.value = count;

      for (let i = 0; i < count; i += 1) {
        const base = i * 4;
        this.stampA[i].set(
          data.posYawAge[base],
          data.posYawAge[base + 1],
          data.posYawAge[base + 2],
          data.posYawAge[base + 3]
        );
        this.stampB[i].set(
          data.scaleDepthSideSeed[base],
          data.scaleDepthSideSeed[base + 1],
          data.scaleDepthSideSeed[base + 2],
          data.scaleDepthSideSeed[base + 3]
        );
      }
    } else {
      this.composeMaterial.uniforms.uFootprintCount.value = 0;
      this.composeMaterial.uniforms.uStampMap.value = null;
    }

    for (let i = count; i < MAX_FOOTPRINTS; i += 1) {
      this.stampA[i].set(0, 0, 0, 1);
      this.stampB[i].set(0, 0, 0, 0);
    }

    renderer.setRenderTarget(this.heightTarget);
    renderer.render(this.composeScene, this.composeCamera);
    renderer.setRenderTarget(null);

    this.applyFootprints(this.heightTarget.texture);
  }
}
