import { PrismaClient } from "@prisma/client"

const DATABASE_URL = process.env.DATABASE_URL
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: DATABASE_URL,
    },
  },
})

const forceSeed = process.argv.includes("--force")

const settings = [
  {
    code: "app_title",
    name: "App Title",
    description: "",
    value: "TaxHacker",
  },
  {
    code: "default_currency",
    name: "Default Currency",
    description: "Don't change this setting if you already have multi-currency transactions. I won't recalculate them.",
    value: "EUR",
  },
  {
    code: "default_category",
    name: "Default Category",
    description: "",
    value: "other",
  },
  {
    code: "default_project",
    name: "Default Project",
    description: "",
    value: "personal",
  },
  {
    code: "default_type",
    name: "Default Type",
    description: "",
    value: "expense",
  },
  {
    code: "openai_api_key",
    name: "ChatGPT API Key",
    description: "You can get if from here: https://platform.openai.com/settings/organization/api-keys",
    value: "",
  },
  {
    code: "prompt_analyse_new_file",
    name: "Prompt for Analyze Transaction",
    description: "Allowed variables: {fields}, {categories}, {categories.code}, {projects}, {projects.code}",
    value: `You are an accountant and invoice analysis assistant. 
Extract the following information from the given invoice: 

{fields}

Where categories are:

{categories}

And projects are:

{projects}

If you can't find something leave it blank. Return only one object. Do not include any other text in your response!`,
  },
  {
    code: "is_welcome_message_hidden",
    name: "Do not show welcome message on dashboard",
    description: "",
    value: "false",
  },
]

const categories = [
  {
    code: "ads",
    name: "Advertisement",
    color: "#882727",
    llm_prompt: "ads, promos, online ads, etc",
  },
  {
    code: "swag",
    name: "Swag and Goods",
    color: "#882727",
    llm_prompt: "swag, stickers, goods, etc",
  },
  { code: "donations", name: "Gifts and Donations", color: "#1e6359", llm_prompt: "donations, gifts, charity" },
  { code: "tools", name: "Equipment and Tools", color: "#c69713", llm_prompt: "equipment, tools" },
  { code: "events", name: "Events and Conferences", color: "#ff8b32", llm_prompt: "events, conferences" },
  { code: "food", name: "Food and Drinks", color: "#d40e70", llm_prompt: "food, drinks, business meals" },
  { code: "insurance", name: "Insurance", color: "#050942", llm_prompt: "insurance, health, life" },
  { code: "invoice", name: "Invoice", color: "#064e85", llm_prompt: "custom invoice, bill" },
  { code: "communication", name: "Mobile and Internet", color: "#0e7d86", llm_prompt: "mobile, internet, phone" },
  { code: "office", name: "Office Supplies", color: "#59b0b9", llm_prompt: "office, supplies, stationery" },
  { code: "online", name: "Online Services", color: "#8753fb", llm_prompt: "online services, saas, subscriptions" },
  { code: "rental", name: "Rental", color: "#050942", llm_prompt: "rental, lease" },
  {
    code: "education",
    name: "Education",
    color: "#ee5d6c",
    llm_prompt: "education, professional development, trainings",
  },
  { code: "salary", name: "Salary", color: "#ce4993", llm_prompt: "salary, wages, etc" },
  { code: "fees", name: "Fees", color: "#6a0d83", llm_prompt: "fees, charges, penalties, etc" },
  { code: "travel", name: "Travel Expenses", color: "#fb9062", llm_prompt: "travel, accommodation, etc" },
  { code: "utility_bills", name: "Utility Bills", color: "#af7e2e", llm_prompt: "bills, electricity, water, etc" },
  {
    code: "transport",
    name: "Transport",
    color: "#800000",
    llm_prompt: "transportation costs, fuel, car rental, vignettes, etc",
  },
  { code: "software", name: "Software", color: "#2b5a1d", llm_prompt: "software, licenses" },
  { code: "other", name: "Other", color: "#121216", llm_prompt: "other, miscellaneous," },
]

const projects = [{ code: "personal", name: "Personal", llm_prompt: "personal", color: "#1e202b" }]

