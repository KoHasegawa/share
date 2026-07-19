import * as THREE from 'three';
import { RendererLike } from '../scene/createRenderer';
import { FootprintSystem, MAX_FOOTPRINTS } from '../footprints/FootprintSystem';
import { SandParams } from './sandParams';
import { createSandMaterial, SandMaterialBundle } from './sandShader';

interface ComposeRenderer {
  setRenderTarget: (target: THREE.WebGLRenderTarget | null) => void;
  render: (scene: THREE.Scene, camera: THREE.Camera) => void;
}

interface HeightTargetConfig {
  type: THREE.TextureDataType;
  minFilter: THREE.MinificationTextureFilter;
  magFilter: THREE.MagnificationTextureFilter;
  encodeScale: number;
  encodeBias: number;
  encoded: boolean;
}

function canCompose(renderer: RendererLike): renderer is RendererLike & ComposeRenderer {
  const candidate = renderer as unknown as Partial<ComposeRenderer>;
  return typeof candidate.setRenderTarget === 'function' && typeof candidate.render === 'function';
}

function isWebGLRenderer(renderer: RendererLike): renderer is RendererLike & THREE.WebGLRenderer {
  return ((renderer as unknown as { isWebGLRenderer?: boolean }).isWebGLRenderer === true);
}

