import Image from 'next/image'
import Link from 'next/link'

import { NavBrandTitle } from '@/components/landing/NavBrandTitle'

type BrandLockupProps = {
  href?: string
  className?: string
  iconSize?: number
  wordmarkWidth?: number
  subtitle?: string
  priority?: boolean
  /** Clases del PNG del logo: nunca usar border-radius en el logo (marca con esquinas rectas). */
  iconClassName?: string
  /** Misma marca que la cabecera de la landing (`/logo-luma-grid.png` + título Bricolage). */
  variant?: 'default' | 'marketing'
}

export default function BrandLockup({
  href,
  className = '',
  iconSize = 44,
  wordmarkWidth = 172,
  subtitle,
  priority = false,
  iconClassName = 'rounded-none shadow-[var(--card-shadow)]',
  variant = 'default',
}: BrandLockupProps) {
  if (variant === 'marketing') {
    const rowClass = `flex min-w-0 items-center gap-2.5 text-base font-extrabold tracking-tight text-forest sm:text-lg ${className}`.trim()
    const logoClass = `h-8 w-8 shrink-0 object-cover shadow-[0_2px_8px_rgba(0,0,0,0.08)] sm:h-9 sm:w-9 rounded-none ${iconClassName}`.trim()
    const inner = (
      <div className={rowClass}>
        <Image
          src="/logo-luma-grid.png"
          alt=""
          width={iconSize}
          height={iconSize}
          priority={priority}
          className={logoClass}
        />
        <NavBrandTitle>Luma Grid</NavBrandTitle>
      </div>
    )
    if (!href) {
      return inner
    }
    return (
      <Link href={href} className="inline-flex max-w-full">
        {inner}
      </Link>
    )
  }

  const content = (
    <div className={`flex items-center gap-3 ${className}`.trim()}>
      <Image
        src="/icons/LogoBase.png"
        alt="Logo de Luma Grid"
        width={iconSize}
        height={iconSize}
        priority={priority}
        className={iconClassName}
      />
      <div className="min-w-0">
        {/* SVG: <img> evita avisos del optimizador de next/image al redimensionar con CSS */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/icons/Luma%20Grid%20Texto.svg"
          alt="Luma Grid"
          width={wordmarkWidth}
          height={Math.round(wordmarkWidth * 0.28)}
          decoding="async"
          loading={priority ? 'eager' : 'lazy'}
          fetchPriority={priority ? 'high' : 'low'}
          className="h-auto max-w-full"
          style={{ maxWidth: `${wordmarkWidth}px` }}
        />
        {subtitle ? (
          <p className="mt-1 text-sm text-[var(--app-muted-foreground)]">
            {subtitle}
          </p>
        ) : null}
      </div>
    </div>
  )

  if (!href) {
    return content
  }

  return (
    <Link href={href} className="inline-flex">
      {content}
    </Link>
  )
}
