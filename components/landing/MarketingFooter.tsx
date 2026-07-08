import Image from 'next/image'
import Link from 'next/link'

import { NavBrandTitle } from '@/components/landing/NavBrandTitle'

/** Pie de la landing comercial (legal). */
export function MarketingFooter() {
  return (
    <footer className="border-t border-black/10 bg-canvas px-4 py-12 sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-6xl flex-col gap-10 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <Link
            href="/#inicio"
            className="inline-flex items-center gap-2.5 font-bricolage-heading text-lg font-extrabold tracking-tight text-forest"
          >
            <Image
              src="/logo-luma-grid.png"
              alt=""
              width={40}
              height={40}
              className="h-9 w-9 shrink-0 object-cover shadow-[0_2px_8px_rgba(0,0,0,0.08)]"
            />
            <NavBrandTitle>Luma Grid</NavBrandTitle>
          </Link>
          <p className="mt-2 text-sm font-medium text-forest/65">Comunicación Aumentativa y Alternativa</p>
          <p className="mt-6 max-w-sm text-sm font-medium leading-relaxed text-forest/75">
            ¿Tienes dudas? Escríbenos a{' '}
            <a
              href="mailto:lumagrid@casanuma.biz"
              className="font-semibold text-forest underline-offset-4 transition hover:text-coral hover:underline"
            >
              lumagrid@casanuma.biz
            </a>
          </p>
        </div>
        <nav
          aria-label="Enlaces legales"
          className="grid w-full grid-cols-3 gap-3 text-center text-sm font-semibold leading-snug text-forest/80 sm:ml-auto sm:w-auto sm:max-w-2xl sm:gap-8 sm:text-right"
        >
          <Link href="/terminos" className="min-w-0 hover:text-coral">
            Términos y Condiciones
          </Link>
          <Link href="/privacidad" className="hover:text-coral">
            Privacidad
          </Link>
          <Link href="/cookies" className="hover:text-coral">
            Cookies
          </Link>
        </nav>
      </div>
    </footer>
  )
}
