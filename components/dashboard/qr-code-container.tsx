import { getLocalIpAddress } from "@/lib/network"
import { QRCodeWidget } from "./qr-code-widget"

export function QRCodeContainer() {
  const ipAddress = getLocalIpAddress()
  const port = parseInt(process.env.PORT || "7331")
  return <QRCodeWidget ipAddress={ipAddress} port={port} />
} 