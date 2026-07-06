/**
 * Minimal type declarations for imap-simple.
 * The package ships no .d.ts and @types/imap-simple does not exist on npm.
 * Typed only to the subset used by lib/email-sync/imap-client.ts.
 */
declare module "imap-simple" {
  interface ImapConfig {
    user: string
    password: string
    host: string
    port: number
    tls?: boolean
    authTimeout?: number
    connTimeout?: number
    tlsOptions?: Record<string, unknown>
  }

  interface ConnectConfig {
    imap: ImapConfig
  }

  interface MessagePart {
    which: string
    size: number
    body: string
  }

  interface MessageAttributes {
    uid: number
    [key: string]: unknown
  }

  interface Message {
    attributes: MessageAttributes
    parts: MessagePart[]
  }

  interface FetchOptions {
    bodies: string[]
    struct?: boolean
    markSeen?: boolean
  }

  interface ImapSimpleObject {
    openBox(boxName: string): Promise<unknown>
    search(criteria: unknown[], fetchOptions: FetchOptions): Promise<Message[]>
    end(): void
  }

  function connect(config: ConnectConfig): Promise<ImapSimpleObject>
}
