/**
 * Pictograma como carácter emoji: la clase `.luma-picto-emoji` usa la fuente emoji nativa del sistema
 * (Segoe UI Emoji, Apple Color Emoji, Noto, etc.), sin incrustar la fuente web de Apple.
 */
export default function PictoEmoji({
  emoji,
  className,
  'aria-hidden': ariaHidden,
}: {
  emoji: string
  className?: string
  'aria-hidden'?: boolean
}) {
  return (
    <span
      className={className ? `luma-picto-emoji ${className}` : 'luma-picto-emoji'}
      aria-hidden={ariaHidden}
    >
      {emoji}
    </span>
  )
}
