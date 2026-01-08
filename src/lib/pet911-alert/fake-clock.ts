export interface Clock {
  nowMs(): number;
  nowIso(): string;
}

export class FakeClock implements Clock {
  private ms: number;

  constructor(startMs: number) {
    this.ms = startMs;
  }

  nowMs(): number {
    return this.ms;
  }

  nowIso(): string {
    return new Date(this.ms).toISOString();
  }

  setMs(ms: number): void {
    this.ms = ms;
  }

  advanceMs(deltaMs: number): void {
    this.ms += deltaMs;
  }
}
