import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"
import { SelectProps } from "@radix-ui/react-select"
import { InputHTMLAttributes, TextareaHTMLAttributes } from "react"

type FormInputProps = InputHTMLAttributes<HTMLInputElement> & {
  title: string
  hideIfEmpty?: boolean
}

export function FormInput({ title, hideIfEmpty = false, ...props }: FormInputProps) {
  if (hideIfEmpty && (!props.defaultValue || props.defaultValue.toString().trim() === "") && !props.value) {
    return null
  }

  return (
    <label className="flex flex-col gap-1">
      <span className="text-sm font-medium">{title}</span>
      <Input {...props} className={cn("bg-background", props.className)} />
    </label>
  )
}

type FormTextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement> & {
  title: string
  hideIfEmpty?: boolean
}

export function FormTextarea({ title, hideIfEmpty = false, ...props }: FormTextareaProps) {
  if (hideIfEmpty && (!props.defaultValue || props.defaultValue.toString().trim() === "") && !props.value) {
    return null
  }

  return (
    <label className="flex flex-col gap-1">
      <span className="text-sm font-medium">{title}</span>
      <Textarea {...props} className={cn("bg-background", props.className)} />
    </label>
  )
}

export const FormSelect = ({
  title,
  items,
  emptyValue,
  placeholder,
  ...props
}: {
  title: string
  items: Array<{ code: string; name: string; color?: string }>
  emptyValue?: string
  placeholder?: string
} & SelectProps) => {
  return (
    <span className="flex flex-col gap-1">
      <span className="text-sm font-medium">{title}</span>
      <Select {...props}>
        <SelectTrigger className="w-full min-w-[150px] bg-background">
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {emptyValue && <SelectItem value="-">{emptyValue}</SelectItem>}
          {items.map((item) => (
            <SelectItem key={item.code} value={item.code}>
              <div className="flex items-center gap-2 text-base pr-2">
                {item.color && <div className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />}
                {item.name}
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </span>
  )
}