const currencies = [
  { code: "USD", name: "$" },
  { code: "EUR", name: "€" },
  { code: "GBP", name: "£" },
  { code: "INR", name: "₹" },
  { code: "AUD", name: "$" },
  { code: "CAD", name: "$" },
  { code: "SGD", name: "$" },
  { code: "CHF", name: "Fr" },
  { code: "MYR", name: "RM" },
  { code: "JPY", name: "¥" },
  { code: "CNY", name: "¥" },
  { code: "NZD", name: "$" },
  { code: "THB", name: "฿" },
  { code: "HUF", name: "Ft" },
  { code: "AED", name: "د.إ" },
  { code: "HKD", name: "$" },
  { code: "MXN", name: "$" },
  { code: "ZAR", name: "R" },
  { code: "PHP", name: "₱" },
  { code: "SEK", name: "kr" },
  { code: "IDR", name: "Rp" },
  { code: "BRL", name: "R$" },
  { code: "SAR", name: "﷼" },
  { code: "TRY", name: "₺" },
  { code: "KES", name: "KSh" },
  { code: "KRW", name: "₩" },
  { code: "EGP", name: "£" },
  { code: "IQD", name: "ع.د" },
  { code: "NOK", name: "kr" },
  { code: "KWD", name: "د.ك" },
  { code: "RUB", name: "₽" },
  { code: "DKK", name: "kr" },
  { code: "PKR", name: "₨" },
  { code: "ILS", name: "₪" },
  { code: "PLN", name: "zł" },
  { code: "QAR", name: "﷼" },
  { code: "OMR", name: "﷼" },
  { code: "COP", name: "$" },
  { code: "CLP", name: "$" },
  { code: "TWD", name: "NT$" },
  { code: "ARS", name: "$" },
  { code: "CZK", name: "Kč" },
  { code: "VND", name: "₫" },
  { code: "MAD", name: "د.م." },
  { code: "JOD", name: "د.ا" },
  { code: "BHD", name: ".د.ب" },
  { code: "XOF", name: "CFA" },
  { code: "LKR", name: "₨" },
  { code: "UAH", name: "₴" },
  { code: "NGN", name: "₦" },
  { code: "TND", name: "د.ت" },
  { code: "UGX", name: "USh" },
  { code: "RON", name: "lei" },
  { code: "BDT", name: "৳" },
  { code: "PEN", name: "S/" },
  { code: "GEL", name: "₾" },
  { code: "XAF", name: "FCFA" },
  { code: "FJD", name: "$" },
  { code: "VEF", name: "Bs" },
  { code: "VES", name: "Bs.S" },
  { code: "BYN", name: "Br" },
  { code: "UZS", name: "лв" },
  { code: "BGN", name: "лв" },
  { code: "DZD", name: "د.ج" },
  { code: "IRR", name: "﷼" },
  { code: "DOP", name: "RD$" },
  { code: "ISK", name: "kr" },
  { code: "CRC", name: "₡" },
  { code: "SYP", name: "£" },
  { code: "JMD", name: "J$" },
  { code: "LYD", name: "ل.د" },
  { code: "GHS", name: "₵" },
  { code: "MUR", name: "₨" },
  { code: "AOA", name: "Kz" },
  { code: "UYU", name: "$U" },
  { code: "AFN", name: "؋" },
  { code: "LBP", name: "ل.ل" },
  { code: "XPF", name: "₣" },
  { code: "TTD", name: "TT$" },
  { code: "TZS", name: "TSh" },
  { code: "ALL", name: "Lek" },
  { code: "XCD", name: "$" },
  { code: "GTQ", name: "Q" },
  { code: "NPR", name: "₨" },
  { code: "BOB", name: "Bs." },
  { code: "ZWD", name: "Z$" },
  { code: "BBD", name: "$" },
  { code: "CUC", name: "$" },
  { code: "LAK", name: "₭" },
  { code: "BND", name: "$" },
  { code: "BWP", name: "P" },
  { code: "HNL", name: "L" },
  { code: "PYG", name: "₲" },
  { code: "ETB", name: "Br" },
  { code: "NAD", name: "$" },
  { code: "PGK", name: "K" },
  { code: "SDG", name: "ج.س." },
  { code: "MOP", name: "MOP$" },
  { code: "BMD", name: "$" },
  { code: "NIO", name: "C$" },
  { code: "BAM", name: "KM" },
  { code: "KZT", name: "₸" },
  { code: "PAB", name: "B/." },
  { code: "GYD", name: "$" },
  { code: "YER", name: "﷼" },
  { code: "MGA", name: "Ar" },
  { code: "KYD", name: "$" },
  { code: "MZN", name: "MT" },
  { code: "RSD", name: "дин." },
  { code: "SCR", name: "₨" },
  { code: "AMD", name: "֏" },
  { code: "AZN", name: "₼" },
  { code: "SBD", name: "$" },
  { code: "SLL", name: "Le" },
  { code: "TOP", name: "T$" },
  { code: "BZD", name: "BZ$" },
  { code: "GMD", name: "D" },
  { code: "MWK", name: "MK" },
  { code: "BIF", name: "FBu" },
  { code: "HTG", name: "G" },
  { code: "SOS", name: "S" },
  { code: "GNF", name: "FG" },
  { code: "MNT", name: "₮" },
  { code: "MVR", name: "Rf" },
  { code: "CDF", name: "FC" },
  { code: "STN", name: "Db" },
  { code: "TJS", name: "ЅМ" },
  { code: "KPW", name: "₩" },
  { code: "KGS", name: "лв" },
  { code: "LRD", name: "$" },
  { code: "LSL", name: "L" },
  { code: "MMK", name: "K" },
  { code: "GIP", name: "£" },
  { code: "MDL", name: "L" },
  { code: "CUP", name: "₱" },
  { code: "KHR", name: "៛" },
  { code: "MKD", name: "ден" },
  { code: "VUV", name: "VT" },
  { code: "ANG", name: "ƒ" },
  { code: "MRU", name: "UM" },
  { code: "SZL", name: "L" },
  { code: "CVE", name: "$" },
  { code: "SRD", name: "$" },
  { code: "SVC", name: "$" },
  { code: "BSD", name: "$" },
  { code: "RWF", name: "R₣" },
  { code: "AWG", name: "ƒ" },
  { code: "BTN", name: "Nu." },
  { code: "DJF", name: "Fdj" },
  { code: "KMF", name: "CF" },
  { code: "ERN", name: "Nfk" },
  { code: "FKP", name: "£" },
  { code: "SHP", name: "£" },
  { code: "WST", name: "WS$" },
  { code: "JEP", name: "£" },
  { code: "TMT", name: "m" },
  { code: "GGP", name: "£" },
  { code: "IMP", name: "£" },
  { code: "TVD", name: "$" },
  { code: "ZMW", name: "ZK" },
  { code: "ADA", name: "Crypto" },
  { code: "BCH", name: "Crypto" },
  { code: "BTC", name: "Crypto" },
  { code: "CLF", name: "UF" },
  { code: "CNH", name: "¥" },
  { code: "DOGE", name: "Crypto" },
  { code: "DOT", name: "Crypto" },
  { code: "ETH", name: "Crypto" },
  { code: "LINK", name: "Crypto" },
  { code: "LTC", name: "Crypto" },
  { code: "LUNA", name: "Crypto" },
  { code: "SLE", name: "Le" },
  { code: "UNI", name: "Crypto" },
  { code: "XBT", name: "Crypto" },
  { code: "XLM", name: "Crypto" },
  { code: "XRP", name: "Crypto" },
  { code: "ZWL", name: "$" },
]

