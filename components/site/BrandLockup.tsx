import Image from 'next/image'
import Link from 'next/link'

type BrandLockupProps = {
  href?: string
  className?: string
  iconSize?: number
  wordmarkWidth?: number
  subtitle?: string
  priority?: boolean
  /** Clases del PNG del logo: nunca usar border-radius en el logo (marca con esquinas rectas). */
  iconClassName?: string
}

export default function BrandLockup({
  href,
  className = '',
  iconSize = 44,
  wordmarkWidth = 172,
  subtitle,
  priority = false,
  iconClassName = 'rounded-none shadow-[var(--card-shadow)]',
}: BrandLockupProps) {
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
