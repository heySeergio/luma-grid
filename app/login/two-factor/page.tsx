import { Suspense } from 'react'
import TwoFactorForm from './TwoFactorForm'

export default function TwoFactorPage() {
  return (
    <Suspense fallback={null}>
      <TwoFactorForm />
    </Suspense>
  )
}
