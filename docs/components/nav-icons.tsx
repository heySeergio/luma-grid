import type { NavIconId } from '@/config/navigation'

const stroke = 'currentColor'

export function NavIcon({ name }: { name: NavIconId }) {
  const common = {
    width: 18,
    height: 18,
    viewBox: '0 0 24 24',
    fill: 'none' as const,
    stroke,
    strokeWidth: 1.65,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
  }

  switch (name) {
    case 'sparkles':
      return (
        <svg {...common} aria-hidden>
          <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
          <circle cx="12" cy="12" r="3" />
        </svg>
      )
    case 'book':
      return (
        <svg {...common} aria-hidden>
          <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
          <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
        </svg>
      )
    case 'compass':
      return (
        <svg {...common} aria-hidden>
          <circle cx="12" cy="12" r="10" />
          <polygon points="12 6 14 12 12 18 10 12 12 6" fill={stroke} stroke="none" opacity="0.35" />
          <path d="M12 6v2M12 16v2M6 12h2M16 12h2" />
        </svg>
      )
    case 'mic':
      return (
        <svg {...common} aria-hidden>
          <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
          <path d="M19 10v2a7 7 0 0 1-14 0v-2M12 19v4M8 23h8" />
        </svg>
      )
    case 'image':
      return (
        <svg {...common} aria-hidden>
          <rect width="18" height="18" x="3" y="3" rx="2" ry="2" />
          <circle cx="9" cy="9" r="2" />
          <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" />
        </svg>
      )
    case 'palette':
      return (
        <svg {...common} aria-hidden>
          <circle cx="13.5" cy="6.5" r="0.9" fill={stroke} stroke="none" />
          <circle cx="17.5" cy="10.5" r="0.9" fill={stroke} stroke="none" />
          <circle cx="8.5" cy="7.5" r="0.9" fill={stroke} stroke="none" />
          <circle cx="6.5" cy="12.5" r="0.9" fill={stroke} stroke="none" />
          <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.8 0 1.5-.7 1.5-1.5 0-.4-.1-.8-.4-1.1-.2-.2-.3-.5-.3-.9 0-.8.7-1.5 1.5-1.5H17c3.3 0 6-2.7 6-6 0-4.4-4.5-8-10-8z" />
        </svg>
      )
    case 'keyboard':
      return (
        <svg {...common} aria-hidden>
          <rect x="2" y="5" width="20" height="14" rx="2" />
          <path d="M6 9h2M10 9h2M14 9h2M18 9h2M6 12h2M10 12h2M14 12h2M18 12h2M8 15h8" />
        </svg>
      )
    case 'bolt':
      return (
        <svg {...common} aria-hidden>
          <path d="M13 2 3 14h9l-1 8 10-12h-9l1-8z" />
        </svg>
      )
    case 'help':
      return (
        <svg {...common} aria-hidden>
          <circle cx="12" cy="12" r="10" />
          <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3M12 17h.01" />
        </svg>
      )
    case 'link':
      return (
        <svg {...common} aria-hidden>
          <path d="M10 13a5 5 0 0 1 0-7l1-1a5 5 0 0 1 7 7l-1 1M14 11a5 5 0 0 1 0 7l-1 1a5 5 0 0 1-7-7l1-1" />
        </svg>
      )
    default:
      return (
        <svg {...common} aria-hidden>
          <circle cx="12" cy="12" r="3" />
        </svg>
      )
  }
}
