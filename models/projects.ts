import { prisma } from "@/lib/db"
import { codeFromName } from "@/lib/utils"
import { Prisma } from "@/prisma/client"
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
  await prisma.transaction.updateMany({
    where: {
      userId,
      projectCode: code,
    },
    data: {
      projectCode: null,
    },
  })

  return await prisma.project.delete({
    where: { userId_code: { code, userId } },
  })
}
export const mergeProjects = async (userId: string, sourceCode: string, targetCode: string) => {
  return await prisma.$transaction(async (tx) => {
    // 1. Get the source project to return it later (for undo)
    const sourceProject = await tx.project.findUnique({
      where: { userId_code: { userId, code: sourceCode } },
    })

    if (!sourceProject) {
      throw new Error("Source project not found")
    }

    // 2. Find all transactions associated with the source project
    const transactions = await tx.transaction.findMany({
      where: { userId, projectCode: sourceCode },
      select: { id: true },
    })
    const transactionIds = transactions.map((t) => t.id)

    // 3. Update transactions to the target project
    await tx.transaction.updateMany({
      where: { userId, projectCode: sourceCode },
      data: { projectCode: targetCode },
    })

    // 4. Delete the source project
    await tx.project.delete({
      where: { userId_code: { userId, code: sourceCode } },
    })

    return { sourceProject, transactionIds }
  })
}

export const undoMergeProjects = async (
  userId: string,
  projectData: Prisma.ProjectCreateInput,
  transactionIds: string[]
) => {
  return await prisma.$transaction(async (tx) => {
    // 1. Re-create the deleted project
    const project = await tx.project.create({
      data: projectData,
    })

    // 2. Move transactions back to the re-created project
    if (transactionIds.length > 0) {
      await tx.transaction.updateMany({
        where: {
          userId,
          id: { in: transactionIds },
        },
        data: { projectCode: project.code },
      })
    }

    return project
  })
}
