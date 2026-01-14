import type { AlertProjection, MemoryEvent } from './types';
import { emptyProjection, replay } from './replay';

export class ProjectionBuilder {
  private projection: AlertProjection;
  private events: MemoryEvent[];

  constructor() {
    this.projection = emptyProjection();
    this.events = [];
  }

  apply(event: MemoryEvent): void {
    this.events.push(event);
    this.projection = replay(this.events);
  }

  build(events: MemoryEvent[]): AlertProjection {
    this.events = [...events];
    this.projection = replay(this.events);
    return this.projection;
  }

  get(): AlertProjection {
    return this.projection;
  }

  reset(): void {
    this.projection = emptyProjection();
    this.events = [];
  }
}
