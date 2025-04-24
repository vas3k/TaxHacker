import { PricingCard } from "@/components/auth/pricing-card"
import { Card, CardContent, CardTitle } from "@/components/ui/card"
import { ColoredText } from "@/components/ui/colored-text"
import config from "@/lib/config"
import { PLANS } from "@/lib/stripe"
import { Mail } from "lucide-react"
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
          <ColoredText>TaxHacker Cloud Edition</ColoredText>
          <h2 className="mt-3 text-2xl font-semibold text-muted-foreground">Choose your plan</h2>
        </CardTitle>
        <CardContent className="w-full">
          {config.auth.disableSignup ? (
            <div className="text-center text-md text-muted-foreground">
              Creating new account is disabled for now. Please use the self-hosted version.
            </div>
          ) : (
            <div className="space-y-8">
              <div className="flex flex-wrap justify-center gap-8">
                {Object.values(PLANS)
                  .filter((plan) => plan.isAvailable)
                  .map((plan) => (
                    <PricingCard key={plan.code} plan={plan} />
                  ))}
              </div>

              <div className="text-center text-muted-foreground">
                By signing up, you agree to our{" "}
                <Link href="/docs/terms" className="hover:text-primary transition-colors underline">
                  Terms of Service
                </Link>
                ,{" "}
                <Link href="/docs/privacy_policy" className="hover:text-primary transition-colors underline">
                  Privacy Policy
                </Link>
                , and{" "}
                <Link href="/docs/ai" className="hover:text-primary transition-colors underline">
                  AI Usage Disclosure
                </Link>
              </div>
            </div>
          )}
        </CardContent>

        <div className="text-center text-muted-foreground">
          <Link
            href={`mailto:${config.app.supportEmail}`}
            className="flex flex-row gap-1 items-center hover:text-primary transition-colors underline"
          >
            <Mail className="w-4 h-4" />
            Contact us for custom plans
          </Link>
        </div>
      </Card>
    </div>
  )
}
