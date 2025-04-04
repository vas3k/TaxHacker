import { FormSelectCurrency } from "@/components/forms/select-currency"
import { FormInput } from "@/components/forms/simple"
import { Button } from "@/components/ui/button"
import { Card, CardDescription, CardTitle } from "@/components/ui/card"
import { ColoredText } from "@/components/ui/colored-text"
import config from "@/lib/config"
import { DEFAULT_CURRENCIES, DEFAULT_SETTINGS } from "@/models/defaults"
import { getSelfHostedUser } from "@/models/users"
import { ShieldAlert } from "lucide-react"
import { redirect } from "next/navigation"
import { selfHostedGetStartedAction } from "../actions"

export default async function SelfHostedWelcomePage() {
  if (!config.selfHosted.isEnabled) {
    return (
      <Card className="w-full max-w-xl mx-auto p-8 flex flex-col items-center justify-center gap-6">
        <CardTitle className="text-2xl font-bold flex items-center gap-2">
          <ShieldAlert className="w-6 h-6" />
          <span>Self-Hosted Mode is not enabled</span>
        </CardTitle>
        <CardDescription className="text-center text-lg flex flex-col gap-2">
          <p>
            To use TaxHacker in self-hosted mode, please set <code className="font-bold">SELF_HOSTED_MODE=true</code> in
            your environment.
          </p>
          <p>In self-hosted mode you can use your own ChatGPT API key and store your data on your own server.</p>
        </CardDescription>
      </Card>
    )
  }

  const user = await getSelfHostedUser()
  if (user) {
    redirect(config.selfHosted.redirectUrl)
  }

  return (
    <Card className="w-full max-w-xl mx-auto p-8 flex flex-col items-center justify-center gap-4">
      <img src="/logo/512.png" alt="Logo" className="w-36 h-36" />
      <CardTitle className="text-3xl font-bold ">
        <ColoredText>TaxHacker: Self-Hosted Edition</ColoredText>
      </CardTitle>
      <CardDescription className="flex flex-col gap-4 text-center text-lg">
        <p>Welcome to your own instance of TaxHacker. Let's set up a couple of settings to get started.</p>

        <form action={selfHostedGetStartedAction} className="flex flex-col gap-8 pt-8">
          <div>
            <FormInput title="OpenAI API Key" name="openai_api_key" defaultValue={config.ai.openaiApiKey} />

            <small className="text-xs text-muted-foreground">
              Get your API key from{" "}
              <a
                href="https://platform.openai.com/settings/organization/api-keys"
                target="_blank"
                className="underline"
              >
                OpenAI Platform Console
              </a>
            </small>
          </div>

          <div className="flex flex-row items-center justify-center gap-2">
            <FormSelectCurrency
              title="Default Currency"
              name="default_currency"
              defaultValue={DEFAULT_SETTINGS.find((s) => s.code === "default_currency")?.value ?? "EUR"}
              currencies={DEFAULT_CURRENCIES}
            />
          </div>

          <Button type="submit" className="w-auto p-6">
            Get Started
          </Button>
        </form>
      </CardDescription>
    </Card>
  )
}