const fields = [
  {
    code: "name",
    name: "Name",
    type: "string",
    llm_prompt: "human readable name, summarize what is bought in the invoice",
    isVisibleInList: true,
    isVisibleInAnalysis: true,
    isRequired: true,
    isExtra: false,
  },
  {
    code: "description",
    name: "Description",
    type: "string",
    llm_prompt: "description of the transaction",
    isVisibleInList: false,
    isVisibleInAnalysis: false,
    isRequired: false,
    isExtra: false,
  },
  {
    code: "merchant",
    name: "Merchant",
    type: "string",
    llm_prompt: "merchant name, use the original spelling and language",
    isVisibleInList: true,
    isVisibleInAnalysis: true,
    isRequired: false,
    isExtra: false,
  },
  {
    code: "issuedAt",
    name: "Issued At",
    type: "string",
    llm_prompt: "issued at date (YYYY-MM-DD format)",
    isVisibleInList: true,
    isVisibleInAnalysis: true,
    isRequired: false,
    isExtra: false,
  },
  {
    code: "projectCode",
    name: "Project",
    type: "string",
    llm_prompt: "project code, one of: {projects.code}",
    isVisibleInList: true,
    isVisibleInAnalysis: true,
    isRequired: false,
    isExtra: false,
  },
  {
    code: "categoryCode",
    name: "Category",
    type: "string",
    llm_prompt: "category code, one of: {categories.code}",
    isVisibleInList: true,
    isVisibleInAnalysis: true,
    isRequired: false,
    isExtra: false,
  },
  {
    code: "files",
    name: "Files",
    type: "string",
    llm_prompt: "",
    isVisibleInList: true,
    isVisibleInAnalysis: true,
    isRequired: false,
    isExtra: false,
  },
  {
    code: "total",
    name: "Total",
    type: "number",
    llm_prompt: "total total of the transaction",
    isVisibleInList: true,
    isVisibleInAnalysis: true,
    isRequired: false,
    isExtra: false,
  },
  {
    code: "currencyCode",
    name: "Currency",
    type: "string",
    llm_prompt: "currency code, ISO 4217 three letter code like USD, EUR, including crypto codes like BTC, ETH, etc",
    isVisibleInList: false,
    isVisibleInAnalysis: true,
    isRequired: false,
    isExtra: false,
  },
  {
    code: "convertedTotal",
    name: "Converted Total",
    type: "number",
    llm_prompt: "",
    isVisibleInList: false,
    isVisibleInAnalysis: false,
    isRequired: false,
    isExtra: false,
  },
  {
    code: "convertedCurrencyCode",
    name: "Converted Currency Code",
    type: "string",
    llm_prompt: "",
    isVisibleInList: false,
    isVisibleInAnalysis: false,
    isRequired: false,
    isExtra: false,
  },
  {
    code: "type",
    name: "Type",
    type: "string",
    llm_prompt: "",
    isVisibleInList: false,
    isVisibleInAnalysis: true,
    isRequired: false,
    isExtra: false,
  },
  {
    code: "note",
    name: "Note",
    type: "string",
    llm_prompt: "",
    isVisibleInList: false,
    isVisibleInAnalysis: false,
    isRequired: false,
    isExtra: false,
  },
  {
    code: "vat_rate",
    name: "VAT Rate",
    type: "number",
    llm_prompt: "VAT rate in percentage 0-100",
    isVisibleInList: false,
    isVisibleInAnalysis: false,
    isRequired: false,
    isExtra: true,
  },
  {
    code: "vat",
    name: "VAT Amount",
    type: "number",
    llm_prompt: "total VAT in currency of the invoice",
    isVisibleInList: false,
    isVisibleInAnalysis: false,
    isRequired: false,
    isExtra: true,
  },
  {
    code: "text",
    name: "Extracted Text",
    type: "string",
    llm_prompt: "extract all recognised text from the invoice",
    isVisibleInList: false,
    isVisibleInAnalysis: false,
    isRequired: false,
    isExtra: false,
  },
]

