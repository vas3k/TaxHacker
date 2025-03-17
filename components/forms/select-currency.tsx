import { Currency } from "@prisma/client"
import { SelectProps } from "@radix-ui/react-select"
import { useMemo } from "react"
import { FormSelect } from "./simple"

export const FormSelectCurrency = ({
  title,
  currencies,
  emptyValue,
  placeholder,
  ...props
}: { title: string; currencies: Currency[]; emptyValue?: string; placeholder?: string } & SelectProps) => {
  const items = useMemo(
    () => currencies.map((currency) => ({ code: currency.code, name: `${currency.code} - ${currency.name}` })),
    [currencies]
  )
  return <FormSelect title={title} items={items} emptyValue={emptyValue} placeholder={placeholder} {...props} />
}
