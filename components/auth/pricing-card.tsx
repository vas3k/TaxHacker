"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Plan } from "@/lib/stripe"
import { Check, Loader2 } from "lucide-react"
import { useState } from "react"
import { FormError } from "../forms/error"

export function PricingCard({ plan, hideButton = false }: { plan: Plan; hideButton?: boolean }) {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleClick = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const response = await fetch(`/api/stripe/checkout?code=${plan.code}`, {
        method: "POST",
      })
      const data = await response.json()
      if (data.error) {
        setError(data.error)
      } else {
        window.location.href = data.session.url
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : "An unknown error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className="w-full max-w-xs relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-secondary/10" />
      <CardHeader className="relative">
        <CardTitle className="text-3xl">{plan.name}</CardTitle>
        <CardDescription>{plan.description}</CardDescription>
        {plan.price && <div className="text-2xl font-bold mt-4">{plan.price}</div>}
      </CardHeader>
      <CardContent className="relative">
        <ul className="space-y-2">
          {plan.benefits.map((benefit, index) => (
            <li key={index} className="flex items-center gap-2">
              <Check className="h-4 w-4 text-primary" />
              <span>{benefit}</span>
            </li>
          ))}
        </ul>
      </CardContent>
      <CardFooter className="flex flex-col gap-2 relative">
        {!hideButton && (
          <Button className="w-full" onClick={handleClick} disabled={isLoading}>
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Get Started"}
          </Button>
        )}
        {error && <FormError>{error}</FormError>}
      </CardFooter>
    </Card>
  )
}
