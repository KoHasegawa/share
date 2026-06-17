import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

const TMP_VEC3 = new THREE.Vector3();
const TMP_QUAT = new THREE.Quaternion();
const TMP_EULER = new THREE.Euler();

// GLB内アニメーションクリップの既定ループ設定（日本語メモ）
const ACTION_DEFAULTS = {
  idle: { loop: THREE.LoopRepeat, repetitions: Infinity, clamp: false },
  walk: { loop: THREE.LoopRepeat, repetitions: Infinity, clamp: false },
  tail_wag: { loop: THREE.LoopRepeat, repetitions: Infinity, clamp: false },
  sit: { loop: THREE.LoopOnce, repetitions: 1, clamp: true },
};

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

export class DogController {
  constructor(sceneContext, options = {}) {
    this.scene = sceneContext.scene;
    this.targets = sceneContext.targets;
    this.onBark = options.onBark || (() => {});

    this.root = new THREE.Group();
    this.scene.add(this.root);

    this.modelRoot = null;
    this.mixer = null;
    this.actions = {};
    this.currentClip = null;
    this.activeAction = null;

    this.nodes = {};
    this.time = 0;

    this.movement = null;
    this.rotationAction = null;
    this.specialAction = null;
    this.temporaryClip = null;

    this.isReady = false;
    this.loadError = null;
    // GLB読み込み完了を待つためのPromiseを保持
    this.readyPromise = this.loadDogModel();

    if (typeof window !== 'undefined') {
      window.playDogAnimation = (name) => this.playAnimation(name);
    }
  }

  async loadDogModel() {
    try {
      const loader = new GLTFLoader();
      const gltf = await loader.loadAsync('models/dog.glb');
      const dogRoot = gltf.scene.getObjectByName('DogRoot') || gltf.scene;
      dogRoot.position.set(0, 0, 0);
      dogRoot.rotation.set(0, 0, 0);
      this.root.add(dogRoot);
      this.modelRoot = dogRoot;

      dogRoot.traverse((child) => {
        if (child.isMesh) {
          child.castShadow = true;
          child.receiveShadow = true;
        }
      });

      const trackNames = [
        'Body',
        'HeadPivot',
        'Snout',
        'TailPivot',
        'Tail',
        'Leg_FL_Pivot',
        'Leg_FR_Pivot',
        'Leg_BL_Pivot',
        'Leg_BR_Pivot',
      ];

      trackNames.forEach((name) => {
        const node = dogRoot.getObjectByName(name);
        if (node) {
          this.nodes[name] = node;
        } else {
          console.warn(`Dog GLB内に ${name} が見つかりません`);
        }
      });

      this.mixer = new THREE.AnimationMixer(dogRoot);
      gltf.animations.forEach((clip) => {
        const action = this.mixer.clipAction(clip);
        action.enabled = true;
        this.actions[clip.name] = action;
      });

      this.playClip('idle');
      this.isReady = true;
    } catch (error) {
      console.error('犬モデルの読み込みに失敗しました', error);
      this.loadError = error;
    }
  }

  waitUntilReady() {
    return this.readyPromise.then(() => !this.loadError);
  }

  update(delta) {
    this.time += delta;
    if (!this.isReady || this.loadError) return;

    if (this.mixer) {
      this.mixer.update(delta);
    }

    this.updateTemporaryClip(delta);
    this.updateMovement(delta);
    this.updateRotation(delta);
    this.updateSpecial(delta);
  }

  interrupt() {
    if (this.movement && this.movement.resolve) {
      this.movement.resolve();
    }
    if (this.rotationAction && this.rotationAction.resolve) {
      this.rotationAction.resolve();
    }
    this.cancelSpecialAction({ resolve: true });
    this.cancelTemporaryClip();
    this.movement = null;
    this.rotationAction = null;
    this.root.position.y = 0;
    this.onBark(false);
    if (this.isReady) {
      this.playClip('idle');
    }
  }

  idle() {
    return this.playDogAnimation('idle');
  }

