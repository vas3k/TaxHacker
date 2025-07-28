"use client"

import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { cn } from "@/lib/utils"
import { FieldConfig } from "./types"

interface FormFieldProps extends FieldConfig {
  className?: string
}

export function FormField({
  id,
  label,
  type = "text",
  placeholder,
  value,
  onChange,
  required = false,
  disabled = false,
  options = [],
  validation,
  showCharCount = false,
  maxLength,
  transform,
  className,
}: FormFieldProps) {
  const error = validation ? validation(value) : undefined
  
  const handleChange = (newValue: any) => {
    const transformedValue = transform ? transform(newValue) : newValue
    onChange(transformedValue)
  }

  const renderField = () => {
    switch (type) {
      case "textarea":
        return (
          <Textarea
            id={id}
            placeholder={placeholder}
            value={value || ""}
            onChange={(e) => handleChange(e.target.value)}
            disabled={disabled}
            maxLength={maxLength}
            className={cn(error && "border-destructive", className)}
          />
        )
      
      case "select":
        return (
          <Select value={value} onValueChange={handleChange} disabled={disabled}>
            <SelectTrigger className={cn(error && "border-destructive", className)}>
              <SelectValue placeholder={placeholder} />
            </SelectTrigger>
            <SelectContent>
              {options.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )
      
      case "checkbox":
        return (
          <div className="flex items-center space-x-2">
            <Checkbox
              id={id}
              checked={value || false}
              onCheckedChange={handleChange}
              disabled={disabled}
            />
            <Label htmlFor={id} className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
              {label}
            </Label>
          </div>
        )
      
      case "color":
        return (
          <Input
            id={id}
            type="color"
            value={value || "#000000"}
            onChange={(e) => handleChange(e.target.value)}
            disabled={disabled}
            className={cn("h-10 w-20", error && "border-destructive", className)}
          />
        )
      
      default:
        return (
          <Input
            id={id}
            type={type}
            placeholder={placeholder}
            value={value || ""}
            onChange={(e) => handleChange(e.target.value)}
            disabled={disabled}
            maxLength={maxLength}
            className={cn(error && "border-destructive", className)}
          />
        )
    }
  }

  if (type === "checkbox") {
    return (
      <div className="space-y-2">
        {renderField()}
        {error && (
          <p className="text-sm text-destructive">{error}</p>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-2">
      <Label htmlFor={id} className={cn(required && "after:content-['*'] after:ml-0.5 after:text-destructive")}>
        {label}
      </Label>
      {renderField()}
      <div className="flex justify-between">
        {error && (
          <p className="text-sm text-destructive">{error}</p>
        )}
        {showCharCount && maxLength && (
          <p className="text-xs text-muted-foreground ml-auto">
            {(value || "").length}/{maxLength}
          </p>
        )}
      </div>
    </div>
  )
}