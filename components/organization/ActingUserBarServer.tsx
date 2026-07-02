import { getActingContextSummary } from '@/app/actions/actingContext'
import { isTherapistOrgMember } from '@/app/actions/organization'
import ActingUserBar from '@/components/organization/ActingUserBar'

export default async function ActingUserBarServer() {
  const [ctx, isTherapist] = await Promise.all([
    getActingContextSummary(),
    isTherapistOrgMember(),
  ])

  if (!isTherapist && !ctx?.isImpersonating) return null

  return (
    <ActingUserBar
      effectiveUserName={ctx?.effectiveUserName ?? null}
      isImpersonating={Boolean(ctx?.isImpersonating)}
      showOrgLink={isTherapist}
    />
  )
}
