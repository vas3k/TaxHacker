import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { QrCode } from "lucide-react"
import { QRCodeSVG } from 'qrcode.react'

export function SidebarQRCode({ ip }: { ip: string }) {
    const port = parseInt(process.env.PORT || "7331")
    const url = `http://${ip}:${port}`
    
    return (
        <Dialog>
            <DialogTrigger asChild>
                <button className="flex items-center gap-2 w-full px-2 py-1.5 text-sm rounded-sm hover:bg-accent">
                    <QrCode className="h-4 w-4" />
                    Mobile QR Code
                </button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Mobile QR Code</DialogTitle>
                </DialogHeader>
                <div className="flex flex-col items-center gap-2">
                    <QRCodeSVG
                        value={url}
                        size={350}
                        level="H"
                        includeMargin={true}
                        className="rounded-lg" />
                    <p className="text-sm text-muted-foreground">{url}</p>
                </div>
            </DialogContent>
        </Dialog>
    )
}