function chooseHeightTargetConfig(renderer: RendererLike): HeightTargetConfig {
  if (!isWebGLRenderer(renderer)) {
    return {
      type: THREE.HalfFloatType,
      minFilter: THREE.LinearFilter,
      magFilter: THREE.LinearFilter,
      encodeScale: 1,
      encodeBias: 0,
      encoded: false
    };
  }

  const extensions = renderer.extensions;
  const hasColorBufferFloat = extensions.has('EXT_color_buffer_float');
  const hasFloatLinear = extensions.has('OES_texture_float_linear');

  if (hasColorBufferFloat) {
    return {
      type: THREE.HalfFloatType,
      minFilter: THREE.LinearFilter,
      magFilter: THREE.LinearFilter,
      encodeScale: 1,
      encodeBias: 0,
      encoded: false
    };
  }

  if (hasFloatLinear) {
    return {
      type: THREE.FloatType,
      minFilter: THREE.LinearFilter,
      magFilter: THREE.LinearFilter,
      encodeScale: 1,
      encodeBias: 0,
      encoded: false
    };
  }

  if (renderer.capabilities.isWebGL2) {
    return {
      type: THREE.HalfFloatType,
      minFilter: THREE.NearestFilter,
      magFilter: THREE.NearestFilter,
      encodeScale: 1,
      encodeBias: 0,
      encoded: false
    };
  }

  return {
    type: THREE.UnsignedByteType,
    minFilter: THREE.NearestFilter,
    magFilter: THREE.NearestFilter,
    encodeScale: 0.2,
    encodeBias: 0.5,
    encoded: true
  };
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
  private readonly heightDecodeScale: number;
  private readonly heightDecodeBias: number;

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

  constructor(renderer: RendererLike, initialParams: SandParams, size = 40, segments = 384) {
    this.renderer = renderer;
    this.planeSize = size;

    this.geometry = new THREE.PlaneGeometry(size, size, segments, segments);
    this.geometry.rotateX(-Math.PI / 2);

    this.materialBundle = createSandMaterial(initialParams);

    this.mesh = new THREE.Mesh(this.geometry, this.materialBundle.material);
    this.mesh.receiveShadow = true;
    this.mesh.castShadow = false;

    const targetConfig = chooseHeightTargetConfig(renderer);
    this.heightTarget = new THREE.WebGLRenderTarget(1024, 1024, {
      format: THREE.RGBAFormat,
      type: targetConfig.type,
      depthBuffer: false,
      stencilBuffer: false,
      magFilter: targetConfig.magFilter,
      minFilter: targetConfig.minFilter
    });
    this.heightTarget.texture.wrapS = THREE.ClampToEdgeWrapping;
    this.heightTarget.texture.wrapT = THREE.ClampToEdgeWrapping;
    this.heightTarget.texture.needsUpdate = true;

    this.heightDecodeScale = targetConfig.encoded ? 1 / targetConfig.encodeScale : 1;
    this.heightDecodeBias = targetConfig.encoded ? targetConfig.encodeBias : 0;

    for (let i = 0; i < MAX_FOOTPRINTS; i += 1) {
      this.stampA[i] = new THREE.Vector4(0, 0, 0, 1);
      this.stampB[i] = new THREE.Vector4(0, 0, 1, 0);
    }

    this.composeMaterial = new THREE.ShaderMaterial({
      uniforms: {
        uFootprintCount: { value: 0 },
        uStampMap: { value: null as THREE.Texture | null },
        uStampTexel: { value: new THREE.Vector2(1 / 768, 1 / 512) },
        uStampGrid: { value: new THREE.Vector2(3, 2) },
        uTileCount: { value: 6 },
        uPlaneSize: { value: this.planeSize },
        uFootA: { value: this.stampA },
        uFootB: { value: this.stampB },
        uRimHeight: { value: initialParams.rimHeight * 0.92 },
        uCohesion: { value: initialParams.cohesion },
        uEdgeCollapse: { value: initialParams.edgeCollapse },
        uBodyWeight: { value: initialParams.bodyWeight },
        uFootDepth: { value: initialParams.footprintDepth },
        uEncodeHeight: { value: targetConfig.encoded ? 1.0 : 0.0 },
        uHeightEncodeScale: { value: targetConfig.encodeScale },
        uHeightEncodeBias: { value: targetConfig.encodeBias }
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
uniform vec2 uStampTexel;
uniform vec2 uStampGrid;
uniform float uTileCount;
uniform float uPlaneSize;
uniform vec4 uFootA[${MAX_FOOTPRINTS}];
uniform vec4 uFootB[${MAX_FOOTPRINTS}];
uniform float uRimHeight;
uniform float uCohesion;
uniform float uEdgeCollapse;
uniform float uBodyWeight;
uniform float uFootDepth;
uniform float uEncodeHeight;
uniform float uHeightEncodeScale;
uniform float uHeightEncodeBias;
varying vec2 vUv;

float hash12(vec2 p) {
  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
}

float valueNoise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  float a = hash12(i);
  float b = hash12(i + vec2(1.0, 0.0));
  float c = hash12(i + vec2(0.0, 1.0));
  float d = hash12(i + vec2(1.0, 1.0));
  return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
}

void main() {
  vec2 world = vec2((vUv.x - 0.5) * uPlaneSize, (0.5 - vUv.y) * uPlaneSize);
  float height = 0.0;
  float dark = 0.0;

  for (int i = 0; i < ${MAX_FOOTPRINTS}; i++) {
    if (i >= uFootprintCount) {
      break;
    }

    vec4 a = uFootA[i]; // x,z,yaw,ageNorm
    vec4 b = uFootB[i]; // scale,depth,aspectSigned,seed

    float c = cos(a.z);
    float s = sin(a.z);

    vec2 rel = world - a.xy;
    vec2 local = vec2(c * rel.x + s * rel.y, -s * rel.x + c * rel.y) / max(1e-4, b.x);
    float aspect = max(0.15, abs(b.z));
    local.x /= aspect;

    vec2 suv = local * 0.5 + 0.5;

    if (suv.x < 0.0 || suv.x > 1.0 || suv.y < 0.0 || suv.y > 1.0) {
      continue;
    }

    // Pick a paw variant from the atlas based on this print's seed, then remap
    // the tile-local uv into that atlas cell.
    float fi = fract(sin(b.w * 12.9898 + 4.21) * 43758.5453);
    float tileI = min(floor(fi * uTileCount), uTileCount - 1.0);
    vec2 cell = vec2(mod(tileI, uStampGrid.x), floor(tileI / uStampGrid.x));
    vec2 atlasUv = (cell + suv) / uStampGrid;

    vec4 stampSample = texture2D(uStampMap, atlasUv);
    float mask = stampSample.r;
    float mound = stampSample.g;
    if (max(mask, mound) <= 1e-4) {
      continue;
    }

    // 崩れはスタンプ側(paintDisturbance)に焼き込み済み。ここでは低周波の
    // 緩やかな深さムラだけ加える。テクセル単位のホワイトノイズを掛けると
    // 法線(隣接差分)が乱れて点描状になるため厳禁。
    float n = valueNoise(local * 3.0 + vec2(b.w * 0.31, b.w * 0.17));
    float collapse = mix(1.0, 0.72 + 0.56 * n, uEdgeCollapse * 0.6);
    mask *= collapse;

    float blurX = texture2D(uStampMap, atlasUv + vec2(uStampTexel.x, 0.0)).r;
    float blurXm = texture2D(uStampMap, atlasUv - vec2(uStampTexel.x, 0.0)).r;
    float blurY = texture2D(uStampMap, atlasUv + vec2(0.0, uStampTexel.y)).r;
    float blurYm = texture2D(uStampMap, atlasUv - vec2(0.0, uStampTexel.y)).r;
    float outer = max(max(blurX, blurXm), max(blurY, blurYm));

    float ageFade = 1.0 - a.w;
    float depth = b.y * (0.55 + 0.45 * uBodyWeight) * (0.55 + 0.45 * uFootDepth);
    float depression = mask * depth;

    // 縁の方向性(後方バイアス)はスタンプのGチャンネルに焼き込み済み。
    // ここでは輪郭のわずかな立ち上がり(wallAO)だけ薄く残す。
    float wallAO = max(outer - mask, 0.0);
    float rim = wallAO * 0.35;
    rim *= uRimHeight * (0.45 + 0.55 * uCohesion) * depth * (0.6 + 0.4 * ageFade);

    float bottomNoise = valueNoise(world * 9.0 + vec2(b.w)) - 0.5;

    height += (-depression + rim);
    // 押し出された縁+蹴り散らし(G)が盛り上がりの主体
    height += mound * depth * (0.35 + 0.85 * uRimHeight) * (0.5 + 0.5 * uCohesion) * ageFade;
    height += bottomNoise * depression * 0.14;
    // 乾いた砂は色がほぼ変わらない: 陰影主体。wallAO由来の点状の暗化は
    // ノイズの多いマスクでちらつくため、なだらかな内部マスク中心にする。
    dark += clamp((wallAO * 0.3 + mask * 0.45) * depth * ageFade, 0.0, 1.0);
  }

  float outHeight = height;
  if (uEncodeHeight > 0.5) {
    outHeight = clamp(height * uHeightEncodeScale + uHeightEncodeBias, 0.0, 1.0);
  }

  gl_FragColor = vec4(outHeight, clamp(dark, 0.0, 1.0), 0.0, 1.0);
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

    const rim = params.rimHeight * 0.92;
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
    this.materialBundle.setHeightTexture(heightTexture, this.heightDecodeScale, this.heightDecodeBias);
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
      const atlas = this.footprintSystem.getStampAtlas();
      this.composeMaterial.uniforms.uStampMap.value = atlas.texture;
      this.composeMaterial.uniforms.uStampTexel.value.set(
        1 / (atlas.tileSize * atlas.cols),
        1 / (atlas.tileSize * atlas.rows)
      );
      this.composeMaterial.uniforms.uStampGrid.value.set(atlas.cols, atlas.rows);
      this.composeMaterial.uniforms.uTileCount.value = atlas.count;

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
          data.scaleDepthAspectSeed[base],
          data.scaleDepthAspectSeed[base + 1],
          data.scaleDepthAspectSeed[base + 2],
          data.scaleDepthAspectSeed[base + 3]
        );
      }
    } else {
      this.composeMaterial.uniforms.uFootprintCount.value = 0;
      this.composeMaterial.uniforms.uStampMap.value = null;
    }

    for (let i = count; i < MAX_FOOTPRINTS; i += 1) {
      this.stampA[i].set(0, 0, 0, 1);
      this.stampB[i].set(0, 0, 1, 0);
    }

    renderer.setRenderTarget(this.heightTarget);
    renderer.render(this.composeScene, this.composeCamera);
    renderer.setRenderTarget(null);

    this.applyFootprints(this.heightTarget.texture);
  }
}
