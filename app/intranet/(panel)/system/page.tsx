import { SystemHealthPanel } from '@/components/intranet/SystemHealthPanel'
import { runHealthChecks } from '@/lib/intranet/health'

export default async function IntranetSystemPage() {
  const checks = await runHealthChecks()

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <header>
        <h1 className="text-2xl font-bold text-[#042D22]">Sistema</h1>
        <p className="mt-1 text-sm text-[#042D22]/55">Estado de dependencias externas</p>
      </header>
      <SystemHealthPanel initialChecks={checks} />
    </div>
  )
}
