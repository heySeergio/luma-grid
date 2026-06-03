import { WaitlistPanel } from '@/components/intranet/WaitlistPanel'
import { getCapturesData } from '@/lib/intranet/captures'

export default async function IntranetWaitlistPage() {
  const { waitlist } = await getCapturesData()

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <header>
        <h1 className="text-2xl font-bold text-[#042D22]">Waitlist</h1>
        <p className="mt-1 text-sm text-[#042D22]/55">Inscripciones desde la landing</p>
      </header>
      <WaitlistPanel waitlist={waitlist} />
    </div>
  )
}
