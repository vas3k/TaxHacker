import { X } from "lucide-react"

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-900 flex flex-col relative">
      <a
        href="/"
        className="absolute top-4 right-4 flex items-center justify-center w-10 h-10 rounded-full bg-gray-800 hover:bg-gray-700 transition-colors"
      >
        <span className="text-gray-300 font-bold text-xl">
          <X />
        </span>
      </a>
      <div className="flex-grow flex flex-col justify-center items-center py-12 px-4 sm:px-6 lg:px-8">{children}</div>
    </div>
  )
}
