import { redirect } from 'next/navigation'

/** Legacy URL: el panel de captaciones pasó a /intranet */
export default function CpanelRedirectPage() {
  redirect('/intranet')
}
