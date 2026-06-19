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
  sandTone: number; // 0 = white beach, 0.5 = golden, 1 = deep brown/ochre.
}

export const defaultSandParams: SandParams = {
  moisture: 0.06, // Dry beach sand: pale and loose rather than damp and dark.
  hardness: 0.51, // Firmer surface so paw walls stay crisp instead of slumping.
  grainSize: 0.79, // Coarser grain reads as real coastal sand at this zoom.
  cohesion: 0.53, // Balanced rim hold around each pad.
  bodyWeight: 0.4, // Lighter pressure: clear but not exaggerated prints.
  footprintDepth: 0.5, // Moderate centre depression.
  rimHeight: 0.3, // Visible lip of displaced sand, restrained by the softer mask gradient.
  edgeCollapse: 0.4, // Stronger crumbling softens sharp outlines while preserving anatomy.
  decaySpeed: 0.71, // Prints fade fairly quickly so the beach stays fresh.
  darkeningStrength: 0.47, // Fresh damp dents darken for contrast without looking painted.
  noiseStrength: 0.36, // Fine procedural grain supports the print rather than obscuring it.
  sandTone: 0.5 // Golden beach by default; lower for white sand, higher for brown.
};
