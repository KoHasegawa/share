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

function clamp01(v: number): number {
  return Math.min(1, Math.max(0, v));
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

function smoothstep(edge0: number, edge1: number, x: number): number {
  if (edge0 === edge1) {
    return x < edge0 ? 0 : 1;
  }

  return smoothstep01(clamp01((x - edge0) / (edge1 - edge0)));
}

function periodicHash(ix: number, iy: number, period: number): number {
  const px = ((ix % period) + period) % period;
  const py = ((iy % period) + period) % period;
  return hash2(px, py);
}

// Seamless value noise: the lattice wraps every `period` cells, so sampling the
// unit square tiles exactly with no discontinuity at the edges.
function periodicValueNoise(x: number, y: number, period: number): number {
  const x0 = Math.floor(x);
  const y0 = Math.floor(y);

  const fx = x - x0;
  const fy = y - y0;
  const ux = smoothstep01(fx);
  const uy = smoothstep01(fy);

  const n00 = periodicHash(x0, y0, period);
  const n10 = periodicHash(x0 + 1, y0, period);
  const n01 = periodicHash(x0, y0 + 1, period);
  const n11 = periodicHash(x0 + 1, y0 + 1, period);

  const nx0 = n00 + (n10 - n00) * ux;
  const nx1 = n01 + (n11 - n01) * ux;
  return nx0 + (nx1 - nx0) * uy;
}

// Tileable fractal noise over the unit square. `baseFreq` must be an integer so
// every octave stays periodic and the generated maps remain seamless when the
// texture repeats across the sand plane. Integer offsets shift the pattern
// without breaking the wrap.
function tileFbm(u: number, v: number, baseFreq: number, octaves: number, offX = 0, offY = 0): number {
  let value = 0;
  let amplitude = 0.5;
  let frequency = baseFreq;
  let totalAmplitude = 0;

  for (let i = 0; i < octaves; i += 1) {
    value += periodicValueNoise(u * frequency + offX, v * frequency + offY, frequency) * amplitude;
    totalAmplitude += amplitude;
    frequency *= 2;
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

  // Integer base frequencies so each octave tiles exactly across the unit
  // square -> no repeating rectangular seams when the texture is mapped many
  // times across the plane.
  const duneFreq = 2;
  const lowFreq = 4;
  const midFreq = 16;
  const grainFreq = 112;

  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      const idx = y * size + x;
      const u = x / size;
      const v = y / size;

      const dune = tileFbm(u, v, duneFreq, 3, 7, -2);
      const low = tileFbm(u, v, lowFreq, 3, 19, 3);
      const mid = tileFbm(u, v, midFreq, 3, 11, 23);
      const grain = tileFbm(u, v, grainFreq, 2, 5, 13);

      const h = dune * 0.22 + low * 0.28 + mid * 0.26 + grain * 0.24;
      height[idx] = h;

      // Keep colour variation mostly mid/high frequency. The strong
      // low-frequency tonal swings used to read as repeating blocky patches
      // once the (non-seamless) tile was repeated across the surface.
      const tonal = (dune - 0.5) * 0.04 + (low - 0.5) * 0.04 + (mid - 0.5) * 0.05 + (grain - 0.5) * 0.03;
      const ochre = (tileFbm(u, v, 9, 2, 31, -4) - 0.5) * 0.04;
      const shell = smoothstep(0.74, 0.96, grain) * 0.03;
      const mineral = smoothstep(0.985, 1.0, hash2(x + 17.0, y - 11.0)) * 0.05;

      const r = clamp01(0.84 + tonal + ochre * 1.25 + shell - mineral * 0.45);
      const g = clamp01(0.75 + tonal * 0.82 + ochre * 0.72 + shell * 0.82 - mineral * 0.62);
      const b = clamp01(0.56 + tonal * 0.55 + ochre * 0.22 + shell * 0.62 - mineral * 0.72);

      const base = idx * 4;
      albedoData[base] = Math.round(r * 255);
      albedoData[base + 1] = Math.round(g * 255);
      albedoData[base + 2] = Math.round(b * 255);
      albedoData[base + 3] = 255;

      const rough = clamp01(0.86 - grain * 0.2 + mid * 0.075 + mineral * 0.12 - shell * 0.035);
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

      const nx = -dx * 4.0;
      const ny = -dy * 4.0;
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
  const maps = buildSandMaps(512);

  const material = new THREE.MeshStandardMaterial({
    color: new THREE.Color('#ead4a6'),
    map: maps.albedo,
    normalMap: maps.normal,
    normalScale: new THREE.Vector2(0.32, 0.32),
    roughnessMap: maps.roughness,
    roughness: 0.82,
    metalness: 0.0
  });

  material.map?.repeat.set(7.5, 7.5);
  material.normalMap?.repeat.set(20, 20);
  material.roughnessMap?.repeat.set(7.5, 7.5);
  material.dithering = true;

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
    displacementScale: new THREE.Uniform(initialParams.footprintDepth * 0.62)
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
    shader.uniforms.moisture = uniforms.moisture;
    shader.uniforms.noiseStrength = uniforms.noiseStrength;
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
uniform mat4 modelViewMatrix;
uniform sampler2D sandHeightMap;
uniform vec2 sandHeightTexel;
uniform vec2 sandHeightDecode;
uniform float displacementScale;
uniform float darkeningStrength;
uniform float moisture;
uniform float noiseStrength;
uniform float washFront;
uniform float washProgress;
varying vec2 vSandUv;
varying vec2 vSandWorld;

float sandHash12(vec2 p) {
  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
}

float sandValueNoise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  f = f * f * (3.0 - 2.0 * f);

  float a = sandHash12(i);
  float b = sandHash12(i + vec2(1.0, 0.0));
  float c = sandHash12(i + vec2(0.0, 1.0));
  float d = sandHash12(i + vec2(1.0, 1.0));

  return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
}

float sandFbm(vec2 p) {
  float value = 0.0;
  float amplitude = 0.5;

  value += sandValueNoise(p) * amplitude;
  p *= 2.03;
  amplitude *= 0.5;

  value += sandValueNoise(p) * amplitude;
  p *= 2.01;
  amplitude *= 0.5;

  value += sandValueNoise(p) * amplitude;
  p *= 2.07;
  amplitude *= 0.5;

  value += sandValueNoise(p) * amplitude;

  return value / 0.9375;
}

vec2 sandWarp(vec2 p) {
  float wx = sandFbm(p * 0.35 + vec2(11.3, 4.1));
  float wy = sandFbm(p * 0.35 + vec2(2.7, 19.6));
  return p + (vec2(wx, wy) - 0.5) * 1.2;
}

float sandSurfaceHeight(vec2 wp) {
  float meso = (sandFbm(wp * 0.18 + vec2(3.1, 7.7)) - 0.5) * 2.0;
  float band = sin(wp.y * 0.9);
  float ripple = (sandFbm(vec2(wp.x * 1.6, wp.y * 6.0)) - 0.5) * 2.0;
  return meso * 0.55 + band * 0.18 + ripple * 0.27;
}

vec3 sandDesaturate(vec3 color, float amount) {
  float luma = dot(color, vec3(0.2126, 0.7152, 0.0722));
  return mix(color, vec3(luma), clamp(amount, 0.0, 1.0));
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
normal = normalize(mix(normal, macroNormalView, 0.82));
vec3 sandMesoNView = normalize(vec3(-dFdx(sandSH), -dFdy(sandSH), 1.0) * vec3(1.6, 1.6, 1.0));
normal = normalize(mix(normal, normalize(vNormal + sandMesoNView * 0.6), 0.30));`
      )
      .replace(
        '#include <map_fragment>',
        `#include <map_fragment>
vec2 sandSW = sandWarp(vSandWorld);
float sandSH = sandSurfaceHeight(sandSW);

float sandShadeCenter = sampleSandHeight(vSandUv);
float sandShadeL = sampleSandHeight(vSandUv - vec2(sandHeightTexel.x, 0.0));
float sandShadeR = sampleSandHeight(vSandUv + vec2(sandHeightTexel.x, 0.0));
float sandShadeD = sampleSandHeight(vSandUv - vec2(0.0, sandHeightTexel.y));
float sandShadeU = sampleSandHeight(vSandUv + vec2(0.0, sandHeightTexel.y));
float sandShadeAverage = (sandShadeL + sandShadeR + sandShadeD + sandShadeU) * 0.25;

// Large-scale natural colour variation across the beach: broad patches of
// whiter and browner sand. Driven by warped world position (not the tiled
// texture uv), so the patches never repeat with the texture tiling.
float sandPatch = smoothstep(0.30, 0.70, sandValueNoise(sandSW * 0.16 + vec2(13.0, 7.0)));
vec3 sandWhite = diffuseColor.rgb * vec3(1.11, 1.10, 1.07);
vec3 sandBrown = diffuseColor.rgb * vec3(0.78, 0.64, 0.45);
diffuseColor.rgb = mix(sandBrown, sandWhite, sandPatch);
float sandMottle = sandValueNoise(sandSW * 0.52 + vec2(-4.0, 9.0));
diffuseColor.rgb *= 1.0 + (sandMottle - 0.5) * 0.12;

float troughAO = smoothstep(0.15, -0.5, sandSH);
diffuseColor.rgb *= 1.0 - troughAO * 0.22;
diffuseColor.rgb = mix(
  diffuseColor.rgb * vec3(0.86, 0.80, 0.68),
  diffuseColor.rgb * vec3(1.05, 1.04, 1.02),
  smoothstep(-0.3, 0.5, sandSH)
);

float grainHi = sandValueNoise(vSandWorld * 320.0);
float quartz = smoothstep(0.86, 1.0, grainHi);
float heavy = smoothstep(0.0, 0.10, grainHi);
diffuseColor.rgb += vec3(0.05) * quartz;
diffuseColor.rgb -= vec3(0.05, 0.045, 0.04) * heavy;

float heightTint = clamp(sandShadeCenter * displacementScale * 6.0, -1.0, 1.0);
diffuseColor.rgb *= 1.0 + heightTint * 0.06;
diffuseColor.rgb = mix(diffuseColor.rgb, diffuseColor.rgb * vec3(0.92, 0.86, 0.74), max(0.0, -heightTint) * 0.18);

float sandWashEdge = smoothstep(washFront - 0.38, washFront + 0.38, vSandWorld.y) * clamp(washProgress * 1.45, 0.0, 1.0);
float sandDryBack = smoothstep(0.58, 1.0, washProgress);
float sandFrontBand = 1.0 - smoothstep(0.035, 0.46, abs(vSandWorld.y - washFront));
float sandWetFilm = clamp(sandWashEdge * (1.0 - sandDryBack) + sandFrontBand * 0.48 * (1.0 - sandDryBack), 0.0, 1.0);

float sandWashRemaining = 1.0 - sandWashEdge;
float sandMoisture = clamp(moisture, 0.0, 1.0);

float sandDepressWorld = max(0.0, -sandShadeCenter) * displacementScale * sandWashRemaining;
float sandConcavityWorld = max(0.0, sandShadeAverage - sandShadeCenter) * displacementScale * sandWashRemaining;
float sandRimWorld = max(0.0, sandShadeCenter) * displacementScale * sandWashRemaining;
float sandConvexWorld = max(0.0, sandShadeCenter - sandShadeAverage) * displacementScale * sandWashRemaining;

float sandDepthAo = smoothstep(0.0010, 0.022, sandDepressWorld * 0.9 + sandConcavityWorld * 2.2);
diffuseColor.rgb *= 1.0 - sandDepthAo * 0.45;

vec2 sandRimGradient = vec2(sandShadeL - sandShadeR, sandShadeD - sandShadeU);
float sandRimSlope = length(sandRimGradient);
vec2 sandRimSlopeDir = sandRimGradient / max(sandRimSlope, 0.0001);
float sandSunFacing = clamp(dot(sandRimSlopeDir, normalize(vec2(-0.82, 0.57))) * 0.5 + 0.5, 0.0, 1.0);
float sandRimMask = smoothstep(0.001, 0.060, sandRimWorld + sandConvexWorld * 1.6);
float sandRimLight = sandRimMask * (0.025 + 0.07 * sandSunFacing) * (1.0 - sandDepthAo * 0.35);
diffuseColor.rgb += diffuseColor.rgb * sandRimLight;

float footprintDark = texture2D(sandHeightMap, vSandUv).g;
float remainingDark = footprintDark * (1.0 - sandWashEdge);
float sandStain = clamp(darkeningStrength, 0.0, 1.4) * clamp(remainingDark, 0.0, 1.0);
diffuseColor.rgb *= 1.0 - clamp(sandStain, 0.0, 0.58);

vec3 sandDampened = sandDesaturate(diffuseColor.rgb, 0.16 + sandMoisture * 0.1) * vec3(0.86, 0.87, 0.88);
diffuseColor.rgb = mix(diffuseColor.rgb, sandDampened, sandMoisture * 0.62);

float sandFoam = 0.0;
float sandSheetSheen = 0.0;
if (washProgress > 0.001) {
  float sandFrontDistance = vSandWorld.y - washFront;
  float sandWaveWarp = (sandFbm(vec2(vSandWorld.x * 0.62 + washProgress * 1.7, vSandWorld.y * 0.16 - washProgress * 0.9)) - 0.5) * 0.22;
  float sandFoamDistance = abs(sandFrontDistance + sandWaveWarp);
  float sandFoamCore = 1.0 - smoothstep(0.018, 0.16, sandFoamDistance);
  float sandFoamFeather = 1.0 - smoothstep(0.1, 0.44, sandFoamDistance);
  float sandFoamLow = sandFbm(vSandWorld * vec2(3.5, 7.0) + vec2(washProgress * 2.6, -washProgress * 6.4));
  float sandFoamMid = sandFbm(vSandWorld * vec2(12.0, 19.0) + vec2(-washProgress * 11.0, washProgress * 8.5));
  float sandFoamHigh = sandFbm(vSandWorld * vec2(34.0, 47.0) + vec2(-washProgress * 24.0, washProgress * 19.0));
  float sandFoamLace = smoothstep(0.42, 0.78, sandFoamLow) * (1.0 - smoothstep(0.68, 0.94, sandFoamMid));
  float sandFoamSpeckles = smoothstep(0.72, 0.96, sandFoamHigh) * smoothstep(0.22, 0.72, sandFoamMid);
  sandFoam = clamp((sandFoamCore * (0.65 + 0.35 * sandFoamLace) + sandFoamFeather * (sandFoamLace * 0.34 + sandFoamSpeckles * 0.42)) * sandFrontBand * (1.0 - sandDryBack) * clamp(washProgress * 2.0, 0.0, 1.0), 0.0, 1.0);

  float sandSheetNoise = sandFbm(vSandWorld * vec2(1.35, 2.05) + vec2(washProgress * 3.1, -washProgress * 2.4));
  sandSheetSheen = sandWetFilm * (0.25 + 0.75 * smoothstep(0.4, 0.88, sandSheetNoise));
}
vec3 sandWaterTint = sandDesaturate(diffuseColor.rgb, 0.26) * vec3(0.73, 0.78, 0.83);
diffuseColor.rgb = mix(diffuseColor.rgb, sandWaterTint, sandWetFilm * 0.5);
diffuseColor.rgb += vec3(0.04, 0.05, 0.055) * sandSheetSheen;
diffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.94, 0.965, 0.985), sandFoam * 0.78);
diffuseColor.rgb = min(diffuseColor.rgb, vec3(1.0));`
      )
      .replace(
        '#include <roughnessmap_fragment>',
        `#include <roughnessmap_fragment>
float sandGrainR = sandValueNoise(vSandWorld * 320.0);
roughnessFactor += (sandGrainR - 0.5) * 0.18;
float sandTroughWet = smoothstep(0.15, -0.5, sandSH);
roughnessFactor = mix(roughnessFactor, 0.5, sandTroughWet * 0.4);
roughnessFactor = mix(roughnessFactor, 0.42, clamp(footprintDark, 0.0, 1.0) * 0.55);
float sandMoistureForRoughness = clamp(moisture, 0.0, 1.0);
roughnessFactor = mix(roughnessFactor, 0.48, sandMoistureForRoughness * 0.55);
roughnessFactor = mix(roughnessFactor, 0.18, sandWetFilm * 0.86);
roughnessFactor = clamp(roughnessFactor, 0.12, 0.98);`
      );
  };

  material.customProgramCacheKey = (): string => 'sand-heightfield-v8-warped-meso';

  const dryColor = new THREE.Color('#f1ddb4');
  const wetColor = new THREE.Color('#b9a17a');

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
    uniforms.displacementScale.value = params.footprintDepth * 0.62;

    const moisture = THREE.MathUtils.clamp(params.moisture, 0, 1);
    material.color.copy(dryColor).lerp(wetColor, moisture * 0.72);

    const roughness = THREE.MathUtils.clamp(0.86 - moisture * 0.28 + params.hardness * 0.05, 0.34, 0.95);
    material.roughness = roughness;

    const normalStrength = THREE.MathUtils.clamp(0.14 + params.noiseStrength * 0.58, 0.05, 0.92);
    material.normalScale.setScalar(normalStrength);

    const grainSize = THREE.MathUtils.clamp(params.grainSize, 0.35, 2.5);
    const tonalRepeat = THREE.MathUtils.clamp(7.5 / Math.sqrt(grainSize), 5.6, 10.5);
    material.map?.repeat.set(tonalRepeat, tonalRepeat);
    material.roughnessMap?.repeat.set(tonalRepeat, tonalRepeat);

    const normalRepeat = THREE.MathUtils.clamp(20 / grainSize, 10, 38);
    material.normalMap?.repeat.set(normalRepeat, normalRepeat);
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
