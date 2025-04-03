import { NewsletterForm } from "@/app/landing/newsletter"
import { ColoredText } from "@/components/ui/colored-text"
import Image from "next/image"
import Link from "next/link"

export default function LandingPage() {
  return (
    <div className="min-h-screen flex flex-col bg-[#FAFAFA]">
      <header className="py-6 px-8 bg-white/80 backdrop-blur-md shadow-sm fixed w-full z-10">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <a href="/" className="flex items-center gap-2">
            <img src="/logo/256.png" alt="Logo" className="h-8" />
            <ColoredText className="text-2xl font-bold">TaxHacker</ColoredText>
          </a>
          <div className="flex gap-4">
            <Link
              href="#start"
              className="text-sm font-medium bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-4 py-2 rounded-full hover:opacity-90 transition-all"
            >
              Get Started
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="pt-32 pb-16 px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <div className="inline-block px-4 py-2 rounded-full bg-purple-50 text-purple-600 text-sm font-medium mb-6">
              🚀 Under Active Development
            </div>
            <h1 className="text-5xl font-bold tracking-tight sm:text-6xl mb-6 bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent pb-2">
              Organize receipts, track expenses, and prepare your taxes with AI
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
              A self-hosted accounting app crafted with love for freelancers and small businesses.
            </p>
            <div className="flex gap-4 justify-center">
              <Link
                href="#start"
                className="px-8 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-medium rounded-full hover:opacity-90 transition-all shadow-lg shadow-blue-500/20"
              >
                Get Started
              </Link>
              <a
                href="mailto:me@vas3k.ru"
                className="px-8 py-3 border border-gray-200 text-gray-700 font-medium rounded-full hover:bg-gray-50 transition-all"
              >
                Contact Us
              </a>
            </div>
          </div>
          <div className="relative aspect-auto rounded-2xl overflow-hidden shadow-2xl ring-8 ring-gray-100 hover:scale-105 transition-all duration-300">
            <div className="absolute inset-0 bg-gradient-to-b from-blue-500/5 to-transparent z-10" />
            <video className="w-full h-auto" autoPlay loop muted playsInline poster="/landing/title.webp">
              <source src="/landing/video.mp4" type="video/mp4" />
              <Image src="/landing/title.webp" alt="TaxHacker" width={1980} height={1224} priority />
            </video>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="flex flex-col gap-3 mb-4 bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
              <span className="text-6xl font-semibold text-muted-foreground">F∗ck Taxes</span>
              <span className="text-4xl font-bold">TaxHacker can save you time, money and nerves</span>
            </h2>
          </div>

          {/* AI Scanner Feature */}
          <div className="flex flex-wrap items-center gap-12 mb-20 bg-white p-8 rounded-2xl shadow-sm ring-1 ring-gray-100">
            <div className="flex-1 min-w-60">
              <div className="inline-block px-3 py-1 rounded-full bg-blue-50 text-blue-600 text-sm font-medium mb-4">
                LLM-Powered
              </div>
              <h3 className="text-2xl font-semibold mb-4">AI Document Analyzer</h3>
              <ul className="space-y-3 text-gray-600">
                <li className="flex items-center">
                  <span className="text-blue-600 mr-2">✓</span>
                  Upload photos or PDFs for automatic recognition
                </li>
                <li className="flex items-center">
                  <span className="text-blue-600 mr-2">✓</span>
                  Extract key information like dates, amounts, and vendors
                </li>
                <li className="flex items-center">
                  <span className="text-blue-600 mr-2">✓</span>
                  Works with any language, format and photo quality
                </li>
                <li className="flex items-center">
                  <span className="text-blue-600 mr-2">✓</span>
                  Automatically organize everything into a structured database
                </li>
              </ul>
            </div>
            <div className="flex-1 relative aspect-auto rounded-2xl overflow-hidden shadow-2xl ring-8 ring-gray-100 hover:scale-105 transition-all duration-300">
              <Image src="/landing/ai-scanner.webp" alt="AI Document Analyzer" width={1900} height={1524} />
            </div>
          </div>

          {/* Multi-currency Feature */}
          <div className="flex flex-wrap items-center gap-12 mb-20 bg-white p-8 rounded-2xl shadow-sm ring-1 ring-gray-100 flex-row-reverse">
            <div className="flex-1 min-w-60">
              <div className="inline-block px-3 py-1 rounded-full bg-green-50 text-green-600 text-sm font-medium mb-4">
                Currency Converter
              </div>
              <h3 className="text-2xl font-semibold mb-4">Multi-Currency Support</h3>
              <ul className="space-y-3 text-gray-600">
                <li className="flex items-center">
                  <span className="text-green-600 mr-2">✓</span>
                  Detects foreign currencies and coverts it to yours
                </li>
                <li className="flex items-center">
                  <span className="text-green-600 mr-2">✓</span>
                  Historical exchange rate lookup on a date of transaction
                </li>
                <li className="flex items-center">
                  <span className="text-green-600 mr-2">✓</span>
                  Support for 170+ world currencies
                </li>
                <li className="flex items-center">
                  <span className="text-green-600 mr-2">✓</span>
                  Even works with cryptocurrencies (BTC, ETH, LTC, etc.)
                </li>
              </ul>
            </div>
            <div className="flex-1 relative aspect-auto rounded-2xl overflow-hidden shadow-2xl ring-8 ring-gray-100 hover:scale-105 transition-all duration-300">
              <Image src="/landing/multi-currency.webp" alt="Currency Converter" width={1400} height={1005} />
            </div>
          </div>

          {/* Transaction Table Feature */}
          <div className="flex flex-wrap items-center gap-12 mb-20 bg-white p-8 rounded-2xl shadow-sm ring-1 ring-gray-100 flex-row-reverse">
            <div className="flex-1 relative aspect-auto rounded-2xl overflow-hidden shadow-2xl ring-8 ring-gray-100 hover:scale-105 transition-all duration-300">
              <Image src="/landing/transactions.webp" alt="Transactions Table" width={2000} height={1279} />
            </div>
            <div className="flex-1  min-w-60">
              <div className="inline-block px-3 py-1 rounded-full bg-pink-50 text-pink-600 text-sm font-medium mb-4">
                Filters
              </div>
              <h3 className="text-2xl font-semibold mb-4">Income & Expense Tracker</h3>
              <ul className="space-y-3 text-gray-600">
                <li className="flex items-center">
                  <span className="text-green-600 mr-2">✓</span>
                  Add, edit and manage your transactions
                </li>
                <li className="flex items-center">
                  <span className="text-green-600 mr-2">✓</span>
                  Filter by any column, category or date range
                </li>
                <li className="flex items-center">
                  <span className="text-green-600 mr-2">✓</span>
                  Customize which columns to show in the table
                </li>
                <li className="flex items-center">
                  <span className="text-green-600 mr-2">✓</span>
                  Import transactions from CSV
                </li>
              </ul>
            </div>
          </div>

          {/* Custom Fields & Categories */}
          <div className="flex flex-wrap items-center gap-12 mb-20 bg-white p-8 rounded-2xl shadow-sm ring-1 ring-gray-100">
            <div className="flex-1 relative aspect-auto rounded-2xl overflow-hidden shadow-2xl ring-8 ring-gray-100 hover:scale-105 transition-all duration-300">
              <Image src="/landing/custom-llm.webp" alt="Custom LLM promts" width={1800} height={1081} />
            </div>
            <div className="flex-1 min-w-60">
              <div className="inline-block px-3 py-1 rounded-full bg-purple-50 text-purple-600 text-sm font-medium mb-4">
                Customization
              </div>
              <h3 className="text-2xl font-semibold mb-4">Custom LLM promts for everything</h3>
              <ul className="space-y-3 text-gray-600">
                <li className="flex items-center">
                  <span className="text-purple-600 mr-2">✓</span>
                  Create custom fields and categories with your own LLM prompts
                </li>
                <li className="flex items-center">
                  <span className="text-purple-600 mr-2">✓</span>
                  Extract any additional information you need
                </li>
                <li className="flex items-center">
                  <span className="text-purple-600 mr-2">✓</span>
                  Automatically categorize by project or category
                </li>
                <li className="flex items-center">
                  <span className="text-purple-600 mr-2">✓</span>
                  Ask AI to assess risk level or any other criteria
                </li>
              </ul>
            </div>
          </div>

          {/* Data Export */}
          <div className="flex flex-wrap items-center gap-12 mb-20 bg-white p-8 rounded-2xl shadow-sm ring-1 ring-gray-100 flex-row-reverse">
            <div className="flex-1 relative aspect-auto rounded-2xl overflow-hidden shadow-2xl ring-8 ring-gray-100 hover:scale-105 transition-all duration-300">
              <Image src="/landing/export.webp" alt="Export" width={1200} height={1081} />
            </div>
            <div className="flex-1 min-w-60">
              <div className="inline-block px-3 py-1 rounded-full bg-orange-50 text-orange-600 text-sm font-medium mb-4">
                Export
              </div>
              <h3 className="text-2xl font-semibold mb-4">Your Data — Your Rules</h3>
              <ul className="space-y-3 text-gray-600">
                <li className="flex items-center">
                  <span className="text-orange-600 mr-2">✓</span>
                  Flexible filters to export your data for tax prep
                </li>
                <li className="flex items-center">
                  <span className="text-orange-600 mr-2">✓</span>
                  Full-text search across documents
                </li>
                <li className="flex items-center">
                  <span className="text-orange-600 mr-2">✓</span>
                  Export to CSV with attached documents
                </li>
                <li className="flex items-center">
                  <span className="text-orange-600 mr-2">✓</span>
                  Download full data archive to migrate to another service
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Deployment Options */}
      <section id="start" className="py-20 px-8 bg-white scroll-mt-20">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4 bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
              Choose Your Version of TaxHacker
            </h2>
          </div>
          <div className="grid md:grid-cols-2 gap-8">
            {/* Self-Hosted Version */}
            <div className="bg-gradient-to-b from-white to-gray-50 p-8 rounded-2xl shadow-lg ring-1 ring-gray-100">
              <div className="inline-block px-3 py-1 rounded-full bg-violet-50 text-violet-600 text-sm font-medium mb-4">
                Use Your Own Server
              </div>
              <h3 className="text-2xl font-semibold mb-4">
                <ColoredText>Self-Hosted Edition</ColoredText>
              </h3>
              <ul className="space-y-3 text-gray-600 mb-8">
                <li className="flex items-center">
                  <span className="text-blue-600 mr-2">✓</span>
                  Complete control over your data
                </li>
                <li className="flex items-center">
                  <span className="text-blue-600 mr-2">✓</span>
                  Use at your own infrastructure
                </li>
                <li className="flex items-center">
                  <span className="text-blue-600 mr-2">✓</span>
                  Free and open source
                </li>
                <li className="flex items-center">
                  <span className="text-blue-600 mr-2">✓</span>
                  Bring your own OpenAI keys
                </li>
              </ul>
              <Link
                href="https://github.com/vas3k/TaxHacker"
                target="_blank"
                className="block w-full text-center px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-medium rounded-full hover:opacity-90 transition-all shadow-lg shadow-blue-500/20"
              >
                Github + Docker Compose
              </Link>
            </div>

            {/* Cloud Version */}
            <div className="bg-gradient-to-b from-white to-gray-50 p-8 rounded-2xl shadow-lg ring-1 ring-gray-100">
              <div className="absolute top-4 right-4">
                <span className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-sm">Coming Soon</span>
              </div>
              <div className="inline-block px-3 py-1 rounded-full bg-purple-50 text-purple-600 text-sm font-medium mb-4">
                We Host It For You
              </div>
              <h3 className="text-2xl font-semibold mb-4">
                <ColoredText>Cloud Edition</ColoredText>
              </h3>
              <ul className="space-y-3 text-gray-600 mb-8">
                <li className="flex items-center">
                  <span className="text-gray-400 mr-2">✓</span>
                  SaaS version for those who prefer less hassle
                </li>
                <li className="flex items-center">
                  <span className="text-gray-400 mr-2">✓</span>
                  We provide AI keys and storage
                </li>
                <li className="flex items-center">
                  <span className="text-gray-400 mr-2">✓</span>
                  Yearly subscription plans
                </li>
                <li className="flex items-center">
                  <span className="text-gray-400 mr-2">✓</span>
                  Automatic updates and new features
                </li>
              </ul>
              <button
                disabled
                className="block w-full text-center px-6 py-3 bg-gray-100 text-gray-400 font-medium rounded-full cursor-not-allowed"
              >
                Coming Soon
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Upcoming Features */}
      <section className="py-20 px-8 bg-gradient-to-b from-white to-gray-50 mt-28">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <div className="inline-block px-4 py-2 rounded-full bg-purple-50 text-purple-600 text-sm font-medium mb-6">
              🚀 Under Active Development
            </div>
            <h2 className="text-3xl font-bold mb-4 bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
              Upcoming Features
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              We're a small, indie project constantly improving. Here's what we're working on next.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 mb-16">
            {/* AI Improvements */}
            <div className="bg-white p-8 rounded-2xl shadow-sm ring-1 ring-gray-100">
              <div className="flex items-center gap-3 mb-4">
                <span className="text-2xl">🤖</span>
                <h3 className="text-xl font-semibold">Better AI Analytics & Agents</h3>
              </div>
              <ul className="space-y-3 text-gray-600">
                <li className="flex items-center">
                  <span className="text-purple-600 mr-2">→</span>
                  Income & expense insights
                </li>
                <li className="flex items-center">
                  <span className="text-purple-600 mr-2">→</span>
                  AI agents to automate your workflows
                </li>
                <li className="flex items-center">
                  <span className="text-purple-600 mr-2">→</span>
                  Recommendations for tax optimization
                </li>
                <li className="flex items-center">
                  <span className="text-purple-600 mr-2">→</span>
                  Custom and local LLM models
                </li>
              </ul>
            </div>

            {/* Smart Reports */}
            <div className="bg-white p-8 rounded-2xl shadow-sm ring-1 ring-gray-100">
              <div className="flex items-center gap-3 mb-4">
                <span className="text-2xl">📂</span>
                <h3 className="text-xl font-semibold">Smart Reports & Reminders</h3>
              </div>
              <ul className="space-y-3 text-gray-600">
                <li className="flex items-center">
                  <span className="text-purple-600 mr-2">→</span>
                  Monthly or quarterly VAT reports
                </li>
                <li className="flex items-center">
                  <span className="text-purple-600 mr-2">→</span>
                  Tax reminders
                </li>
                <li className="flex items-center">
                  <span className="text-purple-600 mr-2">→</span>
                  Annual income & expense reports
                </li>
              </ul>
            </div>

            {/* Transaction Review */}
            <div className="bg-white p-8 rounded-2xl shadow-sm ring-1 ring-gray-100">
              <div className="flex items-center gap-3 mb-4">
                <span className="text-2xl">📥</span>
                <h3 className="text-xl font-semibold">Multiple Transaction Review</h3>
              </div>
              <ul className="space-y-3 text-gray-600">
                <li className="flex items-center">
                  <span className="text-purple-600 mr-2">→</span>
                  Bank statement analysis
                </li>
                <li className="flex items-center">
                  <span className="text-purple-600 mr-2">→</span>
                  Automatic data completeness checks
                </li>
                <li className="flex items-center">
                  <span className="text-purple-600 mr-2">→</span>
                  Unpaid invoice tracking
                </li>
              </ul>
            </div>

            {/* Custom Fields */}
            <div className="bg-white p-8 rounded-2xl shadow-sm ring-1 ring-gray-100">
              <div className="flex items-center gap-3 mb-4">
                <span className="text-2xl">🤯</span>
                <h3 className="text-xl font-semibold">Presets and Plugins</h3>
              </div>
              <ul className="space-y-3 text-gray-600">
                <li className="flex items-center">
                  <span className="text-purple-600 mr-2">→</span>
                  Presets for different countries and industries
                </li>
                <li className="flex items-center">
                  <span className="text-purple-600 mr-2">→</span>
                  Custom reports for various use-cases
                </li>
                <li className="flex items-center">
                  <span className="text-purple-600 mr-2">→</span>
                  Community plugins and reports
                </li>
              </ul>
            </div>
          </div>

          {/* Newsletter Signup */}
          <NewsletterForm />
        </div>
      </section>

      <footer className="py-8 px-8 bg-white">
        <div className="max-w-7xl mx-auto text-center text-sm text-gray-500">
          Made with ❤️ by{" "}
          <a href="https://github.com/vas3k" className="underline">
            vas3k
          </a>
        </div>
      </footer>
    </div>
  )
}
