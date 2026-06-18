export interface SandParams {
  moisture: number;
  hardness: number;
  grainSize: number;
  cohesion: number;
  bodyWeight: number;
  footprintDepth: number;
  rimHeight: number;
  edgeCollapse: number;
  decaySpeed: number;
  darkeningStrength: number;
  noiseStrength: number;
}

export const defaultSandParams: SandParams = {
  moisture: 0.42,
  hardness: 0.48,
  grainSize: 0.52,
  cohesion: 0.57,
  bodyWeight: 0.62,
  footprintDepth: 0.6,
  rimHeight: 0.45,
  edgeCollapse: 0.32,
  decaySpeed: 0.35,
  darkeningStrength: 0.5,
  noiseStrength: 0.46
};
