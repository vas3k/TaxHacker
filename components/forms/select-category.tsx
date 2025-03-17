"use client"

import { Category } from "@prisma/client"
import { SelectProps } from "@radix-ui/react-select"
import { useMemo } from "react"
import { FormSelect } from "./simple"

export const FormSelectCategory = ({
  title,
  categories,
  emptyValue,
  placeholder,
  ...props
}: { title: string; categories: Category[]; emptyValue?: string; placeholder?: string } & SelectProps) => {
  const items = useMemo(
    () => categories.map((category) => ({ code: category.code, name: category.name, color: category.color })),
    [categories]
  )
  return <FormSelect title={title} items={items} emptyValue={emptyValue} placeholder={placeholder} {...props} />
}
