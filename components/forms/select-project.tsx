import { Project } from "@prisma/client"
import { SelectProps } from "@radix-ui/react-select"
import { FormSelect } from "./simple"

export const FormSelectProject = ({
  title,
  projects,
  emptyValue,
  placeholder,
  ...props
}: { title: string; projects: Project[]; emptyValue?: string; placeholder?: string } & SelectProps) => {
  return (
    <FormSelect
      title={title}
      items={projects.map((project) => ({ code: project.code, name: project.name, color: project.color }))}
      emptyValue={emptyValue}
      placeholder={placeholder}
      {...props}
    />
  )
}
