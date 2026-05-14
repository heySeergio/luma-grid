import { APP_ORIGIN } from '@/config/app-origin'

export type NavIconId =
  | 'sparkles'
  | 'book'
  | 'compass'
  | 'mic'
  | 'image'
  | 'palette'
  | 'keyboard'
  | 'bolt'
  | 'help'
  | 'link'

export type NavItem = {
  href: string
  label: string
  icon: NavIconId
}

export type NavSection = {
  title?: string
  items: NavItem[]
}

/** Inicio = portada; Funciones = toda la ayuda de uso (sin contenido técnico para desarrolladores). */
export const topTabs = [
  { href: '/', label: 'Inicio' },
  { href: '/guia', label: 'Funciones' },
  { href: '/changelog', label: 'Novedades' },
] as const

export const FUNCIONES_PATHS = [
  '/empieza-aqui',
  '/guia',
  '/voz-ia',
  '/arasaac',
  '/variantes',
  '/teclado-complementativo',
  '/lexico-y-evaluacion',
  '/preguntas',
] as const

export const sidebarNav: NavSection[] = [
  {
    title: 'Empieza aquí',
    items: [
      { href: '/empieza-aqui', label: 'Recorrido desde cero', icon: 'compass' },
      { href: '/', label: 'Bienvenida', icon: 'sparkles' },
      { href: '/guia', label: 'Resumen de funciones', icon: 'book' },
    ],
  },
  {
    title: 'Lo que puedes hacer',
    items: [
      { href: '/voz-ia', label: 'Voz con IA', icon: 'mic' },
      { href: '/arasaac', label: 'Pictogramas ARASAAC', icon: 'image' },
      { href: '/variantes', label: 'Variantes de palabra', icon: 'palette' },
      { href: '/teclado-complementativo', label: 'Teclado complementativo', icon: 'keyboard' },
      { href: '/lexico-y-evaluacion', label: 'Léxico y evaluación', icon: 'bolt' },
    ],
  },
  {
    title: '¿Dudas?',
    items: [{ href: '/preguntas', label: 'Preguntas frecuentes', icon: 'help' }],
  },
  {
    title: 'Luma Grid en la web',
    items: [{ href: APP_ORIGIN, label: 'Ir a la app', icon: 'link' }],
  },
]
