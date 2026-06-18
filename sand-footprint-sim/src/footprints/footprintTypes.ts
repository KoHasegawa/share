import * as THREE from 'three';
import { generatePawStampTexture, PawStampOptions } from './pawStamp';

export interface FootprintType {
  id: string;
  aspect: number;
  generateStampTexture: (opts: PawStampOptions) => THREE.Texture;
}

export const dogFootprint: FootprintType = {
  id: 'dog',
  aspect: 0.92,
  generateStampTexture: (opts: PawStampOptions): THREE.Texture => generatePawStampTexture(opts)
};
