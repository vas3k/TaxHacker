import { Card, CardContent, CardTitle } from "@/components/ui/card"
import { ColoredText } from "@/components/ui/colored-text"
import { IS_SELF_HOSTED_MODE, SELF_HOSTED_REDIRECT_URL } from "@/lib/constants"
import { redirect } from "next/navigation"

export default async function LoginPage() {
  if (IS_SELF_HOSTED_MODE) {
    redirect(SELF_HOSTED_REDIRECT_URL)
  }

  return (
    <Card className="w-full max-w-xl mx-auto p-8 flex flex-col items-center justify-center gap-4">
      <img src="/logo/512.png" alt="Logo" className="w-36 h-36" />
      <CardTitle className="text-3xl font-bold ">
        <ColoredText>TaxHacker: Cloud Edition</ColoredText>
      </CardTitle>
      <CardContent className="w-full">
        <div className="text-center text-md text-muted-foreground">
          Creating new account is disabled for now. Please use the self-hosted version.
        </div>
        {/* <SignupForm /> */}
      </CardContent>
    </Card>
  )
}
