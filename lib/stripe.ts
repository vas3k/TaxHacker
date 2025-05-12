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
    description: "Discounted plan for our first users who can forgive us bugs and childish problems :)",
    benefits: [
      "Special price for early adopters",
      "512 Mb of storage",
      "1000 AI file analyses",
      "Unlimited transactions",
      "Unlimited fields, categories and projects",
    ],
    price: "€35 for a year",
    stripePriceId: "price_1RHTj1As8DS4NhOzhejpTN3I",
    limits: {
      storage: 512 * 1024 * 1024,
      ai: 1000,
    },
    isAvailable: true,
  },
}
