"use client"
import { useState, useRef, useEffect, useCallback } from "react"
import { FormSelectCurrency } from "@/components/forms/select-currency"
import { FormInput } from "@/components/forms/simple"
import { Button } from "@/components/ui/button"
import { DEFAULT_CURRENCIES, DEFAULT_SETTINGS } from "@/models/defaults"
import { selfHostedGetStartedAction } from "../actions"
import { FormSelect } from "@/components/forms/simple"
import { PROVIDERS } from "@/lib/llm-providers"

type Props = {
  defaultProvider: string
  defaultApiKeys: Record<string, string>
}

export default function SelfHostedSetupFormClient({ defaultProvider, defaultApiKeys }: Props) {
  const [provider, setProvider] = useState(defaultProvider)
  const selected = PROVIDERS.find(p => p.key === provider)!
  const getDefaultApiKey = useCallback((providerKey: string) => defaultApiKeys[providerKey] ?? "", [defaultApiKeys])

  const [apiKey, setApiKey] = useState(getDefaultApiKey(provider))
  const userTyped = useRef(false)

  useEffect(() => {
    if (!userTyped.current) {
      setApiKey(getDefaultApiKey(provider))
    }
    userTyped.current = false
  }, [provider, getDefaultApiKey])

  return (
    <form action={selfHostedGetStartedAction} className="flex flex-col gap-8 pt-8">
      <div className="flex flex-row gap-4 items-center justify-center">
        <FormSelect
          title="LLM provider"
          name="provider"
          value={provider}
          onValueChange={setProvider}
          items={PROVIDERS.map(p => ({
            code: p.key,
            name: p.label,
            logo: p.logo
          }))}
        />
        <FormSelectCurrency
          title="Default Currency"
          name="default_currency"
          defaultValue={DEFAULT_SETTINGS.find((s) => s.code === "default_currency")?.value ?? "EUR"}
          currencies={DEFAULT_CURRENCIES}
        />
      </div>
      <div>
        <FormInput
          title={`${selected.label} API Key`}
          name={selected.apiKeyName}
          value={apiKey ?? ""}
          onChange={e => {
            setApiKey(e.target.value)
            userTyped.current = true
          }}
          placeholder={selected.placeholder}
        />
        <small className="text-xs text-muted-foreground flex justify-center mt-2">
          Get key from
          {"\u00A0"}
          <a href={selected.help.url} target="_blank" className="underline">
            {selected.help.label}
          </a>
        </small>
      </div>
      <Button type="submit" className="w-auto p-6">
        Get Started
      </Button>
    </form>
  )
}