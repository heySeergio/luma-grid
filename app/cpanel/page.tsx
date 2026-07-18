import { permanentRedirect } from 'next/navigation'

/** Antiguo panel /cpanel → stats.lumagrid.app */
export default function CpanelRedirectPage() {
  permanentRedirect('https://stats.lumagrid.app')
}
