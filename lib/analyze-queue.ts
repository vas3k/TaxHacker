export type Task<T> = () => Promise<T>

export class ConcurrencyLimiter {
  private active = 0
  private max = 1
  private waiters: Array<() => void> = []

  setMax(max: number): void {
    this.max = Number.isFinite(max) && max >= 1 ? Math.floor(max) : 1
    this.fill()
  }

  get getMax(): number {
    return this.max
  }

  async run<T>(task: Task<T>): Promise<T> {
    await this.acquire()
    try {
      return await task()
    } finally {
      this.active -= 1
      this.fill()
    }
  }

  private acquire(): Promise<void> {
    if (this.active < this.max) {
      this.active += 1
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
    }
  }
}

export const analyzeLimiter = new ConcurrencyLimiter()
