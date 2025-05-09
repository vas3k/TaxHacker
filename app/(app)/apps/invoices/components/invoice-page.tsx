import { FormSelectCurrency } from "@/components/forms/select-currency"
import { FormAvatar, FormInput, FormTextarea } from "@/components/forms/simple"
import { Button } from "@/components/ui/button"
import { formatCurrency } from "@/lib/utils"
import { Currency } from "@/prisma/client"
import { X } from "lucide-react"
import { InputHTMLAttributes, memo, useCallback, useMemo } from "react"

export interface InvoiceItem {
  name: string
  subtitle: string
  showSubtitle: boolean
  quantity: number
  unitPrice: number
  subtotal: number
}

export interface AdditionalTax {
  name: string
  rate: number
  amount: number
}

export interface AdditionalFee {
  name: string
  amount: number
}

export interface InvoiceFormData {
  title: string
  businessLogo: string | null
  invoiceNumber: string
  date: string
  dueDate: string
  currency: string
  companyDetails: string
  companyDetailsLabel: string
  billTo: string
  billToLabel: string
  items: InvoiceItem[]
  taxIncluded: boolean
  additionalTaxes: AdditionalTax[]
  additionalFees: AdditionalFee[]
  notes: string
  bankDetails: string
  issueDateLabel: string
  dueDateLabel: string
  itemLabel: string
  quantityLabel: string
  unitPriceLabel: string
  subtotalLabel: string
  summarySubtotalLabel: string
  summaryTotalLabel: string
}

interface InvoicePageProps {
  invoiceData: InvoiceFormData
  dispatch: React.Dispatch<any>
  currencies: Currency[]
}

// Memoized row for invoice items
const ItemRow = memo(function ItemRow({
  item,
  index,
  onChange,
  onRemove,
  currency,
}: {
  item: InvoiceItem
  index: number
  onChange: (index: number, field: keyof InvoiceItem, value: string | number | boolean) => void
  onRemove: (index: number) => void
  currency: string
}) {
  return (
    <div className="flex flex-col sm:flex-row items-start py-3 px-4 bg-white hover:bg-gray-50">
      {/* Mobile view label (visible only on small screens) */}
      <div className="flex justify-between sm:hidden mb-2">
        <span className="text-xs font-medium text-gray-500 uppercase">Item</span>
        <Button variant="destructive" className="rounded-full p-1 h-5 w-5" onClick={() => onRemove(index)}>
          <X />
        </Button>
      </div>

      {/* Item name and subtitle */}
      <div className="flex-1 sm:px-0">
        <div className="flex flex-col">
          <FormInput
            type="text"
            value={item.name}
            onChange={(e) => onChange(index, "name", e.target.value)}
            className="w-full min-w-0 font-semibold"
            placeholder="Item name"
            required
          />
          <div>
            {!item.showSubtitle ? (
              <button
                type="button"
                className="text-xs text-gray-400 hover:text-gray-800 mt-1 ml-1"
                onClick={() => onChange(index, "showSubtitle", true)}
              >
                + Add Description
              </button>
            ) : (
              <FormInput
                type="text"
                value={item.subtitle}
                onChange={(e) => onChange(index, "subtitle", e.target.value)}
                className="w-full mt-1 text-xs text-muted-foreground"
                placeholder="Detailed description (optional)"
              />
            )}
          </div>
        </div>
      </div>

      {/* Mobile labels for small screens */}
      <div className="grid grid-cols-3 gap-2 mt-2 sm:hidden">
        <div className="text-xs font-medium text-gray-500 uppercase">Quantity</div>
        <div className="text-xs font-medium text-gray-500 uppercase">Unit Price</div>
        <div className="text-xs font-medium text-gray-500 uppercase">Subtotal</div>
      </div>

      {/* Quantity, Unit Price, Subtotal, and Remove button */}
      <div className="grid grid-cols-3 sm:flex gap-2 mt-1 sm:mt-0">
        <div className="sm:w-20 sm:px-4">
          <FormInput
            type="number"
            min="1"
            value={item.quantity}
            onChange={(e) => onChange(index, "quantity", Number(e.target.value))}
            className="w-full text-right"
            required
          />
        </div>
        <div className="sm:w-28 sm:px-4">
          <FormInput
            type="number"
            step="0.01"
            value={item.unitPrice}
            onChange={(e) => onChange(index, "unitPrice", Number(e.target.value))}
            className="w-full text-right"
            required
          />
        </div>
        <div className="sm:w-28 sm:px-4 flex items-center justify-end">
          <span className="text-sm text-right">{formatCurrency(item.subtotal * 100, currency)}</span>
        </div>
        <div className="hidden sm:flex sm:w-10 sm:px-2 items-center justify-center">
          <Button variant="destructive" className="rounded-full p-1 h-5 w-5" onClick={() => onRemove(index)}>
            <X />
          </Button>
        </div>
      </div>
    </div>
  )
})

