import Link from 'next/link'
import { InstallIconAndroid, InstallIconApple, InstallIconDesktop } from '@/components/site/installPlatformIcons'

const btnBase =
  'inline-flex min-h-[4.25rem] w-full items-center justify-center gap-4 rounded-2xl px-8 py-5 text-base font-bold shadow-sm transition sm:min-w-[14rem] md:min-h-[4.75rem] md:text-lg'

export default function PwaInstallButtons() {
  return (
    <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:justify-center">
      <Link
        href="/tablero"
        className={`${btnBase} bg-white text-slate-900 hover:bg-slate-100 dark:bg-slate-900 dark:text-white dark:hover:bg-slate-800`}
      >
        <InstallIconAndroid className="h-10 w-10 shrink-0 md:h-11 md:w-11" />
        <span>Instalar en Android</span>
      </Link>
      <Link
        href="/tablero"
        className={`${btnBase} bg-white text-slate-900 hover:bg-slate-100 dark:bg-slate-900 dark:text-white dark:hover:bg-slate-800`}
      >
        <InstallIconApple className="h-10 w-10 shrink-0 md:h-11 md:w-11" />
        <span>Instalar en iOS</span>
      </Link>
      <Link
        href="/tablero"
        className={`${btnBase} border-2 border-indigo-400/60 bg-indigo-600/15 text-slate-900 hover:bg-indigo-600/25 dark:border-indigo-400/50 dark:bg-indigo-500/20 dark:text-white dark:hover:bg-indigo-500/30`}
      >
        <InstallIconDesktop className="h-10 w-10 shrink-0 md:h-11 md:w-11" />
        <span>Instalar en ordenador</span>
      </Link>
    </div>
  )
}
