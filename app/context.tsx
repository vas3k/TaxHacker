"use client"

import { createContext, ReactNode, useContext, useState } from "react"

type Notification = {
  code: string
  message: string
}

type NotificationContextType = {
  notification: Notification | null
  showNotification: (notification: Notification) => void
}

const NotificationContext = createContext<NotificationContextType>({
  notification: null,
  showNotification: () => {},
})

export function NotificationProvider({ children }: { children: ReactNode }) {
  const [notification, setNotification] = useState<Notification | null>(null)

  const showNotification = (notification: Notification) => {
    setNotification(notification)
  }

  return (
    <NotificationContext.Provider value={{ notification, showNotification }}>{children}</NotificationContext.Provider>
  )
}

export const useNotification = () => useContext(NotificationContext)
