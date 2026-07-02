import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import OrganizationAdminClient from '@/components/organization/OrganizationAdminClient'
import { getOrganizationForActor, isTherapistOrgMember } from '@/app/actions/organization'

export const metadata = {
  title: 'Organización — Luma Grid',
}

export default async function OrganizacionAdminPage() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) redirect('/login?callbackUrl=/admin/organizacion')

  const isTherapist = await isTherapistOrgMember()
  if (!isTherapist) redirect('/admin')

  const org = await getOrganizationForActor()
  if (!org) redirect('/plan?reason=therapist')

  return <OrganizationAdminClient organization={org} />
}
