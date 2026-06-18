export class WashWave {
  private readonly duration: number;
  private readonly resetFrontValue: number;

  private startFront: number;
  private endFront: number;

  private elapsed = 0;
  private activeState = false;
  private frontValue: number;
  private progressValue = 0;

  constructor(duration = 1.8, startFront = 12, endFront = -12, resetFrontValue = 1e6) {
    this.duration = Math.max(0.1, duration);
    this.startFront = startFront;
    this.endFront = endFront;
    this.resetFrontValue = resetFrontValue;
    this.frontValue = this.resetFrontValue;
  }

  setSweepBounds(startFront: number, endFront: number): void {
    this.startFront = startFront;
    this.endFront = endFront;

    if (!this.activeState) {
      this.frontValue = this.resetFrontValue;
      this.progressValue = 0;
    }
  }

  trigger(): void {
    this.elapsed = 0;
    this.progressValue = 0;
    this.frontValue = this.startFront;
    this.activeState = true;
  }

  update(dt: number): void {
    if (!this.activeState) {
      return;
    }

    this.elapsed += dt;
    const rawProgress = this.elapsed / this.duration;
    const clamped = rawProgress >= 1 ? 1 : rawProgress <= 0 ? 0 : rawProgress;

    this.progressValue = clamped;
    this.frontValue = this.startFront + (this.endFront - this.startFront) * clamped;

    if (clamped >= 1) {
      this.activeState = false;
      this.progressValue = 0;
      this.frontValue = this.resetFrontValue;
    }
  }

  get active(): boolean {
    return this.activeState;
  }

  get front(): number {
    return this.frontValue;
  }

  get progress(): number {
    return this.progressValue;
  }
}
