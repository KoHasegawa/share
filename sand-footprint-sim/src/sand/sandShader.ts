import * as THREE from 'three';
import { SandParams } from './sandParams';

export interface SandShaderUniforms {
  moisture: THREE.Uniform<number>;
  hardness: THREE.Uniform<number>;
  grainSize: THREE.Uniform<number>;
  cohesion: THREE.Uniform<number>;
  bodyWeight: THREE.Uniform<number>;
  footprintDepth: THREE.Uniform<number>;
  rimHeight: THREE.Uniform<number>;
  edgeCollapse: THREE.Uniform<number>;
  decaySpeed: THREE.Uniform<number>;
  darkeningStrength: THREE.Uniform<number>;
  noiseStrength: THREE.Uniform<number>;
  washFront: THREE.Uniform<number>;
  washProgress: THREE.Uniform<number>;
  displacementScale: THREE.Uniform<number>;
}

export interface SandMaterialBundle {
  material: THREE.MeshStandardMaterial;
  uniforms: SandShaderUniforms;
  updateFromParams: (params: SandParams) => void;
  setHeightTexture: (texture: THREE.Texture | null, decodeScale?: number, decodeBias?: number) => void;
}

function fract(v: number): number {
  return v - Math.floor(v);
}

function hash2(x: number, y: number): number {
  return fract(Math.sin(x * 127.1 + y * 311.7) * 43758.5453123);
}

function smoothstep01(t: number): number {
  return t * t * (3 - 2 * t);
}

function valueNoise2(x: number, y: number): number {
  const x0 = Math.floor(x);
  const y0 = Math.floor(y);
  const x1 = x0 + 1;
  const y1 = y0 + 1;

  const fx = x - x0;
  const fy = y - y0;
  const ux = smoothstep01(fx);
  const uy = smoothstep01(fy);

  const n00 = hash2(x0, y0);
  const n10 = hash2(x1, y0);
  const n01 = hash2(x0, y1);
  const n11 = hash2(x1, y1);

  const nx0 = n00 + (n10 - n00) * ux;
  const nx1 = n01 + (n11 - n01) * ux;
  return nx0 + (nx1 - nx0) * uy;
}

function fbm(x: number, y: number, octaves: number): number {
  let value = 0;
  let amplitude = 0.5;
  let frequency = 1.0;
  let totalAmplitude = 0;

  for (let i = 0; i < octaves; i += 1) {
    value += valueNoise2(x * frequency, y * frequency) * amplitude;
    totalAmplitude += amplitude;
    frequency *= 2.03;
    amplitude *= 0.5;
  }

  return totalAmplitude > 0 ? value / totalAmplitude : 0;
}

