import { getServerSession } from 'next-auth'
import AppInterface from '@/components/app/AppInterface'
import { authOptions } from '@/lib/auth'
import { parseDefaultTableroTab } from '@/lib/account/defaultTableroTab'

/** Sesión con cookies por petición; alinea con JWT + User.defaultTableroTab */
export const dynamic = 'force-dynamic'

export default async function TableroPage() {
  const session = await getServerSession(authOptions)
  const initialDefaultTableroTab = parseDefaultTableroTab(session?.user?.defaultTableroTab)
  return <AppInterface initialDefaultTableroTab={initialDefaultTableroTab} />
}
