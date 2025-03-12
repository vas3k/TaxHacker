import { Currency } from "@prisma/client"
import { SelectProps } from "@radix-ui/react-select"
import { FormSelect } from "./simple"

export const FormSelectCurrency = ({
  title,
  currencies,
  emptyValue,
  placeholder,
  ...props
}: { title: string; currencies: Currency[]; emptyValue?: string; placeholder?: string } & SelectProps) => {
  return (
    <FormSelect
      title={title}
      items={currencies.map((currency) => ({ code: currency.code, name: `${currency.code} - ${currency.name}` }))}
      emptyValue={emptyValue}
      placeholder={placeholder}
      {...props}
    />
  )
}