// Memoized row for additional taxes
const TaxRow = memo(function TaxRow({
  tax,
  index,
  onChange,
  onRemove,
  currency,
}: {
  tax: AdditionalTax
  index: number
  onChange: (index: number, field: keyof AdditionalTax, value: string | number) => void
  onRemove: (index: number) => void
  currency: string
}) {
  return (
    <div className="flex justify-between items-center">
      <div className="w-full flex flex-row gap-2 items-center">
        <Button variant="destructive" className="rounded-full p-1 h-5 w-5" onClick={() => onRemove(index)}>
          <X />
        </Button>
        <FormInput
          type="text"
          value={tax.name}
          onChange={(e) => onChange(index, "name", e.target.value)}
          placeholder="Tax name"
        />
        <FormInput
          type="number"
          max="100"
          value={tax.rate}
          onChange={(e) => onChange(index, "rate", Number(e.target.value))}
          className="w-12 text-right"
        />
        <span className="text-sm text-gray-600">%</span>
        <span className="text-sm text-nowrap">{formatCurrency(tax.amount * 100, currency)}</span>
      </div>
    </div>
  )
})

// Memoized row for additional fees
const FeeRow = memo(function FeeRow({
  fee,
  index,
  onChange,
  onRemove,
  currency,
}: {
  fee: AdditionalFee
  index: number
  onChange: (index: number, field: keyof AdditionalFee, value: string | number) => void
  onRemove: (index: number) => void
  currency: string
}) {
  return (
    <div className="w-full flex justify-between items-center">
      <div className="w-full flex flex-row gap-2 items-center justify-between">
        <Button variant="destructive" className="rounded-full p-1 h-5 w-5" onClick={() => onRemove(index)}>
          <X />
        </Button>
        <FormInput
          type="text"
          value={fee.name}
          onChange={(e) => onChange(index, "name", e.target.value)}
          placeholder="Fee or discount name"
        />
        <FormInput
          type="number"
          step="0.01"
          value={fee.amount}
          onChange={(e) => onChange(index, "amount", Number(e.target.value))}
          className="w-16 text-right"
        />
        <span className="text-sm text-nowrap">{formatCurrency(fee.amount * 100, currency)}</span>
      </div>
    </div>
  )
})

