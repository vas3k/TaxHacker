"use client"

import { Category } from "@prisma/client"
import { SelectProps } from "@radix-ui/react-select"
import { FormSelect } from "./simple"

export const FormSelectCategory = ({
  title,
  categories,
  emptyValue,
  placeholder,
  ...props
}: { title: string; categories: Category[]; emptyValue?: string; placeholder?: string } & SelectProps) => {
  return (
    <FormSelect
      title={title}
      items={categories.map((category) => ({ code: category.code, name: category.name, color: category.color }))}
      emptyValue={emptyValue}
      placeholder={placeholder}
      {...props}
    />
  )
}
