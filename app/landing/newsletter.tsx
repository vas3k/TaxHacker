"use client"

import { subscribeToNewsletterAction } from "@/app/landing/actions"
import { useState } from "react"

export function NewsletterForm() {
  const [email, setEmail] = useState("")
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle")
  const [message, setMessage] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setStatus("loading")
    setMessage("")

    try {
      const result = await subscribeToNewsletterAction(email)

      if (result.error) {
        throw new Error(result.error)
      }

      setStatus("success")
      setMessage("Thanks for subscribing! Check your email for confirmation.")
      setEmail("")
    } catch (error) {
      setStatus("error")
      setMessage(error instanceof Error ? error.message : "Failed to subscribe. Please try again.")
    }
  }

  return (
    <div className="bg-white p-8 rounded-2xl shadow-lg shadow-orange-900/5 ring-1 ring-orange-100">
      <div className="max-w-2xl mx-auto text-center">
        <h3 className="text-2xl font-bold mb-4 text-gray-900">Stay Tuned</h3>
        <p className="text-gray-600 mb-6">
          We&apos;re working hard on making TaxHacker useful for everyone. Subscribe to our emails to get notified about
          our plans and new features. No marketing, ads or spam.
        </p>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4 max-w-md mx-auto">
          <div className="flex flex-wrap items-center justify-center gap-4">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              className="flex-1 px-4 py-3 rounded-full border border-orange-200 bg-white text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500"
              required
            />
            <button
              type="submit"
              disabled={status === "loading"}
              className="px-8 py-3 bg-gradient-to-r from-orange-500 to-amber-500 text-white font-bold rounded-full hover:from-orange-600 hover:to-amber-600 transition-all shadow-lg shadow-orange-500/25 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {status === "loading" ? "Subscribing..." : "Subscribe"}
            </button>
          </div>
          {message && (
            <p className={`text-sm ${status === "success" ? "text-green-600" : "text-red-600"}`}>{message}</p>
          )}
        </form>
      </div>
    </div>
  )
}
