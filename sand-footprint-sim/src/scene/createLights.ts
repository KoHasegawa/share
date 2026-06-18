import * as THREE from 'three';

export interface SceneLights {
  directional: THREE.DirectionalLight;
  hemisphere: THREE.HemisphereLight;
  ambient: THREE.AmbientLight;
}

export function createLights(scene: THREE.Scene): SceneLights {
  const ambient = new THREE.AmbientLight(0xffffff, 0.12);
  scene.add(ambient);

  const hemisphere = new THREE.HemisphereLight(0xddeeff, 0xa58f72, 0.45);
  scene.add(hemisphere);

  const directional = new THREE.DirectionalLight(0xfff4df, 1.45);
  directional.position.set(7, 11, 5);
  directional.castShadow = true;
  directional.shadow.mapSize.set(1024, 1024);
  directional.shadow.bias = -0.00008;
  directional.shadow.normalBias = 0.02;

  const shadowExtent = 10;
  directional.shadow.camera.left = -shadowExtent;
  directional.shadow.camera.right = shadowExtent;
  directional.shadow.camera.top = shadowExtent;
  directional.shadow.camera.bottom = -shadowExtent;
  directional.shadow.camera.near = 0.5;
  directional.shadow.camera.far = 40;

  scene.add(directional);

  return {
    directional,
    hemisphere,
    ambient
  };
}