export function InvoicePage({ invoiceData, dispatch, currencies }: InvoicePageProps) {
  const addItem = useCallback(() => dispatch({ type: "ADD_ITEM" }), [dispatch])
  const removeItem = useCallback((index: number) => dispatch({ type: "REMOVE_ITEM", index }), [dispatch])
  const updateItem = useCallback(
    (index: number, field: keyof InvoiceItem, value: string | number | boolean) =>
      dispatch({ type: "UPDATE_ITEM", index, field, value }),
    [dispatch]
  )

  const addAdditionalTax = useCallback(() => dispatch({ type: "ADD_TAX" }), [dispatch])
  const removeAdditionalTax = useCallback((index: number) => dispatch({ type: "REMOVE_TAX", index }), [dispatch])
  const updateAdditionalTax = useCallback(
    (index: number, field: keyof AdditionalTax, value: string | number) =>
      dispatch({ type: "UPDATE_TAX", index, field, value }),
    [dispatch]
  )

  const addAdditionalFee = useCallback(() => dispatch({ type: "ADD_FEE" }), [dispatch])
  const removeAdditionalFee = useCallback((index: number) => dispatch({ type: "REMOVE_FEE", index }), [dispatch])
  const updateAdditionalFee = useCallback(
    (index: number, field: keyof AdditionalFee, value: string | number) =>
      dispatch({ type: "UPDATE_FEE", index, field, value }),
    [dispatch]
  )

  const subtotal = useMemo(() => invoiceData.items.reduce((sum, item) => sum + item.subtotal, 0), [invoiceData.items])
  const taxes = useMemo(
    () => invoiceData.additionalTaxes.reduce((sum, tax) => sum + tax.amount, 0),
    [invoiceData.additionalTaxes]
  )
  const fees = useMemo(
    () => invoiceData.additionalFees.reduce((sum, fee) => sum + fee.amount, 0),
    [invoiceData.additionalFees]
  )
  const total = useMemo(
    () => (invoiceData.taxIncluded ? subtotal : subtotal + taxes) + fees,
    [invoiceData.taxIncluded, subtotal, taxes, fees]
  )

  return (
    <div className="relative w-full max-w-[794px] sm:w-[794px] min-h-[297mm] bg-white shadow-lg p-2 sm:p-8 mb-8">
      {/* Gradient Background */}
      <div className="absolute top-0 left-0 right-0 h-[25%] bg-gradient-to-b from-indigo-100 to-indigo-0 opacity-70" />

      {/* Invoice Header */}
      <div className="flex flex-col sm:flex-row gap-4 sm:gap-8 justify-between items-start mb-8 relative">
        <div className="w-full flex flex-col space-y-2">
          <ShadyFormInput
            type="text"
            value={invoiceData.title}
            onChange={(e) => dispatch({ type: "UPDATE_FIELD", field: "title", value: e.target.value })}
            className="text-2xl sm:text-4xl font-extrabold"
            placeholder="INVOICE"
            required
          />
          <FormInput
            placeholder="Invoice ID or subtitle"
            value={invoiceData.invoiceNumber}
            onChange={(e) => dispatch({ type: "UPDATE_FIELD", field: "invoiceNumber", value: e.target.value })}
            className="w-full sm:w-[200px] font-medium"
          />
        </div>

        <div className="flex flex-row items-center justify-end mt-4 sm:mt-0">
          <FormAvatar
            name="businessLogo"
            className="w-[60px] h-[60px] sm:w-[100px] sm:h-[100px]"
            defaultValue={invoiceData.businessLogo || ""}
            onChange={(e) => {
              const file = e.target.files?.[0]
              if (file) {
                const objectUrl = URL.createObjectURL(file)
                dispatch({ type: "UPDATE_FIELD", field: "businessLogo", value: objectUrl })
              } else {
                dispatch({ type: "UPDATE_FIELD", field: "businessLogo", value: null })
              }
            }}
          />
        </div>
      </div>

      {/* Company and Bill To */}
      <div className="relative grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-8 mb-8">
        <div className="flex flex-col gap-1">
          <ShadyFormInput
            type="text"
            value={invoiceData.companyDetailsLabel}
            onChange={(e) => dispatch({ type: "UPDATE_FIELD", field: "companyDetailsLabel", value: e.target.value })}
            className="text-xs sm:text-sm font-medium"
          />
          <FormTextarea
            value={invoiceData.companyDetails}
            onChange={(e) => dispatch({ type: "UPDATE_FIELD", field: "companyDetails", value: e.target.value })}
            rows={4}
            placeholder="Your Company Name, Address, City, State, ZIP, Country, Tax ID"
            required
          />
        </div>
        <div className="flex flex-col gap-1">
          <ShadyFormInput
            type="text"
            value={invoiceData.billToLabel}
            onChange={(e) => dispatch({ type: "UPDATE_FIELD", field: "billToLabel", value: e.target.value })}
            className="text-xs sm:text-sm font-medium"
          />
          <FormTextarea
            value={invoiceData.billTo}
            onChange={(e) => dispatch({ type: "UPDATE_FIELD", field: "billTo", value: e.target.value })}
            rows={4}
            placeholder="Client Name, Address, City, State, ZIP, Country, Tax ID"
            required
          />
        </div>
      </div>

      <div className="relative flex flex-col sm:flex-row items-start sm:items-end justify-between mb-8 gap-4">
        <div className="flex flex-row items-center gap-4 w-full sm:w-auto">
          <div className="flex flex-col gap-1 w-full">
            <ShadyFormInput
              type="text"
              value={invoiceData.issueDateLabel}
              onChange={(e) => dispatch({ type: "UPDATE_FIELD", field: "issueDateLabel", value: e.target.value })}
              className="text-xs sm:text-sm font-medium"
            />
            <FormInput
              type="date"
              value={invoiceData.date}
              onChange={(e) => dispatch({ type: "UPDATE_FIELD", field: "date", value: e.target.value })}
              className="w-full border-b border-gray-300 py-1"
              required
            />
          </div>

          <div className="flex flex-col gap-1 w-full">
            <ShadyFormInput
              type="text"
              value={invoiceData.dueDateLabel}
              onChange={(e) => dispatch({ type: "UPDATE_FIELD", field: "dueDateLabel", value: e.target.value })}
              className="text-xs sm:text-sm font-medium"
            />
            <FormInput
              type="date"
              value={invoiceData.dueDate}
              onChange={(e) => dispatch({ type: "UPDATE_FIELD", field: "dueDate", value: e.target.value })}
              required
            />
          </div>
        </div>

        <div className="w-full sm:w-auto flex justify-end">
          <FormSelectCurrency
            currencies={currencies}
            value={invoiceData.currency}
            onValueChange={(value) => dispatch({ type: "UPDATE_FIELD", field: "currency", value })}
          />
        </div>
      </div>

      {/* Items Section - Refactored to use only flex divs */}
      <div className="mb-8">
        <div className="border rounded-lg overflow-hidden">
          {/* Header row for column titles */}
          <div className="hidden sm:flex bg-gray-50 text-xs font-medium text-gray-500 uppercase tracking-wider border-b">
            <div className="flex-1 px-4 py-3">
              <ShadyFormInput
                type="text"
                value={invoiceData.itemLabel}
                onChange={(e) => dispatch({ type: "UPDATE_FIELD", field: "itemLabel", value: e.target.value })}
                className="text-xs font-medium text-gray-500 uppercase tracking-wider"
              />
            </div>
            <div className="w-20 px-4 py-3 text-right">
              <ShadyFormInput
                type="text"
                value={invoiceData.quantityLabel}
                onChange={(e) => dispatch({ type: "UPDATE_FIELD", field: "quantityLabel", value: e.target.value })}
                className="text-xs font-medium text-gray-500 uppercase tracking-wider text-right w-full"
              />
            </div>
            <div className="w-28 px-4 py-3 text-right">
              <ShadyFormInput
                type="text"
                value={invoiceData.unitPriceLabel}
                onChange={(e) => dispatch({ type: "UPDATE_FIELD", field: "unitPriceLabel", value: e.target.value })}
                className="text-xs font-medium text-gray-500 uppercase tracking-wider text-right w-full"
              />
            </div>
            <div className="w-28 px-4 py-3 text-right">
              <ShadyFormInput
                type="text"
                value={invoiceData.subtotalLabel}
                onChange={(e) => dispatch({ type: "UPDATE_FIELD", field: "subtotalLabel", value: e.target.value })}
                className="text-xs font-medium text-gray-500 uppercase tracking-wider text-right w-full"
              />
            </div>
            <div className="w-10 px-2 py-3"></div>
          </div>

          {/* Invoice items */}
          <div className="flex flex-col divide-y divide-gray-200">
            {invoiceData.items.map((item, index) => (
              <ItemRow
                key={index}
                item={item}
                index={index}
                onChange={updateItem}
                onRemove={removeItem}
                currency={invoiceData.currency}
              />
            ))}
          </div>

          <Button onClick={addItem} className="m-2 sm:m-3 w-full sm:w-auto">
            + Add Item
          </Button>
        </div>
      </div>

      {/* Notes */}
      <div className="mb-8">
        <FormTextarea
          value={invoiceData.notes}
          onChange={(e) => dispatch({ type: "UPDATE_FIELD", field: "notes", value: e.target.value })}
          className="w-full border border-gray-300 rounded p-2 text-xs sm:text-sm"
          rows={3}
          placeholder="Additional notes or terms"
        />
      </div>

      {/* Summary */}
      <div className="flex justify-end">
        <div className="w-full sm:w-72 space-y-2">
          <div className="flex justify-between">
            <ShadyFormInput
              type="text"
              value={invoiceData.summarySubtotalLabel}
              onChange={(e) => dispatch({ type: "UPDATE_FIELD", field: "summarySubtotalLabel", value: e.target.value })}
              className="text-xs sm:text-sm font-medium text-gray-600"
            />
            <span className="text-xs sm:text-sm">{formatCurrency(subtotal * 100, invoiceData.currency)}</span>
          </div>

          <div className="flex flex-col gap-2 items-start">
            {/* Additional Taxes */}
            {invoiceData.additionalTaxes.map((tax, index) => (
              <TaxRow
                key={index}
                tax={tax}
                index={index}
                onChange={updateAdditionalTax}
                onRemove={removeAdditionalTax}
                currency={invoiceData.currency}
              />
            ))}

            <div className="w-full flex justify-end">
              <Button onClick={addAdditionalTax} className="w-full sm:w-auto">
                + Add Tax
              </Button>
            </div>

            {invoiceData.additionalFees.map((fee, index) => (
              <FeeRow
                key={index}
                fee={fee}
                index={index}
                onChange={updateAdditionalFee}
                onRemove={removeAdditionalFee}
                currency={invoiceData.currency}
              />
            ))}

            <div className="w-full flex justify-end">
              <Button onClick={addAdditionalFee} className="w-full sm:w-auto">
                + Add Fee or Discount
              </Button>
            </div>
          </div>

          <label className="flex items-center space-x-1">
            <input
              type="checkbox"
              checked={invoiceData.taxIncluded}
              onChange={(e) => dispatch({ type: "UPDATE_FIELD", field: "taxIncluded", value: e.target.checked })}
              className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
            />
            <span className="text-gray-600 text-xs sm:text-sm">Taxes are included in price</span>
          </label>
          <div className="flex justify-between border-t pt-2">
            <ShadyFormInput
              type="text"
              value={invoiceData.summaryTotalLabel}
              onChange={(e) => dispatch({ type: "UPDATE_FIELD", field: "summaryTotalLabel", value: e.target.value })}
              className="text-sm sm:text-md font-bold"
            />
            <span className="text-sm sm:text-md font-bold text-nowrap">
              {formatCurrency(total * 100, invoiceData.currency)}
            </span>
          </div>
        </div>
      </div>

      {/* Bank Details Footer */}
      <div className="mt-8 pt-8 border-t">
        <textarea
          value={invoiceData.bankDetails}
          onChange={(e) => dispatch({ type: "UPDATE_FIELD", field: "bankDetails", value: e.target.value })}
          className="text-center text-xs sm:text-sm text-muted-foreground w-full mx-auto border border-gray-300 rounded p-2"
          rows={3}
          placeholder="Bank and Payment Details: Account number, Bank name, IBAN, SWIFT/BIC, Your Email (optional)"
          required
        />
      </div>
    </div>
  )
}

function ShadyFormInput({ className = "", ...props }: { className?: string } & InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={`bg-transparent border border-transparent outline-none p-0 w-full hover:border-dashed hover:border-gray-200 hover:bg-gray-50 focus:bg-gray-50 hover:rounded-sm ${className}`}
      {...props}
    />
  )
}
