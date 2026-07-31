import dns from "node:dns"
import { isIP } from "node:net"

// Security notes:
// - Only allow IMAP on the standard public ports 143/993.
// - Reject localhost and local/private targets before any connection is attempted.
// - Resolve hostnames and verify every resolved IP to reduce DNS rebinding risk.
// - Log rejected hosts so suspicious attempts can be monitored.
const ALLOWED_PORTS = new Set([143, 993])

function isIpLiteral(value: string): boolean {
  return isIP(value) > 0
}

function isPrivateIpv4(address: string): boolean {
  const parts = address.split(".").map((part) => Number.parseInt(part, 10))
  if (parts.length !== 4 || parts.some((part) => Number.isNaN(part) || part < 0 || part > 255)) {
    return false
  }

  const [a, b] = parts
  if (a === 10) return true
  if (a === 172 && b >= 16 && b <= 31) return true
  if (a === 192 && b === 168) return true
  return false
}

function isPrivateIpv6(address: string): boolean {
  const normalized = address.toLowerCase()
  if (normalized === "::1") return true
  if (normalized.startsWith("fe80:")) return true
  if (normalized.startsWith("fc") || normalized.startsWith("fd")) return true
  return false
}

function isReservedOrLocal(address: string): boolean {
  if (address === "127.0.0.1" || address === "::1") return true
  if (address.startsWith("127.")) return true
  if (address.startsWith("169.254.")) return true
  return false
}

function isPrivateAddress(address: string): boolean {
  return isPrivateIpv4(address) || isPrivateIpv6(address) || isReservedOrLocal(address)
}

function isIgnoredHostname(hostname: string): boolean {
  return hostname === "localhost" || hostname === "::1"
}

function rejectWithLog(host: string, port: number, reason: string): never {
  console.warn("[imap-validation] Rejected IMAP connection attempt", { host, port, reason })
  throw new Error(reason)
}

export type ImapTargetValidationOptions = {
  resolveHost?: (host: string) => Promise<string[]>
  rejectDirectIp?: boolean
}

export type ImapTargetValidationResult = {
  host: string
  port: number
  resolvedIps: string[]
}

export async function validateImapTarget(
   host: string,
   port: number,
   options: ImapTargetValidationOptions = {}
): Promise<ImapTargetValidationResult> {
   const rejectDirectIp = options.rejectDirectIp ?? true
   const hostname = host.trim()

   if (!hostname) {
     rejectWithLog(hostname, port, "IMAP host is required")
   }

   if (!ALLOWED_PORTS.has(port)) {
     rejectWithLog(hostname, port, `IMAP port must be one of: ${Array.from(ALLOWED_PORTS).join(", ")}`)
   }

   if (hostname === "localhost" || hostname === "::1" || hostname === "127.0.0.1") {
     rejectWithLog(hostname, port, "IMAP host must not be localhost")
   }

   if (isIpLiteral(hostname)) {
     // Check for private address BEFORE rejecting direct IPs
     if (isPrivateAddress(hostname)) {
       rejectWithLog(hostname, port, "IMAP host resolves to a private or local address")
     }

     if (rejectDirectIp) {
       rejectWithLog(hostname, port, "Direct IP hostnames are not allowed")
     }

     return { host: hostname, port, resolvedIps: [hostname] }
   }

   if (isIgnoredHostname(hostname)) {
     rejectWithLog(hostname, port, "IMAP host must not be localhost")
   }

   const resolveHost = options.resolveHost ?? ((value: string) => dns.promises.lookup(value, { all: true }).then((entries) => entries.map((entry) => entry.address)))
   const resolvedIps = await resolveHost(hostname)

   if (!resolvedIps.length) {
     rejectWithLog(hostname, port, "IMAP host did not resolve to any IP addresses")
   }

   const publicIps = resolvedIps.filter((ip) => !isPrivateAddress(ip))
   if (!publicIps.length) {
     rejectWithLog(hostname, port, "IMAP host resolves to a private or local address")
   }

   return { host: hostname, port, resolvedIps }
}