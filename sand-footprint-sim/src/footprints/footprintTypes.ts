import * as THREE from 'three';
import {
  generateDisturbanceStampAtlas,
  generateDisturbanceStampTexture,
  generatePawStampAtlas,
  generatePawStampTexture,
  PawStampAtlas,
  PawStampOptions
} from './pawStamp';

export interface FootprintType {
  id: string;
  aspect: number;
  generateStampTexture: (opts: PawStampOptions) => THREE.Texture;
  generateStampAtlas: (opts: PawStampOptions) => PawStampAtlas;
}

// 既定: 乾いた砂の攪乱表現。肉球の形は残さず「犬が歩いた後の砂の乱れ」
// (崩れた窪み+後方へ押し出された縁+蹴り散らし)として跡を刻む。
export const dogFootprint: FootprintType = {
  id: 'dog-dry-sand',
  aspect: 1.0,
  generateStampTexture: (opts: PawStampOptions): THREE.Texture => generateDisturbanceStampTexture(opts),
  generateStampAtlas: (opts: PawStampOptions): PawStampAtlas => generateDisturbanceStampAtlas(opts)
};

// 旧表現(解剖学的な肉球+指球)。湿った砂など輪郭が残る条件向けに保持。
export const dogPawPrint: FootprintType = {
  id: 'dog-paw',
  aspect: 0.92,
  generateStampTexture: (opts: PawStampOptions): THREE.Texture => generatePawStampTexture(opts),
  generateStampAtlas: (opts: PawStampOptions): PawStampAtlas => generatePawStampAtlas(opts)
};
