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

export type AnalyzeDocState = "queued" | "analyzing" | "done" | "error"

export type AnalyzeCounts = {
  analyzing: number
  queued: number
  done: number
  error: number
  total: number
}

const EMPTY_COUNTS: AnalyzeCounts = { analyzing: 0, queued: 0, done: 0, error: 0, total: 0 }

/**
 * Per-file analyze progress, reported by each AnalyzeForm and aggregated
 * for the progress badge. Module singleton so all cards share one store.
 */
export class AnalyzeProgress {
  private states = new Map<string, AnalyzeDocState>()
  private listeners = new Set<() => void>()
  private cached: AnalyzeCounts = EMPTY_COUNTS

  setState(fileId: string, state: AnalyzeDocState): void {
    this.states.set(fileId, state)
    this.recompute()
  }

  clear(fileId: string): void {
    if (this.states.delete(fileId)) this.recompute()
  }

  subscribe = (listener: () => void): (() => void) => {
    this.listeners.add(listener)
    return () => {
      this.listeners.delete(listener)
    }
  }

  getCountsSnapshot = (): AnalyzeCounts => this.cached

  private recompute(): void {
    let analyzing = 0
    let queued = 0
    let done = 0
    let error = 0
    for (const state of this.states.values()) {
      if (state === "analyzing") analyzing++
      else if (state === "queued") queued++
      else if (state === "done") done++
      else error++
    }
    this.cached = { analyzing, queued, done, error, total: this.states.size }
    for (const listener of this.listeners) listener()
  }
}

export const analyzeProgress = new AnalyzeProgress()
