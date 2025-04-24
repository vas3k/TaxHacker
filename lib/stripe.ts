import Stripe from "stripe"
import config from "./config"

export const stripeClient: Stripe | null = config.stripe.secretKey
  ? new Stripe(config.stripe.secretKey, {
      apiVersion: "2025-03-31.basil",
    })
  : null

export type Plan = {
  code: string
  name: string
  description: string
  benefits: string[]
  price: string
  stripePriceId: string
  limits: {
    storage: number
    ai: number
  }
  isAvailable: boolean
}

export const PLANS: Record<string, Plan> = {
  unlimited: {
    code: "unlimited",
    name: "Unlimited",
    description: "Special unlimited plan",
    benefits: ["Unlimited storage", "Unlimited AI analysis", "Unlimited everything"],
    price: "",
    stripePriceId: "",
    limits: {
      storage: -1,
      ai: -1,
    },
    isAvailable: false,
  },
  early: {
    code: "early",
    name: "Early Adopter",
    description: "Special plan for our early users",
    benefits: [
      "512 Mb of storage",
      "1000 AI file analysis",
      "Unlimited transactions",
      "Unlimited fields, categories and projects",
    ],
    price: "€50/year",
    stripePriceId: "price_1RGzKUPKOUEUzVB3hVyo2n57",
    limits: {
      storage: 512 * 1024 * 1024,
      ai: 1000,
    },
    isAvailable: true,
  },
}
