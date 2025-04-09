export type ActionState<T> = {
  success: boolean
  error?: string | null
  data?: T | null
}
