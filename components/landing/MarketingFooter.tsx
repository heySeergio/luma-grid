import Image from 'next/image'
import Link from 'next/link'

import { NavBrandTitle } from '@/components/landing/NavBrandTitle'
import { CONTACT_EMAIL } from '@/lib/site/contact'

/** Pie de la landing comercial (legal, Casa Numa). */
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
          <div className="mt-6 flex flex-wrap items-center gap-2">
            <p className="text-sm font-medium text-forest/70">Un proyecto de</p>
            <Link
              href="https://casanuma.biz"
              target="_blank"
              rel="noopener noreferrer"
              className="group relative inline-block w-[4rem] shrink-0 rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-forest focus-visible:ring-offset-2"
            >
              <Image
                src="/casa-numa-logo.png"
                alt="Casa NUMA"
                width={832}
                height={304}
                className="relative z-0 h-auto w-full object-contain object-left transition-opacity duration-200 ease-out group-hover:opacity-0"
              />
              <span
                aria-hidden
                className="pointer-events-none absolute inset-0 z-10 bg-[#F45C41] opacity-0 transition-opacity duration-200 ease-out group-hover:opacity-100"
                style={{
                  WebkitMaskImage: 'url(/casa-numa-logo.png)',
                  maskImage: 'url(/casa-numa-logo.png)',
                  WebkitMaskSize: 'contain',
                  maskSize: 'contain',
                  WebkitMaskRepeat: 'no-repeat',
                  maskRepeat: 'no-repeat',
                  WebkitMaskPosition: 'left center',
                  maskPosition: 'left center',
                }}
              />
            </Link>
          </div>
          <p className="mt-6 max-w-sm text-sm font-medium leading-relaxed text-forest/75">
            ¿Tienes dudas? Escríbenos a{' '}
            <a
              href={`mailto:${CONTACT_EMAIL}`}
              className="font-semibold text-forest underline-offset-4 transition hover:text-coral hover:underline"
            >
              {CONTACT_EMAIL}
            </a>
          </p>
        </div>
        <div className="grid w-full gap-8 sm:ml-auto sm:w-auto sm:max-w-2xl sm:grid-cols-2 sm:gap-10 sm:text-right">
          <nav aria-label="Recursos" className="space-y-3 text-sm font-semibold leading-snug text-forest/80">
            <p className="text-xs font-bold uppercase tracking-wide text-forest/55">Recursos</p>
            <Link href="/comparar" className="block hover:text-coral">
              Comparar comunicadores AAC
            </Link>
            <Link href="/planes" className="block hover:text-coral">
              Planes y precios
            </Link>
            <Link href="/instalar" className="block hover:text-coral">
              Cómo instalar
            </Link>
          </nav>
          <nav aria-label="Enlaces legales" className="space-y-3 text-sm font-semibold leading-snug text-forest/80">
            <p className="text-xs font-bold uppercase tracking-wide text-forest/55">Legal</p>
            <Link href="/terminos" className="block min-w-0 hover:text-coral">
              Términos y Condiciones
            </Link>
            <Link href="/privacidad" className="block hover:text-coral">
              Privacidad
            </Link>
            <Link href="/cookies" className="block hover:text-coral">
              Cookies
            </Link>
          </nav>
        </div>
      </div>
    </footer>
  )
}
