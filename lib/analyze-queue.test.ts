import { describe, expect, it } from "vitest"
import { AnalyzeProgress, ConcurrencyLimiter } from "./analyze-queue"

function tracker() {
  let active = 0
  let peak = 0
  const task = async () => {
    active += 1
    peak = Math.max(peak, active)
    await new Promise<void>((r) => setTimeout(r, 10))
    active -= 1
  }
  return { task, peak: () => peak }
}

describe("ConcurrencyLimiter", () => {
  it("runs tasks strictly serially when max=1", async () => {
    const limiter = new ConcurrencyLimiter()
    limiter.setMax(1)
    const { task, peak } = tracker()

    const order: string[] = []
    const labeled = (label: string) => async () => {
      order.push(label)
      await task()
      return label
    }

    const results = await Promise.all([
      limiter.run(labeled("a")),
      limiter.run(labeled("b")),
      limiter.run(labeled("c")),
    ])

    expect(peak()).toBe(1)
    expect(results).toEqual(["a", "b", "c"])
    expect(order).toEqual(["a", "b", "c"])
  })

  it("allows up to max concurrent tasks and queues the rest", async () => {
    const limiter = new ConcurrencyLimiter()
    limiter.setMax(2)
    const { task, peak } = tracker()

    await Promise.all(Array.from({ length: 5 }, () => limiter.run(task)))

    expect(peak()).toBe(2)
  })

  it("raises capacity for already-queued tasks when setMax increases", async () => {
    const limiter = new ConcurrencyLimiter()
    limiter.setMax(1)
    const { task, peak } = tracker()

    const pending = [limiter.run(task), limiter.run(task), limiter.run(task), limiter.run(task)]
    limiter.setMax(3)
    await Promise.all(pending)

    expect(peak()).toBe(3)
  })

  it("clamps non-positive / non-finite max to 1", async () => {
    const limiter = new ConcurrencyLimiter()
    limiter.setMax(0)
    const { task, peak } = tracker()

    await Promise.all([limiter.run(task), limiter.run(task)])

    expect(peak()).toBe(1)
    expect(limiter.getMax).toBe(1)
  })

  it("reduceMax lowers the cap by 1 and floors at 1", () => {
    const limiter = new ConcurrencyLimiter()
    limiter.setMax(4)
    expect(limiter.getMax).toBe(4)
    limiter.reduceMax()
    expect(limiter.getMax).toBe(3)
    limiter.reduceMax()
    limiter.reduceMax()
    expect(limiter.getMax).toBe(1)
    limiter.reduceMax()
    expect(limiter.getMax).toBe(1)
  })
})

describe("AnalyzeProgress", () => {
  it("aggregates per-doc states into counts", () => {
    const progress = new AnalyzeProgress()
    progress.setState("a", "queued")
    progress.setState("b", "analyzing")
    progress.setState("c", "analyzing")
    progress.setState("d", "done")
    progress.setState("e", "error")
    expect(progress.getCountsSnapshot()).toEqual({
      analyzing: 2,
      queued: 1,
      done: 1,
      error: 1,
      total: 5,
    })
  })

  it("overwrites a doc's previous state and clears on removal", () => {
    const progress = new AnalyzeProgress()
    progress.setState("a", "queued")
    progress.setState("a", "analyzing")
    expect(progress.getCountsSnapshot()).toMatchObject({ analyzing: 1, queued: 0 })
    progress.setState("a", "done")
    expect(progress.getCountsSnapshot()).toMatchObject({ done: 1, analyzing: 0 })
    progress.clear("a")
    expect(progress.getCountsSnapshot()).toEqual({
      analyzing: 0,
      queued: 0,
      done: 0,
      error: 0,
      total: 0,
    })
  })

  it("returns a stable snapshot reference between changes (useSyncExternalStore-safe)", () => {
    const progress = new AnalyzeProgress()
    const before = progress.getCountsSnapshot()
    const unchanged = progress.getCountsSnapshot()
    expect(unchanged).toBe(before)
    progress.setState("a", "queued")
    expect(progress.getCountsSnapshot()).not.toBe(before)
  })
})
