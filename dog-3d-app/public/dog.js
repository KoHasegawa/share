import * as THREE from 'three';

const POSES = {
  stand: {
    front: 0,
    back: 0,
    bodyTilt: 0,
    headTilt: 0,
  },
  sit: {
    front: -0.35,
    back: 0.75,
    bodyTilt: -0.3,
    headTilt: 0.18,
  },
  lie_down: {
    front: -0.65,
    back: 1.15,
    bodyTilt: -0.6,
    headTilt: 0.35,
  },
};

export class DogController {
  constructor(sceneContext, options = {}) {
    this.scene = sceneContext.scene;
    this.targets = sceneContext.targets;
    this.sand = sceneContext.sand || null;
    this.onBark = options.onBark || (() => {});
    this.strideAccum = 0;
    this.gaitPhase = 0;
    this.jumpY = 0;
    this._pawWorld = new THREE.Vector3();
    this._moveDir = new THREE.Vector3(0, 0, 1);

    this.root = new THREE.Group();
    this.root.position.set(0, 0, 0);

    this.time = 0;
    this.currentAnimation = 'idle';
    this.pose = 'stand';
    this.poseTransition = null;
    this.movement = null;
    this.rotationAction = null;
    this.specialAction = null;

    this.buildDog();
    this.scene.add(this.root);
  }

  update(delta) {
    this.time += delta;
    this.updatePose(delta);
    this.updateMovement(delta);
    this.updateRotation(delta);
    this.updateSpecial(delta);
    this.applyAnimation(delta);
    this.applyGrounding();
  }

  applyGrounding() {
    // 砂の起伏に接地させる(ジャンプ中はその高さを加算)
    const groundY = this.sand
      ? this.sand.surfaceHeightAt(this.root.position.x, this.root.position.z)
      : 0;
    this.root.position.y = groundY + this.jumpY;
  }

  interrupt() {
    if (this.movement && this.movement.resolve) {
      this.movement.resolve();
    }
    if (this.rotationAction && this.rotationAction.resolve) {
      this.rotationAction.resolve();
    }
    if (this.specialAction && this.specialAction.resolve) {
      this.specialAction.resolve();
    }
    this.movement = null;
    this.rotationAction = null;
    this.specialAction = null;
    this.poseTransition = null;
    this.setAnimation('idle');
    this.setPoseInstant(this.pose);
  }

  idle() {
    this.setAnimation('idle');
    return Promise.resolve();
  }

  moveTo(target, speed = 'walk') {
    const destination = this.targets[target];
    if (!destination) {
      return Promise.resolve();
    }

    return new Promise((resolve) => {
      this.movement = {
        target,
        destination: destination.clone(),
        speed: speed === 'run' ? 3.5 : 1.8,
        resolve,
      };
      this.setAnimation(speed === 'run' ? 'run' : 'walk');
    });
  }

  returnToUser() {
    return this.moveTo('user', 'walk');
  }

  playAnimation(name) {
    if (!name) {
      return this.idle();
    }
    switch (name) {
      case 'sit':
        return this.transitionPose('sit', 1.2);
      case 'lie_down':
        return this.transitionPose('lie_down', 1.4);
      case 'walk':
        this.setAnimation('walk');
        return this.wait(1.5);
      case 'run':
        this.setAnimation('run');
        return this.wait(1.2);
      case 'wag_tail':
        return this.wagTail();
      case 'sniff':
        return this.sniff();
      case 'jump':
        return this.jump();
      case 'bark':
        return this.bark();
      case 'idle':
      default:
        return this.wait(0.8).then(() => this.idle());
    }
  }

  lookAt(target) {
    const destination = this.targets[target];
    if (!destination) {
      return Promise.resolve();
    }
    const direction = new THREE.Vector3().subVectors(destination, this.root.position);
    const yaw = Math.atan2(direction.x, direction.z);

    return new Promise((resolve) => {
      this.rotationAction = {
        start: this.root.rotation.y,
        end: yaw,
        elapsed: 0,
        duration: 0.6,
        resolve,
      };
    });
  }

  wait(duration = 1) {
    return new Promise((resolve) => {
      this.specialAction = {
        type: 'wait',
        elapsed: 0,
        duration,
        resolve,
      };
      this.setAnimation('idle');
    });
  }

