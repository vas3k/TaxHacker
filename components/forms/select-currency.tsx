import { SelectProps } from "@radix-ui/react-select"
import { useMemo } from "react"
import { FormSelect } from "./simple"

export const FormSelectCurrency = ({
  title,
  currencies,
  emptyValue,
  placeholder,
  hideIfEmpty = false,
  ...props
}: {
  title: string
  currencies: { code: string; name: string }[]
  emptyValue?: string
  placeholder?: string
  hideIfEmpty?: boolean
} & SelectProps) => {
  const items = useMemo(
    () => currencies.map((currency) => ({ code: currency.code, name: `${currency.code} - ${currency.name}` })),
    [currencies]
  )
  return (
    <FormSelect
      title={title}
      items={items}
      emptyValue={emptyValue}
      placeholder={placeholder}
      hideIfEmpty={hideIfEmpty}
      {...props}
    />
  )
}
