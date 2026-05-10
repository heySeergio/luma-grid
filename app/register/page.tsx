import type { Metadata } from 'next'
import { Suspense } from 'react'
import RegisterForm from './RegisterForm'

export const metadata: Metadata = {
  title: 'Crear cuenta',
  description: 'Regístrate en Luma Grid gratuitamente con correo y contraseña o con Google.',
  alternates: { canonical: '/register' },
  robots: { index: false, follow: false },
}

export default function RegisterPage() {
  return (
    <Suspense fallback={<div className="min-h-dvh bg-canvas dark:bg-[var(--app-bg-soft)]" />}>
      <RegisterForm />
    </Suspense>
  )
}
