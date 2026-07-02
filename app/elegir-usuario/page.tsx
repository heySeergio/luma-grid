import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import UserPickerPage from '@/components/organization/UserPickerPage'
import { getOrganizationForActor, isTherapistOrgMember } from '@/app/actions/organization'

export const metadata = {
  title: 'Elegir usuario — Luma Grid',
}

export default async function ElegirUsuarioPage() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) redirect('/login?callbackUrl=/elegir-usuario')

  const isTherapist = await isTherapistOrgMember()
  if (!isTherapist) redirect('/tablero')

  const org = await getOrganizationForActor()
  if (!org) redirect('/plan?reason=therapist')

  return (
    <UserPickerPage
      managedUsers={org.managedUsers}
      organizationName={org.name}
    />
  )
}
