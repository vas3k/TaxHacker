import { useEffect, useState } from "react"

interface Progress {
  id: string
  current: number
  total: number
  type: string
  data: any
  createdAt: string
}

interface UseProgressOptions {
  onSuccess?: (progress: Progress) => void
  onError?: (error: Error) => void
}

export function useProgress(options: UseProgressOptions = {}) {
  const [isLoading, setIsLoading] = useState(false)
  const [eventSource, setEventSource] = useState<EventSource | null>(null)
  const [progress, setProgress] = useState<Progress | null>(null)

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (eventSource) {
        eventSource.close()
      }
    }
  }, [eventSource])

  const startProgress = async (type: string) => {
    setIsLoading(true)
    setProgress(null)

    // Close any existing connection
    if (eventSource) {
      eventSource.close()
    }

    try {
      const progressId = crypto.randomUUID()
      const source = new EventSource(`/api/progress/${progressId}?type=${type}`)
      setEventSource(source)

      source.onmessage = (event) => {
        try {
          const progress = JSON.parse(event.data)
          setProgress(progress)
          options.onSuccess?.(progress)

          if (progress.current === progress.total && progress.total > 0) {
            source.close()
            setIsLoading(false)
          }
        } catch (error) {
          console.error("Failed to parse progress data:", error)
          source.close()
          setIsLoading(false)
        }
      }

      source.onerror = (error) => {
        source.close()
        setIsLoading(false)
        const err = new Error("Progress tracking failed")
        console.error("Progress tracking error:", err)
        options.onError?.(err)
      }

      return progressId
    } catch (error) {
      setIsLoading(false)
      const err = error instanceof Error ? error : new Error("Failed to start progress")
      console.error("Failed to start progress:", err)
      options.onError?.(err)
      return null
    }
  }

  return {
    isLoading,
    startProgress,
    progress,
  }
}