function buildSandMaps(size = 256): {
  albedo: THREE.DataTexture;
  normal: THREE.DataTexture;
  roughness: THREE.DataTexture;
} {
  const albedoData = new Uint8Array(size * size * 4);
  const normalData = new Uint8Array(size * size * 4);
  const roughnessData = new Uint8Array(size * size * 4);
  const height = new Float32Array(size * size);

  const lowFreqScale = 4.5;
  const midFreqScale = 14.0;
  const grainFreqScale = 48.0;

  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      const idx = y * size + x;
      const u = x / size;
      const v = y / size;

      const low = fbm(u * lowFreqScale, v * lowFreqScale, 4);
      const mid = fbm(u * midFreqScale, v * midFreqScale, 3);
      const grain = fbm(u * grainFreqScale, v * grainFreqScale, 2);

      const h = low * 0.6 + mid * 0.28 + grain * 0.12;
      height[idx] = h;

      const variation = (h - 0.5) * 0.24;
      const warmBias = fbm(u * 9.3 + 19.1, v * 9.3 + 3.7, 2) * 0.08 - 0.04;

      const r = Math.min(1, Math.max(0, 0.79 + variation + warmBias * 0.8));
      const g = Math.min(1, Math.max(0, 0.72 + variation * 0.7 + warmBias * 0.55));
      const b = Math.min(1, Math.max(0, 0.58 + variation * 0.45 + warmBias * 0.2));

      const base = idx * 4;
      albedoData[base] = Math.round(r * 255);
      albedoData[base + 1] = Math.round(g * 255);
      albedoData[base + 2] = Math.round(b * 255);
      albedoData[base + 3] = 255;

      const rough = Math.min(1, Math.max(0, 0.8 - grain * 0.25 + mid * 0.08));
      const rough8 = Math.round(rough * 255);
      roughnessData[base] = rough8;
      roughnessData[base + 1] = rough8;
      roughnessData[base + 2] = rough8;
      roughnessData[base + 3] = 255;
    }
  }

  const sampleHeight = (x: number, y: number): number => {
    const xx = (x + size) % size;
    const yy = (y + size) % size;
    return height[yy * size + xx];
  };

  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      const base = (y * size + x) * 4;

      const dx = sampleHeight(x + 1, y) - sampleHeight(x - 1, y);
      const dy = sampleHeight(x, y + 1) - sampleHeight(x, y - 1);

      const nx = -dx * 3.6;
      const ny = -dy * 3.6;
      const nz = 1.0;

      const invLen = 1.0 / Math.sqrt(nx * nx + ny * ny + nz * nz);
      const sx = nx * invLen;
      const sy = ny * invLen;
      const sz = nz * invLen;

      normalData[base] = Math.round((sx * 0.5 + 0.5) * 255);
      normalData[base + 1] = Math.round((sy * 0.5 + 0.5) * 255);
      normalData[base + 2] = Math.round((sz * 0.5 + 0.5) * 255);
      normalData[base + 3] = 255;
    }
  }

  const albedo = new THREE.DataTexture(albedoData, size, size, THREE.RGBAFormat);
  albedo.colorSpace = THREE.SRGBColorSpace;
  albedo.wrapS = THREE.RepeatWrapping;
  albedo.wrapT = THREE.RepeatWrapping;
  albedo.minFilter = THREE.LinearMipmapLinearFilter;
  albedo.magFilter = THREE.LinearFilter;
  albedo.generateMipmaps = true;
  albedo.needsUpdate = true;

  const normal = new THREE.DataTexture(normalData, size, size, THREE.RGBAFormat);
  normal.wrapS = THREE.RepeatWrapping;
  normal.wrapT = THREE.RepeatWrapping;
  normal.minFilter = THREE.LinearMipmapLinearFilter;
  normal.magFilter = THREE.LinearFilter;
  normal.generateMipmaps = true;
  normal.needsUpdate = true;

  const roughness = new THREE.DataTexture(roughnessData, size, size, THREE.RGBAFormat);
  roughness.wrapS = THREE.RepeatWrapping;
  roughness.wrapT = THREE.RepeatWrapping;
  roughness.minFilter = THREE.LinearMipmapLinearFilter;
  roughness.magFilter = THREE.LinearFilter;
  roughness.generateMipmaps = true;
  roughness.needsUpdate = true;

  return { albedo, normal, roughness };
}

