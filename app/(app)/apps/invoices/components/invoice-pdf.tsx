import { formatCurrency } from "@/lib/utils"
import { Document, Font, Image, Page, StyleSheet, Text, View } from "@react-pdf/renderer"
import { formatDate } from "date-fns"
import { ReactElement } from "react"
import { AdditionalFee, AdditionalTax, InvoiceFormData, InvoiceItem } from "./invoice-page"

Font.register({
  family: "Inter",
  fonts: [
    {
      src: "public/fonts/Inter/Inter-Regular.otf",
      fontWeight: 400,
      fontStyle: "normal",
    },
    {
      src: "public/fonts/Inter/Inter-Medium.otf",
      fontWeight: 500,
      fontStyle: "normal",
    },
    {
      src: "public/fonts/Inter/Inter-SemiBold.otf",
      fontWeight: 600,
      fontStyle: "normal",
    },
    {
      src: "public/fonts/Inter/Inter-Bold.otf",
      fontWeight: 700,
      fontStyle: "normal",
    },
    {
      src: "public/fonts/Inter/Inter-ExtraBold.otf",
      fontWeight: 800,
      fontStyle: "normal",
    },
    {
      src: "public/fonts/Inter/Inter-Black.otf",
      fontWeight: 900,
      fontStyle: "normal",
    },
    {
      src: "public/fonts/Inter-Italic.otf",
      fontWeight: 400,
      fontStyle: "italic",
    },
    {
      src: "public/fonts/Inter/Inter-MediumItalic.otf",
      fontWeight: 500,
      fontStyle: "italic",
    },
    {
      src: "public/fonts/Inter/Inter-SemiBoldItalic.otf",
      fontWeight: 600,
      fontStyle: "italic",
    },
    {
      src: "public/fonts/Inter/Inter-BoldItalic.otf",
      fontWeight: 700,
      fontStyle: "italic",
    },
    {
      src: "public/fonts/Inter/Inter-ExtraBoldItalic.otf",
      fontWeight: 800,
      fontStyle: "italic",
    },
    {
      src: "public/fonts/Inter/Inter-BlackItalic.otf",
      fontWeight: 900,
      fontStyle: "italic",
    },
  ],
})

Font.registerEmojiSource({
  format: "png",
  url: "https://cdnjs.cloudflare.com/ajax/libs/twemoji/14.0.2/72x72/",
})

const styles = StyleSheet.create({
  page: {
    fontFamily: "Inter",
    padding: 30,
    backgroundColor: "#ffffff",
  },
  header: {
    marginBottom: 30,
    position: "relative",
  },
  gradientBackground: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: "120px",
    backgroundColor: "#eef2ff",
    opacity: 0.8,
  },
  headerContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 30,
  },
  headerLeft: {
    flex: 1,
  },
  headerRight: {
    width: 110,
    height: 60,
  },
  title: {
    fontSize: 28,
    marginBottom: 10,
    fontWeight: "extrabold",
    color: "#000000",
  },
  subtitle: {
    fontSize: 13,
    color: "#666666",
  },
  logo: {
    width: "100%",
    height: "100%",
    objectFit: "contain",
  },
  companyDetails: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 30,
  },
  companySection: {
    flex: 1,
    marginRight: 30,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: "bold",
    marginBottom: 8,
    color: "#000000",
  },
  sectionContent: {
    fontSize: 12,
    lineHeight: 1.3,
    color: "#000000",
  },
  datesAndCurrency: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    marginBottom: 30,
  },
  dateGroup: {
    flexDirection: "row",
    gap: 20,
  },
  dateItem: {
    marginRight: 20,
  },
  dateLabel: {
    fontSize: 12,
    fontWeight: "bold",
    marginBottom: 8,
    color: "#000000",
  },
  dateValue: {
    fontSize: 12,
    color: "#000000",
  },
  itemsTable: {
    marginBottom: 30,
  },
  tableHeader: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
    paddingVertical: 8,
    backgroundColor: "#F9FAFB",
    textTransform: "uppercase",
  },
  tableRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
    paddingVertical: 8,
  },
  colDescription: {
    flex: 2,
    paddingHorizontal: 10,
  },
  colQuantity: {
    flex: 1,
    paddingHorizontal: 10,
    textAlign: "right",
  },
  colPrice: {
    flex: 1,
    paddingHorizontal: 10,
    textAlign: "right",
  },
  colSubtotal: {
    flex: 1,
    paddingHorizontal: 10,
    textAlign: "right",
  },
  colHeader: {
    fontSize: 10,
    fontWeight: "bold",
    color: "#6B7280",
  },
  colValue: {
    fontSize: 12,
    color: "#000000",
  },
  colName: {
    fontWeight: "semibold",
  },
  itemSubtitle: {
    fontSize: 10,
    color: "#6B7280",
    marginTop: 2,
  },
  notes: {
    marginBottom: 30,
    fontSize: 12,
  },
  notesLabel: {
    fontWeight: "bold",
    marginBottom: 5,
    color: "#000000",
  },
  summary: {
    width: "50%",
    alignSelf: "flex-end",
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 5,
  },
  summaryLabel: {
    fontSize: 12,
    color: "#4B5563",
  },
  summaryValue: {
    fontSize: 12,
    color: "#000000",
  },
  taxRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 5,
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: "#000000",
  },
  totalLabel: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#000000",
  },
  totalValue: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#000000",
  },
  bankDetails: {
    marginTop: 30,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
    textAlign: "center",
    fontSize: 11,
    color: "#6B7280",
  },
})

