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
  /** @deprecated Usa el badge integrado para INTRANET. */
  subtitleClassName?: string
  priority?: boolean
  /** Clases del PNG del logo: esquinas rectas (marca). */
  iconClassName?: string
  /** @deprecated Siempre el lockup de la landing; se ignora. */
  variant?: 'default' | 'marketing'
}

function isIntranetBadge(subtitle?: string) {
  const value = subtitle?.trim().toUpperCase()
  return value === 'INTRANET' || value === 'STATS'
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
  const intranetBadge = isIntranetBadge(subtitle)
  const badgeLabel = subtitle?.trim().toUpperCase() === 'STATS' ? 'Stats' : 'Intranet'

  const rowClass =
    `font-bricolage-heading flex min-w-0 items-center gap-2.5 text-base font-extrabold tracking-tight text-forest dark:text-white sm:text-lg ${className}`.trim()
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
      <div className="min-w-0 leading-none">
        {intranetBadge ? (
          <div className="flex -translate-y-0.5 items-baseline gap-2">
            <NavBrandTitle>Luma Grid</NavBrandTitle>
            <span
              aria-hidden
              className="relative top-px shrink-0 rounded-[5px] border border-[#042D22]/10 bg-[#042D22]/[0.05] px-1.5 py-px text-[0.5rem] font-bold uppercase tracking-[0.14em] text-[#042D22]/45 dark:border-white/10 dark:bg-white/[0.06] dark:text-white/45"
            >
              {badgeLabel}
            </span>
          </div>
        ) : (
          <>
            <span className="inline-block -translate-y-0.5">
              <NavBrandTitle>Luma Grid</NavBrandTitle>
            </span>
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
          </>
        )}
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
