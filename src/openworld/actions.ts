/** One impact/commit per target, independent of frame rate and repeated input. */
export class ActionClock<T> {
  readonly duration: number;
  private running = new Map<string, {value: T; elapsed: number}>();
  constructor(duration = 0.22) {this.duration = duration;}
  start(id: string, value: T): boolean {
    if (this.running.has(id)) return false;
    this.running.set(id, {value, elapsed: 0});
    return true;
  }
  cancel(id: string): void {this.running.delete(id);}
  advance(dt: number): {active: {value: T; progress: number}[]; completed: T[]} {
    const active: {value: T; progress: number}[] = [], completed: T[] = [];
    for (const [id, action] of this.running) {
      action.elapsed += Math.max(0, dt);
      if (action.elapsed >= this.duration) {completed.push(action.value); this.running.delete(id);}
      else active.push({value: action.value, progress: action.elapsed / this.duration});
    }
    return {active, completed};
  }
}