export function InvoicePDF({ data }: { data: InvoiceFormData }): ReactElement {
  const calculateSubtotal = (): number => {
    return data.items.reduce((sum: number, item: InvoiceItem) => sum + item.subtotal, 0)
  }

  const calculateTaxes = (): number => {
    return data.additionalTaxes.reduce((sum: number, tax: AdditionalTax) => sum + tax.amount, 0)
  }

  const calculateTotal = (): number => {
    const subtotal = calculateSubtotal()
    const taxes = calculateTaxes()
    return data.taxIncluded ? subtotal : subtotal + taxes
  }

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.gradientBackground} />

        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <View style={styles.headerLeft}>
              <Text style={styles.title}>{data.title}</Text>
              <Text style={styles.subtitle}>{data.invoiceNumber}</Text>
            </View>
            {data.businessLogo && (
              <View style={styles.headerRight}>
                <Image src={data.businessLogo} style={styles.logo} />
              </View>
            )}
          </View>
        </View>

        {/* Company Details and Bill To */}
        <View style={styles.companyDetails}>
          <View style={styles.companySection}>
            <Text style={styles.sectionLabel}>{data.companyDetailsLabel}</Text>
            <Text style={styles.sectionContent}>{data.companyDetails}</Text>
          </View>
          <View style={styles.companySection}>
            <Text style={styles.sectionLabel}>{data.billToLabel}</Text>
            <Text style={styles.sectionContent}>{data.billTo}</Text>
          </View>
        </View>

        {/* Dates and Currency */}
        <View style={styles.datesAndCurrency}>
          <View style={styles.dateGroup}>
            <View style={styles.dateItem}>
              <Text style={styles.dateLabel}>{data.issueDateLabel}</Text>
              <Text style={styles.dateValue}>{formatDate(data.date, "yyyy-MM-dd")}</Text>
            </View>
            <View style={styles.dateItem}>
              <Text style={styles.dateLabel}>{data.dueDateLabel}</Text>
              <Text style={styles.dateValue}>{formatDate(data.dueDate, "yyyy-MM-dd")}</Text>
            </View>
          </View>
        </View>

        {/* Items Table */}
        <View style={styles.itemsTable}>
          <View style={styles.tableHeader}>
            <Text style={[styles.colHeader, styles.colDescription]}>{data.itemLabel}</Text>
            <Text style={[styles.colHeader, styles.colQuantity]}>{data.quantityLabel}</Text>
            <Text style={[styles.colHeader, styles.colPrice]}>{data.unitPriceLabel}</Text>
            <Text style={[styles.colHeader, styles.colSubtotal]}>{data.subtotalLabel}</Text>
          </View>

          {data.items.map((item: InvoiceItem, index: number) => (
            <View key={index} style={styles.tableRow}>
              <View style={styles.colDescription}>
                <Text style={[styles.colValue, styles.colName]}>{item.name}</Text>
                {item.showSubtitle && item.subtitle && <Text style={styles.itemSubtitle}>{item.subtitle}</Text>}
              </View>
              <Text style={[styles.colValue, styles.colQuantity]}>{item.quantity}</Text>
              <Text style={[styles.colValue, styles.colPrice]}>
                {formatCurrency(item.unitPrice * 100, data.currency)}
              </Text>
              <Text style={[styles.colValue, styles.colSubtotal]}>
                {formatCurrency(item.subtotal * 100, data.currency)}
              </Text>
            </View>
          ))}
        </View>

        {/* Notes */}
        {data.notes && (
          <View style={styles.notes}>
            <Text style={styles.notesLabel}>Notes:</Text>
            <Text>{data.notes}</Text>
          </View>
        )}

        {/* Summary */}
        <View style={styles.summary}>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>{data.summarySubtotalLabel}</Text>
            <Text style={styles.summaryValue}>{formatCurrency(calculateSubtotal() * 100, data.currency)}</Text>
          </View>

          {data.additionalTaxes.map((tax: AdditionalTax, index: number) => (
            <View key={index} style={styles.taxRow}>
              <Text style={styles.summaryLabel}>
                {tax.name} ({tax.rate}%):
              </Text>
              <Text style={styles.summaryValue}>{formatCurrency(tax.amount * 100, data.currency)}</Text>
            </View>
          ))}

          {data.additionalFees.map((fee: AdditionalFee, index: number) => (
            <View key={index} style={styles.taxRow}>
              <Text style={styles.summaryLabel}>{fee.name}</Text>
              <Text style={styles.summaryValue}>{formatCurrency(fee.amount * 100, data.currency)}</Text>
            </View>
          ))}

          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>{data.summaryTotalLabel}</Text>
            <Text style={styles.totalValue}>{formatCurrency(calculateTotal() * 100, data.currency)}</Text>
          </View>
        </View>

        {/* Bank Details */}
        {data.bankDetails && (
          <View style={styles.bankDetails}>
            <Text>{data.bankDetails}</Text>
          </View>
        )}
      </Page>
    </Document>
  )
}
