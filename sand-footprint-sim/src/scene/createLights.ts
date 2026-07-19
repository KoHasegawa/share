import * as THREE from 'three';

export interface SceneLights {
  directional: THREE.DirectionalLight;
  hemisphere: THREE.HemisphereLight;
  ambient: THREE.AmbientLight;
}

export function createLights(scene: THREE.Scene): SceneLights {
  const ambient = new THREE.AmbientLight(0xfff7ec, 0.18);
  scene.add(ambient);

  // 地面反射色も明るいクリームに(暗い土色だと砂全体が茶に沈む)
  const hemisphere = new THREE.HemisphereLight(0xdcecff, 0xc8c0b0, 0.52);
  scene.add(hemisphere);

  // 設計書 §9 どおり仰角 ~35° の斜光にする。真上からのトップダウン視点でも
  // 足跡の窪み・縁の凹凸が陰影として立体的に読めるようにする。
  const directional = new THREE.DirectionalLight(0xffedcf, 1.85);
  directional.position.set(5.4, 4.6, -3.2);
  directional.castShadow = true;
  directional.shadow.mapSize.set(1024, 1024);
  directional.shadow.bias = -0.00012;
  directional.shadow.normalBias = 0.014;
  directional.shadow.radius = 1.6;

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