export function createSandMaterial(initialParams: SandParams): SandMaterialBundle {
  const maps = buildSandMaps(256);

  const material = new THREE.MeshStandardMaterial({
    color: new THREE.Color('#c7b27e'),
    map: maps.albedo,
    normalMap: maps.normal,
    normalScale: new THREE.Vector2(0.35, 0.35),
    roughnessMap: maps.roughness,
    roughness: 0.78,
    metalness: 0.0
  });

  material.map?.repeat.set(8, 8);
  material.normalMap?.repeat.set(16, 16);
  material.roughnessMap?.repeat.set(8, 8);

  const uniforms: SandShaderUniforms = {
    moisture: new THREE.Uniform(initialParams.moisture),
    hardness: new THREE.Uniform(initialParams.hardness),
    grainSize: new THREE.Uniform(initialParams.grainSize),
    cohesion: new THREE.Uniform(initialParams.cohesion),
    bodyWeight: new THREE.Uniform(initialParams.bodyWeight),
    footprintDepth: new THREE.Uniform(initialParams.footprintDepth),
    rimHeight: new THREE.Uniform(initialParams.rimHeight),
    edgeCollapse: new THREE.Uniform(initialParams.edgeCollapse),
    decaySpeed: new THREE.Uniform(initialParams.decaySpeed),
    darkeningStrength: new THREE.Uniform(initialParams.darkeningStrength),
    noiseStrength: new THREE.Uniform(initialParams.noiseStrength),
    washFront: new THREE.Uniform(1e6),
    washProgress: new THREE.Uniform(0),
    displacementScale: new THREE.Uniform(initialParams.footprintDepth * 0.45)
  };

  const fallbackHeightData = new Float32Array([0, 0, 0, 1]);
  const fallbackHeightTexture = new THREE.DataTexture(fallbackHeightData, 1, 1, THREE.RGBAFormat, THREE.FloatType);
  fallbackHeightTexture.needsUpdate = true;
  fallbackHeightTexture.minFilter = THREE.LinearFilter;
  fallbackHeightTexture.magFilter = THREE.LinearFilter;
  fallbackHeightTexture.wrapS = THREE.ClampToEdgeWrapping;
  fallbackHeightTexture.wrapT = THREE.ClampToEdgeWrapping;
  fallbackHeightTexture.generateMipmaps = false;

  const shaderHeightMap = new THREE.Uniform<THREE.Texture>(fallbackHeightTexture);
  const shaderHeightTexel = new THREE.Uniform(new THREE.Vector2(1, 1));
  const shaderHeightDecode = new THREE.Uniform(new THREE.Vector2(1, 0));

  material.onBeforeCompile = (shader): void => {
    shader.uniforms.sandHeightMap = shaderHeightMap;
    shader.uniforms.sandHeightTexel = shaderHeightTexel;
    shader.uniforms.sandHeightDecode = shaderHeightDecode;
    shader.uniforms.displacementScale = uniforms.displacementScale;
    shader.uniforms.darkeningStrength = uniforms.darkeningStrength;
    shader.uniforms.washFront = uniforms.washFront;
    shader.uniforms.washProgress = uniforms.washProgress;

    shader.vertexShader = shader.vertexShader
      .replace(
        '#include <common>',
        `#include <common>
uniform sampler2D sandHeightMap;
uniform vec2 sandHeightDecode;
uniform float displacementScale;
varying vec2 vSandUv;
varying vec2 vSandWorld;

float sampleSandHeight(vec2 uv) {
  float encoded = texture2D(sandHeightMap, uv).r;
  return (encoded - sandHeightDecode.y) * sandHeightDecode.x;
}`
      )
      .replace(
        '#include <uv_vertex>',
        `#include <uv_vertex>
vSandUv = uv;`
      )
      .replace(
        '#include <begin_vertex>',
        `vec3 transformed = vec3( position );
float sandHeight = sampleSandHeight(vSandUv);
transformed += objectNormal * (sandHeight * displacementScale);`
      )
      .replace(
        '#include <worldpos_vertex>',
        `#include <worldpos_vertex>
vSandWorld = worldPosition.xz;`
      );

    shader.fragmentShader = shader.fragmentShader
      .replace(
        '#include <common>',
        `#include <common>
uniform sampler2D sandHeightMap;
uniform vec2 sandHeightTexel;
uniform vec2 sandHeightDecode;
uniform float displacementScale;
uniform float darkeningStrength;
uniform float washFront;
uniform float washProgress;
varying vec2 vSandUv;
varying vec2 vSandWorld;

float hash12(vec2 p) {
  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
}

float sampleSandHeight(vec2 uv) {
  float encoded = texture2D(sandHeightMap, uv).r;
  return (encoded - sandHeightDecode.y) * sandHeightDecode.x;
}`
      )
      .replace(
        '#include <normal_fragment_maps>',
        `#include <normal_fragment_maps>
float hL = sampleSandHeight(vSandUv - vec2(sandHeightTexel.x, 0.0));
float hR = sampleSandHeight(vSandUv + vec2(sandHeightTexel.x, 0.0));
float hD = sampleSandHeight(vSandUv - vec2(0.0, sandHeightTexel.y));
float hU = sampleSandHeight(vSandUv + vec2(0.0, sandHeightTexel.y));
vec3 macroNormalObject = normalize(vec3((hL - hR) * displacementScale * 8.5, 1.0, (hU - hD) * displacementScale * 8.5));
vec3 macroNormalView = normalize((modelViewMatrix * vec4(macroNormalObject, 0.0)).xyz);
normal = normalize(mix(normal, macroNormalView, 0.72));`
      )
      .replace(
        '#include <map_fragment>',
        `#include <map_fragment>
float sandWashEdge = smoothstep(washFront - 0.35, washFront + 0.35, vSandWorld.y) * clamp(washProgress * 1.35, 0.0, 1.0);
float sandDryBack = smoothstep(0.45, 1.0, washProgress);
float sandFrontBand = 1.0 - smoothstep(0.02, 0.32, abs(vSandWorld.y - washFront));
float sandWetFilm = clamp(sandWashEdge * (1.0 - sandDryBack * 0.82) + sandFrontBand * 0.72, 0.0, 1.0);

float footprintDark = texture2D(sandHeightMap, vSandUv).g;
float remainingDark = footprintDark * (1.0 - sandWashEdge);
diffuseColor.rgb *= (1.0 - darkeningStrength * clamp(remainingDark, 0.0, 1.0));

float foamNoise = hash12(vSandWorld * 5.3 + vec2(washProgress * 33.7, washProgress * 17.9));
float foam = sandFrontBand * smoothstep(0.58, 0.9, foamNoise) * (1.0 - sandDryBack);

vec3 wetTint = vec3(0.88, 0.84, 0.76);
diffuseColor.rgb = mix(diffuseColor.rgb, diffuseColor.rgb * wetTint, sandWetFilm * 0.34);
diffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.96, 0.97, 0.99), foam * 0.65);`
      )
      .replace(
        '#include <roughnessmap_fragment>',
        `#include <roughnessmap_fragment>
roughnessFactor = mix(roughnessFactor, 0.22, sandWetFilm);`
      );
  };

  material.customProgramCacheKey = (): string => 'sand-heightfield-v3';

  const dryColor = new THREE.Color('#d5bf8d');
  const wetColor = new THREE.Color('#9f8a64');

  const updateFromParams = (params: SandParams): void => {
    uniforms.moisture.value = params.moisture;
    uniforms.hardness.value = params.hardness;
    uniforms.grainSize.value = params.grainSize;
    uniforms.cohesion.value = params.cohesion;
    uniforms.bodyWeight.value = params.bodyWeight;
    uniforms.footprintDepth.value = params.footprintDepth;
    uniforms.rimHeight.value = params.rimHeight;
    uniforms.edgeCollapse.value = params.edgeCollapse;
    uniforms.decaySpeed.value = params.decaySpeed;
    uniforms.darkeningStrength.value = params.darkeningStrength;
    uniforms.noiseStrength.value = params.noiseStrength;
    uniforms.displacementScale.value = params.footprintDepth * 0.45;

    const moisture = THREE.MathUtils.clamp(params.moisture, 0, 1);
    material.color.copy(dryColor).lerp(wetColor, moisture * 0.9);

    const roughness = THREE.MathUtils.clamp(0.86 - moisture * 0.42 + params.hardness * 0.06, 0.2, 0.95);
    material.roughness = roughness;

    const normalStrength = THREE.MathUtils.clamp(0.16 + params.noiseStrength * 0.7, 0.05, 1.25);
    material.normalScale.setScalar(normalStrength);
  };

  const setHeightTexture = (texture: THREE.Texture | null, decodeScale = 1, decodeBias = 0): void => {
    const target = texture ?? fallbackHeightTexture;
    shaderHeightMap.value = target;
    shaderHeightDecode.value.set(decodeScale, decodeBias);

    let width = 1;
    let height = 1;
    const image = target.image as { width?: number; height?: number } | undefined;
    if (image && typeof image.width === 'number' && typeof image.height === 'number') {
      width = Math.max(1, image.width);
      height = Math.max(1, image.height);
    }

    shaderHeightTexel.value.set(1 / width, 1 / height);
  };

  material.userData.sandUniforms = uniforms;

  updateFromParams(initialParams);

  return {
    material,
    uniforms,
    updateFromParams,
    setHeightTexture
  };
}
