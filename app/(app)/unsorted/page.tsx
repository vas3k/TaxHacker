import { FilePreview } from "@/components/files/preview"
import { UploadButton } from "@/components/files/upload-button"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import AnalyzeForm from "@/components/unsorted/analyze-form"
import { getCurrentUser } from "@/lib/auth"
import config from "@/lib/config"
import { getCategories } from "@/models/categories"
import { getCurrencies } from "@/models/currencies"
import { getFields } from "@/models/fields"
import { getUnsortedFiles } from "@/models/files"
import { getProjects } from "@/models/projects"
import { getSettings } from "@/models/settings"
import { FileText, PartyPopper, Settings, Upload } from "lucide-react"
import { Metadata } from "next"
import Link from "next/link"

export const metadata: Metadata = {
  title: "Unsorted",
  description: "Analyze unsorted files",
}

export default async function UnsortedPage() {
  const user = await getCurrentUser()
  const files = await getUnsortedFiles(user.id)
  const categories = await getCategories(user.id)
  const projects = await getProjects(user.id)
  const currencies = await getCurrencies(user.id)
  const fields = await getFields(user.id)
  const settings = await getSettings(user.id)

  return (
    <div className="flex flex-col gap-4 p-4 w-full max-w-6xl">
      <header className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">You have {files.length} unsorted files</h2>
      </header>

      {config.selfHosted.isEnabled && !settings.openai_api_key && (
        <Alert>
          <Settings className="h-4 w-4 mt-2" />
          <div className="flex flex-row justify-between pt-2">
            <div className="flex flex-col">
              <AlertTitle>ChatGPT API Key is required for analyzing files</AlertTitle>
              <AlertDescription>
                Please set your OpenAI API key in the settings to use the analyze form.
              </AlertDescription>
            </div>
            <Link href="/settings/llm">
              <Button>Go to Settings</Button>
            </Link>
          </div>
        </Alert>
      )}

      <main className="flex flex-col gap-5">
        {files.map((file) => (
          <Card
            key={file.id}
            id={file.id}
            className="flex flex-row flex-wrap md:flex-nowrap justify-center items-start gap-5 p-5 bg-accent"
          >
            <div className="w-full max-w-[500px]">
              <Card>
                <FilePreview file={file} />
              </Card>
            </div>

            <div className="w-full">
              <AnalyzeForm
                file={file}
                categories={categories}
                projects={projects}
                currencies={currencies}
                fields={fields}
                settings={settings}
              />
            </div>
          </Card>
        ))}
        {files.length == 0 && (
          <div className="flex flex-col items-center justify-center gap-2 h-full min-h-[600px]">
            <PartyPopper className="w-12 h-12 text-muted-foreground" />
            <p className="pt-4 text-muted-foreground">Everything is clear! Congrats!</p>
            <p className="flex flex-row gap-2 text-muted-foreground">
              <span>Drag and drop new files here to analyze</span>
              <Upload />
            </p>

            <div className="flex flex-row gap-5 mt-8">
              <UploadButton>
                <Upload /> Upload New File
              </UploadButton>
              <Button variant="outline" asChild>
                <Link href="/transactions">
                  <FileText />
                  Go to Transactions
                </Link>
              </Button>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
