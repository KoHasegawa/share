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

  xLeft: number;
  xRight: number;
  formabilityLo: number;
  formabilityHi: number;
  persistenceDecayHi: number;
  persistenceDecayLo: number;
  footprintAppearDuration: number;

  dogCount: number;
  dogWorldSize: number;
  dogTextureSize: number;
  dogMaxSpeed: number;
  dogArriveRadius: number;
  dogSepRadius: number;
  dogStride: number;
  dogAcceleration: number;
  dogSeparationStrength: number;
  dogWanderSpeedFactor: number;
  dogWanderTurnRate: number;
  dogBoundsPadding: number;
  dogFootTrackHalf: number;
  dogFootForeOffset: number;
  dogFootHindOffset: number;
  dogFootFrontScale: number;
  dogFootHindScale: number;
  dogFootFrontWeight: number;
  dogFootHindWeight: number;
  dogFootFrontAspect: number;
  dogFootHindAspect: number;
  dogFootToeOutFront: number;
  dogFootToeOutHind: number;
  dogFootAngleJitter: number;
  dogFootScaleJitter: number;

  targetLifetime: number;
  targetWorldSize: number;
}

export const defaultSandParams: SandParams = {
  moisture: 0.32, // Slightly damp, grey-taupe beach sand rather than dry gold.
  hardness: 0.54, // Firm enough for readable paw shapes without harsh ridges.
  grainSize: 0.74, // Coarse coastal grain, softened a little for subtler prints.
  cohesion: 0.57, // Damp cohesion keeps low rims coherent.
  bodyWeight: 0.3, // Lighter pressure for dog-driven, understated tracks.
  footprintDepth: 0.36, // Existing normalized range: shallower than the old 0.5.
  rimHeight: 0.21, // Restrained lip of displaced sand.
  edgeCollapse: 0.43, // Mildly crumbly edges avoid a stamped/painted look.
  decaySpeed: 0.71, // Base fade speed; per-print x bias makes right side persist.
  darkeningStrength: 0.33, // Fresh dents darken subtly.
  noiseStrength: 0.34, // Fine procedural grain supports the print.
  sandTone: 0.24, // Lower than golden default: grey/taupe wet beach.

  xLeft: -10.0,
  xRight: 10.0,
  formabilityLo: 0.42,
  formabilityHi: 1.0,
  persistenceDecayHi: 1.75, // Left side: larger decay bias, faster fade.
  persistenceDecayLo: 0.42, // Right side: smaller decay bias, longer-lived prints.
  footprintAppearDuration: 0.18,

  dogCount: 5,
  dogWorldSize: 0.82,
  dogTextureSize: 256,
  dogMaxSpeed: 2.45,
  dogArriveRadius: 0.55,
  dogSepRadius: 0.78,
  dogStride: 0.34,
  dogAcceleration: 5.2,
  dogSeparationStrength: 2.6,
  dogWanderSpeedFactor: 0.5,
  dogWanderTurnRate: 1.35,
  dogBoundsPadding: 0.72,
  dogFootTrackHalf: 0.105,
  dogFootForeOffset: 0.145,
  dogFootHindOffset: -0.145,
  dogFootFrontScale: 1.0,
  dogFootHindScale: 0.82,
  dogFootFrontWeight: 1.08,
  dogFootHindWeight: 0.7,
  dogFootFrontAspect: 1.05,
  dogFootHindAspect: 0.86,
  dogFootToeOutFront: 0.19,
  dogFootToeOutHind: 0.06,
  dogFootAngleJitter: 0.09,
  dogFootScaleJitter: 0.09,

  targetLifetime: 5.0,
  targetWorldSize: 0.34
};
