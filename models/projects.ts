import { prisma } from "@/lib/db"
import { codeFromName } from "@/lib/utils"
import { Prisma } from "@prisma/client"
import { cache } from "react"

export type ProjectData = {
  [key: string]: unknown
}

export const getProjects = cache(async (userId: string) => {
  return await prisma.project.findMany({
    where: { userId },
    orderBy: {
      name: "asc",
    },
  })
})

export const getProjectByCode = cache(async (userId: string, code: string) => {
  return await prisma.project.findUnique({
    where: { userId_code: { code, userId } },
  })
})

export const createProject = async (userId: string, project: ProjectData) => {
  if (!project.code) {
    project.code = codeFromName(project.name as string)
  }
  return await prisma.project.create({
    data: {
      ...project,
      user: {
        connect: {
          id: userId,
        },
      },
    } as Prisma.ProjectCreateInput,
  })
}

export const updateProject = async (userId: string, code: string, project: ProjectData) => {
  return await prisma.project.update({
    where: { userId_code: { code, userId } },
    data: project,
  })
}

export const deleteProject = async (userId: string, code: string) => {
  return await prisma.project.delete({
    where: { userId_code: { code, userId } },
  })
}
