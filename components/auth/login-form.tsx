"use client"

import { FormError } from "@/components/forms/error"
import { FormInput } from "@/components/forms/simple"
import { Button } from "@/components/ui/button"
import { authClient } from "@/lib/auth-client"
import { useRouter } from "next/navigation"
import { useState } from "react"

export function LoginForm({ defaultEmail }: { defaultEmail?: string }) {
  const [email, setEmail] = useState(defaultEmail || "")
  const [otp, setOtp] = useState("")
  const [isOtpSent, setIsOtpSent] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      const result = await authClient.emailOtp.sendVerificationOtp({
        email,
        type: "sign-in",
      })
      if (result.error) {
        setError(result.error.message || "Failed to send the code")
        return
      }
      setIsOtpSent(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to send the code")
    } finally {
      setIsLoading(false)
    }
  }

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      const result = await authClient.signIn.emailOtp({
        email,
        otp,
      })
      if (result.error) {
        setError("The code is invalid or expired")
        return
      }

      router.push("/dashboard")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to verify the code")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={isOtpSent ? handleVerifyOtp : handleSendOtp} className="flex flex-col gap-4 w-full">
      <FormInput
        title="Email"
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
        disabled={isOtpSent}
      />

      {isOtpSent && (
        <FormInput
          title="Check your email for the verification code"
          type="text"
          value={otp}
          onChange={(e) => setOtp(e.target.value)}
          required
          maxLength={6}
          pattern="[0-9]{6}"
        />
      )}

      <Button type="submit" disabled={isLoading}>
        {isLoading ? "Loading..." : isOtpSent ? "Verify Code" : "Enter"}
      </Button>

      {error && <FormError className="text-center">{error}</FormError>}
    </form>
  )
}
