import { FeedbackPanel } from '@/components/intranet/FeedbackPanel'
import { getCapturesData } from '@/lib/intranet/captures'

export default async function IntranetFeedbackPage() {
  const { feedback } = await getCapturesData()

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <header>
        <h1 className="text-2xl font-bold text-[#042D22]">Feedback</h1>
        <p className="mt-1 text-sm text-[#042D22]/55">Opiniones de usuarios y landing</p>
      </header>
      <FeedbackPanel initialFeedback={feedback} />
    </div>
  )
}
