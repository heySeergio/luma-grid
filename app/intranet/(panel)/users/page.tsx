import { UsersTable } from '@/components/intranet/UsersTable'
import { getIntranetUsers } from '@/lib/intranet/users'

export default async function IntranetUsersPage() {
  const users = await getIntranetUsers()

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <header>
        <h1 className="text-2xl font-bold text-[#042D22]">Usuarios</h1>
        <p className="mt-1 text-sm text-[#042D22]/55">Listado completo con filtros</p>
      </header>
      <UsersTable users={users} />
    </div>
  )
}
