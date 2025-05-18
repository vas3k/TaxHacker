"use client"

import { FormSelect } from "@/components/forms/simple"
import { Button } from "@/components/ui/button"
import { User } from "@/prisma/client"
import { Loader2 } from "lucide-react"
import { useEffect, useState } from "react"
import { getLastTaxAdviceData, getTransactionTaxAdvice, TaxAdviceResponse } from "../actions"
import { countries } from "../countries"

const DEFAULT_PROMPT = `Please analyze my transactions and provide tax advice. 
Consider the following questions:
1. Are there any transactions that might be problematic during a tax audit?
2. What tax deductions am I missing?
3. How can I better categorize my expenses for tax purposes?
4. Any recommendations for tax optimization?`

export function TaxAdvisorComponent({ user }: { user: User }) {
  const [prompt, setPrompt] = useState(DEFAULT_PROMPT)
  const [countryCode, setCountryCode] = useState<string>("us")
  const [isLoading, setIsLoading] = useState(false)
  const [isInitialized, setIsInitialized] = useState(false)
  const [isLoadingData, setIsLoadingData] = useState(true)
  const [result, setResult] = useState<TaxAdviceResponse | null>(null)
  const [error, setError] = useState<string | null>(null)

  // Format countries for the FormSelect component
  const countryOptions = countries.map((country) => ({
    code: country.code,
    name: `${country.flag} ${country.name}`,
  }))

  // Load saved data on component mount
  useEffect(() => {
    async function loadSavedData() {
      try {
        const savedData = await getLastTaxAdviceData(user)
        if (savedData) {
          setPrompt(savedData.lastRequest.prompt)
          setCountryCode(savedData.lastRequest.countryCode)
          setResult(savedData.lastResponse)
          setIsInitialized(true)
        }
      } catch (err) {
        console.error("Error loading saved data:", err)
      } finally {
        setIsLoadingData(false)
      }
    }

    loadSavedData()
  }, [user])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    // Get the selected country details
    const selectedCountry = countries.find((c) => c.code === countryCode)

    // Create the final prompt with country information
    let finalPrompt = prompt
    if (selectedCountry) {
      finalPrompt = `${finalPrompt}\n\nPlease consider the tax laws and regulations specific to ${selectedCountry.name} ${selectedCountry.flag} when providing advice.`
    }

    try {
      const response = await getTransactionTaxAdvice({
        prompt: finalPrompt,
        countryCode: countryCode,
      })

      if (response.success && response.data) {
        setResult(response.data)
        setIsInitialized(true)
      } else {
        setError(response.error || "Failed to get tax advice")
      }
    } catch (err) {
      setError(`Error: ${err}`)
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoadingData) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="flex flex-col gap-4">
          <FormSelect
            items={countryOptions}
            title="Select country for tax advice"
            placeholder="Select a country"
            value={countryCode}
            onValueChange={setCountryCode}
          />

          <textarea
            id="prompt"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            className="w-full min-h-[200px] p-4 border border-gray-300 rounded-md"
            placeholder="Enter your question about taxes and transactions..."
          />
        </div>

        <Button type="submit" disabled={isLoading} className="w-full md:w-auto">
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Analyzing...
            </>
          ) : (
            "Ask Tax Advisor"
          )}
        </Button>
      </form>

      {error && <div className="p-4 bg-red-50 border border-red-200 rounded-md text-red-800">{error}</div>}

      {isInitialized && result && (
        <div className="flex flex-col gap-6">
          <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
            <h3 className="text-xl font-semibold mb-4">Tax Recommendations</h3>

            {result.recommendations.map((recommendation, index) => (
              <div key={index} className="mb-6 last:mb-0">
                <h4 className="text-lg font-semibold mb-2">{recommendation.title}</h4>
                <p className="text-gray-700 mb-3">{recommendation.description}</p>

                {recommendation.steps.length > 0 && (
                  <div className="pl-4 border-l-2 border-gray-200">
                    <h5 className="font-medium mb-1">Steps to Take:</h5>
                    <ul className="list-disc pl-5">
                      {recommendation.steps.map((step, stepIndex) => (
                        <li key={stepIndex} className="mb-1">
                          {step}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ))}
          </div>

          {result.problematicTransactions.length > 0 && (
            <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
              <h3 className="text-xl font-semibold mb-4">Problematic Transactions</h3>
              <div className="divide-y divide-gray-200">
                {result.problematicTransactions.map((tx) => (
                  <div key={tx.id} className="py-4">
                    <div className="font-medium">{tx.name}</div>
                    <div className="text-sm text-red-600">{tx.reason}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
