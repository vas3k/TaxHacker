#!/usr/bin/env npx tsx

import { PrismaClient } from "@/prisma/client"
import { randomUUID } from "crypto"
import { mkdir, writeFile } from "fs/promises"
import { join } from "path"

// Email library imports (will need to install)
// npm install imap-simple mailparser

const prisma = new PrismaClient()

type EmailAttachment = {
  filename: string
  contentType: string
  content: Buffer
  size: number
}

type ProcessedEmail = {
  messageId: string
  subject: string
  from: string
  date: Date
  attachments: EmailAttachment[]
}

// Mock IMAP connection for now - replace with actual imap-simple
class MockImapClient {
  async connect(config: any) {
    console.log(`🔌 Connecting to ${config.imap.host}:${config.imap.port}`)
    // Simulate connection delay
    await new Promise((resolve) => setTimeout(resolve, 1000))
    return this
  }

  async openBox(boxName: string) {
    console.log(`📬 Opening mailbox: ${boxName}`)
    return { messages: { total: 5 } }
  }

  async search(criteria: string[], options: any) {
    console.log(`🔍 Searching emails with criteria: ${criteria.join(", ")}`)
    // Mock search results - return some fake message IDs
    return ["1", "2", "3"].map((id) => parseInt(id))
  }

  async getMessages(uids: number[], options: any): Promise<ProcessedEmail[]> {
    console.log(`📧 Fetching ${uids.length} messages`)

    // Mock processed emails with attachments
    return uids.map((uid) => ({
      messageId: `msg-${uid}-${Date.now()}`,
      subject: `Test Email ${uid}`,
      from: "test@example.com",
      date: new Date(),
      attachments: [
        {
          filename: `document-${uid}.pdf`,
          contentType: "application/pdf",
          content: Buffer.from(`Mock PDF content for email ${uid}`),
          size: 1024,
        },
      ],
    }))
  }

  async end() {
    console.log(`📴 Disconnecting from IMAP server`)
  }
}

