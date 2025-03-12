import { addProjectAction, deleteProjectAction, editProjectAction } from "@/app/settings/actions"
import { CrudTable } from "@/components/settings/crud"
import { getProjects } from "@/data/projects"

export default async function ProjectsSettingsPage() {
  const projects = await getProjects()
  const projectsWithActions = projects.map((project) => ({
    ...project,
    isEditable: true,
    isDeletable: true,
  }))

  return (
    <div className="container">
      <h1 className="text-2xl font-bold mb-6">Projects</h1>
      <CrudTable
        items={projectsWithActions}
        columns={[
          { key: "name", label: "Name", editable: true },
          { key: "llm_prompt", label: "LLM Prompt", editable: true },
          { key: "color", label: "Color", editable: true },
        ]}
        onDelete={async (code) => {
          "use server"
          await deleteProjectAction(code)
        }}
        onAdd={async (data) => {
          "use server"
          await addProjectAction(data as { code: string; name: string; llm_prompt: string; color: string })
        }}
        onEdit={async (code, data) => {
          "use server"
          await editProjectAction(code, data as { name: string; llm_prompt: string; color: string })
        }}
      />
    </div>
  )
}
