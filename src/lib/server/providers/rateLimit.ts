import "server-only";

export class WindowLimiter {
  private start = 0;
  private count = 0;
  constructor(private limit: number, private windowMs = 60_000, private now = Date.now) {}
  take() {
    const now = this.now();
    if (now - this.start >= this.windowMs) { this.start = now; this.count = 0; }
    if (this.count >= this.limit) return false;
    this.count++; return true;
  }
}
