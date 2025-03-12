import { prisma } from "@/lib/db"
import { codeFromName } from "@/lib/utils"
import { Prisma } from "@prisma/client"
import { cache } from "react"

export const getProjects = cache(async () => {
  return await prisma.project.findMany({
    orderBy: {
      name: "asc",
    },
  })
})

export const createProject = async (project: Prisma.ProjectCreateInput) => {
  if (!project.code) {
    project.code = codeFromName(project.name as string)
  }
  return await prisma.project.create({
    data: project,
  })
}

export const updateProject = async (code: string, project: Prisma.ProjectUpdateInput) => {
  return await prisma.project.update({
    where: { code },
    data: project,
  })
}

export const deleteProject = async (code: string) => {
  return await prisma.project.delete({
    where: { code },
  })
}
