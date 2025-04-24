import Link from "next/link"

export function SubscriptionExpired() {
  return (
    <Link
      href="/settings/profile"
      className="w-full h-8 p-1 bg-red-500 text-white font-semibold text-center hover:bg-red-600 transition-colors"
    >
      Your subscription has expired. Click here to select a new plan. Otherwise, your account will be deleted.
    </Link>
  )
}
