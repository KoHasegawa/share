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
  moisture: 0.04, // 乾いた珊瑚砂: 明るくサラサラ。湿り暗化はほぼなし。
  hardness: 0.42, // 柔らかめ: 足が沈み、輪郭は崩れる。
  grainSize: 0.82, // 粗めの粒感(実際の海岸砂のスケール感)。
  cohesion: 0.5, // 縁は残るが崩れやすいバランス。
  bodyWeight: 0.45, // 沈み込みは明瞭に、誇張はしない。
  footprintDepth: 0.55, // 中央の窪みはややはっきり。
  rimHeight: 0.44, // 押し出された縁+蹴り散らしが読める高さ。
  edgeCollapse: 0.58, // 乾いた砂: 輪郭は大きく崩れる(肉球の形は残らない)。
  decaySpeed: 0.45, // 乾いた砂の跡は急には消えない。
  darkeningStrength: 0.22, // 乾いた砂は色がほぼ変わらない: 陰影主体。
  noiseStrength: 0.42, // 粒の微細凹凸をやや強めに(写真の質感)。
  sandTone: 0.18 // クリーム寄りの珊瑚砂(白0〜金0.5の間)。
};
