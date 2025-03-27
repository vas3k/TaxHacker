import { SelectProps } from "@radix-ui/react-select"
import { FormSelect } from "./simple"

export const FormSelectType = ({
  title,
  emptyValue,
  placeholder,
  hideIfEmpty = false,
  ...props
}: { title: string; emptyValue?: string; placeholder?: string; hideIfEmpty?: boolean } & SelectProps) => {
  const items = [
    { code: "expense", name: "Expense" },
    { code: "income", name: "Income" },
    { code: "pending", name: "Pending" },
    { code: "other", name: "Other" },
  ]

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
