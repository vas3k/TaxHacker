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
    <div className="bg-gradient-to-r from-purple-50 to-blue-50 p-8 rounded-2xl shadow-sm ring-1 ring-gray-100">
      <div className="max-w-2xl mx-auto text-center">
        <h3 className="text-2xl font-semibold mb-4">Stay Tuned</h3>
        <p className="text-gray-600 mb-6">
          We're working hard on making TaxHacker useful for everyone. Subscribe to our emails to get notified about our
          plans and new features. No marketing, ads or spam.
        </p>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4 max-w-md mx-auto">
          <div className="flex flex-wrap items-center justify-center gap-4">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              className="flex-1 px-4 py-3 rounded-full border border-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-500"
              required
            />
            <button
              type="submit"
              disabled={status === "loading"}
              className="px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white font-medium rounded-full hover:opacity-90 transition-all shadow-lg shadow-purple-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
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
