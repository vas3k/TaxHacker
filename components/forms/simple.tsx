"use client"

import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Input } from "@/components/ui/input"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"
import { SelectProps } from "@radix-ui/react-select"
import { format } from "date-fns"
import { CalendarIcon } from "lucide-react"
import { InputHTMLAttributes, TextareaHTMLAttributes, useState } from "react"

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

export const FormDate = ({
  title,
  name,
  placeholder = "Select date",
  defaultValue,
  ...props
}: {
  title: string
  name: string
  placeholder?: string
  defaultValue?: Date
}) => {
  const [date, setDate] = useState<Date | undefined>(defaultValue)
  const [manualInput, setManualInput] = useState<string>(date ? format(date, "yyyy-MM-dd") : "")

  const handleDateSelect = (newDate: Date | undefined) => {
    setDate(newDate)
    setManualInput(newDate ? format(newDate, "yyyy-MM-dd") : "")
  }

  const handleManualInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setManualInput(e.target.value)
    setDate(undefined)
    try {
      const newDate = new Date(e.currentTarget.value)
      if (!isNaN(newDate.getTime())) {
        setDate(newDate)
      }
    } catch (error) {}
  }

  return (
    <label className="flex flex-col gap-1">
      <span className="text-sm font-medium">{title}</span>
      <div className="relative">
        <Popover>
          <PopoverTrigger asChild>
            <Button
              type="button"
              variant={"outline"}
              className={cn(
                "w-full justify-start text-left font-normal bg-background",
                !date && "text-muted-foreground"
              )}
            >
              {date ? format(date, "PPP") : placeholder}
              <CalendarIcon className="ml-1 h-4 w-4 text-muted-foreground" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-1 flex flex-col gap-2" align="start">
            <Input
              type="text"
              name={name}
              value={manualInput}
              onChange={handleManualInputChange}
              className="text-center"
            />
            <Calendar mode="single" selected={date} onSelect={handleDateSelect} initialFocus {...props} />
          </PopoverContent>
        </Popover>
      </div>
    </label>
  )
}
