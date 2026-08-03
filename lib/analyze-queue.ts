export type Task<T> = () => Promise<T>

export class ConcurrencyLimiter {
  private active = 0
  private max = 1
  private waiters: Array<() => void> = []
  private listeners = new Set<() => void>()

  setMax(max: number): void {
    this.max = Number.isFinite(max) && max >= 1 ? Math.floor(max) : 1
    this.fill()
    this.emit()
  }

  /** Lower the cap by 1 (used on rate-limit); never goes below 1. */
  reduceMax(): void {
    if (this.max <= 1) return
    this.max -= 1
    this.emit()
  }

  get getMax(): number {
    return this.max
  }

  get getActive(): number {
    return this.active
  }

  async run<T>(task: Task<T>): Promise<T> {
    await this.acquire()
    try {
      return await task()
    } finally {
      this.active -= 1
      this.fill()
      this.emit()
    }
  }

  subscribe = (listener: () => void): (() => void) => {
    this.listeners.add(listener)
    return () => {
      this.listeners.delete(listener)
    }
  }

  getMaxSnapshot = (): number => this.max

  getActiveSnapshot = (): number => this.active

  private acquire(): Promise<void> {
    if (this.active < this.max) {
      this.active += 1
      this.emit()
      return Promise.resolve()
    }
    return new Promise<void>((resolve) => {
      this.waiters.push(resolve)
    })
  }

  private fill(): void {
    while (this.waiters.length > 0 && this.active < this.max) {
      this.active += 1
      this.waiters.shift()?.()
      this.emit()
    }
  }

  private emit(): void {
    for (const listener of this.listeners) listener()
  }
}

export const analyzeLimiter = new ConcurrencyLimiter()
