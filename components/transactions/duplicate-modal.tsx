import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { AlertTriangle, CheckCircle2, XCircle } from "lucide-react"
import { format } from "date-fns"
import { ActionState } from "@/lib/actions"
import { Transaction } from "@/prisma/client"

interface DuplicateModalProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  // Use the concrete Transaction type for the ActionState
  duplicateData: ActionState<Transaction>["duplicateData"] | null
  onConfirm: () => void
  onCancel: () => void
}

export function DuplicateModal({ isOpen, onOpenChange, duplicateData, onConfirm, onCancel }: DuplicateModalProps) {
  // If no data, render nothing to avoid errors
  if (!duplicateData) return null

  // Safely extract the new data for readability
  const newData = duplicateData.newTransactionData as Transaction
  const existingData = duplicateData.existingTransaction

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <AlertTriangle className="text-yellow-500 h-6 w-6" />
            Duplicate Transaction Detected
          </DialogTitle>
          <DialogDescription className="text-base">
            We found an existing transaction in your database that matches the date, amount, and merchant of this new
            entry. What would you like to do?
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 my-4">
          {/* LEFT CARD: Existing Data */}
          <Card className="border-yellow-200 bg-yellow-50/30 dark:border-yellow-900/50 dark:bg-yellow-900/10">
            <CardHeader className="pb-3 border-b border-yellow-100 dark:border-yellow-900/30 mb-3">
              <CardTitle className="text-sm font-medium text-yellow-800 dark:text-yellow-500 flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4" />
                Already in Database
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex justify-between border-b pb-1">
                <span className="text-muted-foreground">Date</span>
                <span className="font-medium">
                  {existingData.issuedAt ? format(new Date(existingData.issuedAt), "MMM dd, yyyy") : "N/A"}
                </span>
              </div>
              <div className="flex justify-between border-b pb-1">
                <span className="text-muted-foreground">Merchant</span>
                <span className="font-medium truncate ml-4 text-right">{existingData.merchant || "Unknown"}</span>
              </div>
              <div className="flex justify-between border-b pb-1">
                <span className="text-muted-foreground">Amount</span>
                <span className="font-bold text-base">
                  {(Number(existingData.total || 0) / 100).toFixed(2)} {existingData.currencyCode}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Type</span>
                <span className="capitalize">{existingData.type}</span>
              </div>
            </CardContent>
          </Card>

          {/* RIGHT CARD: New Data */}
          <Card className="border-blue-200 bg-blue-50/30 dark:border-blue-900/50 dark:bg-blue-900/10">
            <CardHeader className="pb-3 border-b border-blue-100 dark:border-blue-900/30 mb-3">
              <CardTitle className="text-sm font-medium text-blue-800 dark:text-blue-400 flex items-center gap-2">
                <AlertTriangle className="h-4 w-4" />
                New Entry
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex justify-between border-b pb-1">
                <span className="text-muted-foreground">Date</span>
                <span className="font-medium">
                  {newData.issuedAt ? format(new Date(newData.issuedAt as unknown as string), "MMM dd, yyyy") : "N/A"}
                </span>
              </div>
              <div className="flex justify-between border-b pb-1">
                <span className="text-muted-foreground">Merchant</span>
                <span className="font-medium truncate ml-4 text-right">
                  {(newData.merchant as string) || "Unknown"}
                </span>
              </div>
              <div className="flex justify-between border-b pb-1">
                <span className="text-muted-foreground">Amount</span>
                <span className="font-bold text-base">
                  {(Number(newData.total || 0) / 100).toFixed(2)} {(newData.currencyCode as string) || ""}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Type</span>
                <span className="capitalize">{(newData.type as string) || "N/A"}</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* ACTION BUTTONS */}
        <div className="flex justify-between items-center mt-6">
          <Button variant="ghost" onClick={onCancel} className="text-muted-foreground hover:text-foreground">
            <XCircle className="h-4 w-4 mr-2" />
            Discard New Entry
          </Button>

          <Button onClick={onConfirm} className="bg-primary hover:bg-primary/90">
            <CheckCircle2 className="h-4 w-4 mr-2" />
            Save Anyway (Keep Both)
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
