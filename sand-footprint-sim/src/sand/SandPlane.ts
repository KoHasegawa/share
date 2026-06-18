import * as THREE from 'three';
import { SandParams } from './sandParams';
import { createSandMaterial, SandMaterialBundle } from './sandShader';

export class SandPlane {
  public readonly mesh: THREE.Mesh<THREE.PlaneGeometry, THREE.MeshStandardMaterial>;
  public readonly materialBundle: SandMaterialBundle;

  // Hook for Batch B: height-field texture/render-target will be connected here.
  public heightField: THREE.Texture | null = null;

  private readonly geometry: THREE.PlaneGeometry;

  constructor(initialParams: SandParams, size = 40, segments = 256) {
    this.geometry = new THREE.PlaneGeometry(size, size, segments, segments);
    this.geometry.rotateX(-Math.PI / 2);

    this.materialBundle = createSandMaterial(initialParams);

    this.mesh = new THREE.Mesh(this.geometry, this.materialBundle.material);
    this.mesh.receiveShadow = true;
    this.mesh.castShadow = false;
  }

  update(_dt: number, params: SandParams): void {
    this.materialBundle.updateFromParams(params);
  }

  // Batch B hook: connect HeightField source texture and stamp accumulation result.
  applyFootprints(heightTexture: THREE.Texture | null): void {
    this.heightField = heightTexture;
    this.materialBundle.setHeightTexture(heightTexture);
  }

  // Batch B hook: Wash wave front value can be used by sand shader modulation.
  applyWash(front: number): void {
    this.materialBundle.uniforms.washFront.value = front;
  }

  dispose(): void {
    this.geometry.dispose();
    this.materialBundle.material.dispose();
  }
}