  bark() {
    return new Promise((resolve) => {
      this.specialAction = {
        type: 'bark',
        elapsed: 0,
        duration: 1.2,
        resolve,
      };
      this.setAnimation('idle');
      this.onBark(true);
    });
  }

  wagTail() {
    return new Promise((resolve) => {
      this.specialAction = {
        type: 'wag_tail',
        elapsed: 0,
        duration: 2.4,
        resolve,
      };
      this.setAnimation('idle');
    });
  }

  sniff() {
    return new Promise((resolve) => {
      this.specialAction = {
        type: 'sniff',
        elapsed: 0,
        duration: 1.6,
        resolve,
      };
      this.setAnimation('idle');
    });
  }

  jump() {
    return new Promise((resolve) => {
      this.specialAction = {
        type: 'jump',
        elapsed: 0,
        duration: 1.2,
        resolve,
      };
      this.setAnimation('run');
    });
  }

  transitionPose(targetPose, duration) {
    return new Promise((resolve) => {
      this.poseTransition = {
        from: this.pose,
        to: targetPose,
        duration,
        elapsed: 0,
        resolve,
      };
    });
  }

  buildDog() {
    const furMain = new THREE.MeshStandardMaterial({ color: 0x8a6547, roughness: 0.68 });
    const furDark = new THREE.MeshStandardMaterial({ color: 0x4a3623, roughness: 0.62 });
    const furLight = new THREE.MeshStandardMaterial({ color: 0xdcc8a8, roughness: 0.45 });
    const noseMaterial = new THREE.MeshStandardMaterial({ color: 0x251d1a, roughness: 0.3, metalness: 0.1 });
    const eyeMaterial = new THREE.MeshStandardMaterial({ color: 0x0f1113, roughness: 0.15, metalness: 0.35 });

    const bodyGeometry = new THREE.CapsuleGeometry(0.42, 1.35, 14, 24);
    bodyGeometry.rotateZ(Math.PI / 2);
    const body = new THREE.Mesh(bodyGeometry, furMain);
    body.castShadow = true;
    body.receiveShadow = true;
    body.position.set(-0.05, 0.95, 0);

    const bellyGeometry = new THREE.CapsuleGeometry(0.28, 0.55, 12, 18);
    bellyGeometry.rotateZ(Math.PI / 2);
    const belly = new THREE.Mesh(bellyGeometry, furLight);
    belly.position.set(0.08, -0.12, 0);
    belly.rotation.y = 0.1;
    belly.castShadow = false;
    body.add(belly);

    const backPatchGeometry = new THREE.CapsuleGeometry(0.2, 0.7, 12, 18);
    backPatchGeometry.rotateZ(Math.PI / 2);
    const backPatch = new THREE.Mesh(backPatchGeometry, furDark);
    backPatch.position.set(-0.38, 0.12, -0.05);
    backPatch.rotation.y = -0.2;
    body.add(backPatch);

    const chestGeometry = new THREE.CapsuleGeometry(0.36, 0.52, 12, 20);
    chestGeometry.rotateZ(Math.PI / 2);
    const chest = new THREE.Mesh(chestGeometry, furMain);
    chest.castShadow = true;
    chest.receiveShadow = true;
    chest.position.set(0.72, 0.98, 0.03);

    const chestMark = new THREE.Mesh(new THREE.SphereGeometry(0.3, 18, 18), furLight);
    chestMark.scale.set(0.55, 0.5, 0.7);
    chestMark.position.set(0.3, -0.08, 0);
    chest.add(chestMark);

    const neckGeometry = new THREE.CapsuleGeometry(0.19, 0.34, 12, 16);
    const neck = new THREE.Mesh(neckGeometry, furMain);
    neckGeometry.rotateZ(Math.PI / 2);
    neck.position.set(1.04, 1.1, 0);
    neck.rotation.z = Math.PI / 9;
    neck.castShadow = true;
    neck.receiveShadow = true;

    const headGroup = new THREE.Group();
    headGroup.position.set(1.28, 1.21, 0);

    const skull = new THREE.Mesh(new THREE.SphereGeometry(0.33, 28, 24), furMain);
    skull.castShadow = true;

    const cheekMask = new THREE.Mesh(new THREE.SphereGeometry(0.28, 24, 20), furDark);
    cheekMask.scale.set(0.8, 0.72, 0.78);
    cheekMask.position.set(-0.12, 0.04, -0.01);
    skull.add(cheekMask);

    const muzzleGeometry = new THREE.CapsuleGeometry(0.17, 0.28, 12, 18);
    muzzleGeometry.rotateZ(Math.PI / 2);
    const muzzle = new THREE.Mesh(muzzleGeometry, furLight);
    muzzle.position.set(0.42, -0.05, 0);
    muzzle.castShadow = true;

    const nose = new THREE.Mesh(new THREE.SphereGeometry(0.08, 18, 18), noseMaterial);
    nose.position.set(0.64, -0.02, 0);
    nose.castShadow = true;
    muzzle.add(nose);

    const mouthLine = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.03, 0.12), noseMaterial);
    mouthLine.position.set(0.12, -0.08, 0);
    muzzle.add(mouthLine);

    const lowerJawGeometry = new THREE.CapsuleGeometry(0.12, 0.16, 10, 14);
    lowerJawGeometry.rotateZ(Math.PI / 2);
    const lowerJaw = new THREE.Mesh(lowerJawGeometry, furLight);
    lowerJaw.position.set(0.3, -0.12, 0);
    muzzle.add(lowerJaw);

    const eyeGeometry = new THREE.SphereGeometry(0.05, 20, 16);
    const eyeLeft = new THREE.Mesh(eyeGeometry, eyeMaterial);
    eyeLeft.position.set(0.18, 0.08, 0.15);
    const eyeRight = eyeLeft.clone();
    eyeRight.position.z = -0.15;

    const eyeHighlightGeometry = new THREE.SphereGeometry(0.018, 12, 12);
    const eyeHighlightMaterial = new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0xffffff, emissiveIntensity: 0.35, roughness: 0.1 });
    const eyeHighlightLeft = new THREE.Mesh(eyeHighlightGeometry, eyeHighlightMaterial);
    eyeHighlightLeft.position.set(0.03, 0.02, 0.02);
    eyeLeft.add(eyeHighlightLeft);
    const eyeHighlightRight = eyeHighlightLeft.clone();
    eyeRight.add(eyeHighlightRight);

    const earGeometry = new THREE.ConeGeometry(0.16, 0.36, 14);
    const earLeft = new THREE.Mesh(earGeometry, furDark);
    earLeft.castShadow = true;
    earLeft.position.set(-0.16, 0.26, 0.2);
    earLeft.rotation.set(Math.PI * 0.9, -0.1, Math.PI * 0.62);
    const earRight = earLeft.clone();
    earRight.position.z = -0.2;
    earRight.rotation.set(Math.PI * 0.9, 0.1, Math.PI * 0.38);

    headGroup.add(skull, muzzle, eyeLeft, eyeRight, earLeft, earRight);

    const tailGroup = new THREE.Group();
    tailGroup.position.set(-1.02, 1.07, 0);

    const tailGeometry = new THREE.CapsuleGeometry(0.07, 0.42, 10, 14);
    tailGeometry.rotateZ(Math.PI / 2.4);
    const tail = new THREE.Mesh(tailGeometry, furMain);
    tail.rotation.z = Math.PI / 2.9;
    tail.position.set(-0.32, 0.05, 0);
    tail.castShadow = true;

    const tailMidGeometry = new THREE.CapsuleGeometry(0.055, 0.32, 10, 12);
    tailMidGeometry.rotateZ(Math.PI / 2.2);
    const tailMid = new THREE.Mesh(tailMidGeometry, furMain);
    tailMid.position.set(-0.28, 0.02, 0);
    tailMid.rotation.z = Math.PI / 7;
    tailMid.castShadow = true;

    const tailTip = new THREE.Mesh(new THREE.SphereGeometry(0.09, 16, 16), furDark);
    tailTip.position.set(-0.2, 0, 0);
    tailMid.add(tailTip);

    tail.add(tailMid);
    tailGroup.add(tail);

    this.legs = {
      frontLeft: makeLeg(0.62, 0.34, 0.26, furDark, furLight),
      frontRight: makeLeg(0.62, 0.34, -0.26, furDark, furLight),
      backLeft: makeLeg(-0.58, 0.32, 0.28, furDark, furLight),
      backRight: makeLeg(-0.58, 0.32, -0.28, furDark, furLight),
    };

    Object.values(this.legs).forEach((leg) => this.root.add(leg.group));

    this.body = body;
    this.chest = chest;
    this.neck = neck;
    this.headGroup = headGroup;
    this.muzzle = muzzle;
    this.tailGroup = tailGroup;
    this.tail = tail;
    this.baseBodyY = body.position.y;
    this.baseTailRotationZ = tail.rotation.z;
    this.baseHeadRotationX = headGroup.rotation.x;
    this.baseBodyRotationZ = body.rotation.z;

    this.root.add(body, chest, neck, headGroup, tailGroup);
    this.setPoseInstant('stand');
  }

  updateMovement(delta) {
    if (!this.movement) return;
    const { destination, speed, resolve, target } = this.movement;
    const currentPosition = this.root.position;
    const direction = new THREE.Vector3().subVectors(destination, currentPosition);
    direction.y = 0; // 高さは接地処理に任せ、水平距離で判定する
    const distance = direction.length();
    // 目標に重ならない距離で停止する(体長ぶんを考慮。ユーザーの前では手前で止まる)
    const STOP_DISTANCES = { user: 3.0, ball: 1.0, bowl: 1.3, bed: 0.3 };
    const stopDistance = STOP_DISTANCES[target] ?? 0.8;

    if (distance < Math.max(stopDistance, 0.05)) {
      this.movement = null;
      this.setAnimation('idle');
      if (resolve) resolve();
      return;
    }

    direction.normalize();
    const step = speed * delta;
    currentPosition.addScaledVector(direction, step);
    const yaw = Math.atan2(direction.x, direction.z);
    this.root.rotation.y = lerpAngle(this.root.rotation.y, yaw, 0.15);

    // 歩幅ごとに対角の2足を接地させ、砂を乱す(乾いた砂の踏み跡)
    this._moveDir.copy(direction);
    this.strideAccum += step;
    const isRun = speed > 2.5;
    const interval = isRun ? 0.7 : 0.45;
    while (this.strideAccum >= interval) {
      this.strideAccum -= interval;
      const pair = this.gaitPhase === 0
        ? ['frontLeft', 'backRight']
        : ['frontRight', 'backLeft'];
      this.gaitPhase = 1 - this.gaitPhase;
      this.stampPaws(pair, direction, isRun ? 1.45 : 1.0, isRun ? 1.0 : 0.5);
    }
  }

  stampPaws(legNames, dir, strength, kick) {
    if (!this.sand) return;
    this.root.updateMatrixWorld(true);
    legNames.forEach((name) => {
      const leg = this.legs[name];
      if (!leg) return;
      leg.group.getWorldPosition(this._pawWorld);
      this.sand.disturbAt(
        this._pawWorld.x + (Math.random() - 0.5) * 0.05,
        this._pawWorld.z + (Math.random() - 0.5) * 0.05,
        {
          dirX: dir.x,
          dirZ: dir.z,
          strength: strength * (0.85 + Math.random() * 0.3),
          kick,
        }
      );
    });
  }

  updateRotation(delta) {
    if (!this.rotationAction) return;
    const action = this.rotationAction;
    action.elapsed += delta;
    const progress = Math.min(action.elapsed / action.duration, 1);
    this.root.rotation.y = lerpAngle(action.start, action.end, easeOut(progress));
    if (progress >= 1) {
      // 向き直りで前足まわりの砂が軽く擦れる
      this._moveDir.set(Math.sin(this.root.rotation.y), 0, Math.cos(this.root.rotation.y));
      this.stampPaws(['frontLeft', 'frontRight'], this._moveDir, 0.5, 0.25);
      const { resolve } = action;
      this.rotationAction = null;
      if (resolve) resolve();
    }
  }

  updatePose(delta) {
    if (!this.poseTransition) return;
    const action = this.poseTransition;
    action.elapsed += delta;
    const progress = Math.min(action.elapsed / action.duration, 1);
    const eased = easeInOut(progress);
    this.applyPoseBlend(action.from, action.to, eased);
    if (progress >= 1) {
      this.pose = action.to;
      this.setPoseInstant(this.pose);
      const { resolve } = action;
      this.poseTransition = null;
      if (resolve) resolve();
    }
  }

  updateSpecial(delta) {
    if (!this.specialAction) return;
    const action = this.specialAction;
    action.elapsed += delta;
    const t = action.elapsed;

    if (action.type === 'wait') {
      if (t >= action.duration) {
        const { resolve } = action;
        this.specialAction = null;
        if (resolve) resolve();
      }
      return;
    }

    if (action.type === 'bark') {
      const cycle = Math.sin(t * 10);
      this.headGroup.rotation.x = -0.1 + 0.2 * Math.sin(t * 5);
      this.muzzle.position.y = -0.05 + 0.04 * Math.max(cycle, 0);
      if (t > 0.9) {
        this.onBark(false);
      }
      if (t >= action.duration) {
        this.headGroup.rotation.x = POSES[this.pose]?.headTilt || 0;
        this.muzzle.position.y = -0.05;
        this.specialAction = null;
        this.onBark(false);
        const { resolve } = action;
        if (resolve) resolve();
      }
      return;
    }

    if (action.type === 'wag_tail') {
      this.tailGroup.rotation.y = Math.sin(t * 12) * 0.6;
      if (t >= action.duration) {
        this.tailGroup.rotation.y = 0;
        const { resolve } = action;
        this.specialAction = null;
        if (resolve) resolve();
      }
      return;
    }

    if (action.type === 'sniff') {
      this.headGroup.rotation.x = THREE.MathUtils.lerp(this.headGroup.rotation.x, -0.5, 0.25);
      this.body.position.y = this.baseBodyY + Math.sin(t * 14) * 0.02;
      if (t >= action.duration) {
        this.headGroup.rotation.x = POSES[this.pose]?.headTilt || 0;
        this.body.position.y = this.baseBodyY;
        this.specialAction = null;
        const { resolve } = action;
        if (resolve) resolve();
      }
      return;
    }

    if (action.type === 'jump') {
      const progress = Math.min(t / action.duration, 1);
      this.jumpY = Math.sin(Math.PI * progress) * 1.2;
      this.setAnimation('run');
      if (progress >= 1) {
        this.jumpY = 0;
        this.specialAction = null;
        this.setAnimation('idle');
        // 着地の衝撃で4足まとめて砂が大きく乱れる
        this.stampPaws(
          ['frontLeft', 'frontRight', 'backLeft', 'backRight'],
          this._moveDir,
          1.6,
          1.1
        );
        const { resolve } = action;
        if (resolve) resolve();
      }
      return;
    }
  }

  applyAnimation(delta) {
    const time = this.time;
    const walkSpeed = this.currentAnimation === 'run' ? 9 : 6;
    const amplitude = this.currentAnimation === 'run' ? 0.8 : 0.4;

    if ((this.currentAnimation === 'walk' || this.currentAnimation === 'run') && this.pose === 'stand') {
      const swing = Math.sin(time * walkSpeed) * amplitude;
      this.legs.frontLeft.group.rotation.x = swing;
      this.legs.backRight.group.rotation.x = swing;
      this.legs.frontRight.group.rotation.x = -swing;
      this.legs.backLeft.group.rotation.x = -swing;
      this.tail.rotation.z = this.baseTailRotationZ + Math.sin(time * 4) * 0.2;
      this.body.position.y = this.baseBodyY + Math.sin(time * walkSpeed * 0.5) * 0.05;
    } else {
      if (this.pose === 'stand') {
        this.legs.frontLeft.group.rotation.x = THREE.MathUtils.lerp(this.legs.frontLeft.group.rotation.x, 0, 0.2);
        this.legs.frontRight.group.rotation.x = THREE.MathUtils.lerp(this.legs.frontRight.group.rotation.x, 0, 0.2);
        this.legs.backLeft.group.rotation.x = THREE.MathUtils.lerp(this.legs.backLeft.group.rotation.x, 0, 0.2);
        this.legs.backRight.group.rotation.x = THREE.MathUtils.lerp(this.legs.backRight.group.rotation.x, 0, 0.2);
        this.body.rotation.z = THREE.MathUtils.lerp(this.body.rotation.z, this.baseBodyRotationZ, 0.2);
        this.headGroup.rotation.x = THREE.MathUtils.lerp(this.headGroup.rotation.x, this.baseHeadRotationX, 0.2);
      } else {
        this.setPoseInstant(this.pose);
      }
      this.tail.rotation.z = THREE.MathUtils.lerp(this.tail.rotation.z, this.baseTailRotationZ + Math.sin(time * 3) * 0.12, 0.15);
      this.body.position.y = this.baseBodyY + Math.sin(time * 2) * 0.03;
    }
  }

  applyPoseBlend(from, to, t) {
    const start = POSES[from] || POSES.stand;
    const end = POSES[to] || POSES.stand;
    const blended = {
      front: THREE.MathUtils.lerp(start.front, end.front, t),
      back: THREE.MathUtils.lerp(start.back, end.back, t),
      bodyTilt: THREE.MathUtils.lerp(start.bodyTilt, end.bodyTilt, t),
      headTilt: THREE.MathUtils.lerp(start.headTilt, end.headTilt, t),
    };

    this.legs.frontLeft.group.rotation.x = blended.front;
    this.legs.frontRight.group.rotation.x = blended.front;
    this.legs.backLeft.group.rotation.x = blended.back;
    this.legs.backRight.group.rotation.x = blended.back;
    this.body.rotation.z = blended.bodyTilt;
    this.headGroup.rotation.x = blended.headTilt;
  }

  setAnimation(name) {
    this.currentAnimation = name || 'idle';
    if (name === 'run') {
      this.pose = 'stand';
    }
    if (name === 'walk') {
      this.pose = 'stand';
    }
    if (name === 'idle') {
      this.setPoseInstant(this.pose);
    }
  }

  setPoseInstant(poseName) {
    const pose = POSES[poseName] || POSES.stand;
    this.legs.frontLeft.group.rotation.x = pose.front;
    this.legs.frontRight.group.rotation.x = pose.front;
    this.legs.backLeft.group.rotation.x = pose.back;
    this.legs.backRight.group.rotation.x = pose.back;
    this.body.rotation.z = pose.bodyTilt;
    this.headGroup.rotation.x = pose.headTilt;
  }
}