  moveTo(target, speed = 'walk') {
    const destination = this.targets[target];
    if (!destination) {
      return Promise.resolve();
    }

    return this.waitUntilReady().then((ok) => {
      if (!ok) return;
      const dest = destination.clone();
      dest.y = 0;
      this.cancelTemporaryClip();
      return new Promise((resolve) => {
        this.movement = {
          target,
          destination: dest,
          speed: speed === 'run' ? 3.5 : 1.8,
          resolve,
          timeScale: speed === 'run' ? 1.6 : 1,
        };
        this.playClip('walk', { timeScale: this.movement.timeScale });
      });
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
        return this.playDogAnimation('sit', { waitForFinish: true });
      case 'lie_down':
        return this.playDogAnimation('sit', { waitForFinish: true });
      case 'walk':
        return this.playDogAnimation('walk').then(() => this.wait(1.5));
      case 'run':
        return this.playDogAnimation('walk', { timeScale: 1.6 }).then(() => this.wait(1.2));
      case 'wag_tail':
        return this.wagTail();
      case 'sniff':
        return this.sniff();
      case 'jump':
        return this.jump();
      case 'bark':
        return this.bark();
      case 'tail_wag':
        return this.playDogAnimation('tail_wag');
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

    return this.waitUntilReady().then((ok) => {
      if (!ok) return;
      const direction = TMP_VEC3.subVectors(destination, this.root.position);
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
    });
  }

  wait(duration = 1) {
    return this.waitUntilReady().then((ok) => {
      if (!ok) return;
      this.cancelSpecialAction({ resolve: true });
      this.playClip('idle');
      return new Promise((resolve) => {
        this.specialAction = {
          type: 'wait',
          duration,
          elapsed: 0,
          resolve,
        };
      });
    });
  }

  bark() {
    return this.waitUntilReady().then((ok) => {
      if (!ok) return;
      this.cancelSpecialAction({ resolve: true });
      const head = this.nodes.HeadPivot;
      const snout = this.nodes.Snout;
      this.onBark(true);
      return new Promise((resolve) => {
        this.specialAction = {
          type: 'bark',
          duration: 1.2,
          elapsed: 0,
          resolve,
          data: {
            headBase: head ? head.quaternion.clone() : null,
            snoutBase: snout ? snout.position.clone() : null,
          },
        };
        this.playClip('idle');
      });
    });
  }

  wagTail() {
    return this.waitUntilReady().then((ok) => {
      if (!ok) return;
      const previous = this.currentClip && this.currentClip !== 'tail_wag' ? this.currentClip : 'idle';
      this.cancelTemporaryClip();
      return new Promise((resolve) => {
        this.playClip('tail_wag', { fadeDuration: 0.25 });
        this.temporaryClip = {
          previousClip: previous,
          duration: 2.4,
          elapsed: 0,
          resolve,
          fadeDuration: 0.35,
        };
      });
    });
  }

  sniff() {
    return this.waitUntilReady().then((ok) => {
      if (!ok) return;
      this.cancelSpecialAction({ resolve: true });
      const head = this.nodes.HeadPivot;
      const body = this.nodes.Body;
      return new Promise((resolve) => {
        this.specialAction = {
          type: 'sniff',
          duration: 1.6,
          elapsed: 0,
          resolve,
          data: {
            headBase: head ? head.quaternion.clone() : null,
            bodyBase: body ? body.position.clone() : null,
          },
        };
        this.playClip('idle');
      });
    });
  }

  jump() {
    return this.waitUntilReady().then((ok) => {
      if (!ok) return;
      this.cancelSpecialAction({ resolve: true });
      return new Promise((resolve) => {
        this.specialAction = {
          type: 'jump',
          duration: 1.2,
          elapsed: 0,
          resolve,
          data: {
            height: 1.2,
          },
        };
        this.playClip('idle');
      });
    });
  }

  playDogAnimation(name, options = {}) {
    return this.waitUntilReady().then((ok) => {
      if (!ok) return;
      this.cancelTemporaryClip(false);
      const action = this.playClip(name, options);
      if (options.waitForFinish && action) {
        return this.waitForActionFinish(action);
      }
    });
  }

  playClip(name, { fadeDuration = 0.35, timeScale = 1, loop, repetitions, clamp, reset = true } = {}) {
    const next = this.actions[name];
    if (!next) return null;

    const defaults = ACTION_DEFAULTS[name] || ACTION_DEFAULTS.idle;
    const loopMode = loop ?? defaults.loop;
    const repeatCount = repetitions ?? defaults.repetitions;
    const clampSetting = clamp ?? defaults.clamp ?? false;

    next.setLoop(loopMode, repeatCount);
    next.clampWhenFinished = clampSetting;

    if (this.activeAction === next) {
      next.enabled = true;
      next.timeScale = timeScale;
      if (!next.isRunning()) {
        next.play();
      }
      this.currentClip = name;
      return next;
    }

    if (this.activeAction) {
      this.activeAction.timeScale = 1;
    }

    if (reset) {
      next.reset();
    }
    next.timeScale = timeScale;
    next.enabled = true;
    next.play();

    if (this.activeAction) {
      next.crossFadeFrom(this.activeAction, fadeDuration, true);
    }

    this.activeAction = next;
    this.currentClip = name;
    return next;
  }

  waitForActionFinish(action) {
    if (!this.mixer || !action) return Promise.resolve();
    return new Promise((resolve) => {
      const handleFinished = (event) => {
        if (event.action !== action) return;
        this.mixer.removeEventListener('finished', handleFinished);
        resolve();
      };
      this.mixer.addEventListener('finished', handleFinished);
    });
  }

  cancelSpecialAction({ resolve = false } = {}) {
    if (!this.specialAction) return;
    const action = this.specialAction;
    if (action.type === 'bark') {
      const head = this.nodes.HeadPivot;
      const snout = this.nodes.Snout;
      if (head && action.data?.headBase) {
        head.quaternion.copy(action.data.headBase);
      }
      if (snout && action.data?.snoutBase) {
        snout.position.copy(action.data.snoutBase);
      }
      this.onBark(false);
    }
    if (action.type === 'sniff') {
      const head = this.nodes.HeadPivot;
      const body = this.nodes.Body;
      if (head && action.data?.headBase) {
        head.quaternion.copy(action.data.headBase);
      }
      if (body && action.data?.bodyBase) {
        body.position.copy(action.data.bodyBase);
      }
    }
    if (action.type === 'jump') {
      this.root.position.y = 0;
    }
    if (resolve && action.resolve) {
      action.resolve();
    }
    this.specialAction = null;
  }

  cancelTemporaryClip(restore = true) {
    if (!this.temporaryClip) return;
    const action = this.temporaryClip;
    if (restore) {
      const next = action.previousClip || 'idle';
      this.playClip(next, { fadeDuration: action.fadeDuration ?? 0.35 });
    }
    if (action.resolve) {
      action.resolve();
    }
    this.temporaryClip = null;
  }

  updateMovement(delta) {
    if (!this.movement) return;
    const { destination, speed, resolve, timeScale } = this.movement;
    const position = this.root.position;
    TMP_VEC3.copy(destination).sub(position);
    TMP_VEC3.y = 0;

    const distance = TMP_VEC3.length();
    if (distance < 0.05) {
      position.x = destination.x;
      position.z = destination.z;
      this.movement = null;
      if (this.activeAction) {
        this.activeAction.timeScale = 1;
      }
      if (resolve) resolve();
      this.playClip('idle');
      return;
    }

    TMP_VEC3.normalize();
    position.x += TMP_VEC3.x * speed * delta;
    position.z += TMP_VEC3.z * speed * delta;

    const yaw = Math.atan2(TMP_VEC3.x, TMP_VEC3.z);
    this.root.rotation.y = lerpAngle(this.root.rotation.y, yaw, 0.18);

    if (this.activeAction) {
      this.activeAction.timeScale = timeScale;
    }
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

  updateTemporaryClip(delta) {
    if (!this.temporaryClip) return;
    const action = this.temporaryClip;
    action.elapsed += delta;
    if (action.elapsed >= action.duration) {
      const next = action.previousClip || 'idle';
      this.playClip(next, { fadeDuration: action.fadeDuration ?? 0.35 });
      if (action.resolve) action.resolve();
      this.temporaryClip = null;
    }
  }

  updateSpecial(delta) {
    if (!this.specialAction) return;
    const action = this.specialAction;
    action.elapsed += delta;

    if (action.type === 'wait') {
      if (action.elapsed >= action.duration) {
        if (action.resolve) action.resolve();
        this.specialAction = null;
      }
      return;
    }

    if (action.type === 'bark') {
      const head = this.nodes.HeadPivot;
      const snout = this.nodes.Snout;
      if (head && action.data?.headBase) {
        head.quaternion.copy(action.data.headBase);
        TMP_EULER.set(-0.12 + Math.sin(action.elapsed * 5) * 0.25, 0, 0);
        TMP_QUAT.setFromEuler(TMP_EULER);
        head.quaternion.multiply(TMP_QUAT);
      }
      if (snout && action.data?.snoutBase) {
        snout.position.copy(action.data.snoutBase);
        snout.position.y += Math.max(Math.sin(action.elapsed * 10), 0) * 0.04;
      }
      if (action.elapsed > action.duration * 0.75) {
        this.onBark(false);
      }
      if (action.elapsed >= action.duration) {
        if (head && action.data?.headBase) head.quaternion.copy(action.data.headBase);
        if (snout && action.data?.snoutBase) snout.position.copy(action.data.snoutBase);
        if (action.resolve) action.resolve();
        this.specialAction = null;
      }
      return;
    }

    if (action.type === 'sniff') {
      const head = this.nodes.HeadPivot;
      const body = this.nodes.Body;
      const enter = Math.min(action.elapsed / 0.6, 1);
      if (head && action.data?.headBase) {
        head.quaternion.copy(action.data.headBase);
        TMP_EULER.set(-0.6 * easeInOut(enter), 0, 0);
        TMP_QUAT.setFromEuler(TMP_EULER);
        head.quaternion.multiply(TMP_QUAT);
      }
      if (body && action.data?.bodyBase) {
        body.position.copy(action.data.bodyBase);
        body.position.y = action.data.bodyBase.y + Math.sin(action.elapsed * 8) * 0.025;
      }
      if (action.elapsed >= action.duration) {
        if (head && action.data?.headBase) head.quaternion.copy(action.data.headBase);
        if (body && action.data?.bodyBase) body.position.copy(action.data.bodyBase);
        if (action.resolve) action.resolve();
        this.specialAction = null;
      }
      return;
    }

    if (action.type === 'jump') {
      const progress = Math.min(action.elapsed / action.duration, 1);
      const height = Math.sin(Math.PI * progress) * (action.data?.height || 1);
      this.root.position.y = height;
      if (progress >= 1) {
        this.root.position.y = 0;
        if (action.resolve) action.resolve();
        this.specialAction = null;
      }
    }
  }
}
