import Link from "next/link"
import { getApps } from "./common"

export default async function AppsPage() {
  const apps = await getApps()

  return (
    <>
      <header className="flex flex-wrap items-center justify-between gap-2 mb-8">
        <h2 className="flex flex-row gap-3 md:gap-5">
          <span className="text-3xl font-bold tracking-tight">Apps</span>
          <span className="text-3xl tracking-tight opacity-20">{apps.length}</span>
        </h2>
      </header>

      <main className="flex flex-row gap-4 flex-wrap">
        {apps.map((app) => (
          <Link
            key={app.id}
            href={`/apps/${app.id}`}
            className="block shadow-xl max-w-[320px] p-6 bg-white rounded-lg hover:shadow-md transition-shadow border-4 border-gray-100"
          >
            <div className="flex flex-col gap-4">
              <div className="flex flex-row items-center gap-4">
                <div className="text-4xl">{app.manifest.icon}</div>
                <div className="text-2xl font-semibold">{app.manifest.name}</div>
              </div>
              <div className="text-sm">{app.manifest.description}</div>
            </div>
          </Link>
        ))}
      </main>
    </>
  )
}