function makeLeg(x, y, z, furMaterial, pawMaterial) {
  const group = new THREE.Group();
  group.position.set(x, y, z);

  const upper = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.18, 0.58, 12), furMaterial);
  upper.position.y = -0.29;
  upper.castShadow = true;
  upper.receiveShadow = true;

  const knee = new THREE.Mesh(new THREE.SphereGeometry(0.12, 16, 14), furMaterial);
  knee.position.y = -0.58;
  knee.castShadow = true;

  const lower = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.12, 0.62, 12), furMaterial);
  lower.position.y = -0.9;
  lower.castShadow = true;
  lower.receiveShadow = true;

  const ankle = new THREE.Mesh(new THREE.SphereGeometry(0.1, 16, 14), furMaterial);
  ankle.position.y = -1.19;
  ankle.castShadow = true;

  const paw = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.16, 0.34), pawMaterial);
  paw.position.set(0, -1.28, 0.04);
  paw.castShadow = true;
  paw.receiveShadow = true;

  const padMaterial = new THREE.MeshStandardMaterial({ color: 0x2d1c16, roughness: 0.7 });
  const pad = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.05, 0.26), padMaterial);
  pad.position.set(0, -0.05, -0.02);
  paw.add(pad);

  const toeGeometry = new THREE.CapsuleGeometry(0.04, 0.05, 6, 10);
  const toeOffsets = [-0.1, -0.03, 0.04, 0.11];
  toeOffsets.forEach((offset) => {
    const toe = new THREE.Mesh(toeGeometry, pawMaterial);
    toe.rotation.z = Math.PI / 2;
    toe.position.set(offset, -0.05, 0.16);
    paw.add(toe);
  });

  group.add(upper, knee, lower, ankle, paw);
  return { group, leg: upper, paw };
}

function easeInOut(t) {
  return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
}

function easeOut(t) {
  return 1 - Math.pow(1 - t, 3);
}

function angleDifference(a, b) {
  let diff = (b - a) % (Math.PI * 2);
  if (diff > Math.PI) diff -= Math.PI * 2;
  if (diff < -Math.PI) diff += Math.PI * 2;
  return diff;
}

function lerpAngle(start, end, alpha) {
  return start + angleDifference(start, end) * alpha;
}
