import { PricingCard } from "@/components/auth/pricing-card"
import { Card, CardContent, CardTitle } from "@/components/ui/card"
import { ColoredText } from "@/components/ui/colored-text"
import config from "@/lib/config"
import { PLANS } from "@/lib/stripe"
import Link from "next/link"
import { redirect } from "next/navigation"

export default async function ChoosePlanPage() {
  if (config.selfHosted.isEnabled) {
    redirect(config.selfHosted.redirectUrl)
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <Card className="w-full max-w-4xl mx-auto p-8 flex flex-col items-center justify-center gap-8">
        <CardTitle className="text-4xl font-bold text-center">
          <ColoredText>Choose your Cloud Edition plan</ColoredText>
        </CardTitle>
        <CardContent className="w-full">
          {config.auth.disableSignup ? (
            <div className="text-center text-md text-muted-foreground">
              Creating new account is disabled for now. Please use the self-hosted version.
            </div>
          ) : (
            <div className="flex flex-wrap justify-center gap-8">
              {Object.values(PLANS)
                .filter((plan) => plan.isAvailable)
                .map((plan) => (
                  <PricingCard key={plan.code} plan={plan} />
                ))}
            </div>
          )}
        </CardContent>
        <div className="text-center text-muted-foreground">
          <Link href="mailto:me@vas3k.com" className="hover:text-primary transition-colors">
            Contact us for custom plans
          </Link>
        </div>
      </Card>
    </div>
  )
}
