import Stripe from "stripe"
import config from "./config"

export const stripeClient: Stripe | null = config.stripe.secretKey
  ? new Stripe(config.stripe.secretKey, {
      apiVersion: "2025-03-31.basil",
    })
  : null

// Type guard to check if Stripe is initialized
export const isStripeEnabled = (client: Stripe | null): client is Stripe => {
  return client !== null
}
