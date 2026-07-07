import { ColoredText } from "@/components/ui/colored-text"
import config from "@/lib/config"
import Image from "next/image"
import Link from "next/link"

const primaryButton =
  "px-8 py-4 bg-gradient-to-r from-orange-500 to-amber-500 text-white font-bold rounded-full hover:from-orange-600 hover:to-amber-600 transition-all duration-300 shadow-lg shadow-orange-500/25 hover:shadow-xl hover:shadow-orange-500/40 hover:scale-105"

const secondaryButton =
  "px-8 py-4 border-2 border-orange-200 text-orange-700 font-bold rounded-full hover:border-orange-400 hover:bg-orange-50 transition-all duration-300 hover:scale-105 bg-white"

const featureCard =
  "flex flex-wrap items-center gap-12 mb-20 bg-white p-8 rounded-3xl shadow-lg shadow-orange-900/5 ring-1 ring-orange-100 hover:shadow-2xl hover:shadow-orange-900/10 hover:ring-orange-200 transition-all duration-500 group"

const featureBadge =
  "inline-block px-4 py-2 rounded-full bg-orange-100 text-orange-700 text-sm font-bold mb-4"

const featureHeading = "text-2xl font-bold mb-4 text-gray-900"

const featureImage =
  "flex-1 relative aspect-auto rounded-3xl overflow-hidden shadow-xl shadow-orange-900/10 ring-1 ring-orange-100 hover:scale-[1.02] transition-all duration-500"

const upcomingCard =
  "bg-white p-8 rounded-3xl shadow-lg shadow-orange-900/5 ring-1 ring-orange-100 hover:shadow-2xl hover:shadow-orange-900/10 hover:ring-orange-200 transition-all duration-500 hover:scale-[1.02]"