async function isDatabaseEmpty() {
  const fieldsCount = await prisma.field.count()
  return fieldsCount === 0
}

async function main() {
  const isEmpty = await isDatabaseEmpty()
  if (!isEmpty && !forceSeed) {
    console.log("Database is already seeded. Use 'npm run seed:force' to force reseeding (can override existing data).")
    return
  }

  console.log("Starting database seeding...")

  // Seed projects
  for (const project of projects) {
    await prisma.project.upsert({
      where: { code: project.code },
      update: { name: project.name, color: project.color, llm_prompt: project.llm_prompt },
      create: project,
    })
  }

  // Seed categories
  for (const category of categories) {
    await prisma.category.upsert({
      where: { code: category.code },
      update: { name: category.name, color: category.color, llm_prompt: category.llm_prompt },
      create: category,
    })
  }

  // Seed currencies
  for (const currency of currencies) {
    await prisma.currency.upsert({
      where: { code: currency.code },
      update: { name: currency.name },
      create: currency,
    })
  }

  // Seed fields
  for (const field of fields) {
    await prisma.field.upsert({
      where: { code: field.code },
      update: {
        name: field.name,
        type: field.type,
        llm_prompt: field.llm_prompt,
        isVisibleInList: field.isVisibleInList,
        isVisibleInAnalysis: field.isVisibleInAnalysis,
        isRequired: field.isRequired,
        isExtra: field.isExtra,
      },
      create: field,
    })
  }

  // Seed settings
  for (const setting of settings) {
    await prisma.setting.upsert({
      where: { code: setting.code },
      update: { name: setting.name, description: setting.description, value: setting.value },
      create: setting,
    })
  }
  await prisma.setting.deleteMany({
    where: {
      code: {
        notIn: settings.map((setting) => setting.code),
      },
    },
  })

  console.log("Database seeded successfully")
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })
