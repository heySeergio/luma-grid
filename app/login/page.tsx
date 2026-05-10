import type { Metadata } from 'next'
import { Suspense } from 'react'
import LoginForm from './LoginForm'

export const metadata: Metadata = {
  title: 'Iniciar sesión',
  description: 'Accede a tu cuenta de Luma Grid con correo y contraseña o con Google.',
  alternates: { canonical: '/login' },
  robots: { index: false, follow: false },
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-dvh bg-canvas dark:bg-[var(--app-bg-soft)]" />}>
      <LoginForm />
    </Suspense>
  )
}
