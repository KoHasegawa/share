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
    this.onBark = options.onBark || (() => {});

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
    const brown = new THREE.MeshStandardMaterial({ color: 0x8d6748, roughness: 0.7 });
    const dark = new THREE.MeshStandardMaterial({ color: 0x4b3621, roughness: 0.6 });
    const light = new THREE.MeshStandardMaterial({ color: 0xd9c3a3, roughness: 0.5 });

    const body = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.6, 0.8), brown);
    body.castShadow = true;
    body.receiveShadow = true;
    body.position.set(0, 0.9, 0);

    const chest = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.55, 0.85), brown);
    chest.castShadow = true;
    chest.position.set(0.65, 0.85, 0);

    const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.24, 0.5, 16), brown);
    neck.position.set(1.05, 1.05, 0);
    neck.rotation.z = Math.PI / 10;
    neck.castShadow = true;

    const headGroup = new THREE.Group();
    headGroup.position.set(1.3, 1.2, 0);

    const head = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.5, 0.5), brown);
    head.position.set(0, 0, 0);
    head.castShadow = true;

    const muzzle = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.25, 0.35), light);
    muzzle.position.set(0.35, -0.05, 0);
    muzzle.castShadow = true;

    const nose = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.12, 0.2), dark);
    nose.position.set(0.58, -0.02, 0);

    const earLeft = new THREE.Mesh(new THREE.ConeGeometry(0.12, 0.3, 10), dark);
    const earRight = earLeft.clone();
    earLeft.position.set(-0.05, 0.28, 0.18);
    earRight.position.set(-0.05, 0.28, -0.18);
    earLeft.rotation.z = Math.PI * 0.6;
    earRight.rotation.z = Math.PI * 0.6;

    headGroup.add(head, muzzle, nose, earLeft, earRight);

    const tailGroup = new THREE.Group();
    tailGroup.position.set(-0.95, 1.05, 0);
    const tail = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.12, 0.7, 12), brown);
    tail.rotation.z = Math.PI / 2.8;
    tail.position.set(-0.35, 0, 0);
    tail.castShadow = true;
    tailGroup.add(tail);

    const legMaterial = dark;
    this.legs = {
      frontLeft: makeLeg(0.6, 0.3, 0.28, legMaterial),
      frontRight: makeLeg(0.6, 0.3, -0.28, legMaterial),
      backLeft: makeLeg(-0.6, 0.3, 0.28, legMaterial),
      backRight: makeLeg(-0.6, 0.3, -0.28, legMaterial),
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
    const { destination, speed, resolve } = this.movement;
    const currentPosition = this.root.position;
    const direction = new THREE.Vector3().subVectors(destination, currentPosition);
    const distance = direction.length();

    if (distance < 0.05) {
      currentPosition.copy(destination);
      this.movement = null;
      this.setAnimation('idle');
      if (resolve) resolve();
      return;
    }

    direction.normalize();
    currentPosition.addScaledVector(direction, speed * delta);
    const yaw = Math.atan2(direction.x, direction.z);
    this.root.rotation.y = lerpAngle(this.root.rotation.y, yaw, 0.15);
  }

  updateRotation(delta) {
    if (!this.rotationAction) return;
    const action = this.rotationAction;
    action.elapsed += delta;
    const progress = Math.min(action.elapsed / action.duration, 1);
    this.root.rotation.y = lerpAngle(action.start, action.end, easeOut(progress));
    if (progress >= 1) {
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
      const height = Math.sin(Math.PI * progress) * 1.2;
      this.root.position.y = height;
      this.setAnimation('run');
      if (progress >= 1) {
        this.root.position.y = 0;
        this.specialAction = null;
        this.setAnimation('idle');
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

function makeLeg(x, y, z, material) {
  const group = new THREE.Group();
  group.position.set(x, y, z);
  const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.14, 1.1, 10), material);
  leg.position.y = -0.55;
  leg.castShadow = true;
  leg.receiveShadow = true;
  const paw = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.18, 0.3), material);
  paw.position.set(0, -1.1, 0);
  paw.castShadow = true;
  group.add(leg, paw);
  return { group, leg, paw };
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
