import { EmailProvider } from "./page"

export const EMAIL_PROVIDER_PRESETS: Record<
  EmailProvider,
  {
    name: string
    icon: string
    host: string
    port: number
    useSSL: boolean
    description: string
  }
> = {
  gmail: {
    name: "Gmail",
    icon: "📧",
    host: "imap.gmail.com",
    port: 993,
    useSSL: true,
    description: "Google Gmail IMAP",
  },
  outlook: {
    name: "Outlook",
    icon: "📮",
    host: "outlook.office365.com",
    port: 993,
    useSSL: true,
    description: "Microsoft Outlook IMAP",
  },
  hotmail: {
    name: "Hotmail",
    icon: "🔥",
    host: "outlook.office365.com",
    port: 993,
    useSSL: true,
    description: "Microsoft Hotmail IMAP",
  },
  fastmail: {
    name: "Fastmail",
    icon: "⚡",
    host: "imap.fastmail.com",
    port: 993,
    useSSL: true,
    description: "Fastmail IMAP",
  },
  yahoo: {
    name: "Yahoo Mail",
    icon: "💜",
    host: "imap.mail.yahoo.com",
    port: 993,
    useSSL: true,
    description: "Yahoo Mail IMAP",
  },
  apple: {
    name: "Apple iCloud",
    icon: "🍎",
    host: "imap.mail.me.com",
    port: 993,
    useSSL: true,
    description: "Apple iCloud Mail IMAP",
  },
  custom: {
    name: "Custom IMAP",
    icon: "⚙️",
    host: "",
    port: 993,
    useSSL: true,
    description: "Custom IMAP server settings",
  },
}
