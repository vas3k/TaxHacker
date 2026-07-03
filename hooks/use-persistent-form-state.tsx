import { useEffect, useState } from "react"

export function usePersistentFormState(key: string, defaultState = {}) {
  const [formState, setFormState] = useState(defaultState)
  const [isLoaded, setIsLoaded] = useState(false)

  useEffect(() => {
    const saved = localStorage.getItem(key)
    if (saved) {
      setFormState(JSON.parse(saved))
    }
    setIsLoaded(true)
  }, [key])

  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem(key, JSON.stringify(formState))
    }
  }, [formState, isLoaded, key])

  return [formState, setFormState] as const
}
