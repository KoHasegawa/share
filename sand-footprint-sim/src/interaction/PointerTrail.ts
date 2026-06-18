import * as THREE from 'three';

export type ScreenToWorldFn = (px: number, py: number) => THREE.Vector2;
export type PointerMoveCallback = (worldPos: THREE.Vector2, dir: THREE.Vector2) => void;

const DEFAULT_SMOOTHING = 18.0;

export class PointerTrail {
  private readonly callbacks: PointerMoveCallback[] = [];

  private dom: HTMLElement | null = null;
  private screenToWorld: ScreenToWorldFn | null = null;

  private activePointerId = -1;
  private isActive = false;

  private readonly currentPos = new THREE.Vector2();
  private readonly previousPos = new THREE.Vector2();
  private readonly rawDir = new THREE.Vector2();
  private readonly smoothDir = new THREE.Vector2(0, 1);

  private lastEventTimeMs = 0;

  private readonly handlePointerDown = (event: PointerEvent): void => {
    if (!this.screenToWorld || !this.dom) {
      return;
    }
    if (this.isActive) {
      return;
    }

    this.activePointerId = event.pointerId;
    this.isActive = true;

    const world = this.screenToWorld(event.clientX, event.clientY);
    this.currentPos.copy(world);
    this.previousPos.copy(world);
    this.rawDir.set(0, 0);
    this.smoothDir.set(0, 1);
    this.lastEventTimeMs = event.timeStamp;

    if (typeof this.dom.setPointerCapture === 'function') {
      this.dom.setPointerCapture(event.pointerId);
    }
  };

  private readonly handlePointerMove = (event: PointerEvent): void => {
    if (!this.isActive || event.pointerId !== this.activePointerId || !this.screenToWorld) {
      return;
    }

    const world = this.screenToWorld(event.clientX, event.clientY);
    this.currentPos.copy(world);

    this.rawDir.subVectors(this.currentPos, this.previousPos);
    const lenSq = this.rawDir.lengthSq();
    if (lenSq <= 1e-8) {
      return;
    }

    this.rawDir.multiplyScalar(1.0 / Math.sqrt(lenSq));

    const dt = Math.max(1e-4, (event.timeStamp - this.lastEventTimeMs) * 0.001);
    this.lastEventTimeMs = event.timeStamp;
    const alpha = 1.0 - Math.exp(-DEFAULT_SMOOTHING * dt);

    this.smoothDir.lerp(this.rawDir, alpha);
    const smoothLenSq = this.smoothDir.lengthSq();
    if (smoothLenSq > 1e-8) {
      this.smoothDir.multiplyScalar(1.0 / Math.sqrt(smoothLenSq));
    } else {
      this.smoothDir.copy(this.rawDir);
    }

    for (let i = 0; i < this.callbacks.length; i += 1) {
      this.callbacks[i](this.currentPos, this.smoothDir);
    }

    this.previousPos.copy(this.currentPos);
  };

  private readonly handlePointerUp = (event: PointerEvent): void => {
    if (!this.isActive || event.pointerId !== this.activePointerId || !this.dom) {
      return;
    }

    if (typeof this.dom.releasePointerCapture === 'function') {
      this.dom.releasePointerCapture(event.pointerId);
    }

    this.isActive = false;
    this.activePointerId = -1;
  };

  onMove(cb: PointerMoveCallback): void {
    this.callbacks.push(cb);
  }

  attach(dom: HTMLElement, screenToWorld: ScreenToWorldFn): void {
    this.detach();
    this.dom = dom;
    this.screenToWorld = screenToWorld;

    dom.addEventListener('pointerdown', this.handlePointerDown, { passive: true });
    dom.addEventListener('pointermove', this.handlePointerMove, { passive: true });
    dom.addEventListener('pointerup', this.handlePointerUp, { passive: true });
    dom.addEventListener('pointercancel', this.handlePointerUp, { passive: true });
    dom.addEventListener('pointerleave', this.handlePointerUp, { passive: true });
  }

  detach(): void {
    if (!this.dom) {
      return;
    }

    this.dom.removeEventListener('pointerdown', this.handlePointerDown);
    this.dom.removeEventListener('pointermove', this.handlePointerMove);
    this.dom.removeEventListener('pointerup', this.handlePointerUp);
    this.dom.removeEventListener('pointercancel', this.handlePointerUp);
    this.dom.removeEventListener('pointerleave', this.handlePointerUp);

    this.dom = null;
    this.screenToWorld = null;
    this.isActive = false;
    this.activePointerId = -1;
  }
}
