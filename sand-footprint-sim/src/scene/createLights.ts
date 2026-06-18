import * as THREE from 'three';

export interface SceneLights {
  directional: THREE.DirectionalLight;
  hemisphere: THREE.HemisphereLight;
  ambient: THREE.AmbientLight;
}

export function createLights(scene: THREE.Scene): SceneLights {
  const ambient = new THREE.AmbientLight(0xfff4e4, 0.08);
  scene.add(ambient);

  const hemisphere = new THREE.HemisphereLight(0xdcecff, 0xb79b74, 0.52);
  scene.add(hemisphere);

  const directional = new THREE.DirectionalLight(0xffedcf, 2.05);
  directional.position.set(7.8, 6.2, -5.4);
  directional.castShadow = true;
  directional.shadow.mapSize.set(1024, 1024);
  directional.shadow.bias = -0.00012;
  directional.shadow.normalBias = 0.014;
  directional.shadow.radius = 3.25;

  const shadowExtent = 12.5;
  directional.shadow.camera.left = -shadowExtent;
  directional.shadow.camera.right = shadowExtent;
  directional.shadow.camera.top = shadowExtent;
  directional.shadow.camera.bottom = -shadowExtent;
  directional.shadow.camera.near = 0.25;
  directional.shadow.camera.far = 42;
  directional.shadow.camera.updateProjectionMatrix();

  scene.add(directional);

  return {
    directional,
    hemisphere,
    ambient
  };
}