export default function LandingPage() {
  return (
    <div className="min-h-screen flex flex-col bg-orange-50/40 text-gray-800">
      <header className="py-6 px-4 md:px-8 bg-white/80 backdrop-blur-xl shadow-sm border-b border-orange-100 fixed w-full z-50">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="relative">
              <Image
                src="/logo/256.png"
                alt="Logo"
                width={32}
                height={32}
                className="h-8 group-hover:scale-110 transition-transform duration-300"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-orange-500 to-amber-500 rounded-full opacity-20 blur-md group-hover:opacity-40 transition-opacity duration-300" />
            </div>
            <ColoredText className="text-2xl font-bold">TaxHacker</ColoredText>
          </Link>
          <div className="flex gap-1 md:gap-4 text-xs md:text-sm">
            <Link
              href="/enter"
              className="cursor-pointer font-bold px-4 py-2 rounded-full border-2 border-orange-200 text-orange-700 hover:border-orange-400 hover:bg-orange-50 transition-all duration-300 hover:scale-105"
            >
              Log In
            </Link>
            <Link
              href="/cloud"
              className="cursor-pointer font-bold text-sm px-4 py-2 rounded-full bg-gradient-to-r from-orange-500 to-amber-500 text-white hover:from-orange-600 hover:to-amber-600 transition-all duration-300 hover:scale-105 shadow-md shadow-orange-500/25"
            >
              Sign Up
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="pt-32 pb-16 px-8 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-orange-100/60 via-orange-50/30 to-transparent" />
        <div className="absolute top-20 left-10 w-72 h-72 bg-orange-400 rounded-full opacity-20 blur-[100px]" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-amber-400 rounded-full opacity-20 blur-[120px]" />

        <div className="max-w-7xl mx-auto relative z-10">
          <div className="text-center mb-12">
            <div className="inline-block px-6 py-3 rounded-full border border-orange-200 bg-orange-100/60 text-orange-700 text-sm font-bold mb-6">
              🚀 Under Active Development
            </div>
            <h1 className="text-5xl font-bold tracking-tight sm:text-6xl mb-6 text-gray-900 pb-2">
              Let AI finally care about your taxes, scan your receipts and{" "}
              <ColoredText>analyze your expenses</ColoredText>
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto font-medium">
              Self-hosted accounting app crafted for freelancers, indie-hackers and small businesses
            </p>
            <div className="flex gap-4 justify-center text-sm md:text-lg">
              <Link href="#start" className={primaryButton}>
                Get Started ✨
              </Link>
              <Link href="mailto:me@vas3k.com" className={secondaryButton}>
                Contact Us 💌
              </Link>
            </div>
          </div>
          <div className="relative aspect-auto rounded-3xl overflow-hidden shadow-2xl shadow-orange-900/15 ring-1 ring-orange-100">
            <video className="w-full h-auto" autoPlay loop muted playsInline poster="/landing/ai-scanner-big.webp">
              <source src="/landing/video.mp4" type="video/mp4" />
              <Image src="/landing/ai-scanner-big.webp" alt="TaxHacker" width={1728} height={1080} priority />
            </video>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-8 relative">
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="text-center mb-16">
            <h2 className="flex flex-col gap-3 mb-4">
              <span className="text-6xl font-bold bg-gradient-to-r from-orange-500 to-amber-500 bg-clip-text text-transparent">
                F∗ck Taxes
              </span>
              <span className="text-4xl font-bold text-gray-900">
                TaxHacker saves you time, money and nerves
              </span>
            </h2>
          </div>

          {/* AI Scanner Feature */}
          <div className={featureCard}>
            <div className="flex-1 min-w-60">
              <div className={featureBadge}>🤖 LLM-Powered</div>
              <h3 className={featureHeading}>Analyze photos and invoices with AI</h3>
              <ul className="space-y-3 text-gray-600">
                <li className="flex items-center">
                  <span className="text-orange-500 mr-3 text-lg">✨</span>
                  Upload your receipts or invoices in PDF for automatic recognition
                </li>
                <li className="flex items-center">
                  <span className="text-orange-500 mr-3 text-lg">✨</span>
                  Extract key information like dates, items, and vendors
                </li>
                <li className="flex items-center">
                  <span className="text-orange-500 mr-3 text-lg">✨</span>
                  Works with any language and any photo quality
                </li>
                <li className="flex items-center">
                  <span className="text-orange-500 mr-3 text-lg">✨</span>
                  Automatically organize everything into a structured database
                </li>
                <li className="flex items-center">
                  <span className="text-orange-500 mr-3 text-lg">✨</span>
                  Bulk upload and analyze multiple files at once
                </li>
              </ul>
            </div>
            <div className={featureImage}>
              <Image src="/landing/ai-scanner.webp" alt="AI Document Analyzer" width={1900} height={1524} />
            </div>
          </div>

          {/* Multi-currency Feature */}
          <div className={`${featureCard} flex-row-reverse`}>
            <div className="flex-1 min-w-60">
              <div className={featureBadge}>💱 Currency Converter</div>
              <h3 className={featureHeading}>Automatically convert currencies (even crypto!)</h3>
              <ul className="space-y-3 text-gray-600">
                <li className="flex items-center">
                  <span className="text-orange-500 mr-3 text-lg">💰</span>
                  Detects foreign currencies and converts it to yours
                </li>
                <li className="flex items-center">
                  <span className="text-orange-500 mr-3 text-lg">💰</span>
                  Knows historical exchange rates on a date of transaction
                </li>
                <li className="flex items-center">
                  <span className="text-orange-500 mr-3 text-lg">💰</span>
                  Supports 170+ world currencies
                </li>
                <li className="flex items-center">
                  <span className="text-orange-500 mr-3 text-lg">💰</span>
                  Works with popular cryptocurrencies (BTC, ETH, LTC, etc.)
                </li>
                <li className="flex items-center">
                  <span className="text-orange-500 mr-3 text-lg">💰</span>
                  Still allows you to fill it manually
                </li>
              </ul>
            </div>
            <div className={featureImage}>
              <Image src="/landing/multi-currency.webp" alt="Currency Converter" width={1400} height={1005} />
            </div>
          </div>

          {/* Transaction Table Feature */}
          <div className={`${featureCard} flex-row-reverse`}>
            <div className={featureImage}>
              <Image src="/landing/transactions.webp" alt="Transactions Table" width={2000} height={1279} />
            </div>
            <div className="flex-1 min-w-60">
              <div className={featureBadge}>🔍 Filters & Categories</div>
              <h3 className={featureHeading}>
                Organize your transactions using fully customizable categories, projects and fields
              </h3>
              <ul className="space-y-3 text-gray-600">
                <li className="flex items-center">
                  <span className="text-orange-500 mr-3 text-lg">📊</span>
                  Absolute freedom to create custom categories, projects and fields
                </li>
                <li className="flex items-center">
                  <span className="text-orange-500 mr-3 text-lg">📊</span>
                  Add, edit and manage your transactions
                </li>
                <li className="flex items-center">
                  <span className="text-orange-500 mr-3 text-lg">📊</span>
                  Filter by any column, category or date range
                </li>
                <li className="flex items-center">
                  <span className="text-orange-500 mr-3 text-lg">📊</span>
                  Customize which columns to show in the table
                </li>
                <li className="flex items-center">
                  <span className="text-orange-500 mr-3 text-lg">📊</span>
                  Import transactions from CSV
                </li>
              </ul>
            </div>
          </div>

          {/* Invoice Generator */}
          <div className={featureCard}>
            <div className="max-w-sm flex-1 relative aspect-auto rounded-3xl overflow-hidden shadow-xl shadow-orange-900/10 ring-1 ring-orange-100 hover:scale-[1.02] transition-all duration-500">
              <Image src="/landing/invoice-generator.webp" alt="Invoice Generator" width={1800} height={1081} />
            </div>
            <div className="flex-1 min-w-60">
              <div className={featureBadge}>📋 Invoice Generator</div>
              <h3 className={featureHeading}>Create custom invoices</h3>
              <ul className="space-y-3 text-gray-600">
                <li className="flex items-center">
                  <span className="text-orange-500 mr-3 text-lg">📄</span>
                  Advanced invoice generator to create any invoice in any language
                </li>
                <li className="flex items-center">
                  <span className="text-orange-500 mr-3 text-lg">📄</span>
                  Edit any field, even labels and titles
                </li>
                <li className="flex items-center">
                  <span className="text-orange-500 mr-3 text-lg">📄</span>
                  Export invoices to PDF or as transactions
                </li>
                <li className="flex items-center">
                  <span className="text-orange-500 mr-3 text-lg">📄</span>
                  Save invoices as templates to reuse them later
                </li>
                <li className="flex items-center">
                  <span className="text-orange-500 mr-3 text-lg">📄</span>
                  Native support for both included and excluded taxes (VAT, GST, etc.)
                </li>
              </ul>
            </div>
          </div>

          {/* Custom Fields & Categories */}
          <div className={featureCard}>
            <div className="flex-1 min-w-60">
              <div className={featureBadge}>🎨 Control over AI</div>
              <h3 className={featureHeading}>Tune any LLM prompt to extract anything you need</h3>
              <ul className="space-y-3 text-gray-600">
                <li className="flex items-center">
                  <span className="text-orange-500 mr-3 text-lg">🔧</span>
                  Expand and improve your TaxHacker instance with custom LLM prompts
                </li>
                <li className="flex items-center">
                  <span className="text-orange-500 mr-3 text-lg">🔧</span>
                  Create custom fields and categories and tell AI how to parse them for you
                </li>
                <li className="flex items-center">
                  <span className="text-orange-500 mr-3 text-lg">🔧</span>
                  Extract any additional information you need
                </li>
                <li className="flex items-center">
                  <span className="text-orange-500 mr-3 text-lg">🔧</span>
                  Automatically categorize by project or category
                </li>
                <li className="flex items-center">
                  <span className="text-orange-500 mr-3 text-lg">🔧</span>
                  Ask AI to assess risk level or any other criteria
                </li>
              </ul>
            </div>
            <div className={featureImage}>
              <Image src="/landing/custom-llm.webp" alt="Custom LLM promts" width={1800} height={1081} />
            </div>
          </div>

          {/* Data Export */}
          <div className={`${featureCard} flex-row-reverse`}>
            <div className="flex-1 min-w-60">
              <div className={featureBadge}>📦 Self-hosting & Data Export</div>
              <h3 className={featureHeading}>Your Data — Your Rules</h3>
              <ul className="space-y-3 text-gray-600">
                <li className="flex items-center">
                  <span className="text-orange-500 mr-3 text-lg">📤</span>
                  Deploy your own instance of TaxHacker for 100% privacy
                </li>
                <li className="flex items-center">
                  <span className="text-orange-500 mr-3 text-lg">📤</span>
                  Export your transactions to CSV for tax prep
                </li>
                <li className="flex items-center">
                  <span className="text-orange-500 mr-3 text-lg">📤</span>
                  Full-text search across documents and invoices
                </li>
                <li className="flex items-center">
                  <span className="text-orange-500 mr-3 text-lg">📤</span>
                  Download full data archive to migrate to another service. We don&#39;t take away or limit what you do with
                  your data
                </li>
              </ul>
            </div>
            <div className={featureImage}>
              <Image src="/landing/export.webp" alt="Export" width={1200} height={1081} />
            </div>
          </div>
        </div>
      </section>

      {/* Deployment Options */}
      <section id="start" className="py-20 px-8 scroll-mt-20 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-orange-100/40 to-transparent" />
        <div className="absolute top-1/2 left-1/4 w-64 h-64 bg-orange-300 rounded-full opacity-20 blur-[100px]" />
        <div className="absolute top-1/2 right-1/4 w-64 h-64 bg-amber-300 rounded-full opacity-20 blur-[100px]" />
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4 text-gray-900">
              Choose Your Version of <ColoredText>TaxHacker</ColoredText>
            </h2>
          </div>
          <div className="grid md:grid-cols-2 gap-16">
            {/* Self-Hosted Version */}
            <div className="bg-white p-8 rounded-3xl shadow-lg shadow-orange-900/5 ring-1 ring-orange-100 hover:shadow-2xl hover:shadow-orange-900/10 hover:ring-orange-200 transition-all duration-500 group">
              <div className={featureBadge}>🏠 Use Your Own Server</div>
              <h3 className="text-2xl font-bold mb-4">
                <ColoredText>Self-Hosted Edition</ColoredText>
              </h3>
              <ul className="space-y-3 text-gray-600 mb-8">
                <li className="flex items-center">
                  <span className="text-orange-500 mr-3 text-lg">🆓</span>
                  Free and Open Source
                </li>
                <li className="flex items-center">
                  <span className="text-orange-500 mr-3 text-lg">🔒</span>
                  Complete control over your data
                </li>
                <li className="flex items-center">
                  <span className="text-orange-500 mr-3 text-lg">🏗️</span>
                  Deploy at your own infrastructure or home server
                </li>
                <li className="flex items-center">
                  <span className="text-orange-500 mr-3 text-lg">🔑</span>
                  Bring your own keys (OpenAI, Gemini, Mistral, etc.)
                </li>
              </ul>
              <Link
                href="https://github.com/vas3k/TaxHacker"
                target="_blank"
                className={`block w-full text-center ${primaryButton}`}
              >
                Github + Docker Compose 🐳
              </Link>
            </div>

            {/* Cloud Version */}
            <div className="bg-gradient-to-br from-orange-500 to-amber-500 p-8 rounded-3xl shadow-xl shadow-orange-500/30 ring-1 ring-orange-400 hover:shadow-2xl hover:shadow-orange-500/40 transition-all duration-500 group relative">
              <div className="inline-block px-4 py-2 rounded-full bg-white/20 text-white text-sm font-bold mb-6 backdrop-blur-sm">
                ☁️ We Host It For You
              </div>
              <h3 className="text-2xl font-bold mb-4 text-white">Cloud Edition</h3>
              <ul className="space-y-3 text-orange-50 mb-8">
                <li className="flex items-center">
                  <span className="mr-3 text-lg">🎯</span>
                  SaaS version if you don&#39;t want to hassle with own servers and deployments
                </li>
                <li className="flex items-center">
                  <span className="mr-3 text-lg">🤖</span>
                  We provide you with AI keys and storage
                </li>
                <li className="flex items-center">
                  <span className="mr-3 text-lg">💳</span>
                  Yearly subscription plans. No hidden fees
                </li>
                <li className="flex items-center">
                  <span className="mr-3 text-lg">🚀</span>
                  Automatic updates and new features
                </li>
              </ul>
              <Link
                href="/cloud"
                className="block w-full text-center px-8 py-4 bg-white text-orange-600 font-bold rounded-full hover:bg-orange-50 transition-all duration-300 shadow-lg hover:scale-105"
              >
                Early Access: €10/month 💎
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Upcoming Features */}
      <section className="py-20 px-8 mt-28 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-orange-100/50 via-orange-50/30 to-transparent" />
        <div className="absolute top-10 left-10 w-64 h-64 bg-orange-300 rounded-full opacity-20 blur-[100px]" />
        <div className="absolute bottom-10 right-10 w-80 h-80 bg-amber-300 rounded-full opacity-20 blur-[100px]" />

        <div className="max-w-7xl mx-auto relative z-10">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4 text-gray-900">
              <ColoredText>Upcoming</ColoredText> Features
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto font-medium">
              We&apos;re a small, indie project constantly improving. Here&apos;s what we&apos;re working on next.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 mb-16">
            <div className={upcomingCard}>
              <div className="flex items-center gap-3 mb-4">
                <span className="text-3xl">🤖</span>
                <h3 className="text-xl font-bold text-gray-900">Better AI Analytics & Agents</h3>
              </div>
              <ul className="space-y-3 text-gray-600">
                <li className="flex items-center">
                  <span className="text-orange-500 mr-3 text-lg">🔮</span>
                  Income & expense insights
                </li>
                <li className="flex items-center">
                  <span className="text-orange-500 mr-3 text-lg">🔮</span>
                  AI agents to automate your workflows
                </li>
                <li className="flex items-center">
                  <span className="text-orange-500 mr-3 text-lg">🔮</span>
                  Recommendations for tax optimization
                </li>
                <li className="flex items-center">
                  <span className="text-orange-500 mr-3 text-lg">🔮</span>
                  Custom and local LLM models
                </li>
              </ul>
            </div>

            <div className={upcomingCard}>
              <div className="flex items-center gap-3 mb-4">
                <span className="text-3xl">📊</span>
                <h3 className="text-xl font-bold text-gray-900">Smart Reports & Reminders</h3>
              </div>
              <ul className="space-y-3 text-gray-600">
                <li className="flex items-center">
                  <span className="text-orange-500 mr-3 text-lg">📈</span>
                  Monthly or quarterly VAT reports
                </li>
                <li className="flex items-center">
                  <span className="text-orange-500 mr-3 text-lg">📈</span>
                  Tax reminders
                </li>
                <li className="flex items-center">
                  <span className="text-orange-500 mr-3 text-lg">📈</span>
                  Annual income & expense reports
                </li>
              </ul>
            </div>

            <div className={upcomingCard}>
              <div className="flex items-center gap-3 mb-4">
                <span className="text-3xl">📥</span>
                <h3 className="text-xl font-bold text-gray-900">Multiple Transaction Review</h3>
              </div>
              <ul className="space-y-3 text-gray-600">
                <li className="flex items-center">
                  <span className="text-orange-500 mr-3 text-lg">💳</span>
                  Bank statement analysis
                </li>
                <li className="flex items-center">
                  <span className="text-orange-500 mr-3 text-lg">💳</span>
                  Automatic data completeness checks
                </li>
                <li className="flex items-center">
                  <span className="text-orange-500 mr-3 text-lg">💳</span>
                  Unpaid invoice tracking
                </li>
              </ul>
            </div>

            <div className={upcomingCard}>
              <div className="flex items-center gap-3 mb-4">
                <span className="text-3xl">🧩</span>
                <h3 className="text-xl font-bold text-gray-900">Presets and Plugins</h3>
              </div>
              <ul className="space-y-3 text-gray-600">
                <li className="flex items-center">
                  <span className="text-orange-500 mr-3 text-lg">🌍</span>
                  Presets for different countries and industries
                </li>
                <li className="flex items-center">
                  <span className="text-orange-500 mr-3 text-lg">🌍</span>
                  Custom reports for various use-cases
                </li>
                <li className="flex items-center">
                  <span className="text-orange-500 mr-3 text-lg">🌍</span>
                  Community plugins and reports
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      <footer className="py-8 px-8 bg-white border-t border-orange-100">
        <div className="max-w-7xl mx-auto text-center text-sm text-gray-500">
          Made with ❤️ in Berlin by{" "}
          <Link
            href="https://github.com/vas3k"
            className="underline font-semibold hover:text-orange-600 transition-colors"
          >
            @vas3k
          </Link>
        </div>

        <section className="py-12 px-8">
          <div className="max-w-7xl mx-auto">
            <div className="flex flex-wrap gap-4 justify-center">
              <Link
                href={`mailto:${config.app.supportEmail}`}
                className="text-sm text-gray-500 hover:text-orange-600 font-medium transition-colors"
              >
                Contact Us
              </Link>
              <Link
                href="/docs/terms"
                className="text-sm text-gray-500 hover:text-orange-600 font-medium transition-colors"
              >
                Terms of Service
              </Link>
              <Link
                href="/docs/privacy_policy"
                className="text-sm text-gray-500 hover:text-orange-600 font-medium transition-colors"
              >
                Privacy Policy
              </Link>
              <Link href="/docs/ai" className="text-sm text-gray-500 hover:text-orange-600 font-medium transition-colors">
                AI Use Disclosure
              </Link>
              <Link
                href="/docs/cookie"
                className="text-sm text-gray-500 hover:text-orange-600 font-medium transition-colors"
              >
                Cookie Policy
              </Link>
              <Link
                href="https://github.com/vas3k/TaxHacker"
                target="_blank"
                className="text-sm text-gray-500 hover:text-orange-600 font-medium transition-colors"
              >
                Source Code
              </Link>
            </div>
          </div>
        </section>
      </footer>
    </div>
  )
}
