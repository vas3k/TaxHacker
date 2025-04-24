import config from "@/lib/config"
import { PLANS, stripeClient } from "@/lib/stripe"
import { NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get("code")

  if (!code) {
    return NextResponse.json({ error: "Missing plan code" }, { status: 400 })
  }

  if (!stripeClient) {
    return NextResponse.json({ error: "Stripe is not enabled" }, { status: 500 })
  }

  const plan = PLANS[code]
  if (!plan || !plan.isAvailable) {
    return NextResponse.json({ error: "Invalid or inactive plan" }, { status: 400 })
  }

  try {
    const session = await stripeClient.checkout.sessions.create({
      billing_address_collection: "auto",
      line_items: [
        {
          price: plan.stripePriceId,
          quantity: 1,
        },
      ],
      mode: "subscription",
      success_url: config.stripe.paymentSuccessUrl,
      cancel_url: config.stripe.paymentCancelUrl,
    })

    if (!session.url) {
      console.log(session)
      return NextResponse.json({ error: `Failed to create checkout session: ${session}` }, { status: 500 })
    }

    return NextResponse.json({ session })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: `Failed to create checkout session: ${error}` }, { status: 500 })
  }
}
