import { Button } from "@/components/ui/button"
import { Card, CardDescription, CardTitle } from "@/components/ui/card"
import { getSettings, updateSettings } from "@/models/settings"
import { Banknote, ChartBarStacked, FolderOpenDot, Key, TextCursorInput, X } from "lucide-react"
import { revalidatePath } from "next/cache"
import Link from "next/link"

export async function WelcomeWidget() {
  const settings = await getSettings()

  return (
    <Card className="flex flex-col md:flex-row items-start gap-10 p-10 w-full">
      <img src="/logo/1024.png" alt="Logo" className="w-64 h-64" />
      <div className="flex flex-col">
        <CardTitle className="flex items-center justify-between">
          <span className="text-2xl font-bold">Hey, I'm TaxHacker 👋</span>
          <Button
            variant="outline"
            size="icon"
            onClick={async () => {
              "use server"
              await updateSettings("is_welcome_message_hidden", "true")
              revalidatePath("/")
            }}
          >
            <X className="h-4 w-4" />
          </Button>
        </CardTitle>
        <CardDescription className="mt-5">
          <p className="mb-3">
            I'm a little accountant app that tries to help you deal with endless receipts, checks and invoices with (you
            guessed it) GenAI. Here's what I can do:
          </p>
          <ul className="mb-5 list-disc pl-5 space-y-1">
            <li>
              <strong>Upload me a photo or a PDF</strong> and I will recognize, categorize and save it as a transaction
              for your tax advisor.
            </li>
            <li>
              I can <strong>automatically convert currencies</strong> and look up exchange rates for a given date.
            </li>
            <li>
              I even <strong>support crypto!</strong> Historical exchange rates for staking too.
            </li>
            <li>
              All <strong>LLM prompts are configurable</strong>: for fields, categories and projects. You can go to
              settings and change them.
            </li>
            <li>
              I save data in a <strong>local SQLite database</strong> and can export it to CSV and ZIP archives.
            </li>
            <li>
              You can even <strong>create your own new fields</strong> to be analyzed and they will be included in the
              CSV export for your tax advisor.
            </li>
            <li>
              I'm still <strong>very young</strong> and can make mistakes. Use me at your own risk!
            </li>
          </ul>
          <p className="mb-3">
            While I can save you a lot of time in categorizing transactions and generating reports, I still highly
            recommend giving the results to a professional tax advisor for review when filing your taxes!
          </p>
        </CardDescription>
        <div className="mt-2">
          <Link href="https://github.com/vas3k/TaxHacker" className="text-blue-500 hover:underline">
            Source Code
          </Link>
          <span className="mx-2">|</span>
          <Link href="https://github.com/vas3k/TaxHacker/issues" className="text-blue-500 hover:underline">
            Request New Feature
          </Link>
          <span className="mx-2">|</span>
          <Link href="https://github.com/vas3k/TaxHacker/issues" className="text-blue-500 hover:underline">
            Report a Bug
          </Link>
          <span className="mx-2">|</span>
          <Link href="mailto:me@vas3k.ru" className="text-blue-500 hover:underline">
            Contact the Author
          </Link>
        </div>
        <div className="flex flex-wrap gap-2 mt-8">
          {settings.openai_api_key === "" && (
            <Link href="/settings/llm">
              <Button>
                <Key className="h-4 w-4" />
                Please give your ChatGPT key here
              </Button>
            </Link>
          )}
          <Link href="/settings">
            <Button variant="outline">
              <Banknote className="h-4 w-4" />
              Default Currency: {settings.default_currency}
            </Button>
          </Link>
          <Link href="/settings/categories">
            <Button variant="outline">
              <ChartBarStacked className="h-4 w-4" />
              Categories
            </Button>
          </Link>
          <Link href="/settings/projects">
            <Button variant="outline">
              <FolderOpenDot className="h-4 w-4" />
              Projects
            </Button>
          </Link>
          <Link href="/settings/fields">
            <Button variant="outline">
              <TextCursorInput className="h-4 w-4" />
              Custom Fields
            </Button>
          </Link>
        </div>
      </div>
    </Card>
  )
}
