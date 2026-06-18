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
  moisture: 0.58, // Slightly damp beach sand: darker and cohesive, but not glossy-wet.
  hardness: 0.34, // Soft enough for rounded paw dents while avoiding exaggerated sink-in.
  grainSize: 0.44, // Fine coastal sand grain scale, keeping surface detail subtle.
  cohesion: 0.68, // Damp grains hold a readable raised rim around each pad.
  bodyWeight: 0.68, // Medium dog pressure gives clear prints without cartoon depth.
  footprintDepth: 0.64, // Strong center depression to work with the new smooth grayscale mask.
  rimHeight: 0.38, // Visible lip of displaced sand, restrained by the softer mask gradient.
  edgeCollapse: 0.28, // Mild crumbling breaks perfect outlines while preserving anatomy.
  decaySpeed: 0.24, // Prints linger long enough to read, then gently fade over time.
  darkeningStrength: 0.47, // Fresh damp dents darken for contrast without looking painted.
  noiseStrength: 0.36 // Fine procedural grain supports the print rather than obscuring it.
};