async function fetchEmailsForServer(server: any): Promise<number> {
  console.log(`\n📧 Processing server: ${server.username} (${server.provider})`)

  // Check if enough time has passed since last sync
  const now = new Date()
  if (server.lastSyncedAt) {
    const hoursSinceLastSync = (now.getTime() - new Date(server.lastSyncedAt).getTime()) / (1000 * 60 * 60)
    if (hoursSinceLastSync < server.syncInterval) {
      console.log(
        `⏰ Skipping ${server.username}: Last sync was ${hoursSinceLastSync.toFixed(1)}h ago, interval is ${server.syncInterval}h`
      )
      return 0
    }
  }

  const config = {
    imap: {
      user: server.username,
      password: server.password,
      host: server.host,
      port: server.port,
      tls: server.useSSL,
      authTimeout: 10000,
      connTimeout: 10000,
      tlsOptions: { rejectUnauthorized: false },
    },
  }

  let client = new MockImapClient()
  let processedCount = 0

  try {
    await client.connect(config)
    await client.openBox("INBOX")

    // Build search criteria
    const searchCriteria = ["UNSEEN"] // Only unread emails

    // If we have a last processed message, search for newer ones
    if (server.lastProcessedMessageId) {
      // In real IMAP: searchCriteria.push(['UID', `${lastUid}:*`])
      console.log(`📍 Resuming from last processed message: ${server.lastProcessedMessageId}`)
    }

    const messageIds = await client.search(searchCriteria, {})

    if (messageIds.length === 0) {
      console.log(`📭 No new emails found for ${server.username}`)
      await updateServerSyncStatus(server.id, now, server.lastProcessedMessageId)
      return 0
    }

    console.log(`📬 Found ${messageIds.length} new emails`)

    const messages = await client.getMessages(messageIds, {
      bodies: "",
      markSeen: false, // Don't mark as read yet
      struct: true,
    })

    let lastProcessedMessageId = server.lastProcessedMessageId

    for (const message of messages) {
      console.log(`📨 Processing: ${message.subject}`)

      // Process attachments
      for (const attachment of message.attachments) {
        const shouldProcess = server.allowedExtensions.some((ext: string) =>
          attachment.filename.toLowerCase().endsWith(ext.toLowerCase())
        )

        if (!shouldProcess) {
          console.log(`⏭️  Skipping ${attachment.filename}: Extension not allowed`)
          continue
        }

        console.log(`💾 Saving attachment: ${attachment.filename} (${attachment.size} bytes)`)

        // Save attachment to uploads directory
        const fileId = randomUUID()
        const uploadPath = process.env.UPLOAD_PATH || "./data/uploads"
        const fileName = `email-${fileId}-${attachment.filename}`
        const filePath = join(uploadPath, fileName)

        // Ensure directory exists
        await mkdir(uploadPath, { recursive: true })

        // Save file
        await writeFile(filePath, attachment.content)

        // Create file record in database (similar to your existing file upload logic)
        await prisma.file.create({
          data: {
            id: fileId,
            filename: attachment.filename,
            path: filePath,
            mimetype: attachment.contentType,
            userId: server.userId, // You'll need to add userId to EmailServer
            metadata: {
              source: "email",
              emailServer: server.id,
              emailSubject: message.subject,
              emailFrom: message.from,
              emailDate: message.date,
              fileSize: attachment.size,
            },
          },
        })

        console.log(`✅ Saved ${attachment.filename} as file ${fileId}`)
        processedCount++
      }

      lastProcessedMessageId = message.messageId
    }

    // Update server sync status
    await updateServerSyncStatus(server.id, now, lastProcessedMessageId)

    console.log(`✅ Processed ${processedCount} attachments from ${server.username}`)
  } catch (error) {
    console.error(`❌ Error processing ${server.username}:`, error)

    // Update server with error status
    await prisma.appData.updateMany({
      where: {
        app: "email",
        userId: server.userId,
      },
      data: {
        data: {
          // This would need to update the specific server's status in the JSON
          // For now just log the error
        },
      },
    })

    throw error
  } finally {
    await client.end()
  }

  return processedCount
}

async function updateServerSyncStatus(serverId: string, syncTime: Date, lastMessageId?: string) {
  // This is a simplified version - in reality you'd need to update the specific server
  // within the JSON data structure stored in appData table
  console.log(`📊 Updating sync status for server ${serverId}`)

  // For now, just log what we would update
  console.log(`   Last synced: ${syncTime.toISOString()}`)
  if (lastMessageId) {
    console.log(`   Last message: ${lastMessageId}`)
  }
}

async function getAllActiveEmailServers() {
  const emailAppData = await prisma.appData.findMany({
    where: {
      app: "email",
    },
    include: {
      user: true,
    },
  })

  const allServers = []

  for (const appData of emailAppData) {
    const data = appData.data as any
    if (data?.servers) {
      for (const server of data.servers) {
        if (server.isActive) {
          allServers.push({
            ...server,
            userId: appData.userId,
          })
        }
      }
    }
  }

  return allServers
}

async function main() {
  console.log(`🚀 Starting email sync at ${new Date().toISOString()}`)

  try {
    const servers = await getAllActiveEmailServers()
    console.log(`🔍 Found ${servers.length} active email servers`)

    if (servers.length === 0) {
      console.log(`📭 No active email servers configured`)
      return
    }

    let totalProcessed = 0

    for (const server of servers) {
      try {
        const processed = await fetchEmailsForServer(server)
        totalProcessed += processed
      } catch (error) {
        console.error(`❌ Failed to process server ${server.username}:`, error)
        // Continue with other servers
      }
    }

    console.log(`\n✅ Email sync completed! Processed ${totalProcessed} attachments total`)
  } catch (error) {
    console.error(`💥 Fatal error during email sync:`, error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

// Allow script to be run directly
if (require.main === module) {
  main().catch(console.error)
}

export { main as fetchEmails }
