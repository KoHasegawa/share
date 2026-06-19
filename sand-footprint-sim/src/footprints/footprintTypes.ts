import * as THREE from 'three';
import { generatePawStampAtlas, generatePawStampTexture, PawStampAtlas, PawStampOptions } from './pawStamp';

export interface FootprintType {
  id: string;
  aspect: number;
  generateStampTexture: (opts: PawStampOptions) => THREE.Texture;
  generateStampAtlas: (opts: PawStampOptions) => PawStampAtlas;
}

export const dogFootprint: FootprintType = {
  id: 'dog',
  aspect: 0.92,
  generateStampTexture: (opts: PawStampOptions): THREE.Texture => generatePawStampTexture(opts),
  generateStampAtlas: (opts: PawStampOptions): PawStampAtlas => generatePawStampAtlas(opts)
};
