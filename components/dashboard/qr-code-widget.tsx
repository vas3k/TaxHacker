import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { QRCodeSVG } from 'qrcode.react'

interface QRCodeWidgetProps {
  ipAddress: string
  port: number
}

export function QRCodeWidget({ ipAddress, port }: QRCodeWidgetProps) {
  const url = `http://${ipAddress}:${port}`

  return (
    <Card className="w-full h-full sm:max-w-xs">
      <CardHeader>
        <CardTitle>Scan to access from phone</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col items-center gap-4">
        <QRCodeSVG
          value={url}
          size={150}
          level="H"
          includeMargin={true}
          className="rounded-lg"
        />
      </CardContent>
    </Card>
  )
}