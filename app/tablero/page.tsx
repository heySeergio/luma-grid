import { getServerSession } from 'next-auth'
import AppInterface from '@/components/app/AppInterface'
import { authOptions } from '@/lib/auth'
import { parseDefaultTableroTab } from '@/lib/account/defaultTableroTab'
import { loadTableroInitial } from '@/lib/tablero/loadTableroInitial'

/** Sesión con cookies por petición; alinea con JWT + User.defaultTableroTab */
export const dynamic = 'force-dynamic'

export default async function TableroPage() {
  const session = await getServerSession(authOptions)
  const tableroInitial = await loadTableroInitial(session)
  const initialDefaultTableroTab = parseDefaultTableroTab(
    tableroInitial?.accountSettings?.defaultTableroTab ?? session?.user?.defaultTableroTab,
  )
  return (
    <AppInterface
      initialDefaultTableroTab={initialDefaultTableroTab}
      tableroInitial={tableroInitial ?? undefined}
    />
  )
}
