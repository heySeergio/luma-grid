'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import PlanPickerModal from '@/components/plan/PlanPickerModal'
import { getSubscriptionGateState, type SubscriptionGateState } from '@/app/actions/plan'

type Props = {
  children: React.ReactNode
  initialGate: SubscriptionGateState
}

export default function PlanGateClient({ children, initialGate }: Props) {
  const [gate, setGate] = useState<SubscriptionGateState>(initialGate)

  const refreshGate = useCallback(async () => {
    const next = await getSubscriptionGateState()
    setGate(next)
  }, [])

  useEffect(() => {
    void refreshGate()
  }, [refreshGate])

  const needsPlanSelection = useMemo(() => {
    if (!gate || !('signedIn' in gate) || !gate.signedIn) return false
    return gate.needsPlanSelection
  }, [gate])

  const handlePlanCompleted = useCallback(() => {
    void refreshGate()
  }, [refreshGate])

  if (!gate || !('signedIn' in gate) || !gate.signedIn) {
    return <>{children}</>
  }

  return (
    <>
      {needsPlanSelection ? (
        <PlanPickerModal open dismissable={false} onCompleted={handlePlanCompleted} />
      ) : null}
      {needsPlanSelection ? null : children}
    </>
  )
}
