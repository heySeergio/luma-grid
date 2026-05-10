import { cn } from '@/lib/utils/cn'

const maskFromPublic = (src: string) =>
  ({
    backgroundColor: 'currentColor',
    maskImage: `url(${src})`,
    maskSize: 'contain',
    maskRepeat: 'no-repeat',
    maskPosition: 'center',
    WebkitMaskImage: `url(${src})`,
    WebkitMaskSize: 'contain',
    WebkitMaskRepeat: 'no-repeat',
    WebkitMaskPosition: 'center',
  }) as const

/**
 * Iconos de plataforma para instalación PWA (landing / CTA hacia tablero).
 * Recursos: `/android.svg`, `/apple.svg` (máscara + `currentColor` del texto padre).
 */
export function InstallIconAndroid({ className }: { className?: string }) {
  return (
    <span
      className={cn('inline-block shrink-0', className)}
      style={maskFromPublic('/android.svg')}
      aria-hidden
    />
  )
}

export function InstallIconApple({ className }: { className?: string }) {
  return (
    <span
      className={cn('inline-block shrink-0', className)}
      style={maskFromPublic('/apple.svg')}
      aria-hidden
    />
  )
}

export function InstallIconDesktop({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <rect x="2" y="3" width="20" height="14" rx="2" />
      <path d="M8 21h8" />
      <path d="M12 17v4" />
    </svg>
  )
}
