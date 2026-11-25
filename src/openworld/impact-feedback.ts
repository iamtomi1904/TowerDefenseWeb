/** Presentation only: never advances actions, rewards or world simulation. */
export class ImpactFeedback {
  private remaining = 0;
  private strength = 0;
  private age = 0;
  trigger(strength = 0.08): void {
    this.remaining = 0.16;
    this.strength = Math.min(0.12, Math.max(this.strength, strength));
    this.age = 0;
  }
  reset(): void {this.remaining = this.strength = this.age = 0;}
  advance(dt: number): {x: number; y: number} {
    dt = Math.max(0, dt);
    this.age += dt;
    this.remaining = Math.max(0, this.remaining - dt);
    if (!this.remaining) {this.strength = 0; return {x: 0, y: 0};}
    const amplitude = this.strength * (this.remaining / 0.16) ** 2;
    return {x: Math.sin(this.age * 155) * amplitude, y: Math.cos(this.age * 123) * amplitude * 0.55};
  }
}

export function withinHarvestReach(px: number, py: number, pz: number, tx: number, ty: number, tz: number): boolean {
  return Math.hypot(tx - px, tz - pz) <= 3.6 && Math.abs(ty - py) <= 0.65;
}
