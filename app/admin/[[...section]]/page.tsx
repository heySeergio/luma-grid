import { redirect } from 'next/navigation'
import { isLegacyLexiconAdminPath, isValidAdminSegments, legacyLexiconRedirectTarget } from '@/lib/admin/adminNav'

type AdminPageProps = {
  params: Promise<{ section?: string[] }>
}

/** Valida la ruta; el panel vive en layout para no remontar al cambiar de sección. */
export default async function AdminPage({ params }: AdminPageProps) {
  const { section } = await params
  if (section && isLegacyLexiconAdminPath(section)) {
    redirect(legacyLexiconRedirectTarget(section))
  }
  if (section && !isValidAdminSegments(section)) {
    redirect('/admin')
  }
  return null
}
