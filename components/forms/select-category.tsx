"use client"

import { Category } from "@/prisma/client"
import { SelectProps } from "@radix-ui/react-select"
import { useMemo } from "react"
import { FormSelect } from "./simple"

type CategoryWithChildren = Category & { children?: Category[] }

export const FormSelectCategory = ({
  title,
  categories,
  emptyValue,
  placeholder,
  hideIfEmpty = false,
  isRequired = false,
  ...props
}: {
  title: string
  categories: CategoryWithChildren[]
  emptyValue?: string
  placeholder?: string
  hideIfEmpty?: boolean
  isRequired?: boolean
} & SelectProps) => {
  // Build hierarchical items list with proper ordering and indentation
  const items = useMemo(() => {
    const result: { code: string; name: string; color: string }[] = []

    // Get parent categories (no parentCode)
    const parents = categories.filter((c) => !c.parentCode)
    const childrenByParent = categories.reduce(
      (acc, c) => {
        if (c.parentCode) {
          if (!acc[c.parentCode]) acc[c.parentCode] = []
          acc[c.parentCode].push(c)
        }
        return acc
      },
      {} as Record<string, Category[]>
    )

    // Add parents with their children
    for (const parent of parents) {
      result.push({
        code: parent.code,
        name: parent.name,
        color: parent.color,
      })

      const children = childrenByParent[parent.code] || []
      for (const child of children) {
        result.push({
          code: child.code,
          name: `  └ ${child.name}`,
          color: child.color,
        })
      }
    }

    return result
  }, [categories])

  return (
    <FormSelect
      title={title}
      items={items}
      emptyValue={emptyValue}
      placeholder={placeholder}
      hideIfEmpty={hideIfEmpty}
      isRequired={isRequired}
      {...props}
    />
  )
}
