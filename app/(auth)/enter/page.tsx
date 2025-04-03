import { LoginForm } from "@/components/auth/login-form"
import { Card, CardContent, CardTitle } from "@/components/ui/card"
import { ColoredText } from "@/components/ui/colored-text"
import config from "@/lib/config"
import { redirect } from "next/navigation"

export default async function LoginPage() {
  if (config.selfHosted.isEnabled) {
    redirect(config.selfHosted.redirectUrl)
  }

  return (
    <Card className="w-full max-w-xl mx-auto p-8 flex flex-col items-center justify-center gap-4">
      <img src="/logo/512.png" alt="Logo" className="w-36 h-36" />
      <CardTitle className="text-3xl font-bold ">
        <ColoredText>TaxHacker: Cloud Edition</ColoredText>
      </CardTitle>
      <CardContent className="w-full">
        <LoginForm />
      </CardContent>
    </Card>
  )
}
