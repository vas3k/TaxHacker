import config from "@/lib/config"
import { PLANS, stripeClient } from "@/lib/stripe"
import { createUserDefaults, isDatabaseEmpty } from "@/models/defaults"
import { getOrCreateCloudUser, getUserByStripeCustomerId, updateUser } from "@/models/users"
import { NextResponse } from "next/server"
import Stripe from "stripe"

export async function POST(request: Request) {
  const signature = request.headers.get("stripe-signature")
  const body = await request.text()

  if (!signature || !config.stripe.webhookSecret) {
    return new NextResponse("Webhook signature or secret missing", { status: 400 })
  }

  if (!stripeClient) {
    return new NextResponse("Stripe client is not initialized", { status: 500 })
  }

  let event: Stripe.Event

  try {
    event = stripeClient.webhooks.constructEvent(body, signature, config.stripe.webhookSecret)
  } catch (err) {
    console.error(`Webhook signature verification failed:`, err)
    return new NextResponse("Webhook signature verification failed", { status: 400 })
  }

  console.log("Webhook event:", event)

  // Handle the event
  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session
        const customerId = session.customer as string
        const subscriptionId = session.subscription as string
        const subscription = await stripeClient.subscriptions.retrieve(subscriptionId)

        for (const item of subscription.items.data) {
          await handleUserSubscriptionUpdate(customerId, item)
        }
        break
      }

      case "customer.subscription.created":
      case "customer.subscription.updated":
      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription
        const customerId = subscription.customer as string

        for (const item of subscription.items.data) {
          await handleUserSubscriptionUpdate(customerId, item)
        }
        break
      }

      default:
        console.log(`Unhandled event type ${event.type}`)
        return new NextResponse("No handler for event type", { status: 400 })
    }

    return new NextResponse("Webhook processed successfully", { status: 200 })
  } catch (error) {
    console.error("Error processing webhook:", error)
    return new NextResponse("Webhook processing failed", { status: 500 })
  }
}

async function handleUserSubscriptionUpdate(
  customerId: string,
  item: Stripe.SubscriptionItem
) {
  if (!stripeClient) {
    return new NextResponse("Stripe client is not initialized", { status: 500 })
  }

  const plan = Object.values(PLANS).find((p) => p.stripePriceId === item.price.id)
  if (!plan) {
    throw new Error(`Plan not found for price ID: ${item.price.id}`)
  }

  let user = await getUserByStripeCustomerId(customerId)
  if (!user) {
    const customer = (await stripeClient.customers.retrieve(customerId)) as Stripe.Customer
    user = await getOrCreateCloudUser(customer.email as string, {
      email: customer.email as string,
      name: customer.name as string,
      stripeCustomerId: customer.id,
    })

    if (await isDatabaseEmpty(user.id)) {
      await createUserDefaults(user.id)
    }
  }

  const newMembershipExpiresAt = new Date(item.current_period_end * 1000)

  await updateUser(user.id, {
    membershipPlan: plan.code,
    membershipExpiresAt:
      user.membershipExpiresAt && user.membershipExpiresAt > newMembershipExpiresAt
        ? user.membershipExpiresAt
        : newMembershipExpiresAt,
    storageLimit: plan.limits.storage,
    aiBalance: plan.limits.ai,
    updatedAt: new Date(),
  })

  console.log(`Updated user ${user.id} with plan ${plan.code} and expires at ${newMembershipExpiresAt}`)
}
