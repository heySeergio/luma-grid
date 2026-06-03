import Image from 'next/image'
import Link from 'next/link'

import { NavBrandTitle } from '@/components/landing/NavBrandTitle'

type BrandLockupProps = {
  href?: string
  className?: string
  iconSize?: number
  /** @deprecated El wordmark es tipografía (NavBrandTitle), no SVG. */
  wordmarkWidth?: number
  subtitle?: string
  /** Clases extra para el subtítulo (p. ej. intranet). */
  subtitleClassName?: string
  priority?: boolean
  /** Clases del PNG del logo: esquinas rectas (marca). */
  iconClassName?: string
  /** @deprecated Siempre el lockup de la landing; se ignora. */
  variant?: 'default' | 'marketing'
}

export default function BrandLockup({
  href,
  className = '',
  iconSize = 44,
  subtitle,
  subtitleClassName = '',
  priority = false,
  iconClassName = 'rounded-none shadow-[0_2px_8px_rgba(0,0,0,0.08)]',
}: BrandLockupProps) {

  const rowClass =
    `font-bricolage-heading flex min-w-0 items-start gap-2.5 text-base font-extrabold tracking-tight text-forest dark:text-white sm:text-lg ${className}`.trim()
  const logoClass = `h-8 w-8 shrink-0 object-cover sm:h-9 sm:w-9 rounded-none ${iconClassName}`.trim()

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
      <div className="min-w-0 pt-0.5">
        <NavBrandTitle>Luma Grid</NavBrandTitle>
        {subtitle ? (
          <p
            className={
              subtitleClassName.trim()
                ? subtitleClassName.trim()
                : 'mt-1 text-sm text-[var(--app-muted-foreground)]'
            }
          >
            {subtitle}
          </p>
        ) : null}
      </div>
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
