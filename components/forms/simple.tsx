"use client"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Input } from "@/components/ui/input"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"
import { SelectProps } from "@radix-ui/react-select"
import { format } from "date-fns"
import { CalendarIcon, Upload } from "lucide-react"
import { InputHTMLAttributes, TextareaHTMLAttributes, useEffect, useRef, useState } from "react"

type FormInputProps = InputHTMLAttributes<HTMLInputElement> & {
  title?: string
  hideIfEmpty?: boolean
}

export function FormInput({ title, hideIfEmpty = false, ...props }: FormInputProps) {
  if (hideIfEmpty && (!props.defaultValue || props.defaultValue.toString().trim() === "") && !props.value) {
    return null
  }

  return (
    <label className="flex flex-col gap-1">
      {title && <span className="text-sm font-medium">{title}</span>}
      <Input {...props} className={cn("bg-background", props.className)} />
    </label>
  )
}

type FormTextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement> & {
  title?: string
  hideIfEmpty?: boolean
}

export function FormTextarea({ title, hideIfEmpty = false, ...props }: FormTextareaProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    const textarea = textareaRef.current
    if (!textarea) return

    const resize = () => {
      textarea.style.height = "auto"
      textarea.style.height = `${textarea.scrollHeight + 5}px`
    }

    resize() // initial resize

    textarea.addEventListener("input", resize)
    return () => textarea.removeEventListener("input", resize)
  }, [props.value, props.defaultValue])

  if (hideIfEmpty && (!props.defaultValue || props.defaultValue.toString().trim() === "") && !props.value) {
    return null
  }

  return (
    <label className="flex flex-col gap-1">
      {title && <span className="text-sm font-medium">{title}</span>}
      <Textarea ref={textareaRef} {...props} className={cn("bg-background", props.className)} />
    </label>
  )
}

export const FormSelect = ({
  items,
  title,
  emptyValue,
  placeholder,
  hideIfEmpty = false,
  ...props
}: {
  items: Array<{ code: string; name: string; color?: string; badge?: string }>
  title?: string
  emptyValue?: string
  placeholder?: string
  hideIfEmpty?: boolean
} & SelectProps) => {
  if (hideIfEmpty && (!props.defaultValue || props.defaultValue.toString().trim() === "") && !props.value) {
    return null
  }

  return (
    <span className="flex flex-col gap-1">
      {title && <span className="text-sm font-medium">{title}</span>}
      <Select {...props}>
        <SelectTrigger className="w-full min-w-[150px] bg-background">
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {emptyValue && <SelectItem value="-">{emptyValue}</SelectItem>}
          {items.map((item) => (
            <SelectItem key={item.code} value={item.code}>
              <div className="flex items-center gap-2 text-base pr-2">
                {item.badge && <Badge className="px-2">{item.badge}</Badge>}
                {!item.badge && item.color && (
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
                )}
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
  name,
  title,
  placeholder = "Select date",
  defaultValue,
  ...props
}: {
  name: string
  title?: string
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
    } catch {}
  }

  return (
    <label className="flex flex-col gap-1">
      {title && <span className="text-sm font-medium">{title}</span>}
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

export const FormAvatar = ({
  title,
  defaultValue,
  className,
  onChange,
  ...props
}: {
  title?: string
  defaultValue?: string
  className?: string
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void
} & InputHTMLAttributes<HTMLInputElement>) => {
  const [preview, setPreview] = useState<string | null>(defaultValue || null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => {
        setPreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }

    // Call the original onChange if provided
    if (onChange) {
      onChange(e)
    }
  }

  return (
    <label className="inline-block">
      {title && <span className="text-sm font-medium">{title}</span>}
      <div className={cn("relative group", className)}>
        <div className="absolute inset-0 flex items-center justify-center bg-background rounded-lg overflow-hidden">
          {preview ? (
            <img src={preview} alt="Avatar preview" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full bg-muted flex items-center justify-center">
              <span className="text-muted-foreground">No image</span>
            </div>
          )}
        </div>
        <div className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg">
          <input
            type="file"
            accept="image/*"
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            onChange={handleFileChange}
            {...props}
          />
          <Upload className="z-10 bg-white/30 text-white p-1 rounded-sm h-7 w-8 cursor-pointer" />
        </div>
      </div>
    </label>
  )
}
